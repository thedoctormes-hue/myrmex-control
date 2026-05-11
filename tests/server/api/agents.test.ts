// ============================================================
// API-тесты для agents.ts — CRUD агентов
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import type { Agent, MyrmexState } from '@shared/types.js';

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

import { router } from '../../../src/server/api/agents.js';

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

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    params: {},
    body: {},
    query: {},
    ...overrides,
  } as unknown as Request;
}

function createMockRes(): Response & { _json: unknown; _status: number } {
  const res = {
    _json: null as unknown,
    _status: 200,
    json(data: unknown) { res._json = data; return res as unknown as Response; },
    status(code: number) { res._status = code; return res as unknown as Response; },
  } as unknown as Response & { _json: unknown; _status: number };
  return res;
}

function findHandler(method: string, path: string) {
  const layer = router.stack.find(
    (l: any) => l.route && l.route.path === path && l.route.methods[method.toLowerCase()]
  );
  if (!layer) throw new Error(`Handler not found: ${method} ${path}`);
  return layer.route.stack[0].handle;
}

// ============================================================
// GET /api/agents
// ============================================================

describe('GET /api/agents', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('возвращает пустой массив если агентов нет', async () => {
    mockReadState.mockReturnValue(createMockState());
    const req = createMockReq();
    const res = createMockRes();
    const handler = findHandler('GET', '/');
    await handler(req, res as unknown as Response, () => {});
    expect(res._json).toEqual([]);
  });

  it('возвращает список агентов', async () => {
    const agents: Agent[] = [
      { id: 'a1', name: 'Кот', role: 'reviewer', model: 'gpt-4', status: 'idle', project_id: null, current_task_id: null, last_seen: new Date().toISOString(), config: {} },
      { id: 'a2', name: 'Муравей', role: 'worker', model: 'claude', status: 'working', project_id: null, current_task_id: null, last_seen: new Date().toISOString(), config: {} },
    ];
    mockReadState.mockReturnValue(createMockState({ agents }));
    const req = createMockReq();
    const res = createMockRes();
    const handler = findHandler('GET', '/');
    await handler(req, res as unknown as Response, () => {});
    expect(res._json).toHaveLength(2);
    expect((res._json as Agent[])[0].name).toBe('Кот');
  });
});

// ============================================================
// GET /api/agents/:id
// ============================================================

describe('GET /api/agents/:id', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('возвращает агента по id', async () => {
    const agents: Agent[] = [
      { id: 'a1', name: 'Кот', role: 'reviewer', model: 'gpt-4', status: 'idle', project_id: null, current_task_id: null, last_seen: new Date().toISOString(), config: {} },
    ];
    mockReadState.mockReturnValue(createMockState({ agents }));
    const req = createMockReq({ params: { id: 'a1' } });
    const res = createMockRes();
    const handler = findHandler('GET', '/:id');
    await handler(req, res as unknown as Response, () => {});
    expect((res._json as Agent).name).toBe('Кот');
  });

  it('возвращает 404 если агент не найден', async () => {
    mockReadState.mockReturnValue(createMockState());
    const req = createMockReq({ params: { id: 'nonexistent' } });
    const res = createMockRes();
    const handler = findHandler('GET', '/:id');
    await handler(req, res as unknown as Response, () => {});
    expect(res._status).toBe(404);
  });
});

// ============================================================
// POST /api/agents
// ============================================================

describe('POST /api/agents', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('создаёт агента с именем', async () => {
    mockReadState.mockReturnValue(createMockState());
    const req = createMockReq({ body: { name: 'Новый агент', role: 'worker', model: 'gpt-4' } });
    const res = createMockRes();
    const handler = findHandler('POST', '/');
    await handler(req, res as unknown as Response, () => {});
    expect(res._status).toBe(201);
    expect((res._json as Agent).name).toBe('Новый агент');
    expect((res._json as Agent).status).toBe('idle');
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('создаёт агента с дефолтными значениями', async () => {
    mockReadState.mockReturnValue(createMockState());
    const req = createMockReq({ body: {} });
    const res = createMockRes();
    const handler = findHandler('POST', '/');
    await handler(req, res as unknown as Response, () => {});
    expect(res._status).toBe(201);
    expect((res._json as Agent).name).toBe('Новый агент');
    expect((res._json as Agent).role).toBe('worker');
  });
});

// ============================================================
// PUT /api/agents/:id
// ============================================================

describe('PUT /api/agents/:id', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('обновляет агента', async () => {
    const agents: Agent[] = [
      { id: 'a1', name: 'Кот', role: 'reviewer', model: 'gpt-4', status: 'idle', project_id: null, current_task_id: null, last_seen: new Date().toISOString(), config: {} },
    ];
    mockReadState.mockReturnValue(createMockState({ agents }));
    const req = createMockReq({ params: { id: 'a1' }, body: { status: 'working' } });
    const res = createMockRes();
    const handler = findHandler('PUT', '/:id');
    await handler(req, res as unknown as Response, () => {});
    expect(res._status).toBe(200);
    expect((res._json as Agent).status).toBe('working');
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('возвращает 404 если агент не найден', async () => {
    mockReadState.mockReturnValue(createMockState());
    const req = createMockReq({ params: { id: 'nonexistent' }, body: { status: 'working' } });
    const res = createMockRes();
    const handler = findHandler('PUT', '/:id');
    await handler(req, res as unknown as Response, () => {});
    expect(res._status).toBe(404);
  });
});

// ============================================================
// DELETE /api/agents/:id
// ============================================================

describe('DELETE /api/agents/:id', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('удаляет агента', async () => {
    const agents: Agent[] = [
      { id: 'a1', name: 'Кот', role: 'reviewer', model: 'gpt-4', status: 'idle', project_id: null, current_task_id: null, last_seen: new Date().toISOString(), config: {} },
    ];
    mockReadState.mockReturnValue(createMockState({ agents }));
    const req = createMockReq({ params: { id: 'a1' }, body: {} });
    const res = createMockRes();
    const handler = findHandler('DELETE', '/:id');
    await handler(req, res as unknown as Response, () => {});
    expect(res._status).toBe(200);
    expect((res._json as { success: boolean }).success).toBe(true);
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('возвращает 404 если агент не найден', async () => {
    mockReadState.mockReturnValue(createMockState());
    const req = createMockReq({ params: { id: 'nonexistent' }, body: {} });
    const res = createMockRes();
    const handler = findHandler('DELETE', '/:id');
    await handler(req, res as unknown as Response, () => {});
    expect(res._status).toBe(404);
  });
});
