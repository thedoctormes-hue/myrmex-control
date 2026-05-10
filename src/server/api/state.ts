import { Router, Request, Response } from 'express';
import { readState } from '../myrmex.js';

export const router = Router();

// GET /api/state — полное состояние (для инициализации клиента)
router.get('/', (_req: Request, res: Response) => {
  try {
    const state = readState();
    res.json(state);
  } catch {
    res.status(500).json({ error: 'Failed to read myrmex state' });
  }
});
