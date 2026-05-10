// ============================================================
// Health Score API — агрегированная оценка состояния системы
// ============================================================

import { Router, Request, Response } from 'express';
import { readState } from '../myrmex.js';

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

router.get('/', (_req: Request, res: Response) => {
  const state = readState();

  // Servers score
  const totalServers = state.servers.length;
  const onlineServers = state.servers.filter(s => s.status === 'online').length;
  const serversScore = totalServers === 0 ? 100 : Math.round((onlineServers / totalServers) * 100);

  // Tasks score
  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = state.tasks.filter(t => t.status === 'in_progress' || t.status === 'review').length;
  const tasksScore = totalTasks === 0 ? 100 : Math.round(((doneTasks + inProgressTasks * 0.5) / totalTasks) * 100);

  // Agents score
  const totalAgents = state.agents.length;
  const activeAgents = state.agents.filter(a => a.status === 'working' || a.status === 'idle').length;
  const agentsScore = totalAgents === 0 ? 100 : Math.round((activeAgents / totalAgents) * 100);

  // Overall (weighted: servers 40%, tasks 35%, agents 25%)
  const overall = Math.round(
    serversScore * 0.4 +
    tasksScore * 0.35 +
    agentsScore * 0.25
  );

  const result: HealthScore = {
    overall,
    servers: { online: onlineServers, total: totalServers, score: serversScore },
    tasks: { total: totalTasks, done: doneTasks, inProgress: inProgressTasks, score: tasksScore },
    agents: { active: activeAgents, total: totalAgents, score: agentsScore },
    timestamp: new Date().toISOString(),
  };

  res.json(result);
});
