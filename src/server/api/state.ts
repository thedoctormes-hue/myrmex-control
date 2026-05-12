import { Router, Request, Response } from 'express';
import { readState } from '../myrmex.js';

export const router = Router();

// GET /api/state — полное состояние (для инициализации клиента)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const state = await readState();
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read myrmex state' });
  }
});
