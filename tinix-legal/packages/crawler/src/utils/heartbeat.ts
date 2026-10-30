import fs from 'fs';
import path from 'path';

export interface HeartbeatState {
  pid: number;
  status: 'RUNNING' | 'STOPPED' | 'STALLED';
  lastHeartbeat: string;
  currentUrl?: string;
  processedCount: number;
  successCount: number;
  errorCount: number;
  message?: string;
  startedAt: string;
}

const HEARTBEAT_FILE = path.resolve(process.cwd(), 'crawler-heartbeat.json');

export function updateHeartbeat(state: Partial<HeartbeatState>) {
  try {
    const existing = getHeartbeatState();
    const updated: HeartbeatState = {
      pid: process.pid,
      status: 'RUNNING',
      startedAt: existing?.startedAt || new Date().toISOString(),
      processedCount: existing?.processedCount || 0,
      successCount: existing?.successCount || 0,
      errorCount: existing?.errorCount || 0,
      ...existing,
      ...state,
      lastHeartbeat: new Date().toISOString(),
    };
    fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    // Ignore heartbeat write errors
  }
}

export function getHeartbeatState(): HeartbeatState | null {
  try {
    if (!fs.existsSync(HEARTBEAT_FILE)) return null;
    const raw = fs.readFileSync(HEARTBEAT_FILE, 'utf-8');
    const data = JSON.parse(raw) as HeartbeatState;

    // Check if stalled (no heartbeat for > 20s while RUNNING)
    if (data.status === 'RUNNING') {
      const last = new Date(data.lastHeartbeat).getTime();
      const now = Date.now();
      if (now - last > 20000) {
        data.status = 'STALLED';
      }
    }
    return data;
  } catch (err) {
    return null;
  }
}

export function setHeartbeatStopped(message?: string) {
  const existing = getHeartbeatState();
  if (existing) {
    existing.status = 'STOPPED';
    existing.message = message || 'Process stopped';
    try {
      fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify(existing, null, 2), 'utf-8');
    } catch (_) {}
  }
}
