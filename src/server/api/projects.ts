import { Router, Request, Response } from 'express';
import { readState, writeState, createLogEntry } from '../myrmex.js';
import type { Project } from '@shared/types.js';
import { validate } from '../validation/validate.js';
import { projectCreateSchema, projectUpdateSchema } from '../validation/schemas.js';

export const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const state = await readState();
    res.json(state.projects);
  } catch {
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const state = await readState();
    const project = state.projects.find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch {
    res.status(500).json({ error: 'Failed to read project' });
  }
});

router.post('/', validate(projectCreateSchema), async (req: Request, res: Response) => {
  try {
    const state = await readState();
    const now = new Date().toISOString();

    const project: Project = {
      id: crypto.randomUUID(),
      name: req.body.name,
      description: req.body.description || '',
      color: req.body.color || '#6366f1',
      icon: req.body.icon || '📦',
      status: req.body.status || 'active',
      created_at: now,
      updated_at: now,
    };

    state.projects.push(project);
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'create', 'project', project.id, { name: project.name }
    ));

    res.status(201).json(project);
  } catch {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.put('/:id', validate(projectUpdateSchema), async (req: Request, res: Response) => {
  try {
    const state = await readState();
    const idx = state.projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Project not found' });

    const updated: Project = {
      ...state.projects[idx],
      ...req.body,
      id: state.projects[idx].id,
      created_at: state.projects[idx].created_at,
      updated_at: new Date().toISOString(),
    };

    state.projects[idx] = updated;
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'update', 'project', updated.id, req.body
    ));

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const state = await readState();
    const idx = state.projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Project not found' });

    const deleted = state.projects.splice(idx, 1)[0];
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'delete', 'project', deleted.id, { name: deleted.name }
    ));

    res.json({ success: true, id: deleted.id });
  } catch {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});
