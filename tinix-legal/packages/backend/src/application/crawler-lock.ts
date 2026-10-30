import fs from 'fs';
import path from 'path';

// CronService.triggerCrawler() and both admin.ts crawler-trigger routes used
// to each read the crawler's heartbeat file and only spawn if status wasn't
// 'RUNNING' — a classic check-then-act race: the heartbeat file is written
// by the *child* crawler process, asynchronously, only after it starts up
// and calls updateHeartbeat() for the first time. Two triggers arriving
// within that startup window both see the same stale "not running" state
// and both spawn, producing two overlapping crawler processes writing to
// the same tables concurrently.
//
// The fix is a lock file created by the *spawning* side, synchronously,
// before the child process even starts — using the `wx` flag, which is
// atomic at the OS level: `open(..., O_CREAT | O_EXCL)` guarantees only one
// caller can win when multiple processes race to create the same path.
const LOCK_FILE = path.resolve(process.cwd(), '../crawler/crawler.lock');

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Attempt to acquire the crawler run lock. Returns true if acquired (caller
 * may now spawn the crawler process), false if another crawler run already
 * holds it. Automatically clears a stale lock left behind by a process that
 * died without releasing it (crash, kill -9).
 */
export function acquireCrawlerLock(): boolean {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const heldPid = parseInt(fs.readFileSync(LOCK_FILE, 'utf-8').trim(), 10);
      if (!heldPid || !isProcessAlive(heldPid)) {
        fs.unlinkSync(LOCK_FILE);
      }
    }
  } catch {
    // If we can't even read/clear a stale lock, fall through and let the
    // exclusive-create attempt below decide.
  }

  try {
    // Written as a placeholder (this backend process's own pid) at acquire
    // time — the caller doesn't know the crawler child's pid yet, since it
    // hasn't been spawned. Call setCrawlerLockPid() right after spawn() so
    // staleness checks are based on the actual crawler process, not the
    // long-lived backend process (which would always read as "alive" and
    // defeat stale-lock recovery entirely).
    fs.writeFileSync(LOCK_FILE, String(process.pid), { flag: 'wx' });
    return true;
  } catch (err: any) {
    if (err.code === 'EEXIST') return false;
    throw err;
  }
}

/** Call once the crawler child process's real pid is known. */
export function setCrawlerLockPid(pid: number): void {
  try {
    fs.writeFileSync(LOCK_FILE, String(pid));
  } catch {
    // Lock file may have already been released concurrently — ignore.
  }
}

export function releaseCrawlerLock(): void {
  try {
    fs.unlinkSync(LOCK_FILE);
  } catch {
    // Already gone — nothing to do.
  }
}
