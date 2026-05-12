// ============================================================
// Myrmex Control — Express сервер
// API + статический сервер для production
// ============================================================

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { requireAuth, setup, login, logout, authStatus, changePassword, twaLogin } from './auth.js';

import { router as tasksRouter } from './api/tasks.js';
import { router as projectsRouter } from './api/projects.js';
import { router as libraryRouter } from './api/library.js';
import { router as filesRouter } from './api/files.js';
import { router as serversRouter } from './api/servers.js';
import { router as stateRouter } from './api/state.js';
import { startWatchdog, stopWatchdog } from './watchdog.js';
import { rateLimit, errorHandler, cspHeaders, authRateLimit } from './middleware.js';
import { router as backupRouter } from './api/backup.js';
import { router as healthRouter } from './api/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- BL-011: Required env check ---
const REQUIRED_ENV: string[] = [];
if (process.env.NODE_ENV === 'production') {
  REQUIRED_ENV.push('JWT_SECRET');
}

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: ${key} is not set in environment`);
    process.exit(1);
  }
}

// --- Read version from package.json ---
function getAppVersion(): string {
  try {
    const pkgPath = join(__dirname, '../package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      return pkg.version || '0.0.0';
    }
  } catch {}
  return '0.0.0';
}

const app = express();
const PORT = process.env.PORT || 3000;

// BL-025: Trust proxy (for CDN/VPN X-Forwarded-For)
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(cspHeaders);
app.use(rateLimit);

// BL-011: Version endpoint (public)
app.get('/api/version', (_req, res) => {
  res.json({
    version: getAppVersion(),
    name: 'Myrmex Control',
    node_env: process.env.NODE_ENV || 'development',
  });
});

// Health check (public, no auth)
app.use('/api/health', healthRouter);

// Auth routes (public, with stricter rate limit)
app.post('/api/auth/setup', authRateLimit, setup);
app.post('/api/auth/login', authRateLimit, login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/status', authStatus);
app.post('/api/auth/change-password', requireAuth, changePassword);
app.post('/api/auth/twa', authRateLimit, twaLogin);

// API routes (require auth)
app.use('/api/state', requireAuth, stateRouter);
app.use('/api/tasks', requireAuth, tasksRouter);
app.use('/api/projects', requireAuth, projectsRouter);
app.use('/api/library', requireAuth, libraryRouter);
app.use('/api/files', requireAuth, filesRouter);
app.use('/api/servers', requireAuth, serversRouter);

// BL-016: Backup API
app.use('/api/backup', requireAuth, backupRouter);

// Production: static client files
const clientDist = join(__dirname, '../client');
app.use(express.static(clientDist));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(join(clientDist, 'index.html'));
});

// Global error handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🐜 Myrmex Control v${getAppVersion()} запущен на http://localhost:${PORT}`);
  startWatchdog();
});

// Graceful shutdown
function shutdown() {
  stopWatchdog();
  server.close(() => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
