import { config as dotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';

export type Role = 'api' | 'worker' | 'scheduler';
export interface MvpConfig {
  nodeEnv: string; host: string; port: number; workerPort: number; schedulerPort: number;
  databaseUrl: string; redisUrl: string; minioEndpoint: string; minioPort: number;
  minioSsl: boolean; minioAccessKey: string; minioSecretKey: string; bucket: string;
  origins: string[]; healthTimeoutMs: number; minioRegion?: string; embedJobs: boolean;
}
export function loadConfig(): MvpConfig {
  const result = dotenv({ path: process.env.LIMI_ENV_FILE ?? fileURLToPath(new URL('../../../../../.limi.env', import.meta.url)) });
  if (result.error && process.env.LIMI_ENV_FILE) throw new Error('Cannot read LIMI_ENV_FILE');
  return parseConfig(process.env);
}
export function parseConfig(env: NodeJS.ProcessEnv): MvpConfig {
  const required = (key: string) => {
    const value = env[key]?.trim();
    if (!value || value.startsWith('replace-with-')) throw new Error(`Invalid or missing ${key}`);
    return value;
  };
  const integer = (key: string, fallback: number, min = 1, max = 65535) => {
    const raw = env[key] ?? String(fallback);
    if (!/^\d+$/.test(raw) || Number(raw) < min || Number(raw) > max) throw new Error(`Invalid ${key}`);
    return Number(raw);
  };
  const url = (key: string, protocols: string[]) => {
    try { const value = new URL(required(key)); if (!protocols.includes(value.protocol) || !value.hostname) throw new Error(); return value.toString(); }
    catch { throw new Error(`Invalid ${key}`); }
  };
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) throw new Error('Invalid NODE_ENV');
  if (!['true', 'false'].includes(env.MINIO_USE_SSL ?? 'false')) throw new Error('Invalid MINIO_USE_SSL');
  const origins = required('ALLOWED_ORIGINS').split(',').map(value => value.trim());
  for (const origin of origins) {
    try { const parsed = new URL(origin); if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) throw new Error(); }
    catch { throw new Error('Invalid ALLOWED_ORIGINS'); }
  }
  if (nodeEnv === 'production' && origins.some(origin => !origin.startsWith('https://'))) {
    throw new Error('Production ALLOWED_ORIGINS must use HTTPS');
  }
  const bucket = required('MINIO_BUCKET');
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error('Invalid MINIO_BUCKET');
  const endpoint = required('MINIO_ENDPOINT');
  if (endpoint.includes('/') || endpoint.includes(':')) throw new Error('Invalid MINIO_ENDPOINT');
  const secret = required('MINIO_SECRET_KEY');
  if (secret.length < 8) throw new Error('Invalid MINIO_SECRET_KEY');
  const ports = [integer('API_PORT', 4010), integer('WORKER_HEALTH_PORT', 4011), integer('SCHEDULER_HEALTH_PORT', 4012)];
  if (new Set(ports).size !== 3) throw new Error('MVP ports must be distinct');
  return { nodeEnv, host: env.API_HOST ?? '127.0.0.1', port: ports[0], workerPort: ports[1], schedulerPort: ports[2],
    databaseUrl: url('DATABASE_URL', ['postgresql:', 'postgres:']), redisUrl: url('REDIS_URL', ['redis:', 'rediss:']),
    minioEndpoint: endpoint, minioPort: integer('MINIO_PORT', 9100), minioSsl: env.MINIO_USE_SSL === 'true',
    minioAccessKey: required('MINIO_ACCESS_KEY'), minioSecretKey: secret, bucket, origins,
    healthTimeoutMs: integer('HEALTH_TIMEOUT_MS', 4000, 100, 30000),
    // S3-compatible stores other than MinIO (e.g. Cloudflare R2 uses region "auto").
    minioRegion: env.MINIO_REGION?.trim() || undefined,
    // Single-process hosting (free tiers without background workers): the API also runs worker and scheduler jobs.
    embedJobs: env.LIMI_EMBED_JOBS === 'true' };
}
