import { Router, Request, Response } from 'express';
import { readState, writeState, createLogEntry } from '../myrmex.js';
import type { Task, TaskStatus } from '@shared/types.js';

export const router = Router();

// GET /api/tasks — все задачи (фильтр по project_id, status, assignee_id)
router.get('/', (req: Request, res: Response) => {
  try {
    const state = readState();
    let tasks = state.tasks;

    if (req.query.project_id) {
      tasks = tasks.filter(t => t.project_id === req.query.project_id);
    }
    if (req.query.status) {
      tasks = tasks.filter(t => t.status === req.query.status);
    }
    if (req.query.assignee_id) {
      tasks = tasks.filter(t => t.assignee_id === req.query.assignee_id);
    }

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read tasks' });
  }
});

// GET /api/tasks/:id — одна задача
router.get('/:id', (req: Request, res: Response) => {
  try {
    const state = readState();
    const task = state.tasks.find(t => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read task' });
  }
});

// POST /api/tasks — создать задачу
router.post('/', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const now = new Date().toISOString();

    const task: Task = {
      id: crypto.randomUUID(),
      project_id: req.body.project_id || '',
      title: req.body.title || 'Без названия',
      description: req.body.description || '',
      status: (req.body.status as TaskStatus) || 'backlog',
      priority: req.body.priority || 'medium',
      assignee_id: req.body.assignee_id || null,
      parent_id: req.body.parent_id || null,
      dependencies: req.body.dependencies || [],
      tags: req.body.tags || [],
      created_at: now,
      updated_at: now,
      completed_at: null,
    };

    state.tasks.push(task);
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'create', 'task', task.id, { title: task.title }
    ));

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id — обновить задачу
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const idx = state.tasks.findIndex(t => t.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const old = state.tasks[idx];
    const now = new Date().toISOString();

    const updated: Task = {
      ...old,
      ...req.body,
      id: old.id,              // id не меняется
      created_at: old.created_at, // created_at не меняется
      updated_at: now,
      completed_at: req.body.status === 'done' && old.status !== 'done'
        ? now
        : req.body.completed_at ?? old.completed_at,
    };

    state.tasks[idx] = updated;
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'update', 'task', updated.id, req.body
    ));

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id — удалить задачу
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const idx = state.tasks.findIndex(t => t.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const deleted = state.tasks.splice(idx, 1)[0];
    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'delete', 'task', deleted.id, { title: deleted.title }
    ));

    res.json({ success: true, id: deleted.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /api/tasks/:id/move — переместить в другой статус
router.post('/:id/move', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const task = state.tasks.find(t => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const oldStatus = task.status;
    task.status = req.body.status as TaskStatus;
    task.updated_at = new Date().toISOString();
    if (task.status === 'done') {
      task.completed_at = task.updated_at;
    }

    await writeState(state, req.body.source || 'api', createLogEntry(
      req.body.source || 'api', 'move', 'task', task.id, { from: oldStatus, to: task.status }
    ));

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to move task' });
  }
});
