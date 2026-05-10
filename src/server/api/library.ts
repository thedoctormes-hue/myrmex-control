import { Router, Request, Response } from 'express';
import { readState, writeState, createLogEntry } from '../myrmex.js';
import type { Skill } from '@shared/types.js';

export const router = Router();

// GET /api/library
router.get('/', (req: Request, res: Response) => {
  try {
    const state = readState();
    let items = state.library;
    if (req.query.type) {
      items = items.filter(s => s.type === req.query.type);
    }
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Failed to read library' });
  }
});

// GET /api/library/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const state = readState();
    const item = state.library.find(s => s.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Skill not found' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Failed to read skill' });
  }
});

// POST /api/library
router.post('/', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const now = new Date().toISOString();

    const skill: Skill = {
      id: crypto.randomUUID(),
      type: req.body.type || 'skill',
      name: req.body.name || 'Новый скилл',
      description: req.body.description || '',
      content: req.body.content || '',
      file_path: req.body.file_path || null,
      tags: req.body.tags || [],
      created_at: now,
      updated_at: now,
    };

    state.library.push(skill);
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'create', 'skill', skill.id, { name: skill.name }
    ));

    res.status(201).json(skill);
  } catch {
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

// PUT /api/library/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const idx = state.library.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Skill not found' });

    const updated: Skill = {
      ...state.library[idx],
      ...req.body,
      id: state.library[idx].id,
      created_at: state.library[idx].created_at,
      updated_at: new Date().toISOString(),
    };

    state.library[idx] = updated;
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'update', 'skill', updated.id, req.body
    ));

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

// DELETE /api/library/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const idx = state.library.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Skill not found' });

    const deleted = state.library.splice(idx, 1)[0];
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'delete', 'skill', deleted.id, { name: deleted.name }
    ));

    res.json({ success: true, id: deleted.id });
  } catch {
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});
