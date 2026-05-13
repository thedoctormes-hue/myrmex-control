// ============================================================
// Health Score API — агрегированная оценка состояния системы
// ============================================================

import { Router, Request, Response } from 'express';
import { readState } from '../myrmex.js';
import os from 'os';

export const router = Router();

interface HealthScore {
  overall: number;           // 0-100
  servers: {
    online: number;
    total: number;
    score: number;
  };
  tasks: {
    total: number;
    done: number;
    inProgress: number;
    score: number;
  };
  agents: {
    active: number;
    total: number;
    score: number;
  };
  timestamp: string;
}

async function computeHealthScore(): Promise<HealthScore> {
  const state = await readState();

  const totalServers = state.servers.length;
  const onlineServers = state.servers.filter(s => s.status === 'online').length;
  const serversScore = totalServers === 0 ? 100 : Math.round((onlineServers / totalServers) * 100);

  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = state.tasks.filter(t => t.status === 'in_progress' || t.status === 'review').length;
  const tasksScore = totalTasks === 0 ? 100 : Math.round(((doneTasks + inProgressTasks * 0.5) / totalTasks) * 100);

  const totalAgents = state.agents.length;
  const activeAgents = state.agents.filter(a => a.status === 'working' || a.status === 'idle').length;
  const agentsScore = totalAgents === 0 ? 100 : Math.round((activeAgents / totalAgents) * 100);

  const overall = Math.round(
    serversScore * 0.4 +
    tasksScore * 0.35 +
    agentsScore * 0.25
  );

  return {
    overall,
    servers: { online: onlineServers, total: totalServers, score: serversScore },
    tasks: { total: totalTasks, done: doneTasks, inProgress: inProgressTasks, score: tasksScore },
    agents: { active: activeAgents, total: totalAgents, score: agentsScore },
    timestamp: new Date().toISOString(),
  };
}

router.get('/', async (_req: Request, res: Response) => {
  res.json(await computeHealthScore());
});

router.get('/score', async (_req: Request, res: Response) => {
  res.json(await computeHealthScore());
});

// --- BL-024: System metrics endpoint ---

interface SystemMetrics {
  uptime: number;           // секунды
  uptime_human: string;
  memory: {
    total_mb: number;
    used_mb: number;
    free_mb: number;
    usage_percent: number;
  };
  cpu: {
    cores: number;
    load_avg: number[];
  };
  node: {
    version: string;
    pid: number;
  };
  timestamp: string;
}

router.get('/metrics', async (_req: Request, res: Response) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const uptimeSec = process.uptime();

  // Human-readable uptime
  const d = Math.floor(uptimeSec / 86400);
  const h = Math.floor((uptimeSec % 86400) / 3600);
  const m = Math.floor((uptimeSec % 3600) / 60);
  const uptimeHuman = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;

  const result: SystemMetrics = {
    uptime: Math.floor(uptimeSec),
    uptime_human: uptimeHuman,
    memory: {
      total_mb: Math.round(totalMem / 1024 / 1024),
      used_mb: Math.round(usedMem / 1024 / 1024),
      free_mb: Math.round(freeMem / 1024 / 1024),
      usage_percent: Math.round((usedMem / totalMem) * 100),
    },
    cpu: {
      cores: os.cpus().length,
      load_avg: os.loadavg(),
    },
    node: {
      version: process.version,
      pid: process.pid,
    },
    timestamp: new Date().toISOString(),
  };

  res.json(result);
});
