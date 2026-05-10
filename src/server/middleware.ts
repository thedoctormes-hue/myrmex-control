// ============================================================
// Middleware: rate limiting + error logging + security headers
// ============================================================

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// --- Security Headers ---

export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  });
}

// --- Rate Limiter (in-memory, per-IP) ---

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateMap = new Map<string, RateEntry>();
const RATE_LIMIT = 100;           // запросов
const RATE_WINDOW_MS = 60_000;    // в минуту

// Очистка каждые 5 минут
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
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  next();
}

// --- Error Logger ---

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
    // если не удалось записать — молча
  }
}

// --- Global Error Handler ---

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logError(err, req);
  res.status(500).json({ error: 'Internal server error' });
}
