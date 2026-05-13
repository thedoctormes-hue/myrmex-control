// ============================================================
// Middleware: rate limiting + auth lockout + CSP + error logging
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============================================================
// General Rate Limiter (100 req/min per IP)
// ============================================================

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateMap = new Map<string, RateEntry>();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(key);
  }
}, 5 * 60_000);

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateMap.set(ip, entry);
  }

  entry.count++;

  if (entry.count > RATE_LIMIT) {
    res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  next();
}

// ============================================================
// BL-015: Auth Rate Limiter (5 req/min) + Account Lockout
// ============================================================

interface AuthAttemptEntry {
  failedCount: number;
  lockedUntil: number;
  timestamps: number[];
}

const authAttempts = new Map<string, AuthAttemptEntry>();
const AUTH_RATE_LIMIT = 5;
const AUTH_RATE_WINDOW_MS = 60_000;
const AUTH_LOCKOUT_THRESHOLD = 10;
const AUTH_LOCKOUT_MS = 15 * 60_000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of authAttempts) {
    if (now > entry.lockedUntil && now - (entry.timestamps[entry.timestamps.length - 1] || 0) > 60 * 60 * 1000) {
      authAttempts.delete(ip);
    }
  }
}, 10 * 60_000);

export function authRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let entry = authAttempts.get(ip);
  if (!entry) {
    entry = { failedCount: 0, lockedUntil: 0, timestamps: [] };
    authAttempts.set(ip, entry);
  }

  // Check lockout
  if (entry.lockedUntil > now) {
    const retryAfter = Math.ceil((entry.lockedUntil - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({
      error: 'Account locked due to too many failed attempts',
      retry_after_sec: retryAfter,
    });
    return;
  }

  // Sliding window rate limit
  entry.timestamps = entry.timestamps.filter(t => now - t < AUTH_RATE_WINDOW_MS);
  if (entry.timestamps.length >= AUTH_RATE_LIMIT) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + AUTH_RATE_WINDOW_MS - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({
      error: 'Too many auth attempts',
      retry_after_sec: retryAfter,
    });
    return;
  }

  entry.timestamps.push(now);
  next();
}

/** BL-015: Record a failed auth attempt. Call this from login/setup on failure. */
export function recordAuthFailure(req: Request): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let entry = authAttempts.get(ip);
  if (!entry) {
    entry = { failedCount: 0, lockedUntil: 0, timestamps: [] };
    authAttempts.set(ip, entry);
  }

  entry.failedCount++;
  if (entry.failedCount >= AUTH_LOCKOUT_THRESHOLD) {
    entry.lockedUntil = now + AUTH_LOCKOUT_MS;
  }
}

/** BL-015: Clear auth failures on successful login */
export function clearAuthFailures(req: Request): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  authAttempts.delete(ip);
}

// ============================================================
// CSP Headers (BL-013)
// ============================================================

export function cspHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://t.me",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' ws: wss:",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
  ].join('; '));

  // BL-031: Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // HSTS — only in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
}

// ============================================================
// Error Logger
// ============================================================

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_PATH = join(LOG_DIR, 'error.log');

function ensureLogDir() {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
}

export function logError(err: Error, req?: Request) {
  ensureLogDir();
  const entry = {
    timestamp: new Date().toISOString(),
    message: err.message,
    stack: err.stack,
    url: req?.url,
    method: req?.method,
    ip: req?.ip,
  };
  try {
    appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n', 'utf-8');
  } catch {
    // silent
  }
}

// ============================================================
// Global Error Handler
// ============================================================

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logError(err, req);
  res.status(500).json({ error: 'Internal server error' });
}
