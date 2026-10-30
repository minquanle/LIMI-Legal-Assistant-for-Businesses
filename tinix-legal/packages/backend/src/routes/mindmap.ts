import { Router, Request, Response } from 'express';
import { MindmapService } from '../services/MindmapService.js';

const router = Router();

/**
 * GET /api/mindmap/diff
 * Phân tích và so sánh 2 phiên bản văn bản, trả về Nodes và Edges cho React Flow
 */
router.post('/diff', async (req: Request, res: Response) => {
  try {
    const { docId1, docId2 } = req.body;
    
    // Gọi service xử lý Tree Diff
    const { nodes, edges } = await MindmapService.generateDiffTree(docId1, docId2);
    
    return res.json({ nodes, edges });
  } catch (err) {
    console.error('Error generating mindmap diff', err);
    return res.status(500).json({ error: 'Failed to generate mindmap diff' });
  }
});

export { router as mindmapRouter };
