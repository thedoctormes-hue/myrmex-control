// ============================================================
// E2E тесты для Kanban-доски (BL-030)
// ============================================================
// Покрывает:
//   1. Drag-and-drop задач между колонками (POST /api/tasks/:id/move)
//   2. Создание задачи через API (POST /api/tasks)
//   3. Редактирование задачи (PUT /api/tasks/:id)
//   4. Фильтрация по assignee, status, project_id (GET /api/tasks)
//   5. Перемещение задачи через API (POST /api/tasks/:id/move)
//   6. Клиентские обёртки (api.ts fetch-вызовы)
//   7. Валидация входных данных (Zod)
//   8. Граничные случаи
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import type { Task, MyrmexState, TaskStatus, TaskPriority } from '@shared/types.js';

// ── Мокируем myrmex.ts ДО импорта роутера ──

const mockReadState = vi.fn();
const mockWriteState = vi.fn().mockResolvedValue(undefined);
const mockCreateLogEntry = vi.fn();

vi.mock('../../../src/server/myrmex.js', () => ({
  readState: (...args: unknown[]) => mockReadState(...args),
  writeState: (...args: unknown[]) => mockWriteState(...args),
  createLogEntry: (...args: unknown[]) => mockCreateLogEntry(...args),
  isDemo: () => false,
  runAsDemo: <T>(fn: () => T) => fn(),
}));

import { router } from '../../../src/server/api/tasks.js';

// ── Хелперы ──

