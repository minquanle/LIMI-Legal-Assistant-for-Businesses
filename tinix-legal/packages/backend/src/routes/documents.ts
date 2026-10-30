import { Router, Request, Response } from 'express';
import path from 'path';
import { DocumentService } from '../application/document-service.js';


const router = Router();

/** GET /api/documents/facets/stats */
router.get('/facets/stats', async (_req: Request, res: Response) => {
  try {
    const facets = await DocumentService.getFacets();
    return res.json(facets);
  } catch (err) {
    console.error('Facets error:', err);
    return res.status(500).json({ error: 'Failed to fetch facets' });
  }
});

/** GET /api/documents/:id */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await DocumentService.getById(req.params.id as string);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    return res.json(doc);
  } catch (err) {
    console.error('Document detail error:', err);
    return res.status(500).json({ error: 'Failed to fetch document' });
  }
});

/** GET /api/documents/:id/ast */
router.get('/:id/ast', async (req: Request, res: Response) => {
  try {
    const tree = await DocumentService.getAstTree(req.params.id as string);
    return res.json(tree);
  } catch (err) {
    console.error('AST fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch AST' });
  }
});

/** GET /api/documents/:id/relations */
router.get('/:id/relations', async (req: Request, res: Response) => {
  try {
    const relations = await DocumentService.getRelations(req.params.id as string);
    return res.json(relations);
  } catch (err) {
    console.error('Relations error:', err);
    return res.status(500).json({ error: 'Failed to fetch relations' });
  }
});

/** GET /api/documents/:id/lineage — Hierarchical lineage and validity tree */
router.get('/:id/lineage', async (req: Request, res: Response) => {
  try {
    const lineage = await DocumentService.getLineageTree(req.params.id as string);
    if (!lineage) return res.status(404).json({ error: 'Document not found' });
    return res.json(lineage);
  } catch (err) {
    console.error('Lineage fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch lineage tree' });
  }
});

/** GET /api/documents/:id/mindmap — Root document + guiding/amending relations as a node graph */
router.get('/:id/mindmap', async (req: Request, res: Response) => {
  try {
    const graph = await DocumentService.getMindmapGraph(req.params.id as string);
    if (!graph) return res.status(404).json({ error: 'Document not found' });
    return res.json(graph);
  } catch (err) {
    console.error('Mindmap graph fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch mindmap graph' });
  }
});


/** GET /api/documents/:id/download/:attachmentId */
router.get('/:id/download/:attachmentId', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const attachmentId = req.params.attachmentId as string;
    const attachment = await DocumentService.getAttachment(id, attachmentId);
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

    // Path traversal defense
    const storageRoot = path.resolve(process.env.STORAGE_LOCAL_PATH || './storage');
    const safeFilePath = path.resolve(storageRoot, attachment.storagePath);

    if (!safeFilePath.startsWith(storageRoot)) {
      return res.status(403).json({ error: 'Access denied: invalid file path' });
    }

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(attachment.originalName)}"`,
    );
    return res.sendFile(attachment.storagePath, {
      root: storageRoot,
    });
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ error: 'Download failed' });
  }
});


export { router as documentsRouter };
