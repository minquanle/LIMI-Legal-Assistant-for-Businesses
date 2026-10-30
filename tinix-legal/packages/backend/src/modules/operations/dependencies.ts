import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { createStorage } from './storage.js';
import type { MvpConfig } from './config.js';

export type Checks = Record<'database' | 'redis' | 'storage', 'up' | 'down'>;
export interface Dependencies { database?:PrismaClient; storage?:ReturnType<typeof createStorage>; check(): Promise<Checks>; close(): Promise<void>; }
export function createDependencies(config: MvpConfig): Dependencies {
  const database = new PrismaClient({ datasources: { db: { url: config.databaseUrl } }, log: [] });
  const redis = new Redis(config.redisUrl, { lazyConnect: true, connectTimeout: config.healthTimeoutMs,
    commandTimeout: config.healthTimeoutMs, maxRetriesPerRequest: 0, retryStrategy: () => null, enableOfflineQueue: false });
  redis.on('error', () => {});
  const storage = createStorage(config);
  let inFlight: Promise<Checks> | undefined;
  let redisConnect: Promise<void> | undefined;
  async function pingRedis() {
    if (redis.status === 'wait' || redis.status === 'end') {
      redisConnect ??= redis.connect().finally(() => { redisConnect = undefined; });
      await redisConnect;
    } else if (redisConnect) await redisConnect;
    if (await redis.ping() !== 'PONG') throw new Error('Redis not ready');
  }
  async function bounded(operation: () => Promise<unknown>): Promise<'up' | 'down'> {
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([operation(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Timeout')), config.healthTimeoutMs); })]);
      return 'up';
    } catch { return 'down'; }
    finally { if (timer) clearTimeout(timer); }
  }
  return {
    database, storage,
    check() {
      inFlight ??= Promise.all([
        bounded(() => database.$queryRaw`SELECT 1`), bounded(pingRedis),
        bounded(async () => { if (!await storage.bucketExists(config.bucket)) throw new Error('Missing bucket'); })
      ]).then(([database, redis, storage]) => ({ database, redis, storage })).finally(() => { inFlight = undefined; });
      return inFlight;
    },
    async close() { redis.disconnect(); await database.$disconnect(); }
  };
}
