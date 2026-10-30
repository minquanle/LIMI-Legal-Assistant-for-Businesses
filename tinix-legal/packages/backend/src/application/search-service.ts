import { prisma } from '../infrastructure/db.js';
import { meili, LEGAL_DOCS_INDEX, LEGAL_AST_INDEX } from '../infrastructure/search-client.js';
import { EmbeddingService } from '../services/embedding-service.js';
import type { SearchParams, SearchResult, DocumentSummary } from '../domain/types.js';

/** Escapes a value interpolated into a MeiliSearch filter expression string. */
function escapeMeiliFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normalizeDocumentNumber(num: string): string {
  return num
    .trim()
    .replace(/[\s]+/g, '')
    .replace(/[-–—]/g, '/')
    .replace(/\/+/g, '/')
    .toUpperCase();
}

/**
 * Application layer: Search use cases.
 * Orchestrates MeiliSearch (full-text) and Prisma (filter/browse) queries.
 */
export class SearchService {
  /**
   * Hybrid search: MeiliSearch for full-text, Prisma for filter-only browsing.
   */
  static async search(params: SearchParams): Promise<SearchResult> {
    const {
      q = '',
      documentType,
      issuingBody,
      validityStatus,
      field,
      exact,
      scope,
      yearFrom,
      yearTo,
      page = 1,
      limit = 20,
    } = params;

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const offset = (pageNum - 1) * limitNum;

    // Full-text search via MeiliSearch
    if (q.trim()) {
      const cleanQ = q.trim();
      
      // 1. Check for exact document number match in Postgres first (guarantees exact number lookup works instantly)
      let whereExact: any = {
        OR: [
          { documentNumber: { equals: cleanQ, mode: 'insensitive' } },
          { normalizedNumber: { equals: cleanQ, mode: 'insensitive' } }
        ]
      };
      
      const isDocNumberPattern = /^\d+\/\d+/.test(cleanQ);
      if (isDocNumberPattern) {
        const normalizedQ = normalizeDocumentNumber(cleanQ);
        whereExact.OR.push(
          { documentNumber: { startsWith: cleanQ + '/', mode: 'insensitive' } },
          { normalizedNumber: { startsWith: normalizedQ + '/', mode: 'insensitive' } }
        );
      }

      if (documentType) {
        const types = documentType.split(',').map(s => s.trim()).filter(Boolean);
        if (types.length > 0) whereExact.documentType = { in: types };
      }
      if (validityStatus) {
        const statuses = validityStatus.split(',').map(s => s.trim()).filter(Boolean);
        if (statuses.length > 0) whereExact.validityStatus = { in: statuses };
      }
      if (field) {
        const fields = field.split(',').map(s => s.trim()).filter(Boolean);
        if (fields.length > 0) whereExact.field = { in: fields };
      }

      const exactDocs = await prisma.canonicalDocument.findMany({
        where: whereExact,
        select: {
          id: true,
          documentNumber: true,
          documentType: true,
          title: true,
          issuingBody: true,
          promulgationDate: true,
          effectiveDate: true,
          validityStatus: true,
          field: true,
        },
        take: 30,
        orderBy: { promulgationDate: 'desc' }
      });

      const meiliFilters: string[] = [];
      if (documentType) {
        const types = documentType.split(',').map(s => s.trim()).filter(Boolean);
        if (types.length > 0) {
          meiliFilters.push(`(${types.map(t => `documentType = "${escapeMeiliFilterValue(t)}"`).join(' OR ')})`);
        }
      }
      if (issuingBody) {
        const bodies = issuingBody.split(',').map(s => s.trim()).filter(Boolean);
        if (bodies.length > 0) {
          meiliFilters.push(`(${bodies.map(b => `issuingBody = "${escapeMeiliFilterValue(b)}"`).join(' OR ')})`);
        }
      }
      if (validityStatus) {
        const statuses = validityStatus.split(',').map(s => s.trim()).filter(Boolean);
        if (statuses.length > 0) {
          meiliFilters.push(`(${statuses.map(s => `validityStatus = "${escapeMeiliFilterValue(s)}"`).join(' OR ')})`);
        }
      }
      if (field) {
        const fields = field.split(',').map(s => s.trim()).filter(Boolean);
        if (fields.length > 0) {
          meiliFilters.push(`(${fields.map(f => `field = "${escapeMeiliFilterValue(f)}"`).join(' OR ')})`);
        }
      }
      if (yearFrom) meiliFilters.push(`promulgationYear >= ${yearFrom}`);
      if (yearTo) meiliFilters.push(`promulgationYear <= ${yearTo}`);

      let meiliQuery = q;
      if (exact === 'true' && q.trim()) {
        const trimmed = q.trim();
        if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) {
          meiliQuery = `"${trimmed}"`;
        }
      }

      // When hybrid RRF fusion is enabled, we must fetch an un-paginated candidate
      // pool from rank 0 (not the requested page's offset) so RRF can merge BM25
      // and vector ranks correctly; the real page offset is applied once, after
      // fusion, below. Otherwise pagination would be double-applied.
      const hybridEnabled = params.hybrid !== 'false' && (params.hybrid as any) !== false;
      const candidatePoolSize = Math.min(offset + limitNum, 500);
      const meiliOffset = hybridEnabled ? 0 : offset;
      const meiliLimit = hybridEnabled ? candidatePoolSize : limitNum;

      const searchOptions: any = {
        offset: meiliOffset,
        limit: meiliLimit,
        filter: meiliFilters.length > 0 ? meiliFilters.join(' AND ') : undefined,
        attributesToHighlight: ['title', 'fullText'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
        attributesToCrop: ['fullText'],
        cropLength: 200,
      };

      if (scope === 'title') {
        searchOptions.attributesToSearchOn = ['title'];
      }

      let searchResult: any = { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 };
      let hits: any[] = [];
      let totalCount = 0;
      let degraded = false;

      try {
        searchResult = await meili.index(LEGAL_DOCS_INDEX).search(meiliQuery, searchOptions);
        hits = searchResult.hits || [];
        totalCount = searchResult.estimatedTotalHits ?? hits.length;
      } catch (meiliErr) {
        console.error('[SearchService] MeiliSearch error, falling back to PostgreSQL:', meiliErr);
        degraded = true;

        // Clean query for Postgres ILIKE search — every term must appear in
        // either title or fullText (AND across terms, OR across the two fields),
        // matching full-text search semantics more closely than a single-field OR.
        const cleanTerms = cleanQ.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 1).slice(0, 5);
        const termClauses = cleanTerms.length > 0
          ? cleanTerms.map(term => ({
              OR: [
                { title: { contains: term, mode: 'insensitive' as const } },
                { fullText: { contains: term, mode: 'insensitive' as const } },
              ],
            }))
          : [{ OR: [{ title: { contains: cleanQ.slice(0, 30), mode: 'insensitive' as const } }] }];
        const searchWhere: any = { AND: termClauses };

        if (documentType) {
          const types = documentType.split(',').map(s => s.trim()).filter(Boolean);
          if (types.length > 0) searchWhere.documentType = { in: types };
        }
        if (validityStatus) {
          const statuses = validityStatus.split(',').map(s => s.trim()).filter(Boolean);
          if (statuses.length > 0) searchWhere.validityStatus = { in: statuses };
        }

        const [fallbackDocs, fallbackCount] = await Promise.all([
          prisma.canonicalDocument.findMany({
            where: searchWhere,
            select: {
              id: true,
              documentNumber: true,
              documentType: true,
              title: true,
              issuingBody: true,
              promulgationDate: true,
              effectiveDate: true,
              validityStatus: true,
              field: true,
            },
            take: limitNum,
            skip: offset,
            orderBy: { promulgationDate: 'desc' },
          }),
          prisma.canonicalDocument.count({ where: searchWhere }),
        ]);

        hits = fallbackDocs.map(doc => ({
          ...doc,
          promulgationYear: doc.promulgationDate ? new Date(doc.promulgationDate).getFullYear() : null,
          _formatted: {
            title: doc.title,
            documentNumber: doc.documentNumber,
            fullText: doc.title,
          }
        }));
        totalCount = fallbackCount;
      }

      const exactIds = new Set(exactDocs.map(d => d.id));
      if (exactDocs.length > 0) {
        hits = hits.filter((h: any) => !exactIds.has(h.id));

        if (pageNum === 1) {
          const formattedExactDocs = exactDocs.map(doc => ({
            ...doc,
            promulgationYear: doc.promulgationDate ? new Date(doc.promulgationDate).getFullYear() : null,
            _formatted: {
              title: doc.title,
              documentNumber: `<mark>${doc.documentNumber}</mark>`,
              fullText: doc.title
            }
          }));
          hits = [...formattedExactDocs, ...hits];
          if (hits.length > limitNum) {
            hits = hits.slice(0, limitNum);
          }
          totalCount = Math.max(totalCount + exactDocs.length, hits.length);
        }
      }

      // 2. Perform pgvector similarity search in parallel (if hybrid is enabled or by default)
      let vectorHits: Array<{ documentId: string; distance: number }> = [];
      if (hybridEnabled) {
        try {
          vectorHits = await SearchService.searchVector(cleanQ, Math.max(50, candidatePoolSize), {
            documentType,
            yearFrom,
            yearTo,
            issuingBody,
          });
        } catch (vectorErr) {
          console.error('[SearchService] Vector search failed, continuing with BM25-only results:', vectorErr);
          vectorHits = [];
        }
      }

      // 3. Apply Reciprocal Rank Fusion (RRF) algorithm if vector hits are present
      if (vectorHits.length > 0) {
        const K = 60;
        const hitMap = new Map<string, any>();

        // Process BM25 Meili hits
        hits.forEach((hit: any, idx: number) => {
          hitMap.set(hit.id, {
            ...hit,
            rrfScore: 1 / (K + idx + 1),
          });
        });

        // Process pgvector hits. Exact-number matches are already shown (page 1
        // only, prepended above) and excluded from `hits`/BM25 rank — also skip
        // them here so they can't re-appear via the vector path on any page.
        const missingVectorIds: string[] = [];
        const vectorRrfById = new Map<string, { rrf: number; distance: number }>();
        for (let j = 0; j < vectorHits.length; j++) {
          const vHit = vectorHits[j];
          if (exactIds.has(vHit.documentId)) continue;
          const vRrf = 1 / (K + j + 1);

          if (hitMap.has(vHit.documentId)) {
            const existing = hitMap.get(vHit.documentId);
            existing.rrfScore += vRrf;
            existing.vectorScore = vHit.distance;
          } else if (!vectorRrfById.has(vHit.documentId)) {
            missingVectorIds.push(vHit.documentId);
            vectorRrfById.set(vHit.documentId, { rrf: vRrf, distance: vHit.distance });
          }
        }

        // Batch-fetch doc details for vector-only hits (avoids N+1 queries).
        if (missingVectorIds.length > 0) {
          const vDocs = await prisma.canonicalDocument.findMany({
            where: { id: { in: missingVectorIds } },
            select: {
              id: true,
              documentNumber: true,
              documentType: true,
              title: true,
              issuingBody: true,
              promulgationDate: true,
              effectiveDate: true,
              validityStatus: true,
              field: true,
              trichYeu: true,
            },
          });
          for (const vDoc of vDocs) {
            const rrf = vectorRrfById.get(vDoc.id)!;
            hitMap.set(vDoc.id, {
              ...vDoc,
              promulgationYear: vDoc.promulgationDate ? new Date(vDoc.promulgationDate).getFullYear() : null,
              _formatted: { title: vDoc.title, fullText: vDoc.trichYeu || vDoc.title },
              rrfScore: rrf.rrf,
              vectorScore: rrf.distance,
            });
          }
        }

        // Sort candidates by combined RRF score descending
        const combinedHits = Array.from(hitMap.values()).sort((a, b) => b.rrfScore - a.rrfScore);
        hits = combinedHits.slice(offset, offset + limitNum);
        totalCount = Math.max(totalCount, combinedHits.length);
      }

      const matchedDocIds = hits.map((h: any) => h.id);
      let astHighlights: Record<string, any> = {};

      if (matchedDocIds.length > 0) {
        try {
          const docIdFilter = matchedDocIds.map((id: string) => `documentId = "${escapeMeiliFilterValue(id)}"`).join(' OR ');
          const astResult = await meili.index(LEGAL_AST_INDEX).search(meiliQuery, {
            limit: limitNum * 2,
            filter: docIdFilter,
            attributesToHighlight: ['heading', 'content'],
            highlightPreTag: '<mark>',
            highlightPostTag: '</mark>',
            attributesToCrop: ['content'],
            cropLength: 150,
          });

          for (const astHit of (astResult?.hits || []) as any[]) {
            if (!astHighlights[astHit.documentId]) {
              astHighlights[astHit.documentId] = {
                id: astHit.id,
                nodeType: astHit.nodeType,
                heading: astHit._formatted?.heading || astHit.heading,
                contentSnippet: astHit._formatted?.content || astHit.content,
              };
            }
          }
        } catch (astErr) {
          // Non-critical: search still returns results without inline AST highlights.
          console.error('[SearchService] AST highlight search failed:', astErr);
        }
      }

      return {
        results: hits.map((hit: any) => ({ ...hit, astMatch: astHighlights[hit.id] || null })),
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        query: q,
        processingTimeMs: searchResult.processingTimeMs || 0,
        isHybrid: vectorHits.length > 0,
        degraded,
      };
    }


