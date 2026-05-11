import { Router, Request, Response } from 'express';
import { readState, writeState, createLogEntry } from '../myrmex.js';
import type { Agent, AgentStatus } from '@shared/types.js';

export const router = Router();

// GET /api/agents
router.get('/', (_req: Request, res: Response) => {
  try {
    const state = readState();
    res.json(state.agents);
  } catch {
    res.status(500).json({ error: 'Failed to read agents' });
  }
});

// GET /api/agents/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const state = readState();
    const agent = state.agents.find(a => a.id === req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch {
    res.status(500).json({ error: 'Failed to read agent' });
  }
});

// POST /api/agents
router.post('/', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const now = new Date().toISOString();

    const agent: Agent = {
      id: crypto.randomUUID(),
      name: req.body.name || 'Новый агент',
      role: req.body.role || 'worker',
      model: req.body.model || 'unknown',
      status: (req.body.status as AgentStatus) || 'idle',
      project_id: req.body.project_id || null,
      current_task_id: req.body.current_task_id || null,
      last_seen: now,
      config: req.body.config || {},
    };

    state.agents.push(agent);
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'create', 'agent', agent.id, { name: agent.name }
    ));

    res.status(201).json(agent);
  } catch {
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// PUT /api/agents/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const idx = state.agents.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Agent not found' });

    const updated: Agent = {
      ...state.agents[idx],
      ...req.body,
      id: state.agents[idx].id,
      last_seen: new Date().toISOString(),
    };

    state.agents[idx] = updated;
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'update', 'agent', updated.id, req.body
    ));

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// DELETE /api/agents/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const idx = state.agents.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Agent not found' });

    const deleted = state.agents.splice(idx, 1)[0];
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'delete', 'agent', deleted.id, { name: deleted.name }
    ));

    res.json({ success: true, id: deleted.id });
  } catch {
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});
