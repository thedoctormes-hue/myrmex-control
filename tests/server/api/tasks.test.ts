// ============================================================
// API-тесты для tasks.ts — CRUD + move + фильтрация
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import type { Task, MyrmexState } from '@shared/types.js';

// Мокируем myrmex.ts ДО импорта роутера
const mockReadState = vi.fn();
const mockWriteState = vi.fn().mockResolvedValue(undefined);
const mockCreateLogEntry = vi.fn();

vi.mock('../../../src/server/myrmex.js', () => ({
  readState: (...args: unknown[]) => mockReadState(...args),
  writeState: (...args: unknown[]) => mockWriteState(...args),
  createLogEntry: (...args: unknown[]) => mockCreateLogEntry(...args),
}));

// Импортируем ПОСЛЕ моков — получаем app с привязанными роутерами
import { router } from '../../../src/server/api/tasks.js';

// --- Хелперы ---

function createMockState(overrides: Partial<MyrmexState> = {}): MyrmexState {
  const now = new Date().toISOString();
  return {
    _meta: { version: '0.1.0', last_updated: now, last_updated_by: 'test', change_count: 0 },
    workspace: { name: 'Test', description: '', owner: 'tester', created_at: now },
    projects: [],
    agents: [],
    tasks: [],
    library: [],
    files: [],
    servers: [],
    settings: { theme: 'dark', language: 'ru', refresh_interval_sec: 30, notifications_enabled: true, custom: {} },
    mcp_servers: [],
    changelog: [],
    ...overrides,
  };
}

function createTask(overrides: Partial<Task> = {}): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    project_id: 'proj-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'backlog',
    priority: 'medium',
    assignee_id: null,
    parent_id: null,
    dependencies: [],
    tags: [],
    created_at: now,
    updated_at: now,
    completed_at: null,
    ...overrides,
  };
}

function createMockRequest(params: Record<string, string> = {}, body: Record<string, unknown> = {}, query: Record<string, string> = {}): Request {
  return { params, body, query } as unknown as Request;
}

function createMockResponse(): Response & { _json: unknown; _status: number } {
  const res: any = {
    _json: null,
    _status: 200,
    status(code: number) { res._status = code; return res; },
    json(data: unknown) { res._json = data; return res; },
  };
  return res;
}

// Хелпер для вызова роута через supertest-подобный подход
// Ручной вызов handler из роутера Express
function findRouteHandler(method: string, pathPattern: string) {
  const stack = (router as any).stack;
  for (const layer of stack) {
    if (layer.route) {
      const route = layer.route;
      const methods = Object.keys(route.methods).map(m => m.toUpperCase());
      if (methods.includes(method.toUpperCase())) {
        // Простое сравнение путей (без параметров для точного совпадения)
        const routePath = route.path;
        if (routePath === pathPattern || routePath.replace(/:\w+/g, ':id') === pathPattern) {
          return route;
        }
      }
    }
  }
  return null;
}

// --- Тесты ---

