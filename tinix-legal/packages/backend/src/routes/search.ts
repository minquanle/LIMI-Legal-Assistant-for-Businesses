import { Router, Request, Response } from 'express';
import { SearchService } from '../application/search-service.js';

const router = Router();

/** GET /api/search */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, documentType, issuingBody, validityStatus, field, exact, scope, yearFrom, yearTo, page, limit, hybrid } = req.query;

    const result = await SearchService.search({
      q: q as string,
      documentType: documentType as string,
      issuingBody: issuingBody as string,
      validityStatus: validityStatus as string,
      field: field as string,
      exact: exact as string,
      scope: scope as string,
      yearFrom: yearFrom as string,
      yearTo: yearTo as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      hybrid: hybrid as string,
    });

    return res.json(result);
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
});

/** GET /api/search/suggest */
router.get('/suggest', async (req: Request, res: Response) => {
  try {
    const { q = '' } = req.query;
    const suggestions = await SearchService.suggest(q as string);
    return res.json({ suggestions });
  } catch (err) {
    return res.status(500).json({ error: 'Suggestion failed' });
  }
});

/** POST /api/search/index */
router.post('/index', async (_req: Request, res: Response) => {
  try {
    const result = await SearchService.reindex();
    return res.json({ message: 'Indexing started', ...result });
  } catch (err) {
    console.error('Index error:', err);
    return res.status(500).json({ error: 'Indexing failed' });
  }
});

export { router as searchRouter };
