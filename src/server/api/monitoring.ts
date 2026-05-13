// ============================================================
// Monitoring API — BL-032: Real-time monitoring dashboard
// ============================================================

import { Router, Request, Response } from 'express';
import { readState } from '../myrmex.js';
import os from 'os';

export const router = Router();

interface MonitoringData {
  system: {
    uptime_sec: number;
    uptime_human: string;
    memory_total_mb: number;
    memory_used_mb: number;
    memory_free_mb: number;
    memory_usage_percent: number;
    cpu_cores: number;
    cpu_load: number[];
    node_version: string;
  };
  app: {
    active_tasks: number;
    completed_tasks_24h: number;
    total_agents: number;
    active_agents: number;
    online_servers: number;
    total_servers: number;
    changelog_24h: number;
    last_backup: string | null;
  };
  alerts: Alert[];
  timestamp: string;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  source: string;
  timestamp: string;
}

// --- Alert thresholds ---
const MEMORY_WARNING_THRESHOLD = 80;  // %
const MEMORY_CRITICAL_THRESHOLD = 95; // %
const CPU_WARNING_THRESHOLD = 2.0;    // load per core

router.get('/', async (_req: Request, res: Response) => {
  const state = await readState();
  const now = new Date();
  const d24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // System metrics
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);
  const uptimeSec = process.uptime();
  const d = Math.floor(uptimeSec / 86400);
  const h = Math.floor((uptimeSec % 86400) / 3600);
  const m = Math.floor((uptimeSec % 3600) / 60);
  const uptimeHuman = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;

  // App metrics
  const activeTasks = state.tasks.filter(t =>
    t.status !== 'done' && t.status !== 'cancelled'
  ).length;
  const completedTasks24h = state.tasks.filter(t =>
    t.completed_at && new Date(t.completed_at) >= d24
  ).length;
  const activeAgents = state.agents.filter(a =>
    a.status === 'working' || a.status === 'idle'
  ).length;
  const onlineServers = state.servers.filter(s => s.status === 'online').length;
  const changelog24h = state.changelog.filter(e =>
    new Date(e.timestamp) >= d24
  ).length;

  // Alerts
  const alerts: Alert[] = [];

  if (memPercent >= MEMORY_CRITICAL_THRESHOLD) {
    alerts.push({
      id: crypto.randomUUID(),
      severity: 'critical',
      message: `Memory usage critical: ${memPercent}%`,
      source: 'system',
      timestamp: now.toISOString(),
    });
  } else if (memPercent >= MEMORY_WARNING_THRESHOLD) {
    alerts.push({
      id: crypto.randomUUID(),
      severity: 'warning',
      message: `Memory usage high: ${memPercent}%`,
      source: 'system',
      timestamp: now.toISOString(),
    });
  }

  const loadPerCore = os.loadavg()[0] / os.cpus().length;
  if (loadPerCore > CPU_WARNING_THRESHOLD) {
    alerts.push({
      id: crypto.randomUUID(),
      severity: 'warning',
      message: `High CPU load: ${loadPerCore.toFixed(2)} per core`,
      source: 'system',
      timestamp: now.toISOString(),
    });
  }

  // Agent alerts
  const errorAgents = state.agents.filter(a => a.status === 'error');
  for (const agent of errorAgents) {
    alerts.push({
      id: crypto.randomUUID(),
      severity: 'warning',
      message: `Agent "${agent.name}" in error state`,
      source: 'agents',
      timestamp: now.toISOString(),
    });
  }

  // Server alerts
  const offlineServers = state.servers.filter(s => s.status === 'offline');
  for (const server of offlineServers) {
    alerts.push({
      id: crypto.randomUUID(),
      severity: 'critical',
      message: `Server "${server.name}" is offline`,
      source: 'servers',
      timestamp: now.toISOString(),
    });
  }

  const result: MonitoringData = {
    system: {
      uptime_sec: Math.floor(uptimeSec),
      uptime_human: uptimeHuman,
      memory_total_mb: Math.round(totalMem / 1024 / 1024),
      memory_used_mb: Math.round(usedMem / 1024 / 1024),
      memory_free_mb: Math.round(freeMem / 1024 / 1024),
      memory_usage_percent: memPercent,
      cpu_cores: os.cpus().length,
      cpu_load: os.loadavg(),
      node_version: process.version,
    },
    app: {
      active_tasks: activeTasks,
      completed_tasks_24h: completedTasks24h,
      total_agents: state.agents.length,
      active_agents: activeAgents,
      online_servers: onlineServers,
      total_servers: state.servers.length,
      changelog_24h: changelog24h,
      last_backup: null, // TODO: from backup API
    },
    alerts,
    timestamp: now.toISOString(),
  };

  res.json(result);
});