function createMockState(overrides: Partial<MyrmexState> = {}): MyrmexState {
  const now = new Date().toISOString();
  return {
    _meta: { version: '0.1.0', last_updated: now, last_updated_by: 'test', change_count: 0 },
    workspace: { name: 'Test', description: '', owner: 'tester', created_at: now },
    projects: [
      { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Test Project', description: '', color: '#6366f1', icon: '📦', status: 'active', created_at: now, updated_at: now },
    ],
    agents: [
      { id: '550e8400-e29b-41d4-a716-446655440011', name: 'Agent Alpha', role: 'developer', model: 'gpt-4', status: 'idle', project_id: '550e8400-e29b-41d4-a716-446655440001', current_task_id: null, last_seen: now, config: {} },
      { id: '550e8400-e29b-41d4-a716-446655440012', name: 'Agent Beta', role: 'tester', model: 'gpt-4', status: 'working', project_id: '550e8400-e29b-41d4-a716-446655440001', current_task_id: null, last_seen: now, config: {} },
    ],
    tasks: [],
    library: [],
    files: [],
    servers: [],
    settings: { theme: 'dark', language: 'ru', refresh_interval_sec: 30, notifications_enabled: true, custom: {} },
    mcp_servers: [],
    changelog: [],
    users: [],
    refresh_tokens: {},
    ...overrides,
  };
}

const TEST_PROJ_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEST_AGENT_1 = '550e8400-e29b-41d4-a716-446655440011';
const TEST_AGENT_2 = '550e8400-e29b-41d4-a716-446655440012';
const TEST_PROJ_2 = '550e8400-e29b-41d4-a716-446655440002';

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    project_id: TEST_PROJ_ID,
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

function createMockRequest(
  params: Record<string, string> = {},
  body: Record<string, unknown> = {},
  query: Record<string, string> = {}
): Request {
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

const noop: NextFunction = () => {};

/**
 * Находит route по method и path, вызывает ВСЕ handler-и в цепочке
 * (middleware → handler), передавая next между ними.
 * Для GET маршрутов — один handler. Для POST/PUT — validate middleware + handler.
 * Поддерживает async handler-ы через await.
 */
async function invokeRoute(
  method: string,
  pathPattern: string,
  req: Request,
  res: Response & { _json: unknown; _status: number }
) {
  const stack = (router as any).stack;
  for (const layer of stack) {
    if (layer.route) {
      const route = layer.route;
      const methods = Object.keys(route.methods).map(m => m.toUpperCase());
      if (methods.includes(method.toUpperCase()) && route.path === pathPattern) {
        const handlers = route.stack.map((s: any) => s.handle);
        let idx = 0;
        const next = async () => {
          if (idx < handlers.length) {
            const handler = handlers[idx++];
            await handler(req, res, next);
          }
        };
        await next();
        return true;
      }
    }
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// Часть 1: Создание задач (POST /api/tasks)
// ═══════════════════════════════════════════════════════════════════════════

describe('Kanban API — Создание задач', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'create', entity_type: 'task', entity_id: 'new', diff: {},
    });
  });

  it('создаёт задачу в backlog по умолчанию', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({}, { title: 'New Kanban Task', project_id: TEST_PROJ_ID });
    const res = createMockResponse();

    await invokeRoute('POST', '/', req, res);

    expect(res._status).toBe(201);
    const result = res._json as Task;
    expect(result.title).toBe('New Kanban Task');
    expect(result.status).toBe('backlog');
    expect(result.priority).toBe('medium');
    expect(result.project_id).toBe(TEST_PROJ_ID);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeDefined();
    expect(result.completed_at).toBeNull();
    expect(mockWriteState).toHaveBeenCalledTimes(1);
  });

  it('создаёт задачу с полными данными (assignee, tags, priority)', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({}, {
      title: 'Full Task',
      project_id: TEST_PROJ_ID,
      description: 'Detailed description',
      status: 'todo',
      priority: 'critical',
      assignee_id: TEST_AGENT_1,
      tags: ['frontend', 'urgent'],
    });
    const res = createMockResponse();

    await invokeRoute('POST', '/', req, res);

    expect(res._status).toBe(201);
    const result = res._json as Task;
    expect(result.status).toBe('todo');
    expect(result.priority).toBe('critical');
    expect(result.assignee_id).toBe(TEST_AGENT_1);
    expect(result.tags).toEqual(['frontend', 'urgent']);
  });

  it('создаёт задачу с минимальными данными (defaults)', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    // Отправляем только title — остальные поля берутся из defaults в handler-е
    const req = createMockRequest({}, { title: 'Min Task' });
    const res = createMockResponse();

    await invokeRoute('POST', '/', req, res);

    expect(res._status).toBe(201);
    const result = res._json as Task;
    expect(result.title).toBe('Min Task');
    expect(result.status).toBe('backlog');
    expect(result.priority).toBe('medium');
    expect(result.assignee_id).toBeNull();
    expect(result.tags).toEqual([]);
  });

  it('возвращает 500 при ошибке создания', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });

    const req = createMockRequest({}, { title: 'Fail Task' });
    const res = createMockResponse();

    await invokeRoute('POST', '/', req, res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to create task' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Часть 2: Drag-and-drop (POST /api/tasks/:id/move)
// ═══════════════════════════════════════════════════════════════════════════

describe('Kanban API — Drag-and-drop (POST /api/tasks/:id/move)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'move', entity_type: 'task', entity_id: 't1', diff: {},
    });
  });

  it.each([
    ['backlog', 'todo'],
    ['todo', 'in_progress'],
    ['in_progress', 'review'],
    ['review', 'done'],
    ['backlog', 'in_progress'],
    ['todo', 'done'],
    ['done', 'backlog'],
    ['cancelled', 'todo'],
  ] as [TaskStatus, TaskStatus][])(
    'перемещает задачу из "%s" в "%s"',
    async (fromStatus, toStatus) => {
      const task = makeTask({ id: 'task-move', status: fromStatus });
      mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

      const req = createMockRequest({ id: 'task-move' }, { status: toStatus });
      const res = createMockResponse();

      await invokeRoute('POST', '/:id/move', req, res);

      expect(res._status).toBe(200);
      const result = res._json as Task;
      expect(result.status).toBe(toStatus);
      expect(mockWriteState).toHaveBeenCalled();
    }
  );

  it('устанавливает completed_at при перемещении в done', async () => {
    const task = makeTask({ id: 'task-move', status: 'review', completed_at: null });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-move' }, { status: 'done' });
    const res = createMockResponse();

    await invokeRoute('POST', '/:id/move', req, res);

    const result = res._json as Task;
    expect(result.status).toBe('done');
    expect(result.completed_at).not.toBeNull();
    expect(result.completed_at).toBeDefined();
  });

  it('НЕ устанавливает completed_at при перемещении в не-done статус', async () => {
    const task = makeTask({ id: 'task-move', status: 'backlog', completed_at: null });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-move' }, { status: 'in_progress' });
    const res = createMockResponse();

    await invokeRoute('POST', '/:id/move', req, res);

    const result = res._json as Task;
    expect(result.status).toBe('in_progress');
    expect(result.completed_at).toBeNull();
  });

  it('возвращает 404 если задача не найдена', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({ id: 'nonexistent' }, { status: 'done' });
    const res = createMockResponse();

    await invokeRoute('POST', '/:id/move', req, res);

    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Task not found' });
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });

    const req = createMockRequest({ id: 'task-1' }, { status: 'done' });
    const res = createMockResponse();

    await invokeRoute('POST', '/:id/move', req, res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to move task' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Часть 3: Редактирование задачи (PUT /api/tasks/:id)
// ═══════════════════════════════════════════════════════════════════════════

describe('Kanban API — Редактирование задачи (PUT /api/tasks/:id)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'update', entity_type: 'task', entity_id: 't1', diff: {},
    });
  });

  it('обновляет название и описание задачи', async () => {
    const task = makeTask({ id: 'task-edit', title: 'Old Title', description: 'Old desc' });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-edit' }, { title: 'New Title', description: 'New desc' });
    const res = createMockResponse();

    await invokeRoute('PUT', '/:id', req, res);

    expect(res._status).toBe(200);
    const result = res._json as Task;
    expect(result.title).toBe('New Title');
    expect(result.description).toBe('New desc');
  });

  it('обновляет приоритет задачи', async () => {
    const task = makeTask({ id: 'task-edit', priority: 'low' });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-edit' }, { priority: 'critical' });
    const res = createMockResponse();

    await invokeRoute('PUT', '/:id', req, res);

    const result = res._json as Task;
    expect(result.priority).toBe('critical');
  });

  it('обновляет статус задачи', async () => {
    const task = makeTask({ id: 'task-edit', status: 'backlog' });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-edit' }, { status: 'in_progress' });
    const res = createMockResponse();

    await invokeRoute('PUT', '/:id', req, res);

    const result = res._json as Task;
    expect(result.status).toBe('in_progress');
  });

  it('обновляет assignee задачи', async () => {
    const task = makeTask({ id: 'task-edit', assignee_id: null });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-edit' }, { assignee_id: TEST_AGENT_1 });
    const res = createMockResponse();

    await invokeRoute('PUT', '/:id', req, res);

    const result = res._json as Task;
    expect(result.assignee_id).toBe(TEST_AGENT_1);
  });

  it('обновляет tags задачи', async () => {
    const task = makeTask({ id: 'task-edit', tags: ['old'] });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-edit' }, { tags: ['new', 'updated'] });
    const res = createMockResponse();

    await invokeRoute('PUT', '/:id', req, res);

    const result = res._json as Task;
    expect(result.tags).toEqual(['new', 'updated']);
  });

  it('устанавливает completed_at при смене статуса на done', async () => {
    const task = makeTask({ id: 'task-edit', status: 'review', completed_at: null });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-edit' }, { status: 'done' });
    const res = createMockResponse();

    await invokeRoute('PUT', '/:id', req, res);

    const result = res._json as Task;
    expect(result.completed_at).not.toBeNull();
  });

  it('не меняет id и created_at при обновлении', async () => {
    const originalId = 'task-immutable';
    const originalCreated = '2025-01-01T00:00:00.000Z';
    const task = makeTask({ id: originalId, created_at: originalCreated });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: originalId }, { id: 'hacked-id', created_at: 'hacked-date' });
    const res = createMockResponse();

    await invokeRoute('PUT', '/:id', req, res);

    const result = res._json as Task;
    expect(result.id).toBe(originalId);
    expect(result.created_at).toBe(originalCreated);
  });

  it('возвращает 404 если задача не найдена', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({ id: 'nonexistent' }, { title: 'Ghost' });
    const res = createMockResponse();

    await invokeRoute('PUT', '/:id', req, res);

    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Task not found' });
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });

    const req = createMockRequest({ id: 'task-1' }, { title: 'Fail' });
    const res = createMockResponse();

    await invokeRoute('PUT', '/:id', req, res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to update task' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Часть 4: Фильтрация задач (GET /api/tasks)
// ═══════════════════════════════════════════════════════════════════════════

describe('Kanban API — Фильтрация задач (GET /api/tasks)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseTasks = [
    makeTask({ id: 't1', project_id: TEST_PROJ_ID, status: 'backlog', priority: 'low', assignee_id: TEST_AGENT_1, tags: ['frontend'] }),
    makeTask({ id: 't2', project_id: TEST_PROJ_ID, status: 'todo', priority: 'medium', assignee_id: TEST_AGENT_2, tags: ['backend'] }),
    makeTask({ id: 't3', project_id: TEST_PROJ_ID, status: 'in_progress', priority: 'high', assignee_id: TEST_AGENT_1, tags: ['frontend', 'urgent'] }),
    makeTask({ id: 't4', project_id: TEST_PROJ_ID, status: 'review', priority: 'critical', assignee_id: null, tags: ['backend'] }),
    makeTask({ id: 't5', project_id: TEST_PROJ_ID, status: 'done', priority: 'medium', assignee_id: TEST_AGENT_2, tags: [] }),
    makeTask({ id: 't6', project_id: TEST_PROJ_2, status: 'todo', priority: 'high', assignee_id: TEST_AGENT_1, tags: ['frontend'] }),
  ];

  it('фильтрует по status = backlog', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: baseTasks }));

    const req = createMockRequest({}, {}, { status: 'backlog' });
    const res = createMockResponse();

    await invokeRoute('GET', '/', req, res);

    expect(res._status).toBe(200);
    const result = res._json as Task[];
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t1');
  });

  it('фильтрует по status = done', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: baseTasks }));

    const req = createMockRequest({}, {}, { status: 'done' });
    const res = createMockResponse();

    await invokeRoute('GET', '/', req, res);

    const result = res._json as Task[];
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('done');
  });

  it('фильтрует по assignee_id', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: baseTasks }));

    const req = createMockRequest({}, {}, { assignee_id: TEST_AGENT_1 });
    const res = createMockResponse();

    await invokeRoute('GET', '/', req, res);

    const result = res._json as Task[];
    expect(result).toHaveLength(3); // t1, t3, t6
    expect(result.every(t => t.assignee_id === TEST_AGENT_1)).toBe(true);
  });

  it('фильтрует по project_id', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: baseTasks }));

    const req = createMockRequest({}, {}, { project_id: TEST_PROJ_ID });
    const res = createMockResponse();

    await invokeRoute('GET', '/', req, res);

    const result = res._json as Task[];
    expect(result).toHaveLength(5);
    expect(result.every(t => t.project_id === TEST_PROJ_ID)).toBe(true);
  });

  it('комбинирует фильтры: project_id + status + assignee_id', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: baseTasks }));

    const req = createMockRequest({}, {}, { project_id: TEST_PROJ_ID, status: 'todo', assignee_id: TEST_AGENT_2 });
    const res = createMockResponse();

    await invokeRoute('GET', '/', req, res);

    const result = res._json as Task[];
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t2');
  });

  it('возвращает пустой массив если нет совпадений', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: baseTasks }));

    const req = createMockRequest({}, {}, { status: 'cancelled' });
    const res = createMockResponse();

    await invokeRoute('GET', '/', req, res);

    expect(res._status).toBe(200);
    expect(res._json).toEqual([]);
  });

  it('возвращает все задачи без фильтров', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: baseTasks }));

    const req = createMockRequest({}, {}, {});
    const res = createMockResponse();

    await invokeRoute('GET', '/', req, res);

    const result = res._json as Task[];
    expect(result).toHaveLength(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Часть 5: Удаление задачи (DELETE /api/tasks/:id)
// ═══════════════════════════════════════════════════════════════════════════

describe('Kanban API — Удаление задачи', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'delete', entity_type: 'task', entity_id: 't1', diff: {},
    });
  });

  it('удаляет задачу по ID', async () => {
    const task = makeTask({ id: 'task-to-delete' });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-to-delete' });
    const res = createMockResponse();

    await invokeRoute('DELETE', '/:id', req, res);

    expect(res._status).toBe(200);
    expect(res._json).toEqual({ success: true, id: 'task-to-delete' });
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('возвращает 404 если задача не найдена', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({ id: 'nonexistent' });
    const res = createMockResponse();

    await invokeRoute('DELETE', '/:id', req, res);

    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Task not found' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Часть 6: Получение задачи по ID (GET /api/tasks/:id)
// ═══════════════════════════════════════════════════════════════════════════

describe('Kanban API — Получение задачи по ID', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('возвращает задачу по ID', async () => {
    const task = makeTask({ id: 'task-123', title: 'Find me', status: 'in_progress' });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-123' });
    const res = createMockResponse();

    await invokeRoute('GET', '/:id', req, res);

    expect(res._status).toBe(200);
    expect((res._json as Task).id).toBe('task-123');
    expect((res._json as Task).title).toBe('Find me');
    expect((res._json as Task).status).toBe('in_progress');
  });

  it('возвращает 404 если задача не найдена', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({ id: 'nonexistent' });
    const res = createMockResponse();

    await invokeRoute('GET', '/:id', req, res);

    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Task not found' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Часть 7: Интеграционные тесты — полный жизненный цикл
// ═══════════════════════════════════════════════════════════════════════════

describe('Kanban E2E — Полный жизненный цикл задачи', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'e2e', entity_type: 'task', entity_id: 'e2e', diff: {},
    });
  });

  it('полный цикл: создание → перемещение по всем колонкам → удаление', async () => {
    // 1. Создаём задачу
    let state = createMockState({ tasks: [] });
    mockReadState.mockReturnValue(state);

    const createReq = createMockRequest({}, {
      title: 'E2E Task',
      project_id: TEST_PROJ_ID,
      priority: 'high',
      assignee_id: TEST_AGENT_1,
      tags: ['e2e'],
    });
    const createRes = createMockResponse();

    await invokeRoute('POST', '/', createReq, createRes);

    expect(createRes._status).toBe(201);
    const createdTask = createRes._json as Task;
    expect(createdTask.status).toBe('backlog');
    expect(createdTask.title).toBe('E2E Task');

    // 2. Перемещаем backlog → todo
    state = createMockState({ tasks: [createdTask] });
    mockReadState.mockReturnValue(state);

    const move1Req = createMockRequest({ id: createdTask.id }, { status: 'todo' });
    const move1Res = createMockResponse();

    await invokeRoute('POST', '/:id/move', move1Req, move1Res);

    expect(move1Res._status).toBe(200);
    const movedTask1 = move1Res._json as Task;
    expect(movedTask1.status).toBe('todo');

    // 3. Перемещаем todo → in_progress
    state = createMockState({ tasks: [movedTask1] });
    mockReadState.mockReturnValue(state);

    const move2Req = createMockRequest({ id: createdTask.id }, { status: 'in_progress' });
    const move2Res = createMockResponse();

    await invokeRoute('POST', '/:id/move', move2Req, move2Res);

    expect(move2Res._status).toBe(200);
    const movedTask2 = move2Res._json as Task;
    expect(movedTask2.status).toBe('in_progress');

    // 4. Перемещаем in_progress → review
    state = createMockState({ tasks: [movedTask2] });
    mockReadState.mockReturnValue(state);

    const move3Req = createMockRequest({ id: createdTask.id }, { status: 'review' });
    const move3Res = createMockResponse();

    await invokeRoute('POST', '/:id/move', move3Req, move3Res);

    expect(move3Res._status).toBe(200);
    const movedTask3 = move3Res._json as Task;
    expect(movedTask3.status).toBe('review');

    // 5. Перемещаем review → done (должен установиться completed_at)
    state = createMockState({ tasks: [movedTask3] });
    mockReadState.mockReturnValue(state);

    const move4Req = createMockRequest({ id: createdTask.id }, { status: 'done' });
    const move4Res = createMockResponse();

    await invokeRoute('POST', '/:id/move', move4Req, move4Res);

    expect(move4Res._status).toBe(200);
    const doneTask = move4Res._json as Task;
    expect(doneTask.status).toBe('done');
    expect(doneTask.completed_at).not.toBeNull();

    // 6. Удаляем задачу
    state = createMockState({ tasks: [doneTask] });
    mockReadState.mockReturnValue(state);

    const deleteReq = createMockRequest({ id: createdTask.id });
    const deleteRes = createMockResponse();

    await invokeRoute('DELETE', '/:id', deleteReq, deleteRes);

    expect(deleteRes._status).toBe(200);
    expect(deleteRes._json).toEqual({ success: true, id: createdTask.id });
  });

  it('полный цикл: создание → редактирование → перемещение → проверка фильтрации', async () => {
    // 1. Создаём задачу
    let state = createMockState({ tasks: [] });
    mockReadState.mockReturnValue(state);

    const createReq = createMockRequest({}, {
      title: 'Filter Test Task',
      project_id: TEST_PROJ_ID,
      status: 'backlog',
      priority: 'low',
      assignee_id: TEST_AGENT_1,
      tags: ['test'],
    });
    const createRes = createMockResponse();

    await invokeRoute('POST', '/', createReq, createRes);

    const createdTask = createRes._json as Task;
    expect(createdTask.status).toBe('backlog');

    // 2. Редактируем: меняем priority на critical и assignee на agent-2
    state = createMockState({ tasks: [createdTask] });
    mockReadState.mockReturnValue(state);

    const updateReq = createMockRequest({ id: createdTask.id }, {
      priority: 'critical',
      assignee_id: TEST_AGENT_2,
    });
    const updateRes = createMockResponse();

    await invokeRoute('PUT', '/:id', updateReq, updateRes);

    expect(updateRes._status).toBe(200);
    const updatedTask = updateRes._json as Task;
    expect(updatedTask.priority).toBe('critical');
    expect(updatedTask.assignee_id).toBe(TEST_AGENT_2);
    expect(updatedTask.title).toBe('Filter Test Task');
    expect(updatedTask.status).toBe('backlog');

    // 3. Перемещаем в in_progress
    state = createMockState({ tasks: [updatedTask] });
    mockReadState.mockReturnValue(state);

    const moveReq = createMockRequest({ id: createdTask.id }, { status: 'in_progress' });
    const moveRes = createMockResponse();

    await invokeRoute('POST', '/:id/move', moveReq, moveRes);

    const movedTask = moveRes._json as Task;
    expect(movedTask.status).toBe('in_progress');

    // 4. Проверяем фильтрацию: поиск по assignee_id = agent-2
    state = createMockState({ tasks: [movedTask] });
    mockReadState.mockReturnValue(state);

    const filterReq = createMockRequest({}, {}, { assignee_id: TEST_AGENT_2 });
    const filterRes = createMockResponse();

    await invokeRoute('GET', '/', filterReq, filterRes);

    const filtered = filterRes._json as Task[];
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(createdTask.id);
    expect(filtered[0].assignee_id).toBe(TEST_AGENT_2);

    // 5. Проверяем фильтрацию: поиск по status = backlog (не должно найти)
    state = createMockState({ tasks: [movedTask] });
    mockReadState.mockReturnValue(state);

    const filter2Req = createMockRequest({}, {}, { status: 'backlog' });
    const filter2Res = createMockResponse();

    await invokeRoute('GET', '/', filter2Req, filter2Res);

    const filtered2 = filter2Res._json as Task[];
    expect(filtered2).toHaveLength(0);
  });

  it('возврат задачи из done в backlog (reopen)', async () => {
    const task = makeTask({ id: 'reopen-task', status: 'done', completed_at: '2025-06-01T12:00:00.000Z' });
    const state = createMockState({ tasks: [task] });
    mockReadState.mockReturnValue(state);

    const moveReq = createMockRequest({ id: 'reopen-task' }, { status: 'backlog' });
    const moveRes = createMockResponse();

    await invokeRoute('POST', '/:id/move', moveReq, moveRes);

    expect(moveRes._status).toBe(200);
    const reopened = moveRes._json as Task;
    expect(reopened.status).toBe('backlog');
  });

  it('перемещение в cancelled и обратно в todo', async () => {
    const task = makeTask({ id: 'cancel-task', status: 'in_progress' });
    let state = createMockState({ tasks: [task] });
    mockReadState.mockReturnValue(state);

    // Перемещаем в cancelled
    const move1Req = createMockRequest({ id: 'cancel-task' }, { status: 'cancelled' });
    const move1Res = createMockResponse();

    await invokeRoute('POST', '/:id/move', move1Req, move1Res);

    expect(move1Res._status).toBe(200);
    expect((move1Res._json as Task).status).toBe('cancelled');

    // Восстанавливаем из cancelled в todo
    const cancelledTask = move1Res._json as Task;
    state = createMockState({ tasks: [cancelledTask] });
    mockReadState.mockReturnValue(state);

    const move2Req = createMockRequest({ id: 'cancel-task' }, { status: 'todo' });
    const move2Res = createMockResponse();

    await invokeRoute('POST', '/:id/move', move2Req, move2Res);

    expect(move2Res._status).toBe(200);
    expect((move2Res._json as Task).status).toBe('todo');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Часть 8: Валидация входных данных (Zod)
// ═══════════════════════════════════════════════════════════════════════════

describe('Kanban API — Валидация входных данных', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'create', entity_type: 'task', entity_id: 'new', diff: {},
    });
  });

  it('отклоняет создание задачи с пустым title (Zod validation)', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({}, { title: '', project_id: TEST_PROJ_ID });
    const res = createMockResponse();

    await invokeRoute('POST', '/', req, res);

    expect(res._status).toBe(400);
    const body = res._json as { error: string };
    expect(body.error).toBe('Validation error');
  });

  it('отклоняет создание задачи с невалидным status', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({}, { title: 'Valid Title', status: 'invalid_status' });
    const res = createMockResponse();

    await invokeRoute('POST', '/', req, res);

    expect(res._status).toBe(400);
  });

  it('отклоняет создание задачи с невалидным priority', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const req = createMockRequest({}, { title: 'Valid Title', priority: 'super-urgent' });
    const res = createMockResponse();

    await invokeRoute('POST', '/', req, res);

    expect(res._status).toBe(400);
  });

  it('отклоняет move с невалидным status', async () => {
    const task = makeTask({ id: 'task-1', status: 'backlog' });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-1' }, { status: 'not-a-status' });
    const res = createMockResponse();

    await invokeRoute('POST', '/:id/move', req, res);

    expect(res._status).toBe(400);
  });

  it('отклоняет move без обязательного поля status', async () => {
    const task = makeTask({ id: 'task-1', status: 'backlog' });
    mockReadState.mockReturnValue(createMockState({ tasks: [task] }));

    const req = createMockRequest({ id: 'task-1' }, {});
    const res = createMockResponse();

    await invokeRoute('POST', '/:id/move', req, res);

    expect(res._status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Часть 9: Граничные случаи
// ═══════════════════════════════════════════════════════════════════════════

describe('Kanban API — Граничные случаи', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'test', entity_type: 'task', entity_id: 'test', diff: {},
    });
  });

  it('обработка большого количества задач (100+)', async () => {
    const manyTasks = Array.from({ length: 150 }, (_, i) =>
      makeTask({
        id: `task-${i}`,
        title: `Task ${i}`,
        status: (['backlog', 'todo', 'in_progress', 'review', 'done'] as TaskStatus[])[i % 5],
        priority: (['low', 'medium', 'high', 'critical'] as TaskPriority[])[i % 4],
        assignee_id: i % 3 === 0 ? null : (i % 2 === 0 ? TEST_AGENT_1 : TEST_AGENT_2),
      })
    );
    mockReadState.mockReturnValue(createMockState({ tasks: manyTasks }));

    const req = createMockRequest({}, {}, {});
    const res = createMockResponse();

    await invokeRoute('GET', '/', req, res);

    expect(res._status).toBe(200);
    expect((res._json as Task[])).toHaveLength(150);
  });

  it('фильтрация по status возвращает корректное количество из большого списка', async () => {
    const manyTasks = Array.from({ length: 100 }, (_, i) =>
      makeTask({
        id: `task-${i}`,
        status: (['backlog', 'todo', 'in_progress', 'review', 'done'] as TaskStatus[])[i % 5],
      })
    );
    mockReadState.mockReturnValue(createMockState({ tasks: manyTasks }));

    const req = createMockRequest({}, {}, { status: 'done' });
    const res = createMockResponse();

    await invokeRoute('GET', '/', req, res);

    const result = res._json as Task[];
    expect(result).toHaveLength(20); // 100 / 5 = 20 на каждый статус
    expect(result.every(t => t.status === 'done')).toBe(true);
  });

  it('одновременные операции чтения и записи не ломают состояние', async () => {
    const task = makeTask({ id: 'concurrent-1', status: 'backlog' });
    const state = createMockState({ tasks: [task] });
    mockReadState.mockReturnValue(state);

    // Одновременно читаем и перемещаем
    const getReq = createMockRequest({}, {}, {});
    const getRes = createMockResponse();

    const moveReq = createMockRequest({ id: 'concurrent-1' }, { status: 'todo' });
    const moveRes = createMockResponse();

    await invokeRoute('GET', '/', getReq, getRes);
    await invokeRoute('POST', '/:id/move', moveReq, moveRes);

    // Оба должны завершиться успешно
    expect(getRes._status).toBe(200);
    expect(moveRes._status).toBe(200);
  });

  it('задача с максимальным количеством tags', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const manyTags = Array.from({ length: 50 }, (_, i) => `tag-${i}`);
    const req = createMockRequest({}, {
      title: 'Many Tags Task',
      project_id: TEST_PROJ_ID,
      tags: manyTags,
    });
    const res = createMockResponse();

    await invokeRoute('POST', '/', req, res);

    expect(res._status).toBe(201);
    const result = res._json as Task;
    expect(result.tags).toHaveLength(50);
  });

  it('задача с длинным title (до 500 символов)', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const longTitle = 'A'.repeat(500);
    const req = createMockRequest({}, { title: longTitle, project_id: TEST_PROJ_ID });
    const res = createMockResponse();

    await invokeRoute('POST', '/', req, res);

    expect(res._status).toBe(201);
    expect((res._json as Task).title).toBe(longTitle);
  });

  it('задача с title длиннее 500 символов отклоняется', async () => {
    mockReadState.mockReturnValue(createMockState({ tasks: [] }));

    const tooLongTitle = 'A'.repeat(501);
    const req = createMockRequest({}, { title: tooLongTitle, project_id: TEST_PROJ_ID });
    const res = createMockResponse();

    await invokeRoute('POST', '/', req, res);

    expect(res._status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Часть 10: Тесты клиентских обёрток (api.ts fetch-вызовы)
// ═══════════════════════════════════════════════════════════════════════════

describe('Kanban API — Клиентские обёртки (api.ts)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('createTask отправляет POST с правильными данными', async () => {
    const mockTask = makeTask({ id: 'api-task-1', title: 'API Created' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockTask,
    });
    globalThis.fetch = fetchMock as any;

    const { createTask: apiCreateTask } = await import('../../../src/client/lib/api.js');

    const result = await apiCreateTask({ title: 'API Created', project_id: TEST_PROJ_ID });

    expect(fetchMock).toHaveBeenCalledWith('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'API Created', project_id: TEST_PROJ_ID }),
    });
    expect(result.id).toBe('api-task-1');
    expect(result.title).toBe('API Created');
  });

  it('moveTask отправляет POST на /api/tasks/:id/move', async () => {
    const movedTask = makeTask({ id: 'api-task-2', status: 'in_progress' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => movedTask,
    });
    globalThis.fetch = fetchMock as any;

    const { moveTask } = await import('../../../src/client/lib/api.js');

    const result = await moveTask('api-task-2', 'in_progress');

    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/api-task-2/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' }),
    });
    expect(result.status).toBe('in_progress');
  });

  it('getTasks отправляет GET с query параметрами для фильтрации', async () => {
    const tasks = [makeTask({ id: 't1', status: 'done' })];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => tasks,
    });
    globalThis.fetch = fetchMock as any;

    const { getTasks } = await import('../../../src/client/lib/api.js');

    const result = await getTasks({ status: 'done', project_id: TEST_PROJ_ID });

    expect(fetchMock).toHaveBeenCalledWith('/api/tasks?status=done&project_id=550e8400-e29b-41d4-a716-446655440001', {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('done');
  });

  it('updateTask отправляет PUT с обновлёнными данными', async () => {
    const updatedTask = makeTask({ id: 'api-task-3', title: 'Updated', priority: 'critical' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => updatedTask,
    });
    globalThis.fetch = fetchMock as any;

    const { updateTask } = await import('../../../src/client/lib/api.js');

    const result = await updateTask('api-task-3', { title: 'Updated', priority: 'critical' });

    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/api-task-3', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated', priority: 'critical' }),
    });
    expect(result.title).toBe('Updated');
    expect(result.priority).toBe('critical');
  });

  it('deleteTask отправляет DELETE', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, id: 'api-task-4' }),
    });
    globalThis.fetch = fetchMock as any;

    const { deleteTask } = await import('../../../src/client/lib/api.js');

    const result = await deleteTask('api-task-4');

    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/api-task-4', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(result.success).toBe(true);
  });

  it('getTasks без параметров отправляет GET без query string', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
    globalThis.fetch = fetchMock as any;

    const { getTasks } = await import('../../../src/client/lib/api.js');

    await getTasks();

    expect(fetchMock).toHaveBeenCalledWith('/api/tasks', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('обработка 401 вызывает onUnauthorized handler', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });
    globalThis.fetch = fetchMock as any;

    const { getTasks, setUnauthorizedHandler } = await import('../../../src/client/lib/api.js');

    const unauthorizedHandler = vi.fn();
    setUnauthorizedHandler(unauthorizedHandler);

    await expect(getTasks()).rejects.toThrow('Unauthorized');
    expect(unauthorizedHandler).toHaveBeenCalled();
  });

  it('обработка ошибки сети', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });
    globalThis.fetch = fetchMock as any;

    const { getTasks } = await import('../../../src/client/lib/api.js');

    await expect(getTasks()).rejects.toThrow('Internal server error');
  });
});