describe('GET /api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('возвращает пустой список задач', () => {
    mockReadState.mockReturnValue(createMockState());

    const req = createMockRequest({}, {}, {});
    const res = createMockResponse();

    // Находим handler для GET /
    const route = findRouteHandler('GET', '/');
    expect(route).not.toBeNull();
    const handler = route!.stack[0].handle;
    handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json).toEqual([]);
  });

  it('возвращает все задачи когда нет фильтров', () => {
    const tasks = [
      createTask({ id: 't1', title: 'Task 1' }),
      createTask({ id: 't2', title: 'Task 2' }),
    ];
    mockReadState.mockReturnValue(createMockState({ tasks }));

    const req = createMockRequest({}, {}, {});
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(200);
    expect(res._json).toHaveLength(2);
  });

  it('фильтрует по project_id', () => {
    const tasks = [
      createTask({ id: 't1', project_id: 'proj-1', title: 'Task 1' }),
      createTask({ id: 't2', project_id: 'proj-2', title: 'Task 2' }),
      createTask({ id: 't3', project_id: 'proj-1', title: 'Task 3' }),
    ];
    mockReadState.mockReturnValue(createMockState({ tasks }));

    const req = createMockRequest({}, {}, { project_id: 'proj-1' });
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(200);
    const result = res._json as Task[];
    expect(result).toHaveLength(2);
    expect(result.every(t => t.project_id === 'proj-1')).toBe(true);
  });

  it('фильтрует по status', () => {
    const tasks = [
      createTask({ id: 't1', status: 'backlog' }),
      createTask({ id: 't2', status: 'done' }),
      createTask({ id: 't3', status: 'done' }),
    ];
    mockReadState.mockReturnValue(createMockState({ tasks }));

    const req = createMockRequest({}, {}, { status: 'done' });
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(200);
    const result = res._json as Task[];
    expect(result).toHaveLength(2);
    expect(result.every(t => t.status === 'done')).toBe(true);
  });

  it('фильтрует по assignee_id', () => {
    const tasks = [
      createTask({ id: 't1', assignee_id: 'agent-1' }),
      createTask({ id: 't2', assignee_id: 'agent-2' }),
      createTask({ id: 't3', assignee_id: 'agent-1' }),
    ];
    mockReadState.mockReturnValue(createMockState({ tasks }));

    const req = createMockRequest({}, {}, { assignee_id: 'agent-1' });
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(200);
    const result = res._json as Task[];
    expect(result).toHaveLength(2);
    expect(result.every(t => t.assignee_id === 'agent-1')).toBe(true);
  });

  it('комбинирует несколько фильтров', () => {
    const tasks = [
      createTask({ id: 't1', project_id: 'proj-1', status: 'done', assignee_id: 'agent-1' }),
      createTask({ id: 't2', project_id: 'proj-1', status: 'backlog', assignee_id: 'agent-1' }),
      createTask({ id: 't3', project_id: 'proj-2', status: 'done', assignee_id: 'agent-1' }),
    ];
    mockReadState.mockReturnValue(createMockState({ tasks }));

    const req = createMockRequest({}, {}, { project_id: 'proj-1', status: 'done' });
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(200);
    const result = res._json as Task[];
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t1');
  });

  it('возвращает 500 при ошибке readState', () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });

    const req = createMockRequest({}, {}, {});
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to read tasks' });
  });
});

describe('GET /api/tasks/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('возвращает задачу по ID', () => {
    const task = createTask({ id: 'task-123', title: 'Find me' });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-123' });
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/:id');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(200);
    expect((res._json as Task).id).toBe('task-123');
    expect((res._json as Task).title).toBe('Find me');
  });

  it('возвращает 404 если задача не найдена', () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({ id: 'nonexistent' });
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/:id');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Task not found' });
  });

  it('возвращает 500 при ошибке', () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });

    const req = createMockRequest({ id: 'task-123' });
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/:id');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to read task' });
  });
});

describe('POST /api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'create', entity_type: 'task', entity_id: 'new', diff: {},
    });
  });

  it('создаёт задачу с полными данными', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({}, {
      project_id: 'proj-1',
      title: 'New Task',
      description: 'Full description',
      status: 'todo',
      priority: 'high',
      assignee_id: 'agent-1',
      tags: ['urgent'],
    });
    const res = createMockResponse();

    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);

    expect(res._status).toBe(201);
    const result = res._json as Task;
    expect(result.title).toBe('New Task');
    expect(result.description).toBe('Full description');
    expect(result.status).toBe('todo');
    expect(result.priority).toBe('high');
    expect(result.assignee_id).toBe('agent-1');
    expect(result.tags).toEqual(['urgent']);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeDefined();
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('создаёт задачу с минимальными данными (defaults)', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({}, {});
    const res = createMockResponse();

    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);

    expect(res._status).toBe(201);
    const result = res._json as Task;
    expect(result.title).toBe('Без названия');
    expect(result.status).toBe('backlog');
    expect(result.priority).toBe('medium');
    expect(result.assignee_id).toBeNull();
    expect(result.tags).toEqual([]);
  });

  it('вызывает writeState с правильными аргументами', async () => {
    const state = createMockState({ tasks: [] });
    mockReadState.mockReturnValue(state);

    const req = createMockRequest({}, { title: 'Write Test', source: 'test-source' });
    const res = createMockResponse();

    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);

    expect(mockWriteState).toHaveBeenCalledTimes(1);
    const writeCall = mockWriteState.mock.calls[0];
    expect(writeCall[1]).toBe('test-source');
  });

  it('возвращает 500 при ошибке создания', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });

    const req = createMockRequest({}, { title: 'Fail Task' });
    const res = createMockResponse();

    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to create task' });
  });
});

