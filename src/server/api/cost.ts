// ============================================================
// Cost Tracking API — BL-033: Учёт затрат на агентов и серверы
// ============================================================

import { Router, Request, Response } from 'express';
import { readState, writeState, createLogEntry } from '../myrmex.js';

export const router = Router();

// --- Cost model ---

interface CostEntry {
  id: string;
  date: string;          // YYYY-MM-DD
  category: 'agent' | 'server' | 'storage' | 'network' | 'other';
  entity_id: string;     // agent_id or server_id
  entity_name: string;
  amount: number;        // USD
  currency: string;
  details: string;
  source: string;
  created_at: string;
}

interface CostSummary {
  total: number;
  byCategory: Record<string, number>;
  byEntity: { name: string; category: string; amount: number }[];
  daily: { date: string; amount: number }[];
  period: { from: string; to: string };
  currency: string;
  timestamp: string;
}

// --- Default pricing (configurable via settings) ---

const DEFAULT_PRICING: Record<string, number> = {
  agent_hourly: 0.05,     // $0.05 per agent per hour
  server_hourly: 0.10,    // $0.10 per server per hour
  storage_gb_monthly: 0.02, // $0.02 per GB per month
  network_gb: 0.01,       // $0.01 per GB
};

// --- Routes ---

// GET /api/costs — cost summary
router.get('/', async (req: Request, res: Response) => {
  try {
    const state = await readState();
    const now = new Date();

    // Parse period
    const fromParam = req.query.from as string;
    const toParam = req.query.to as string;
    const from = fromParam ? new Date(fromParam) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = toParam ? new Date(toParam) : now;

    // Get cost entries from state (stored in settings.custom.costs)
    const costEntries: CostEntry[] = ((state.settings as unknown as Record<string, unknown>).costs as CostEntry[]) || [];

    // Filter by period
    const filtered = costEntries.filter(e => {
      const d = new Date(e.date);
      return d >= from && d <= to;
    });

    // Calculate summary
    const byCategory: Record<string, number> = {};
    const entityMap: Record<string, { name: string; category: string; amount: number }> = {};
    const dailyMap: Record<string, number> = {};

    let total = 0;
    for (const entry of filtered) {
      total += entry.amount;
      byCategory[entry.category] = (byCategory[entry.category] || 0) + entry.amount;

      const entityKey = `${entry.category}:${entry.entity_id}`;
      if (!entityMap[entityKey]) {
        entityMap[entityKey] = { name: entry.entity_name, category: entry.category, amount: 0 };
      }
      entityMap[entityKey].amount += entry.amount;

      dailyMap[entry.date] = (dailyMap[entry.date] || 0) + entry.amount;
    }

    const byEntity = Object.values(entityMap).sort((a, b) => b.amount - a.amount);
    const daily = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const result: CostSummary = {
      total: Math.round(total * 100) / 100,
      byCategory,
      byEntity,
      daily,
      period: { from: from.toISOString(), to: to.toISOString() },
      currency: 'USD',
      timestamp: now.toISOString(),
    };

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to get cost summary' });
  }
});

// POST /api/costs/estimate — estimate costs based on current state
router.post('/estimate', async (_req: Request, res: Response) => {
  try {
    const state = await readState();
    const pricing = DEFAULT_PRICING;

    // Estimate agent costs (based on active agents)
    const activeAgents = state.agents.filter(a => a.status === 'working' || a.status === 'idle');
    const agentCostDaily = activeAgents.length * pricing.agent_hourly * 24;
    const agentCostMonthly = agentCostDaily * 30;

    // Estimate server costs
    const onlineServers = state.servers.filter(s => s.status === 'online');
    const serverCostDaily = onlineServers.length * pricing.server_hourly * 24;
    const serverCostMonthly = serverCostDaily * 30;

    const totalDaily = agentCostDaily + serverCostDaily;
    const totalMonthly = agentCostMonthly + serverCostMonthly;

    res.json({
      agents: {
        count: activeAgents.length,
        daily: Math.round(agentCostDaily * 100) / 100,
        monthly: Math.round(agentCostMonthly * 100) / 100,
        hourly_rate: pricing.agent_hourly,
      },
      servers: {
        count: onlineServers.length,
        daily: Math.round(serverCostDaily * 100) / 100,
        monthly: Math.round(serverCostMonthly * 100) / 100,
        hourly_rate: pricing.server_hourly,
      },
      total: {
        daily: Math.round(totalDaily * 100) / 100,
        monthly: Math.round(totalMonthly * 100) / 100,
        yearly: Math.round(totalMonthly * 12 * 100) / 100,
      },
      currency: 'USD',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({ error: 'Failed to estimate costs' });
  }
});

// POST /api/costs — add cost entry
router.post('/', async (req: Request, res: Response) => {
  try {
    const state = await readState();
    const now = new Date();

    const entry: CostEntry = {
      id: crypto.randomUUID(),
      date: req.body.date || now.toISOString().split('T')[0],
      category: req.body.category || 'other',
      entity_id: req.body.entity_id || 'unknown',
      entity_name: req.body.entity_name || 'Unknown',
      amount: req.body.amount || 0,
      currency: req.body.currency || 'USD',
      details: req.body.details || '',
      source: req.body.source || 'api',
      created_at: now.toISOString(),
    };

    // Store in settings.custom.costs
    const settings = state.settings as unknown as Record<string, unknown>;
    const costs: CostEntry[] = (settings.costs as CostEntry[]) || [];
    costs.push(entry);
    settings.costs = costs;

    await writeState(
      { settings: state.settings },
      entry.source,
      createLogEntry(entry.source, 'create', 'cost', entry.id, {
        category: entry.category,
        amount: entry.amount,
      })
    );

    res.status(201).json(entry);
  } catch {
    res.status(500).json({ error: 'Failed to add cost entry' });
  }
});
