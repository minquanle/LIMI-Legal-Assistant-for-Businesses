import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import cron from 'node-cron';
import parser from 'cron-parser';
import { prisma } from '../infrastructure/db.js';
import { CRAWL_JOB_DEFINITIONS } from './crawl-job-registry.js';

/**
 * Schedules and runs the incremental dulieuphapluat.vn update jobs managed
 * from /admin/crawl-jobs. Each run spawns the crawler's
 * src/jobs/run-update-job.ts (diff sitemap vs already-collected URLs, crawl
 * only the new ones), then — for datasets backed by a lookup tool — appends
 * the new rows to `reference_lookups` via the import script. Runs are
 * recorded in `crawl_job_runs`; at most MAX_CONCURRENT run at once, the rest
 * queue, so a burst of cron ticks can't hammer the source site.
 */

const MAX_CONCURRENT = 2;
const MAX_RUNTIME_MS = 8 * 60 * 60 * 1000;
const LOG_TAIL_CHARS = 6000;

interface ActiveRun {
  runId: string;
  jobKey: string;
  child?: ChildProcess;
  cancelled: boolean;
}

export class CrawlJobService {
  private static tasks = new Map<string, cron.ScheduledTask>();
  private static active = new Map<string, ActiveRun>(); // by job key: running
  private static queue: Array<{ jobKey: string; runId: string }> = [];

  /** Seed missing jobs, fail runs orphaned by a restart, and schedule enabled jobs. */
  static async init() {
    for (const def of CRAWL_JOB_DEFINITIONS) {
      await prisma.crawlJob.upsert({
        where: { key: def.key },
        update: { name: def.name, description: def.description, groupName: def.groupName, importTarget: def.importTarget ?? null },
        create: {
          key: def.key,
          name: def.name,
          description: def.description,
          groupName: def.groupName,
          importTarget: def.importTarget ?? null,
          schedule: def.defaultSchedule,
          maxNewUrls: def.defaultMaxNewUrls,
        },
      });
    }

    await prisma.crawlJobRun.updateMany({
      where: { status: { in: ['RUNNING', 'QUEUED'] } },
      data: { status: 'FAILED', finishedAt: new Date(), error: 'Bị gián đoạn do backend khởi động lại' },
    });

    await this.rescheduleAll();
  }

  static async rescheduleAll() {
    for (const t of this.tasks.values()) t.stop();
    this.tasks.clear();
    const jobs = await prisma.crawlJob.findMany({ where: { enabled: true } });
    for (const job of jobs) this.scheduleJob(job.key, job.schedule);
    console.log(`[CrawlJobService] Scheduled ${this.tasks.size} incremental crawl jobs`);
  }

  private static scheduleJob(key: string, schedule: string) {
    if (!cron.validate(schedule)) return;
    const task = cron.schedule(schedule, () => {
      this.enqueue(key, 'cron').catch((err) => console.error(`[CrawlJobService] enqueue ${key} failed:`, err));
    });
    this.tasks.set(key, task);
  }

  static nextRunAt(schedule: string): Date | null {
    try {
      return parser.parseExpression(schedule).next().toDate();
    } catch {
      return null;
    }
  }

  static validateSchedule(schedule: string): boolean {
    return cron.validate(schedule) && this.nextRunAt(schedule) !== null;
  }

  static isActive(key: string): boolean {
    return this.active.has(key) || this.queue.some((q) => q.jobKey === key);
  }

  /** Queue a run; returns null if this job is already running/queued. */
  static async enqueue(jobKey: string, trigger: 'cron' | 'manual') {
    const job = await prisma.crawlJob.findUnique({ where: { key: jobKey } });
    if (!job) throw new Error(`Unknown crawl job: ${jobKey}`);
    if (this.isActive(jobKey)) return null;

    const run = await prisma.crawlJobRun.create({ data: { jobId: job.id, trigger, status: 'QUEUED' } });
    this.queue.push({ jobKey, runId: run.id });
    this.pump();
    return run;
  }

  static async cancel(jobKey: string): Promise<boolean> {
    const queued = this.queue.findIndex((q) => q.jobKey === jobKey);
    if (queued >= 0) {
      const [q] = this.queue.splice(queued, 1);
      await prisma.crawlJobRun.update({ where: { id: q.runId }, data: { status: 'CANCELLED', finishedAt: new Date() } });
      return true;
    }
    const run = this.active.get(jobKey);
    if (!run) return false;
    run.cancelled = true;
    this.killTree(run.child);
    return true;
  }

  private static killTree(child?: ChildProcess) {
    if (!child?.pid) return;
    try {
      process.kill(-child.pid, 'SIGTERM'); // detached => own process group
    } catch {
      try {
        child.kill('SIGTERM');
      } catch {
        /* already gone */
      }
    }
  }

