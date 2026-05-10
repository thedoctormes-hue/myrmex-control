// ============================================================
// Myrmex Control — Express сервер
// API + статический сервер для production
// ============================================================

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { requireAuth, setup, login, logout, authStatus } from './auth.js';
import { securityHeaders, rateLimit, errorHandler } from './middleware.js';
import { router as tasksRouter } from './api/tasks.js';
import { router as projectsRouter } from './api/projects.js';
import { router as libraryRouter } from './api/library.js';
import { router as filesRouter } from './api/files.js';
import { router as serversRouter } from './api/servers.js';
import { router as stateRouter } from './api/state.js';
import { startWatchdog, stopWatchdog } from './watchdog.js';
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

// Auth routes (публичные)
app.post('/api/auth/setup', setup);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/status', authStatus);

// API routes (требуют авторизации)
app.use('/api/state', requireAuth, stateRouter);
app.use('/api/tasks', requireAuth, tasksRouter);
app.use('/api/projects', requireAuth, projectsRouter);
app.use('/api/library', requireAuth, libraryRouter);
app.use('/api/files', requireAuth, filesRouter);
app.use('/api/servers', requireAuth, serversRouter);

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
