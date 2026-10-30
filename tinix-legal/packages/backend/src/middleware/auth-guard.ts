import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { RBACService } from '../services/rbac-service.js';

/**
 * Compare two secrets in constant time. Hashing first keeps the comparison
 * length-independent, so neither the value nor its length leaks via timing.
 */
function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hb = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

export interface AuthenticatedRequest extends Request {
  userRole?: string;
  userId?: string;
}

/**
 * Middleware: Verify Admin Access Token / API Key
 * Validates either:
 * 1. Bearer Token in Authorization header matching ADMIN_SECRET_KEY or configured session
 * 2. Custom header `x-admin-key` or `x-api-key`
 * 3. Default dev environment pass-through if explicitly in local development with warning
 */
export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const adminKeyHeader = req.headers['x-admin-key'] as string;
  const apiKeyHeader = req.headers['x-api-key'] as string;

  const configuredAdminKey = process.env.ADMIN_SECRET_KEY || process.env.API_ADMIN_KEY;

  let providedToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.slice(7).trim();
  } else if (adminKeyHeader) {
    providedToken = adminKeyHeader.trim();
  } else if (apiKeyHeader) {
    providedToken = apiKeyHeader.trim();
  }

  if (!configuredAdminKey) {
    // Fail closed: never grant admin access implicitly. Local dev must opt in
    // explicitly via ALLOW_DEV_ADMIN_BYPASS=true, never by omission of config.
    const devBypassAllowed = process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_ADMIN_BYPASS === 'true';
    if (devBypassAllowed) {
      req.userRole = 'SUPER_ADMIN';
      return next();
    }
    return res.status(500).json({
      error: 'ServerMisconfigured',
      message: 'ADMIN_SECRET_KEY chưa được cấu hình trên máy chủ.',
    });
  }

  if (providedToken && safeEqual(providedToken, configuredAdminKey)) {
    req.userRole = 'SUPER_ADMIN';
    return next();
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Yêu cầu quyền quản trị viên (Admin Secret Key hoặc Bearer Token không hợp lệ).',
  });
}

/**
 * Middleware: Check if role has specific feature permission in RBAC Matrix
 */
export function requirePermission(featureCode: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.userRole;
    if (!role) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Yêu cầu xác thực trước khi kiểm tra quyền truy cập.',
      });
    }
    try {
      const isAllowed = await RBACService.checkPermission(role, featureCode);
      if (!isAllowed) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Vai trò [${role}] không có quyền thực hiện chức năng [${featureCode}].`,
        });
      }
      next();
    } catch (err) {
      console.error(`[requirePermission] checkPermission failed for role=${role} feature=${featureCode}:`, err);
      return res.status(503).json({
        error: 'ServiceUnavailable',
        message: 'Không thể xác minh quyền truy cập lúc này.',
      });
    }
  };
}
