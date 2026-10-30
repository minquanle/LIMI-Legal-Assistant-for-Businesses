import { prisma } from '../infrastructure/db.js';
import Redis from 'ioredis';

// Trend caching is a pure optimization — the data underneath comes from
// Postgres either way — so Redis being down must never take this feature
// down with it. `lazyConnect` defers the first connection attempt to the
// first actual command (no connection noise at boot if this endpoint is
// never hit), a capped `retryStrategy` keeps reconnect attempts from
// hammering a Redis that's down while still recovering once it's back, and
// the `error` listener replaces ioredis's default behavior of dumping the
// full error + stack on every failed attempt with one short warning.
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  lazyConnect: true,
  retryStrategy: (times) => Math.min(1000 * times, 10000),
});

let loggedRedisUnavailable = false;
redis.on('error', (err) => {
  if (!loggedRedisUnavailable) {
    console.warn('[TrendAnalyticsService] Redis unavailable, trend caching disabled until it recovers:', err.message);
    loggedRedisUnavailable = true;
  }
});
redis.on('ready', () => {
  loggedRedisUnavailable = false;
});

// ioredis's own retry/backoff knobs (maxRetriesPerRequest, retryStrategy)
// govern the *connection*, not a hard ceiling on how long any single command
// can leave the caller waiting — depending on internal reconnect state, a
// command issued while Redis is down can still take many seconds, or more,
// to settle. A request-scoped timeout on each call gives a deterministic
// upper bound regardless of what ioredis is doing internally.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Redis call timed out after ${ms}ms`)), ms)),
  ]);
}

export class TrendAnalyticsService {
  static async getDocumentTrends(filters: any) {
    const cacheKey = `analytics:trends:${JSON.stringify(filters)}`;

    // A cache-read failure must fall through to computing the answer from
    // Postgres, not fail the whole request — caching is an optimization, not
    // a dependency of this feature.
    try {
      const cached = await withTimeout(redis.get(cacheKey), 1000);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn('[TrendAnalyticsService] Cache read failed, computing fresh:', (err as Error).message);
    }

    // Construct raw query to group by year and document type
    const result = await prisma.$queryRaw`
      SELECT 
        EXTRACT(YEAR FROM "promulgationDate") as year,
        "documentType",
        COUNT(*)::int as count
      FROM canonical_documents
      WHERE "promulgationDate" IS NOT NULL
      GROUP BY year, "documentType"
      ORDER BY year ASC
    `;

    const groupedByYear: Record<number, any> = {};
    const typeDistribution: Record<string, number> = {};

    for (const row of (result as any[])) {
      const year = row.year;
      const docType = row.documentType;
      const count = row.count;

      if (!groupedByYear[year]) {
        groupedByYear[year] = { year };
      }
      groupedByYear[year][docType] = count;

      typeDistribution[docType] = (typeDistribution[docType] || 0) + count;
    }

    const trendData = Object.values(groupedByYear).sort((a: any, b: any) => a.year - b.year);
    const summaryData = Object.entries(typeDistribution).map(([name, value]) => ({ name, value }));

    const response = {
      trends: trendData,
      summary: summaryData
    };

    // Cache with TTL 3600 seconds (1 hour). A write failure just means the
    // next request recomputes instead of hitting cache — not worth failing
    // this request over.
    try {
      await withTimeout(redis.setex(cacheKey, 3600, JSON.stringify(response)), 1000);
    } catch (err) {
      console.warn('[TrendAnalyticsService] Cache write failed:', (err as Error).message);
    }

    return response;
  }
}
