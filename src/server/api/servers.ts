import { Router, Request, Response } from 'express';
import { readState, writeState, createLogEntry } from '../myrmex.js';
import type { Server } from '@shared/types.js';

export const router = Router();

// GET /api/servers
router.get('/', (_req: Request, res: Response) => {
  try {
    const state = readState();
    res.json(state.servers);
  } catch {
    res.status(500).json({ error: 'Failed to read servers' });
  }
});

// GET /api/servers/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const state = readState();
    const server = state.servers.find(s => s.id === req.params.id);
    if (!server) return res.status(404).json({ error: 'Server not found' });
    res.json(server);
  } catch {
    res.status(500).json({ error: 'Failed to read server' });
  }
});

// POST /api/servers
router.post('/', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const now = new Date().toISOString();

    const server: Server = {
      id: crypto.randomUUID(),
      name: req.body.name || 'Новый сервер',
      host: req.body.host || '',
      port: req.body.port || 22,
      status: 'offline',
      services: req.body.services || [],
      last_check: now,
      meta: req.body.meta || {},
    };

    state.servers.push(server);
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'create', 'server', server.id, { name: server.name }
    ));

    res.status(201).json(server);
  } catch {
    res.status(500).json({ error: 'Failed to create server' });
  }
});

// PUT /api/servers/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const idx = state.servers.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Server not found' });

    const updated: Server = {
      ...state.servers[idx],
      ...req.body,
      id: state.servers[idx].id,
      last_check: new Date().toISOString(),
    };

    state.servers[idx] = updated;
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'update', 'server', updated.id, req.body
    ));

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update server' });
  }
});

// DELETE /api/servers/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const idx = state.servers.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Server not found' });

    const deleted = state.servers.splice(idx, 1)[0];
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'delete', 'server', deleted.id, { name: deleted.name }
    ));

    res.json({ success: true, id: deleted.id });
  } catch {
    res.status(500).json({ error: 'Failed to delete server' });
  }
});

// POST /api/servers/:id/check — проверить статус (watchdog вызывает)
router.post('/:id/check', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const server = state.servers.find(s => s.id === req.params.id);
    if (!server) return res.status(404).json({ error: 'Server not found' });

    // Обновить статус (watchdog передаёт результат)
    if (req.body.status) {
      server.status = req.body.status;
    }
    server.last_check = new Date().toISOString();

    await writeState(state, 'watchdog', createLogEntry(
      'watchdog', 'check', 'server', server.id, { status: server.status }
    ));

    res.json(server);
  } catch {
    res.status(500).json({ error: 'Failed to check server' });
  }
});
