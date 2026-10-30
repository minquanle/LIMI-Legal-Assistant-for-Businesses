import 'dotenv/config';

/**
 * Crawler configuration loaded from environment variables.
 */
export const config = {
  /** Max concurrent requests across all crawlers */
  concurrency: parseInt(process.env.CRAWLER_CONCURRENCY || '3', 10),
  /** Maximum requests per minute per source */
  maxRequestsPerMinute: parseInt(process.env.CRAWLER_MAX_REQUESTS_PER_MINUTE || '30', 10),
  /** Number of retries for failed requests */
  retryCount: parseInt(process.env.CRAWLER_RETRY_COUNT || '3', 10),
  /** Request timeout in seconds */
  requestTimeoutSecs: parseInt(process.env.CRAWLER_REQUEST_TIMEOUT_SECS || '60', 10),
  /** Navigation timeout for Playwright pages in seconds */
  navigationTimeoutSecs: parseInt(process.env.CRAWLER_NAVIGATION_TIMEOUT_SECS || '90', 10),
  /** Storage path for downloaded files */
  storagePath: process.env.STORAGE_LOCAL_PATH || './storage',
  /** Database URL */
  databaseUrl: process.env.DATABASE_URL || '',
  /** User agent for crawlers */
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  /** Common legal search keywords for VBPL daily incremental crawl.
   *  Override with CRAWLER_KEYWORDS as a comma-separated list without
   *  redeploying — previously this array was the only way to change what
   *  the daily crawl searches for. */
  commonLegalKeywords: process.env.CRAWLER_KEYWORDS
    ? process.env.CRAWLER_KEYWORDS.split(',').map((k) => k.trim()).filter(Boolean)
    : [
        'Luật',
        'Nghị định',
        'Quyết định',
        'Thông tư',
        'Nghị quyết',
        'Chỉ thị',
        'đất đai',
        'thuế',
        'lao động',
        'tài chính',
        'doanh nghiệp',
        'đầu tư',
        'dân sự',
        'hình sự',
        'y tế',
        'giáo dục',
        'giao thông',
        'môi trường',
        'xây dựng',
      ],
  /** MinIO object storage connection, centralized here instead of scattered
   *  process.env reads with fallback defaults across pipeline modules. */
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ROOT_USER || 'admin',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'password123',
  },
};
