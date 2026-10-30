import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/db.js';

export const referenceLookupRouter = Router();

const KNOWN_DATASETS = new Set(['tax-registry', 'admin-unit', 'land-price']);

function isKnownDataset(key: string): boolean {
  return KNOWN_DATASETS.has(key);
}

/**
 * GET /api/reference/:datasetKey/search?q=...&page=...&limit=...
 *
 * Accent-insensitive substring search over `searchText`, same `unaccent`
 * approach as admin-violations. Backed by a trigram GIN index (see
 * scripts/setup-reference-lookup-index.ts) so this stays fast even against
 * the tax-registry dataset's ~1.4M rows.
 */
referenceLookupRouter.get('/:datasetKey/search', async (req: Request, res: Response) => {
  try {
    const datasetKey = req.params.datasetKey as string;
    if (!isKnownDataset(datasetKey)) {
      return res.status(404).json({ error: 'Unknown dataset' });
    }

    const q = (req.query.q as string | undefined)?.trim() || '';
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const skip = (page - 1) * limit;

    if (!q) {
      return res.json({ items: [], total: 0, page, limit });
    }

    const pattern = '%' + q + '%';

    const items = await prisma.$queryRaw<
      Array<{ id: string; title: string; subtitle: string | null; data: unknown }>
    >`
      SELECT id, title, subtitle, data
      FROM reference_lookups
      WHERE "datasetKey" = ${datasetKey}
        AND unaccent("searchText") ILIKE unaccent(${pattern})
      ORDER BY title ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*)::bigint AS count
      FROM reference_lookups
      WHERE "datasetKey" = ${datasetKey}
        AND unaccent("searchText") ILIKE unaccent(${pattern})
    `;

    return res.json({
      items,
      total: Number(countRows[0]?.count ?? 0),
      page,
      limit,
    });
  } catch (err) {
    console.error('[reference-lookup] Error searching:', err);
    return res.status(500).json({ error: 'Failed to search' });
  }
});

/**
 * GET /api/reference/:datasetKey/:id — full detail (the original crawled
 * record, in `data`).
 */
referenceLookupRouter.get('/:datasetKey/:id', async (req: Request, res: Response) => {
  try {
    const datasetKey = req.params.datasetKey as string;
    const id = req.params.id as string;
    if (!isKnownDataset(datasetKey)) {
      return res.status(404).json({ error: 'Unknown dataset' });
    }

    const item = await prisma.referenceLookup.findFirst({
      where: { id, datasetKey },
    });
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.json({ item });
  } catch (err) {
    console.error('[reference-lookup] Error fetching detail:', err);
    return res.status(500).json({ error: 'Failed to fetch detail' });
  }
});
