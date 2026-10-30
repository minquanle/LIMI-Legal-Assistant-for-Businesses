import { Request, Response, NextFunction } from 'express';

/**
 * 1. Security Headers Middleware (OWASP recommended headers)
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Enable XSS filtering in browsers that support it
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Strict Transport Security (HSTS) in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  // Disable X-Powered-By to prevent fingerprinting
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * 2. In-Memory Sliding Window Rate Limiter
 */
interface RateLimitRecord {
  timestamps: number[];
}

const clientLimits = new Map<string, RateLimitRecord>();

// Cleanup stale client records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of clientLimits.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
    if (record.timestamps.length === 0) {
      clientLimits.delete(ip);
    }
  }
}, 300000);

export function createRateLimiter(options: { maxRequests: number; windowMs: number; message?: string }) {
  const { maxRequests, windowMs, message = 'Quá nhiều yêu cầu từ địa chỉ IP của bạn. Vui lòng thử lại sau.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client IP
    const clientIp = (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown'
    );

    const now = Date.now();
    let record = clientLimits.get(clientIp);
    if (!record) {
      record = { timestamps: [] };
      clientLimits.set(clientIp, record);
    }

    // Filter timestamps within current window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - record.timestamps.length);
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000).toString());

    if (record.timestamps.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      });
    }

    record.timestamps.push(now);
    next();
  };
}

// Pre-configured rate limiters
export const generalRateLimiter = createRateLimiter({
  maxRequests: 120,
  windowMs: 60 * 1000, // 120 req / 1 minute
  message: 'Tần suất gửi yêu cầu quá cao. Vui lòng thử lại sau 1 phút.',
});

export const aiRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 30 AI req / 1 minute
  message: 'Tần suất gọi trợ lý AI vượt hạn mức cho phép. Vui lòng đợi trong giây lát.',
});

/**
 * 3. Safe Global Error Handler Middleware
 */
export function safeErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error('[System Error caught by SafeErrorHandler]:', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    error: 'Internal Server Error',
    message: isDev ? err.message : 'Hệ thống đang bận. Vui lòng thử lại sau.',
    ...(isDev && { stack: err.stack }),
  });
}
