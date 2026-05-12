// ============================================================
// Analytics API — метрики и статистика
// ============================================================

import { Router, Request, Response } from 'express';
import { readState } from '../myrmex.js';

export const router = Router();

interface Analytics {
  tasks: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byProject: { name: string; count: number }[];
    completedLast7Days: number;
    createdLast7Days: number;
    avgCompletionHours: number | null;
  };
  projects: {
    total: number;
    active: number;
    paused: number;
    archived: number;
  };
  agents: {
    byStatus: Record<string, number>;
    byProject: { name: string; count: number }[];
  };
  servers: {
    byStatus: Record<string, number>;
    total: number;
  };
  activity: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  timestamp: string;
}

router.get('/', async (_req: Request, res: Response) => {
  const state = await readState();
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // --- Tasks ---
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  for (const t of state.tasks) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
  }

  const projectTaskCounts: Record<string, number> = {};
  for (const t of state.tasks) {
    projectTaskCounts[t.project_id] = (projectTaskCounts[t.project_id] || 0) + 1;
  }
  const byProject = Object.entries(projectTaskCounts).map(([pid, count]) => {
    const proj = state.projects.find(p => p.id === pid);
    return { name: proj?.name || pid, count };
  }).sort((a, b) => b.count - a.count);

  const completedLast7Days = state.tasks.filter(t =>
    t.completed_at && new Date(t.completed_at) >= d7
  ).length;

  const createdLast7Days = state.tasks.filter(t =>
    new Date(t.created_at) >= d7
  ).length;

  // Avg completion time (for completed tasks)
  const completedTasks = state.tasks.filter(t => t.completed_at && t.created_at);
  const avgCompletionHours = completedTasks.length > 0
    ? completedTasks.reduce((sum, t) => {
        const created = new Date(t.created_at).getTime();
        const completed = new Date(t.completed_at!).getTime();
        return sum + (completed - created) / (1000 * 60 * 60);
      }, 0) / completedTasks.length
    : null;

  // --- Projects ---
  const projects = {
    total: state.projects.length,
    active: state.projects.filter(p => p.status === 'active').length,
    paused: state.projects.filter(p => p.status === 'paused').length,
    archived: state.projects.filter(p => p.status === 'archived').length,
  };

  // --- Agents ---
  const agentByStatus: Record<string, number> = {};
  for (const a of state.agents) {
    agentByStatus[a.status] = (agentByStatus[a.status] || 0) + 1;
  }
  const agentProjectCounts: Record<string, number> = {};
  for (const a of state.agents) {
    if (a.project_id) {
      agentProjectCounts[a.project_id] = (agentProjectCounts[a.project_id] || 0) + 1;
    }
  }
  const agentByProject = Object.entries(agentProjectCounts).map(([pid, count]) => {
    const proj = state.projects.find(p => p.id === pid);
    return { name: proj?.name || pid, count };
  });

  // --- Servers ---
  const serverByStatus: Record<string, number> = {};
  for (const s of state.servers) {
    serverByStatus[s.status] = (serverByStatus[s.status] || 0) + 1;
  }

  // --- Activity (from changelog) ---
  const last24h = state.changelog.filter(e => new Date(e.timestamp) >= d24).length;
  const last7d = state.changelog.filter(e => new Date(e.timestamp) >= d7).length;
  const last30d = state.changelog.filter(e => new Date(e.timestamp) >= d30).length;

  const result: Analytics = {
    tasks: {
      byStatus,
      byPriority,
      byProject,
      completedLast7Days,
      createdLast7Days,
      avgCompletionHours: avgCompletionHours !== null ? Math.round(avgCompletionHours * 10) / 10 : null,
    },
    projects,
    agents: {
      byStatus: agentByStatus,
      byProject: agentByProject,
    },
    servers: {
      byStatus: serverByStatus,
      total: state.servers.length,
    },
    activity: { last24h, last7d, last30d },
    timestamp: now.toISOString(),
  };

  res.json(result);
});
