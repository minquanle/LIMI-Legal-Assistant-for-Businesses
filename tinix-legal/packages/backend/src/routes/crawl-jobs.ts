import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/db.js';
import { requireAdminAuth } from '../middleware/auth-guard.js';
import { CrawlJobService } from '../application/CrawlJobService.js';

export const crawlJobsRouter = Router();
crawlJobsRouter.use(requireAdminAuth);

/** GET /api/admin/crawl-jobs — every job with its latest run + next scheduled time. */
crawlJobsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const jobs = await prisma.crawlJob.findMany({ orderBy: [{ groupName: 'asc' }, { name: 'asc' }] });
    const lastRuns = await prisma.crawlJobRun.findMany({
      where: { jobId: { in: jobs.map((j) => j.id) } },
      orderBy: { startedAt: 'desc' },
      distinct: ['jobId'],
    });
    const lastByJob = new Map(lastRuns.map((r) => [r.jobId, r]));
    res.json({
      jobs: jobs.map((j) => ({
        ...j,
        running: CrawlJobService.isActive(j.key),
        nextRunAt: j.enabled ? CrawlJobService.nextRunAt(j.schedule) : null,
        lastRun: lastByJob.get(j.id) ? { ...lastByJob.get(j.id), logTail: undefined } : null,
      })),
    });
  } catch (err) {
    console.error('[crawl-jobs] list failed:', err);
    res.status(500).json({ error: 'Failed to list crawl jobs' });
  }
});

/** PUT /api/admin/crawl-jobs/:key — { enabled?, schedule?, maxNewUrls? } */
crawlJobsRouter.put('/:key', async (req: Request, res: Response) => {
  try {
    const key = req.params.key as string;
    const { enabled, schedule, maxNewUrls } = req.body ?? {};
    const data: { enabled?: boolean; schedule?: string; maxNewUrls?: number } = {};

    if (enabled !== undefined) {
      if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'enabled must be a boolean' });
      data.enabled = enabled;
    }
    if (schedule !== undefined) {
      if (typeof schedule !== 'string' || !CrawlJobService.validateSchedule(schedule.trim())) {
        return res.status(400).json({ error: 'Biểu thức cron không hợp lệ' });
      }
      data.schedule = schedule.trim();
    }
    if (maxNewUrls !== undefined) {
      if (!Number.isInteger(maxNewUrls) || maxNewUrls < 1 || maxNewUrls > 200000) {
        return res.status(400).json({ error: 'maxNewUrls phải là số nguyên từ 1 đến 200000' });
      }
      data.maxNewUrls = maxNewUrls;
    }

    const job = await prisma.crawlJob.update({ where: { key }, data }).catch(() => null);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    await CrawlJobService.rescheduleAll();
    res.json({ job: { ...job, nextRunAt: job.enabled ? CrawlJobService.nextRunAt(job.schedule) : null } });
  } catch (err) {
    console.error('[crawl-jobs] update failed:', err);
    res.status(500).json({ error: 'Failed to update crawl job' });
  }
});

/** POST /api/admin/crawl-jobs/:key/run — run now (queued if 2 jobs already running). */
crawlJobsRouter.post('/:key/run', async (req: Request, res: Response) => {
  try {
    const run = await CrawlJobService.enqueue(req.params.key as string, 'manual');
    if (!run) return res.status(409).json({ error: 'Job đang chạy hoặc đã nằm trong hàng đợi' });
    res.status(202).json({ run });
  } catch (err) {
    const msg = (err as Error).message;
    res.status(msg.startsWith('Unknown crawl job') ? 404 : 500).json({ error: msg });
  }
});

/** POST /api/admin/crawl-jobs/:key/stop */
crawlJobsRouter.post('/:key/stop', async (req: Request, res: Response) => {
  const stopped = await CrawlJobService.cancel(req.params.key as string);
  if (!stopped) return res.status(409).json({ error: 'Job không đang chạy' });
  res.json({ stopped: true });
});

/** GET /api/admin/crawl-jobs/:key/runs?limit=20 — history incl. log tail. */
crawlJobsRouter.get('/:key/runs', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const job = await prisma.crawlJob.findUnique({ where: { key: req.params.key as string } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const runs = await prisma.crawlJobRun.findMany({ where: { jobId: job.id }, orderBy: { startedAt: 'desc' }, take: limit });
    res.json({ runs });
  } catch (err) {
    console.error('[crawl-jobs] runs failed:', err);
    res.status(500).json({ error: 'Failed to list runs' });
  }
});
