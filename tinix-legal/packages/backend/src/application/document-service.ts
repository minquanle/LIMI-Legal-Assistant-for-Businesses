import { prisma } from '../infrastructure/db.js';
import type { DocumentDetail, DocumentSummary, FacetsResult, AstNodeRecord } from '../domain/types.js';

/**
 * Application layer: Document use cases.
 * All DB interaction goes through Prisma, but is encapsulated here
 * so routes stay thin HTTP controllers.
 */
export class DocumentService {
  /**
   * Get full document detail by ID.
   */
  static async getById(id: string): Promise<DocumentDetail | null> {
    const doc = await prisma.canonicalDocument.findUnique({
      where: { id },
      include: {
        sources: {
          select: { id: true, site: true, url: true, lastCrawledAt: true },
        },
        attachments: {
          select: {
            id: true,
            originalName: true,
            hash: true,
            storagePath: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
        astNodes: {
          select: {
            id: true,
            nodeType: true,
            ordinal: true,
            heading: true,
            content: true,
            path: true,
            depth: true,
            orderIndex: true,
            parentId: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        outgoingRelations: {
          select: {
            id: true,
            relationType: true,
            targetDocNumber: true,
            description: true,
            targetDoc: { select: { id: true, title: true, documentNumber: true } },
          },
        },
        incomingRelations: {
          select: {
            id: true,
            relationType: true,
            targetDocNumber: true,
            description: true,
            sourceDoc: { select: { id: true, title: true, documentNumber: true } },
          },
        },
      },
    });

    if (!doc) return null;

    return {
      ...doc,
      sources: doc.sources as any,
      attachments: doc.attachments as any,
      astNodes: doc.astNodes as AstNodeRecord[],
      outgoingRelations: doc.outgoingRelations.map((r: any) => ({
        id: r.id,
        relationType: r.relationType,
        targetDocNumber: r.targetDocNumber,
        description: r.description,
        document: r.targetDoc ?? null,
      })),
      incomingRelations: doc.incomingRelations.map((r: any) => ({
        id: r.id,
        relationType: r.relationType,
        targetDocNumber: r.targetDocNumber,
        description: r.description,
        document: r.sourceDoc ?? null,
      })),
    } as DocumentDetail;
  }

  /**
   * Get document relations (outgoing + incoming).
   */
  static async getRelations(id: string) {
    const [outgoing, incoming] = await Promise.all([
      prisma.documentRelation.findMany({
        where: { sourceDocId: id },
        include: {
          targetDoc: {
            select: { id: true, title: true, documentNumber: true, validityStatus: true },
          },
        },
      }),
      prisma.documentRelation.findMany({
        where: { targetDocId: id },
        include: {
          sourceDoc: {
            select: { id: true, title: true, documentNumber: true, validityStatus: true },
          },
        },
      }),
    ]);

    return {
      outgoing: outgoing.map((r: any) => ({
        type: r.relationType,
        document: r.targetDoc,
        targetDocNumber: r.targetDocNumber,
        description: r.description,
      })),
      incoming: incoming.map((r: any) => ({
        type: r.relationType,
        document: r.sourceDoc,
        targetDocNumber: r.targetDocNumber,
        description: r.description,
      })),
    };
  }

  /**
   * Computes multi-level hierarchical lineage and validity tree for a document.
   */
  static async getLineageTree(id: string) {
    const doc = await prisma.canonicalDocument.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        documentNumber: true,
        documentType: true,
        issuingBody: true,
        promulgationDate: true,
        effectiveDate: true,
        expiryDate: true,
        validityStatus: true,
      },
    });

    if (!doc) return null;

    // Fetch direct relationships
    const [outgoing, incoming] = await Promise.all([
      (prisma as any).documentRelation.findMany({
        where: { sourceDocId: id },
        include: {
          targetDoc: {
            select: {
              id: true,
              title: true,
              documentNumber: true,
              documentType: true,
              issuingBody: true,
              validityStatus: true,
              effectiveDate: true,
            },
          },
        },
      }),
      (prisma as any).documentRelation.findMany({
        where: { targetDocId: id },
        include: {
          sourceDoc: {
            select: {
              id: true,
              title: true,
              documentNumber: true,
              documentType: true,
              issuingBody: true,
              validityStatus: true,
              effectiveDate: true,
            },
          },
        },
      }),
    ]);

    // Grouping
    const baseLaws: any[] = [];
    const guidingDocuments: any[] = [];
    const amendingDocuments: any[] = [];
    const supersedingDocuments: any[] = [];

    // Outgoing relations
    for (const rel of outgoing) {
      const target = rel.targetDoc || {
        id: null,
        title: rel.targetDocNumber,
        documentNumber: rel.targetDocNumber,
        documentType: 'Văn bản tham chiếu',
        validityStatus: 'KHONG_XAC_DINH',
      };

      const relType = String(rel.relationType);
      if (relType === 'CAN_CU' || relType === 'BASIS') {
        baseLaws.push({ ...target, relationType: 'CAN_CU', description: rel.description || 'Căn cứ ban hành' });
      } else if (relType === 'HUONG_DAN' || relType === 'GUIDES') {
        guidingDocuments.push({ ...target, relationType: 'HUONG_DAN', description: rel.description || 'Hướng dẫn thi hành' });
      } else if (relType === 'SUA_DOI' || relType === 'AMENDS' || relType === 'SUPPLEMENTS') {
        amendingDocuments.push({ ...target, relationType: 'SUA_DOI', description: rel.description || 'Sửa đổi / Bổ sung' });
      } else if (relType === 'THAY_THE' || relType === 'REPLACES' || relType === 'BAI_BO') {
        supersedingDocuments.push({ ...target, relationType: 'THAY_THE', description: rel.description || 'Thay thế / Bãi bỏ' });
      }
    }

    // Incoming relations
    for (const rel of incoming) {
      const source = rel.sourceDoc;
      if (!source) continue;

      const relType = String(rel.relationType);
      if (relType === 'HUONG_DAN' || relType === 'GUIDES') {
        guidingDocuments.push({ ...source, relationType: 'DUOC_HUONG_DAN', description: rel.description || 'Được hướng dẫn bởi' });
      } else if (relType === 'SUA_DOI' || relType === 'AMENDS' || relType === 'SUPPLEMENTS') {
        amendingDocuments.push({ ...source, relationType: 'BI_SUA_DOI', description: rel.description || 'Bị sửa đổi bởi' });
      } else if (relType === 'THAY_THE' || relType === 'REPLACES' || relType === 'BAI_BO') {
        supersedingDocuments.push({ ...source, relationType: 'BI_THAY_THE', description: rel.description || 'Bị thay thế bởi' });
      }
    }

    return {
      root: doc,
      baseLaws,
      guidingDocuments,
      amendingDocuments,
      supersedingDocuments,
      totalConnected: baseLaws.length + guidingDocuments.length + amendingDocuments.length + supersedingDocuments.length,
    };
  }

  /**
   * Builds a { nodes, edges } graph for the "legal mindmap" view from the
   * document's real relation data (same source as getLineageTree) — the root
   * document plus the decrees/circulars that guide or amend it, classified
   * into the node types the mindmap UI expects.
   */
  static async getMindmapGraph(id: string) {
    const lineage = await DocumentService.getLineageTree(id);
    if (!lineage) return null;

    const nodes: Array<{ id: string; label: string; type: 'root' | 'nghidinh' | 'thongtu' | 'related'; level: number }> = [
      {
        id: lineage.root.id,
        label: `${lineage.root.title} (${lineage.root.documentNumber})`,
        type: 'root',
        level: 1,
      },
    ];
    const edges: Array<{ source: string; target: string; relation: string }> = [];
    const seenNodeIds = new Set<string>([lineage.root.id]);

    const classify = (documentType: string | undefined): { type: 'nghidinh' | 'thongtu' | 'related'; level: number } => {
      if (documentType === 'NGHI_DINH') return { type: 'nghidinh', level: 2 };
      if (documentType === 'THONG_TU' || documentType === 'THONG_TU_LIEN_TICH') return { type: 'thongtu', level: 3 };
      return { type: 'related', level: 2 };
    };

    const related = [...lineage.guidingDocuments, ...lineage.amendingDocuments, ...lineage.supersedingDocuments];
    for (const doc of related) {
      if (!doc.id || seenNodeIds.has(doc.id)) continue;
      seenNodeIds.add(doc.id);
      const { type, level } = classify(doc.documentType);
      nodes.push({
        id: doc.id,
        label: `${doc.title} (${doc.documentNumber})`,
        type,
        level,
      });
      edges.push({ source: lineage.root.id, target: doc.id, relation: doc.description });
    }

    return { nodes, edges };
  }



  /**
   * Get AST tree for a document (flat list → nested tree).
   */
  static async getAstTree(id: string) {
    const nodes = await prisma.legalASTNode.findMany({
      where: { documentId: id },
      orderBy: { orderIndex: 'asc' },
    });

    const map = new Map<string, any>();
    const rootNodes: any[] = [];

    for (const node of nodes) {
      map.set(node.id, { ...node, children: [] });
    }
    for (const node of nodes) {
      const mappedNode = map.get(node.id)!;
      if (node.parentId) {
        const parent = map.get(node.parentId);
        if (parent) parent.children.push(mappedNode);
        else rootNodes.push(mappedNode);
      } else {
        rootNodes.push(mappedNode);
      }
    }
    return rootNodes;
  }

  /**
   * Get attachment record by documentId + attachmentId.
   */
  static async getAttachment(documentId: string, attachmentId: string) {
    return prisma.attachment.findFirst({
      where: { id: attachmentId, documentId },
    });
  }

  /**
   * Get filter facets for the search UI.
   */
  static async getFacets(): Promise<FacetsResult> {
    const [documentTypes, issuingBodies, validityStatuses, fields, yearRange] = await Promise.all([
      prisma.canonicalDocument.groupBy({
        by: ['documentType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.canonicalDocument.groupBy({
        by: ['issuingBody'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 50,
      }),
      prisma.canonicalDocument.groupBy({
        by: ['validityStatus'],
        _count: { id: true },
      }),
      prisma.canonicalDocument.groupBy({
        by: ['field'],
        where: { field: { not: '' } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 30,
      }),
      prisma.canonicalDocument.aggregate({
        _min: { promulgationDate: true },
        _max: { promulgationDate: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalDocuments: yearRange._count.id,
      documentTypes: documentTypes.map((d: any) => ({ value: d.documentType, count: d._count.id })),
      issuingBodies: issuingBodies.map((d: any) => ({ value: d.issuingBody, count: d._count.id })),
      validityStatuses: validityStatuses.map((d: any) => ({ value: d.validityStatus, count: d._count.id })),
      fields: fields.map((f: any) => ({ value: f.field, count: f._count.id })),
      yearRange: {
        min: yearRange._min.promulgationDate
          ? new Date(yearRange._min.promulgationDate).getFullYear()
          : null,
        max: yearRange._max.promulgationDate
          ? new Date(yearRange._max.promulgationDate).getFullYear()
          : null,
      },
    };
  }


  /**
   * Browse documents with filters (no full-text search).
   */
  static async browse(params: {
    documentType?: string;
    issuingBody?: string;
    validityStatus?: string;
    yearFrom?: string;
    yearTo?: string;
    page: number;
    limit: number;
  }): Promise<{ results: DocumentSummary[]; total: number }> {
    const { documentType, issuingBody, validityStatus, yearFrom, yearTo, page, limit } = params;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (documentType) where.documentType = documentType;
    if (issuingBody) where.issuingBody = { contains: issuingBody, mode: 'insensitive' };
    if (validityStatus) where.validityStatus = validityStatus;
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
        take: limit,
      }),
      prisma.canonicalDocument.count({ where }),
    ]);

    return { results: results as DocumentSummary[], total };
  }
}
