import { Router, Request, Response } from 'express';
import { readState, writeState, createLogEntry } from '../myrmex.js';
import type { Settings } from '@shared/types.js';

export const router = Router();

// GET /api/settings
router.get('/', (_req: Request, res: Response) => {
  try {
    const state = readState();
    res.json(state.settings);
  } catch {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// PUT /api/settings
router.put('/', async (req: Request, res: Response) => {
  try {
    const state = readState();

    const updated: Settings = {
      ...state.settings,
      ...req.body,
      custom: { ...state.settings.custom, ...(req.body.custom || {}) },
    };

    state.settings = updated;
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'update', 'settings', 'global', req.body
    ));

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});
