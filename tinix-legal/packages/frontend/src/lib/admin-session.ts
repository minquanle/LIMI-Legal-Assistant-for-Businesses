import crypto from 'node:crypto';

/**
 * Server-only admin session helpers.
 *
 * The admin secret must NEVER reach the browser. Previously the same value was
 * exposed as NEXT_PUBLIC_ADMIN_KEY, which Next.js inlines into the client
 * bundle — any anonymous visitor could read it out of a static chunk and call
 * the backend as SUPER_ADMIN. Instead the browser proves knowledge of the
 * secret once (POST /api/admin-session) and receives an httpOnly cookie that
 * JavaScript cannot read; server-side proxy routes attach the real key.
 */

export const ADMIN_COOKIE_NAME = 'tinix_admin_session';

/** 8 hours — long enough for an ops session, short enough to limit replay. */
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function getAdminSecret(): string | null {
  return process.env.ADMIN_SECRET_KEY || process.env.API_ADMIN_KEY || null;
}

/** Compare two strings in constant time, without leaking their length. */
function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hb = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(expiresAt: number, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`admin:${expiresAt}`).digest('hex');
}

/** True when the server has an admin secret configured at all. */
export function isAdminAuthConfigured(): boolean {
  return getAdminSecret() !== null;
}

/** Validate a key submitted from the admin login form. */
export function verifyAdminKey(provided: string): boolean {
  const secret = getAdminSecret();
  if (!secret || !provided) return false;
  return safeEqual(provided, secret);
}

/**
 * Mint a session token. The token proves knowledge of the secret without
 * containing it, so a leaked cookie cannot be replayed against the backend
 * directly and expires on its own.
 */
export function issueSessionToken(): string | null {
  const secret = getAdminSecret();
  if (!secret) return null;
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  const secret = getAdminSecret();
  if (!secret || !token) return false;

  const separator = token.indexOf('.');
  if (separator <= 0) return false;

  const expiresAt = Number(token.slice(0, separator));
  const mac = token.slice(separator + 1);
  if (!Number.isFinite(expiresAt) || !mac) return false;
  if (Date.now() > expiresAt) return false;

  return safeEqual(mac, sign(expiresAt, secret));
}

/** The real key to forward to the backend, for server-side callers only. */
export function getBackendAdminKey(): string | null {
  return getAdminSecret();
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_MS / 1000,
};
