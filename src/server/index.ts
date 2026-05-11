// ============================================================
// Myrmex Control — Express сервер
// API + статический сервер для production
// ============================================================

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { requireAuth, requireRole, setup, login, logout, authStatus, refresh, totpSetup, totpVerify, totpDisable } from './auth.js';
import { securityHeaders, rateLimit, errorHandler } from './middleware.js';
import { router as tasksRouter } from './api/tasks.js';
import { router as projectsRouter } from './api/projects.js';
import { router as libraryRouter } from './api/library.js';
import { router as filesRouter } from './api/files.js';
import { router as serversRouter } from './api/servers.js';
import { router as stateRouter } from './api/state.js';
import { router as healthRouter } from './api/health.js';
import { router as auditRouter } from './api/audit.js';
import { router as analyticsRouter } from './api/analytics.js';
import { router as agentsRouter } from './api/agents.js';
import { router as settingsRouter } from './api/settings.js';
import { startWatchdog, stopWatchdog } from './watchdog.js';
import { runAsDemo } from './myrmex.js';
// import { startBackupScheduler, stopBackupScheduler } from './backup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(securityHeaders());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(rateLimit);

// Demo mode middleware — if nginx sets X-Demo-Mode header, run in demo context
app.use((req, _res, next) => {
  const demoHeader = req.headers['x-demo-mode'];
  if (demoHeader === 'true' || demoHeader === '1') {
    return runAsDemo(() => next());
  }
  next();
});

// Version endpoint (public, for client update checks)
app.get('/api/version', (_req, res) => {
  res.json({ version: '1.0.0' });
});

// Auth routes (публичные)
app.post('/api/auth/setup', setup);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.post('/api/auth/refresh', refresh);
app.get('/api/auth/status', authStatus);

// TOTP routes (требуют авторизации)
app.post('/api/auth/totp/setup', requireAuth, totpSetup);
app.post('/api/auth/totp/verify', requireAuth, totpVerify);
app.post('/api/auth/totp/disable', requireAuth, totpDisable);

// API routes (требуют авторизации)
// Read: operator+ (viewer can read)
app.use('/api/state', requireAuth, stateRouter);
app.use('/api/tasks', requireAuth, tasksRouter);
app.use('/api/projects', requireAuth, projectsRouter);
app.use('/api/library', requireAuth, libraryRouter);
app.use('/api/files', requireAuth, filesRouter);
app.use('/api/servers', requireAuth, serversRouter);
app.use('/api/health', requireAuth, healthRouter);
app.use('/api/audit', requireAuth, requireRole('admin'), auditRouter);
app.use('/api/analytics', requireAuth, analyticsRouter);
app.use('/api/agents', requireAuth, agentsRouter);
app.use('/api/settings', requireAuth, settingsRouter);

// Production: статические файлы клиента
const clientDist = join(__dirname, '../client');
app.use(express.static(clientDist));

// SPA fallback — все не-API запросы → index.html
app.get('*', (_req, res) => {
  res.sendFile(join(clientDist, 'index.html'));
});

// Global error handler (должен быть последним)
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🐜 Myrmex Control запущен на http://localhost:${PORT}`);
  startWatchdog();
  // startBackupScheduler();
});

// Graceful shutdown
function shutdown() {
  stopWatchdog();
  // stopBackupScheduler();
  server.close(() => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
