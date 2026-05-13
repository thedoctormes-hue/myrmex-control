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
import { router as agentsRouter } from './api/agents.js';
import { router as stateRouter } from './api/state.js';
import { router as settingsRouter } from './api/settings.js';
import { router as analyticsRouter } from './api/analytics.js';
import { router as auditRouter } from './api/audit.js';
import { startWatchdog, stopWatchdog } from './watchdog.js';
import { rateLimit, errorHandler, cspHeaders, authRateLimit } from './middleware.js';
import { router as backupRouter } from './api/backup.js';
import { router as healthRouter } from './api/health.js';
import { initWebSocket, closeWebSocket } from './ws.js';
import { router as monitoringRouter } from './api/monitoring.js';
import { router as costRouter } from './api/cost.js';
import { router as deployRouter } from './api/deploy.js';
import { router as artifactsRouter } from './api/artifacts.js';
import { router as skillsRouter } from './api/skills.js';
import { router as webhooksRouter } from './api/webhooks.js';
import { router as fileExchangeRouter } from './api/fileExchange.js';
import { router as knowledgeRouter } from './api/knowledge.js';
import { router as sessionsRouter } from './api/sessions.js';
import { router as evolutionRouter } from './api/evolution.js';
import { router as saasRouter } from './api/saas.js';
import { router as demoRouter } from './api/demo.js';

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
app.use('/api/exchange', requireAuth, fileExchangeRouter);
app.use('/api/servers', requireAuth, serversRouter);
app.use('/api/agents', requireAuth, agentsRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/analytics', requireAuth, analyticsRouter);
app.use('/api/audit', requireAuth, auditRouter);
app.use('/api/monitoring', requireAuth, monitoringRouter);
app.use('/api/costs', requireAuth, costRouter);

// BL-034: Deploy
app.use('/api/deploy', requireAuth, deployRouter);

// BL-035: Artifacts
app.use('/api/artifacts', requireAuth, artifactsRouter);

// BL-037: Skills
app.use('/api/skills', skillsRouter);

// BL-038: Webhooks
app.use('/api/webhooks', requireAuth, webhooksRouter);

// BL-043: Knowledge Graph
app.use('/api/knowledge', requireAuth, knowledgeRouter);

// BL-046: Sessions
app.use('/api/sessions', requireAuth, sessionsRouter);

// BL-045: Evolution
app.use('/api/evolution', requireAuth, evolutionRouter);

// BL-047: SaaS
app.use('/api/saas', saasRouter);

// BL-042: Demo
app.use('/api/demo', demoRouter);

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

// BL-028: Initialize WebSocket server
initWebSocket(server);

// Graceful shutdown
function shutdown() {
  stopWatchdog();
  closeWebSocket();
  server.close(() => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
