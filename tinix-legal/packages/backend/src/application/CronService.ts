import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import cron from 'node-cron';
import { prisma } from '../infrastructure/db.js';
import { WatchlistService } from '../services/watchlist-service.js';
import { QALLMService } from '../services/qa-llm-service.js';
import { acquireCrawlerLock, setCrawlerLockPid, releaseCrawlerLock } from './crawler-lock.js';

const CONFIG_FILE = path.resolve(process.cwd(), 'crawler-cron-config.json');

export interface CronConfig {
  enabled: boolean;
  schedule: string;
  maxPagesPerKeyword: number;
  lastRun?: string;
  nextRun?: string;
  lastStatus?: 'SUCCESS' | 'FAILED' | 'RUNNING';
}

export class CronService {
  private static task: cron.ScheduledTask | null = null;

  static getConfig(): CronConfig {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      }
    } catch (_) {}
    return { enabled: false, schedule: '0 2 * * *', maxPagesPerKeyword: 10 };
  }

  static saveConfig(config: CronConfig) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  }

  static start() {
    const config = this.getConfig();
    if (this.task) {
      this.task.stop();
      this.task = null;
    }

    if (config.enabled && cron.validate(config.schedule)) {
      console.log(`[CronService] Scheduling daily crawler at: ${config.schedule}`);
      this.task = cron.schedule(config.schedule, async () => {
        console.log('[CronService] Triggering scheduled daily crawler sweep...');
        await this.triggerCrawler();
        await this.cleanupOldSessions();
        // check watchlist updates
        console.log('[CronService] Checking for watchlist updates...');
        // await WatchlistService.checkUpdatesAndNotify(); // (Mock for 6.5)

        // Generate Q&A for newly crawled documents
        console.log('[CronService] Generating Q&A for new documents...');
        try {
          const generated = await QALLMService.processUnprocessedDocuments(10);
          console.log(`[CronService] Q&A generation complete: ${generated} items created`);
        } catch (err) {
          console.error('[CronService] Q&A generation failed:', err);
        }
      });
    }
  }

  static updateSettings(enabled: boolean, schedule: string, maxPagesPerKeyword: number = 10) {
    if (!cron.validate(schedule)) {
      throw new Error('Invalid cron expression');
    }
    if (maxPagesPerKeyword < 1 || maxPagesPerKeyword > 50) {
      throw new Error('maxPagesPerKeyword must be between 1 and 50');
    }
    const config = this.getConfig();
    config.enabled = enabled;
    config.schedule = schedule;
    config.maxPagesPerKeyword = maxPagesPerKeyword;
    this.saveConfig(config);
    this.start();
  }

  private static async triggerCrawler() {
    // Atomic lock guards against a race with the admin "run now" endpoints —
    // see crawler-lock.ts for why the heartbeat file alone isn't enough.
    if (!acquireCrawlerLock()) {
      console.log('[CronService] Crawler is already running. Skipping scheduled trigger.');
      return;
    }

    // Update config stats
    const config = this.getConfig();
    config.lastRun = new Date().toISOString();
    config.lastStatus = 'RUNNING';
    this.saveConfig(config);

    const crawlerWorkspace = path.resolve(process.cwd(), '../crawler');
    const child = spawn('npx', ['tsx', 'src/index.ts'], {
      cwd: crawlerWorkspace,
      shell: true,
      detached: true,
      env: {
        ...process.env,
        CRAWL_MODE: 'oneshot',
        DAILY_MAX_PAGES: String(config.maxPagesPerKeyword ?? 10),
      },
    });

    if (child.pid) setCrawlerLockPid(child.pid);
    child.on('error', () => releaseCrawlerLock());

    child.on('close', (code) => {
      const currentConfig = this.getConfig();
      currentConfig.lastStatus = code === 0 ? 'SUCCESS' : 'FAILED';
      this.saveConfig(currentConfig);
      releaseCrawlerLock();
      console.log(`[CronService] Crawler process exited with code ${code}. Status updated.`);
    });

    child.unref();
  }

  private static async cleanupOldSessions() {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const result = await prisma.conversationSession.deleteMany({
        where: { updatedAt: { lt: cutoff } }
      });
      console.log(`[CronService] Cleanup: Deleted ${result.count} old conversation sessions.`);
    } catch(err) {
      console.error('[CronService] Failed to cleanup sessions:', err);
    }
  }
}
