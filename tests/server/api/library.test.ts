// ============================================================
// API-тесты для library.ts — CRUD библиотеки (skills/hooks/masks)
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import type { Skill, MyrmexState } from '@shared/types.js';

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

import { router } from '../../../src/server/api/library.js';

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

function createSkill(overrides: Partial<Skill> = {}): Skill {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    type: 'skill',
    name: 'Test Skill',
    description: 'Test description',
    content: 'Test content',
    file_path: null,
    tags: [],
    created_at: now,
    updated_at: now,
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

function findRouteHandler(method: string, pathPattern: string) {
  const stack = (router as any).stack;
  for (const layer of stack) {
    if (layer.route) {
      const route = layer.route;
      const methods = Object.keys(route.methods).map(m => m.toUpperCase());
      if (methods.includes(method.toUpperCase())) {
        if (route.path === pathPattern) {
          return route;
        }
      }
    }
  }
  return null;
}

// --- Тесты ---

describe('GET /api/library', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('возвращает пустой список', () => {
    mockReadState.mockReturnValue(createMockState());
    const req = createMockRequest({}, {}, {});
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toEqual([]);
  });

  it('возвращает все элементы библиотеки', () => {
    const items = [
      createSkill({ id: 's1', type: 'skill', name: 'Skill A' }),
      createSkill({ id: 's2', type: 'hook', name: 'Hook B' }),
      createSkill({ id: 's3', type: 'mask', name: 'Mask C' }),
    ];
    mockReadState.mockReturnValue(createMockState({ library: items }));
    const req = createMockRequest({}, {}, {});
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toHaveLength(3);
  });

  it('фильтрует по типу (skill)', () => {
    const items = [
      createSkill({ id: 's1', type: 'skill', name: 'Skill A' }),
      createSkill({ id: 's2', type: 'hook', name: 'Hook B' }),
      createSkill({ id: 's3', type: 'skill', name: 'Skill C' }),
    ];
    mockReadState.mockReturnValue(createMockState({ library: items }));
    const req = createMockRequest({}, {}, { type: 'skill' });
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    const result = res._json as Skill[];
    expect(result).toHaveLength(2);
    expect(result.every(i => i.type === 'skill')).toBe(true);
  });

  it('фильтрует по типу (hook)', () => {
    const items = [
      createSkill({ id: 's1', type: 'skill', name: 'Skill A' }),
      createSkill({ id: 's2', type: 'hook', name: 'Hook B' }),
    ];
    mockReadState.mockReturnValue(createMockState({ library: items }));
    const req = createMockRequest({}, {}, { type: 'hook' });
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);
    const result = res._json as Skill[];
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('hook');
  });

  it('возвращает 500 при ошибке', () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({}, {}, {});
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to read library' });
  });
});

describe('GET /api/library/:id', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('возвращает элемент по ID', () => {
    const item = createSkill({ id: 'lib-123', name: 'Find me' });
    mockReadState.mockReturnValue(createMockState({ library: [item] }));
    const req = createMockRequest({ id: 'lib-123' });
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/:id');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    expect((res._json as Skill).id).toBe('lib-123');
    expect((res._json as Skill).name).toBe('Find me');
  });

  it('возвращает 404 если элемент не найден', () => {
    mockReadState.mockReturnValue(createMockState({ library: [] }));
    const req = createMockRequest({ id: 'nonexistent' });
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/:id');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Skill not found' });
  });

  it('возвращает 500 при ошибке', () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({ id: 'lib-1' });
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/:id');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to read skill' });
  });
});

describe('POST /api/library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'create', entity_type: 'skill', entity_id: 'new', diff: {},
    });
  });

  it('создаёт skill с полными данными', async () => {
    mockReadState.mockReturnValue(createMockState({ library: [] }));
    const req = createMockRequest({}, {
      type: 'skill', name: 'New Skill', description: 'Desc',
      content: 'Content', tags: ['tag1'],
    });
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(201);
    const result = res._json as Skill;
    expect(result.type).toBe('skill');
    expect(result.name).toBe('New Skill');
    expect(result.content).toBe('Content');
    expect(result.tags).toEqual(['tag1']);
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('создаёт hook', async () => {
    mockReadState.mockReturnValue(createMockState({ library: [] }));
    const req = createMockRequest({}, { type: 'hook', name: 'My Hook' });
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);
    const result = res._json as Skill;
    expect(result.type).toBe('hook');
    expect(result.name).toBe('My Hook');
  });

  it('создаёт mask', async () => {
    mockReadState.mockReturnValue(createMockState({ library: [] }));
    const req = createMockRequest({}, { type: 'mask', name: 'My Mask' });
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);
    const result = res._json as Skill;
    expect(result.type).toBe('mask');
  });

  it('создаёт с defaults при пустом теле', async () => {
    mockReadState.mockReturnValue(createMockState({ library: [] }));
    const req = createMockRequest({}, {});
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);
    const result = res._json as Skill;
    expect(result.type).toBe('skill');
    expect(result.name).toBe('Новый скилл');
    expect(result.content).toBe('');
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({}, { name: 'Fail' });
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to create skill' });
  });
});

describe('PUT /api/library/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'update', entity_type: 'skill', entity_id: 's1', diff: {},
    });
  });

  it('обновляет элемент', async () => {
    const item = createSkill({ id: 'lib-1', name: 'Old Name', type: 'skill' });
    mockReadState.mockReturnValue(createMockState({ library: [item] }));
    const req = createMockRequest({ id: 'lib-1' }, { name: 'New Name', content: 'New content' });
    const res = createMockResponse();
    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    const result = res._json as Skill;
    expect(result.name).toBe('New Name');
    expect(result.content).toBe('New content');
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('не меняет id и created_at при обновлении', async () => {
    const originalId = 'lib-immutable';
    const originalCreated = '2025-01-01T00:00:00.000Z';
    const item = createSkill({ id: originalId, created_at: originalCreated });
    mockReadState.mockReturnValue(createMockState({ library: [item] }));
    const req = createMockRequest({ id: originalId }, { id: 'hacked', created_at: 'hacked' });
    const res = createMockResponse();
    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);
    const result = res._json as Skill;
    expect(result.id).toBe(originalId);
    expect(result.created_at).toBe(originalCreated);
  });

  it('возвращает 404 если элемент не найден', async () => {
    mockReadState.mockReturnValue(createMockState({ library: [] }));
    const req = createMockRequest({ id: 'nonexistent' }, { name: 'Ghost' });
    const res = createMockResponse();
    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Skill not found' });
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({ id: 'lib-1' }, { name: 'Fail' });
    const res = createMockResponse();
    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to update skill' });
  });
});

describe('DELETE /api/library/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'delete', entity_type: 'skill', entity_id: 's1', diff: {},
    });
  });

  it('удаляет элемент', async () => {
    const item = createSkill({ id: 'lib-to-delete' });
    mockReadState.mockReturnValue(createMockState({ library: [item] }));
    const req = createMockRequest({ id: 'lib-to-delete' });
    const res = createMockResponse();
    const route = findRouteHandler('DELETE', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toEqual({ success: true, id: 'lib-to-delete' });
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('возвращает 404 если элемент не найден', async () => {
    mockReadState.mockReturnValue(createMockState({ library: [] }));
    const req = createMockRequest({ id: 'nonexistent' });
    const res = createMockResponse();
    const route = findRouteHandler('DELETE', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Skill not found' });
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({ id: 'lib-1' });
    const res = createMockResponse();
    const route = findRouteHandler('DELETE', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to delete skill' });
  });
});
