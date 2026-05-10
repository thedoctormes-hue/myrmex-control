// ============================================================
// API-тесты для projects.ts — CRUD проектов
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import type { Project, MyrmexState } from '@shared/types.js';

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

import { router } from '../../../src/server/api/projects.js';

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

function createProject(overrides: Partial<Project> = {}): Project {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: 'Test Project',
    description: 'Test description',
    color: '#6366f1',
    icon: '📦',
    status: 'active',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function createMockRequest(params: Record<string, string> = {}, body: Record<string, unknown> = {}): Request {
  return { params, body } as unknown as Request;
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

describe('GET /api/projects', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('возвращает пустой список проектов', () => {
    mockReadState.mockReturnValue(createMockState());
    const req = createMockRequest();
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toEqual([]);
  });

  it('возвращает список проектов', () => {
    const projects = [
      createProject({ id: 'p1', name: 'Project A' }),
      createProject({ id: 'p2', name: 'Project B' }),
    ];
    mockReadState.mockReturnValue(createMockState({ projects }));
    const req = createMockRequest();
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toHaveLength(2);
  });

  it('возвращает 500 при ошибке', () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest();
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to read projects' });
  });
});

describe('GET /api/projects/:id', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('возвращает проект по ID', () => {
    const project = createProject({ id: 'proj-123', name: 'Find me' });
    mockReadState.mockReturnValue(createMockState({ projects: [project] }));
    const req = createMockRequest({ id: 'proj-123' });
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/:id');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    expect((res._json as Project).id).toBe('proj-123');
    expect((res._json as Project).name).toBe('Find me');
  });

  it('возвращает 404 если проект не найден', () => {
    mockReadState.mockReturnValue(createMockState({ projects: [] }));
    const req = createMockRequest({ id: 'nonexistent' });
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/:id');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Project not found' });
  });

  it('возвращает 500 при ошибке', () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({ id: 'proj-1' });
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/:id');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to read project' });
  });
});

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'create', entity_type: 'project', entity_id: 'new', diff: {},
    });
  });

  it('создаёт проект с полными данными', async () => {
    mockReadState.mockReturnValue(createMockState({ projects: [] }));
    const req = createMockRequest({}, {
      name: 'New Project', description: 'Full description',
      color: '#ff0000', icon: '🚀', status: 'active',
    });
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(201);
    const result = res._json as Project;
    expect(result.name).toBe('New Project');
    expect(result.description).toBe('Full description');
    expect(result.color).toBe('#ff0000');
    expect(result.icon).toBe('🚀');
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('создаёт проект с defaults при пустом теле', async () => {
    mockReadState.mockReturnValue(createMockState({ projects: [] }));
    const req = createMockRequest({}, {});
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(201);
    const result = res._json as Project;
    expect(result.name).toBe('Новый проект');
    expect(result.color).toBe('#6366f1');
    expect(result.icon).toBe('📦');
    expect(result.status).toBe('active');
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({}, { name: 'Fail' });
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to create project' });
  });
});

describe('PUT /api/projects/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'update', entity_type: 'project', entity_id: 'p1', diff: {},
    });
  });

  it('обновляет проект', async () => {
    const project = createProject({ id: 'proj-1', name: 'Old Name' });
    mockReadState.mockReturnValue(createMockState({ projects: [project] }));
    const req = createMockRequest({ id: 'proj-1' }, { name: 'New Name', status: 'paused' });
    const res = createMockResponse();
    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    const result = res._json as Project;
    expect(result.name).toBe('New Name');
    expect(result.status).toBe('paused');
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('не меняет id и created_at при обновлении', async () => {
    const originalId = 'proj-immutable';
    const originalCreated = '2025-01-01T00:00:00.000Z';
    const project = createProject({ id: originalId, created_at: originalCreated });
    mockReadState.mockReturnValue(createMockState({ projects: [project] }));
    const req = createMockRequest({ id: originalId }, { id: 'hacked', created_at: 'hacked' });
    const res = createMockResponse();
    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);
    const result = res._json as Project;
    expect(result.id).toBe(originalId);
    expect(result.created_at).toBe(originalCreated);
  });

  it('возвращает 404 если проект не найден', async () => {
    mockReadState.mockReturnValue(createMockState({ projects: [] }));
    const req = createMockRequest({ id: 'nonexistent' }, { name: 'Ghost' });
    const res = createMockResponse();
    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Project not found' });
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({ id: 'proj-1' }, { name: 'Fail' });
    const res = createMockResponse();
    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to update project' });
  });
});

describe('DELETE /api/projects/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'delete', entity_type: 'project', entity_id: 'p1', diff: {},
    });
  });

  it('удаляет проект', async () => {
    const project = createProject({ id: 'proj-to-delete' });
    mockReadState.mockReturnValue(createMockState({ projects: [project] }));
    const req = createMockRequest({ id: 'proj-to-delete' });
    const res = createMockResponse();
    const route = findRouteHandler('DELETE', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toEqual({ success: true, id: 'proj-to-delete' });
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('возвращает 404 если проект не найден', async () => {
    mockReadState.mockReturnValue(createMockState({ projects: [] }));
    const req = createMockRequest({ id: 'nonexistent' });
    const res = createMockResponse();
    const route = findRouteHandler('DELETE', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Project not found' });
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({ id: 'proj-1' });
    const res = createMockResponse();
    const route = findRouteHandler('DELETE', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to delete project' });
  });
});
