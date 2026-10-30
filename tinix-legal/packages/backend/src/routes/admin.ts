import { Router } from 'express';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { AdminService } from '../application/admin-service.js';
import { CronService } from '../application/CronService.js';
import { requireAdminAuth } from '../middleware/auth-guard.js';
import { acquireCrawlerLock, setCrawlerLockPid, releaseCrawlerLock } from '../application/crawler-lock.js';

export const adminRouter = Router();

// Apply Admin Auth Guard to all /api/admin routes
adminRouter.use(requireAdminAuth);


// ─── Crawler process state ────────────────────────────────────────────────────
const HEARTBEAT_FILE = path.resolve(process.cwd(), '../crawler/crawler-heartbeat.json');
let activeCrawlerProcess: ChildProcess | null = null;

function readHeartbeatState() {
  try {
    if (!fs.existsSync(HEARTBEAT_FILE)) {
      return { status: 'STOPPED', message: 'No crawler active', lastHeartbeat: null };
    }
    const data = JSON.parse(fs.readFileSync(HEARTBEAT_FILE, 'utf-8'));
    if (data.status === 'RUNNING') {
      const diff = Date.now() - new Date(data.lastHeartbeat).getTime();
      if (diff > 20000) data.status = 'STALLED';
    }
    return data;
  } catch {
    return { status: 'STOPPED', message: 'Error reading heartbeat' };
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/** GET /api/admin/stats */
adminRouter.get('/stats', async (_req, res) => {
  try {
    const stats = await AdminService.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** GET /api/admin/quality */
adminRouter.get('/quality', async (_req, res) => {
  try {
    const report = await AdminService.getQualityReport();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** POST /api/admin/relink-relations */
adminRouter.post('/relink-relations', async (_req, res) => {
  try {
    const count = await AdminService.relinkRelations();
    res.json({ message: `Successfully re-linked ${count} relations`, reLinkedCount: count });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** GET /api/admin/crawler/status */
adminRouter.get(['/crawler/status', '/crawler/heartbeat'], (_req, res) => {
  res.json(readHeartbeatState());
});

/** GET /api/admin/crawler/logs */
adminRouter.get('/crawler/logs', async (_req, res) => {
  try {
    const logs = await AdminService.getCrawlLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** POST /api/admin/crawler/trigger — Daily incremental sweep (oneshot) */
adminRouter.post('/crawler/trigger', (_req, res) => {
  try {
    // Atomic lock, not the heartbeat-file check that used to run here — see
    // crawler-lock.ts for why the heartbeat file alone leaves a race window
    // (shared with CronService's scheduled trigger and /crawler/trigger-full).
    if (!acquireCrawlerLock()) {
      return res.json({ message: 'Crawler is already running', status: 'RUNNING' });
    }
    const crawlerWorkspace = path.resolve(process.cwd(), '../crawler');
    const config = CronService.getConfig();
    activeCrawlerProcess = spawn('npx', ['tsx', 'src/index.ts'], {
      cwd: crawlerWorkspace,
      shell: true,
      detached: true,
      env: {
        ...process.env,
        CRAWL_MODE: 'oneshot',
        DAILY_MAX_PAGES: String(config.maxPagesPerKeyword ?? 10),
      },
    });
    if (activeCrawlerProcess.pid) setCrawlerLockPid(activeCrawlerProcess.pid);
    activeCrawlerProcess.on('close', () => releaseCrawlerLock());
    activeCrawlerProcess.on('error', () => releaseCrawlerLock());
    activeCrawlerProcess.unref();
    res.json({ message: 'Daily incremental sweep triggered', pid: activeCrawlerProcess.pid, status: 'RUNNING' });
  } catch (err) {
    releaseCrawlerLock();
    res.status(500).json({ error: (err as Error).message });
  }
});

/** POST /api/admin/crawler/trigger-full — Full deep scan (all sources, all pages) */
adminRouter.post('/crawler/trigger-full', (_req, res) => {
  try {
    if (!acquireCrawlerLock()) {
      return res.json({ message: 'Crawler is already running', status: 'RUNNING' });
    }
    const crawlerWorkspace = path.resolve(process.cwd(), '../crawler');
    activeCrawlerProcess = spawn('npx', ['tsx', 'src/index.ts'], {
      cwd: crawlerWorkspace,
      shell: true,
      detached: true,
      env: {
        ...process.env,
        CRAWL_MODE: 'full', // Triggers runAllCrawlers() in crawler index.ts
      },
    });
    if (activeCrawlerProcess.pid) setCrawlerLockPid(activeCrawlerProcess.pid);
    activeCrawlerProcess.on('close', () => releaseCrawlerLock());
    activeCrawlerProcess.on('error', () => releaseCrawlerLock());
    activeCrawlerProcess.unref();
    res.json({ message: 'Full deep scan triggered', pid: activeCrawlerProcess.pid, status: 'RUNNING' });
  } catch (err) {
    releaseCrawlerLock();
    res.status(500).json({ error: (err as Error).message });
  }
});

/** POST /api/admin/crawler/stop */
adminRouter.post('/crawler/stop', (_req, res) => {
  try {
    if (activeCrawlerProcess?.pid) {
      try {
        process.kill(activeCrawlerProcess.pid);
      } catch (e) {
        // Ignore if already dead
      }
      activeCrawlerProcess = null;
    }
    try {
      if (fs.existsSync(HEARTBEAT_FILE)) {
        const data = JSON.parse(fs.readFileSync(HEARTBEAT_FILE, 'utf-8'));
        if (data.pid) {
          try {
            process.kill(data.pid);
          } catch (e) {
            // Ignore if already dead
          }
        }
        data.status = 'STOPPED';
        data.message = 'Stopped manually by admin';
        fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify(data, null, 2));
      }
    } catch { /* ignore */ }
    releaseCrawlerLock();
    res.json({ message: 'Crawler stopped', status: 'STOPPED' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** GET /api/admin/crawler/cron */
adminRouter.get('/crawler/cron', (_req, res) => {
  try {
    const config = CronService.getConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** POST /api/admin/crawler/cron */
adminRouter.post('/crawler/cron', (req, res) => {
  try {
    const { enabled, schedule, maxPagesPerKeyword } = req.body;
    if (typeof enabled !== 'boolean' || typeof schedule !== 'string') {
      return res.status(400).json({ error: 'Invalid parameters. Need enabled (boolean) and schedule (string)' });
    }
    const maxPages = typeof maxPagesPerKeyword === 'number' ? maxPagesPerKeyword : 10;
    CronService.updateSettings(enabled, schedule, maxPages);
    res.json({ message: 'Crawler cron settings updated successfully', config: CronService.getConfig() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
