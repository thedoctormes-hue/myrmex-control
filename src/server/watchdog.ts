// ============================================================
// Watchdog — фоновый мониторинг серверов и баланса
// ============================================================

import { readState, writeState, createLogEntry } from './myrmex.js';

const SERVER_CHECK_INTERVAL = 5 * 60 * 1000;  // 5 минут
const BALANCE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 часа

let serverTimer: ReturnType<typeof setInterval> | null = null;
let balanceTimer: ReturnType<typeof setInterval> | null = null;

export function startWatchdog() {
  console.log('🐕 Watchdog запущен');

  // Проверка серверов
  serverTimer = setInterval(async () => {
    try {
      const state = await readState();
      for (const server of state.servers) {
        const status = await pingServer(server.host, server.port);
        if (status !== server.status) {
          server.status = status;
          server.last_check = new Date().toISOString();
          await writeState(state, 'watchdog', createLogEntry(
            'watchdog', 'check', 'server', server.id, { status }
          ));
        }
      }
    } catch (err) {
      console.error('Watchdog server check error:', err);
    }
  }, SERVER_CHECK_INTERVAL);

  // Проверка баланса (заглушка для v0.1)
  balanceTimer = setInterval(async () => {
    console.log('💰 Balance check (v0.2 — OpenRouter integration)');
  }, BALANCE_CHECK_INTERVAL);
}

export function stopWatchdog() {
  if (serverTimer) clearInterval(serverTimer);
  if (balanceTimer) clearInterval(balanceTimer);
  console.log('🐕 Watchdog остановлен');
}

async function pingServer(host: string, port: number): Promise<'online' | 'offline'> {
  // Простая проверка через TCP connect (v0.1)
  // В v0.2 — HTTP health check
  try {
    const { createConnection } = await import('net');
    return new Promise((resolve) => {
      const socket = createConnection(port, host, () => {
        socket.end();
        resolve('online');
      });
      socket.setTimeout(3000);
      socket.on('timeout', () => {
        socket.destroy();
        resolve('offline');
      });
      socket.on('error', () => {
        resolve('offline');
      });
    });
  } catch {
    return 'offline';
  }
}