  private static pump() {
    while (this.active.size < MAX_CONCURRENT && this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.execute(next.jobKey, next.runId).catch((err) => console.error(`[CrawlJobService] run ${next.jobKey} crashed:`, err));
    }
  }

  private static runProcess(
    cwd: string,
    args: string[],
    env: NodeJS.ProcessEnv,
    active: ActiveRun,
    onOutput: (chunk: string) => void,
  ): Promise<number> {
    return new Promise((resolve) => {
      const child = spawn('npx', ['tsx', ...args], { cwd, shell: true, detached: true, env: { ...process.env, ...env } });
      active.child = child;
      const timer = setTimeout(() => this.killTree(child), MAX_RUNTIME_MS);
      child.stdout?.on('data', (d) => onOutput(String(d)));
      child.stderr?.on('data', (d) => onOutput(String(d)));
      child.on('error', (err) => {
        clearTimeout(timer);
        onOutput(`spawn error: ${err.message}`);
        resolve(1);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        resolve(code ?? 1);
      });
    });
  }

  private static async execute(jobKey: string, runId: string) {
    const job = await prisma.crawlJob.findUnique({ where: { key: jobKey } });
    if (!job) return;

    const active: ActiveRun = { runId, jobKey, cancelled: false };
    this.active.set(jobKey, active);
    const startedAt = Date.now();
    await prisma.crawlJobRun.update({ where: { id: runId }, data: { status: 'RUNNING', startedAt: new Date() } });
    await prisma.crawlJob.update({ where: { id: job.id }, data: { lastRunAt: new Date(), lastStatus: 'RUNNING' } });

    let logTail = '';
    const onOutput = (chunk: string) => {
      logTail = (logTail + chunk.replace(/[[0-9;]*m/g, '')).slice(-LOG_TAIL_CHARS);
    };

    let status: 'SUCCESS' | 'FAILED' | 'CANCELLED' = 'FAILED';
    let error: string | null = null;
    let result: any = null;
    let imported = 0;

    try {
      const resultFile = path.join(os.tmpdir(), `crawl-job-${runId}.json`);
      const crawlerCwd = path.resolve(process.cwd(), '../crawler');
      const code = await this.runProcess(
        crawlerCwd,
        ['src/jobs/run-update-job.ts'],
        {
          JOB_DATASET: jobKey,
          JOB_MAX_NEW_URLS: String(job.maxNewUrls),
          JOB_RESULT_FILE: resultFile,
          // Per-run Crawlee storage so concurrent jobs never share a request queue.
          CRAWLEE_STORAGE_DIR: path.join(crawlerCwd, 'storage', `update-${jobKey}`),
        },
        active,
        onOutput,
      );

      if (fs.existsSync(resultFile)) {
        try {
          result = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));
        } catch {
          /* handled below */
        }
        fs.rmSync(resultFile, { force: true });
      }

      if (active.cancelled) {
        status = 'CANCELLED';
      } else if (code !== 0 || !result) {
        error = result?.error || `Crawler thoát với mã ${code}${result ? '' : ' và không ghi kết quả'}`;
      } else if (result.error) {
        error = result.error;
      } else {
        status = 'SUCCESS';
      }

      // Lookup-tool datasets: append the new rows so the tool shows them.
      if (status === 'SUCCESS' && job.importTarget && Array.isArray(result?.outputFiles) && result.outputFiles.length > 0) {
        let importOut = '';
        const importCode = await this.runProcess(
          process.cwd(),
          ['src/scripts/import-reference-lookup.ts', job.importTarget, '--append', result.outputFiles.join(',')],
          {},
          active,
          (c) => {
            importOut += c;
            onOutput(c);
          },
        );
        const m = importOut.match(/IMPORTED=(\d+)/);
        imported = m ? parseInt(m[1], 10) : 0;
        if (importCode !== 0) {
          status = 'FAILED';
          error = `Crawl thành công nhưng nạp vào DB thất bại (mã ${importCode})`;
        }
      }
    } catch (err) {
      error = (err as Error).message;
    }

    const durationMs = Date.now() - startedAt;
    await prisma.crawlJobRun.update({
      where: { id: runId },
      data: {
        status,
        finishedAt: new Date(),
        newUrls: result?.newUrls ?? 0,
        newRecords: result?.recordsWritten ?? 0,
        failedUrls: result?.failedUrls ?? 0,
        imported,
        truncated: !!result?.truncated,
        error,
        logTail,
      },
    });
    await prisma.crawlJob.update({
      where: { id: job.id },
      data: { lastStatus: status, lastDurationMs: durationMs, lastNewRecords: result?.recordsWritten ?? 0 },
    });

    this.active.delete(jobKey);
    this.pump();
  }
}