describe('PUT /api/tasks/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'update', entity_type: 'task', entity_id: 't1', diff: {},
    });
  });

  it('обновляет задачу', async () => {
    const task = createTask({ id: 'task-1', title: 'Old Title', status: 'backlog' });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-1' }, { title: 'New Title', status: 'in_progress' });
    const res = createMockResponse();

    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);

    expect(res._status).toBe(200);
    const result = res._json as Task;
    expect(result.title).toBe('New Title');
    expect(result.status).toBe('in_progress');
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('не меняет id и created_at при обновлении', async () => {
    const originalId = 'task-immutable';
    const originalCreated = '2025-01-01T00:00:00.000Z';
    const task = createTask({ id: originalId, created_at: originalCreated });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: originalId }, { id: 'hacked-id', created_at: 'hacked-date' });
    const res = createMockResponse();

    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);

    const result = res._json as Task;
    expect(result.id).toBe(originalId);
    expect(result.created_at).toBe(originalCreated);
  });

  it('устанавливает completed_at при смене статуса на done', async () => {
    const task = createTask({ id: 'task-1', status: 'in_progress', completed_at: null });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-1' }, { status: 'done' });
    const res = createMockResponse();

    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);

    const result = res._json as Task;
    expect(result.completed_at).not.toBeNull();
    expect(result.completed_at).toBeDefined();
  });

  it('НЕ сбрасывает completed_at если статус остаётся done', async () => {
    const completedTime = '2025-06-01T12:00:00.000Z';
    const task = createTask({ id: 'task-1', status: 'done', completed_at: completedTime });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-1' }, { title: 'Updated title' });
    const res = createMockResponse();

    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);

    const result = res._json as Task;
    expect(result.completed_at).toBe(completedTime);
  });

  it('возвращает 404 если задача не найдена', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({ id: 'nonexistent' }, { title: 'Ghost' });
    const res = createMockResponse();

    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);

    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Task not found' });
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });

    const req = createMockRequest({ id: 'task-1' }, { title: 'Fail' });
    const res = createMockResponse();

    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to update task' });
  });
});

describe('DELETE /api/tasks/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'delete', entity_type: 'task', entity_id: 't1', diff: {},
    });
  });

  it('удаляет задачу', async () => {
    const task = createTask({ id: 'task-to-delete' });
    const state = createMockState({ tasks: [task] });
    mockReadState.mockReturnValue(state);

    const req = createMockRequest({ id: 'task-to-delete' });
    const res = createMockResponse();

    const route = findRouteHandler('DELETE', '/:id');
    await route!.stack[0].handle(req, res);

    expect(res._status).toBe(200);
    expect(res._json).toEqual({ success: true, id: 'task-to-delete' });
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('возвращает 404 если задача не найдена', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({ id: 'nonexistent' });
    const res = createMockResponse();

    const route = findRouteHandler('DELETE', '/:id');
    await route!.stack[0].handle(req, res);

    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Task not found' });
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });

    const req = createMockRequest({ id: 'task-1' });
    const res = createMockResponse();

    const route = findRouteHandler('DELETE', '/:id');
    await route!.stack[0].handle(req, res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to delete task' });
  });
});

describe('POST /api/tasks/:id/move', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'move', entity_type: 'task', entity_id: 't1', diff: {},
    });
  });

  it('перемещает задачу в другой статус', async () => {
    const task = createTask({ id: 'task-move', status: 'backlog' });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-move' }, { status: 'in_progress' });
    const res = createMockResponse();

    const route = findRouteHandler('POST', '/:id/move');
    await route!.stack[0].handle(req, res);

    expect(res._status).toBe(200);
    const result = res._json as Task;
    expect(result.status).toBe('in_progress');
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('устанавливает completed_at при перемещении в done', async () => {
    const task = createTask({ id: 'task-move', status: 'review', completed_at: null });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-move' }, { status: 'done' });
    const res = createMockResponse();

    const route = findRouteHandler('POST', '/:id/move');
    await route!.stack[0].handle(req, res);

    const result = res._json as Task;
    expect(result.status).toBe('done');
    expect(result.completed_at).not.toBeNull();
  });

  it('возвращает 404 если задача не найдена', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({ id: 'nonexistent' }, { status: 'done' });
    const res = createMockResponse();

    const route = findRouteHandler('POST', '/:id/move');
    await route!.stack[0].handle(req, res);

    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Task not found' });
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });

    const req = createMockRequest({ id: 'task-1' }, { status: 'done' });
    const res = createMockResponse();

    const route = findRouteHandler('POST', '/:id/move');
    await route!.stack[0].handle(req, res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to move task' });
  });
});