    // Browse (filter only) via Prisma
    const where: any = {};
    if (documentType) {
      const types = documentType.split(',').map(s => s.trim()).filter(Boolean);
      if (types.length > 0) {
        where.documentType = { in: types };
      }
    }
    if (issuingBody) {
      const bodies = issuingBody.split(',').map(s => s.trim()).filter(Boolean);
      if (bodies.length > 0) {
        where.OR = bodies.map(b => ({ issuingBody: { contains: b, mode: 'insensitive' } }));
      }
    }
    if (validityStatus) {
      const statuses = validityStatus.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        where.validityStatus = { in: statuses };
      }
    }
    if (field) {
      const fields = field.split(',').map(s => s.trim()).filter(Boolean);
      if (fields.length > 0) {
        where.field = { in: fields };
      }
    }
    if (yearFrom || yearTo) {
      where.promulgationDate = {};
      if (yearFrom) where.promulgationDate.gte = new Date(`${yearFrom}-01-01`);
      if (yearTo) where.promulgationDate.lte = new Date(`${yearTo}-12-31`);
    }

    const [results, total] = await Promise.all([
      prisma.canonicalDocument.findMany({
        where,
        select: {
          id: true,
          documentNumber: true,
          documentType: true,
          title: true,
          issuingBody: true,
          promulgationDate: true,
          effectiveDate: true,
          validityStatus: true,
          field: true,
        },
        orderBy: { promulgationDate: 'desc' },
        skip: offset,
        take: limitNum,
      }),
      prisma.canonicalDocument.count({ where }),
    ]);

    return {
      results: results as DocumentSummary[],
      total,
      page: pageNum,
      limit: limitNum,
      query: q,
    };
  }

  /**
   * Autocomplete suggestions.
   */
  static async suggest(q: string): Promise<DocumentSummary[]> {
    if (!q.trim()) return [];

    return prisma.canonicalDocument.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { documentNumber: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        documentNumber: true,
        documentType: true,
      },
      take: 8,
      orderBy: { promulgationDate: 'desc' },
    }) as any;
  }

  /**
   * Re-index all documents into MeiliSearch.
   */
  static async reindex(): Promise<{ docTaskUid: number; documentsCount: number; astNodesCount: number }> {
    const documents = await prisma.canonicalDocument.findMany({
      select: {
        id: true,
        documentNumber: true,
        normalizedNumber: true,
        documentType: true,
        title: true,
        issuingBody: true,
        signer: true,
        promulgationDate: true,
        effectiveDate: true,
        validityStatus: true,
        field: true,
        fullText: true,
      },
    });

    const meiliDocs = documents.map((doc: any) => ({
      ...doc,
      promulgationYear: doc.promulgationDate ? new Date(doc.promulgationDate).getFullYear() : null,
    }));

    await meili.createIndex(LEGAL_DOCS_INDEX, { primaryKey: 'id' });
    const index = meili.index(LEGAL_DOCS_INDEX);
    await index.updateFilterableAttributes(['documentType', 'issuingBody', 'validityStatus', 'promulgationYear', 'field']);
    await index.updateSearchableAttributes(['title', 'documentNumber', 'fullText', 'issuingBody', 'signer']);
    const task = await index.addDocuments(meiliDocs);

    await meili.createIndex(LEGAL_AST_INDEX, { primaryKey: 'id' });
    const astIndex = meili.index(LEGAL_AST_INDEX);
    await astIndex.updateSearchableAttributes(['heading', 'content', 'path']);
    await astIndex.updateFilterableAttributes(['documentId', 'nodeType']);

    const astNodes = await prisma.legalASTNode.findMany({
      select: { id: true, documentId: true, nodeType: true, heading: true, content: true, path: true },
    });

    for (let i = 0; i < astNodes.length; i += 10000) {
      await astIndex.addDocuments(astNodes.slice(i, i + 10000));
    }

    return { docTaskUid: task.taskUid, documentsCount: meiliDocs.length, astNodesCount: astNodes.length };
  }

  /**
   * Perform pgvector similarity search on document_embeddings with Filters.
   */
  static async searchVector(query: string, limit: number = 50, filters: any = {}): Promise<Array<{ documentId: string; distance: number }>> {
    try {
      const vector = await EmbeddingService.generateEmbedding(query);
      const vectorStr = `[${vector.join(',')}]`;
      
      let baseQuery = `
         SELECT e."documentId", (1 - (e.embedding <=> $1::vector)) as distance
         FROM "DocumentEmbedding" e
         JOIN "CanonicalDocument" d ON e."documentId" = d."id"
         WHERE 1=1
      `;
      const queryParams: any[] = [vectorStr];
      let paramCount = 1;

      if (filters.documentType) {
        const types = filters.documentType.split(',').map((s: string) => s.trim()).filter(Boolean);
        if (types.length > 0) {
          const placeholders = types.map(() => `$${++paramCount}`).join(',');
          baseQuery += ` AND d."documentType" IN (${placeholders})`;
          queryParams.push(...types);
        }
      }
      if (filters.issuingBody) {
        const bodies = filters.issuingBody.split(',').map((s: string) => s.trim()).filter(Boolean);
        if (bodies.length > 0) {
          const placeholders = bodies.map(() => `$${++paramCount}`).join(',');
          baseQuery += ` AND d."issuingBody" IN (${placeholders})`;
          queryParams.push(...bodies);
        }
      }
      if (filters.yearFrom) {
        baseQuery += ` AND d."promulgationDate" >= $${++paramCount}`;
        queryParams.push(new Date(`${filters.yearFrom}-01-01`));
      }
      if (filters.yearTo) {
        baseQuery += ` AND d."promulgationDate" <= $${++paramCount}`;
        queryParams.push(new Date(`${filters.yearTo}-12-31`));
      }

      baseQuery += ` ORDER BY e.embedding <=> $1::vector LIMIT $${++paramCount};`;
      queryParams.push(limit);

      const rows = await prisma.$queryRawUnsafe<any[]>(baseQuery, ...queryParams);
      
      return (rows || []).map((r) => ({
        documentId: r.documentId,
        distance: Number(r.distance || 0),
      }));
    } catch (err) {
      console.error('Vector search fallback (pgvector error):', err);
      return [];
    }
  }
}
