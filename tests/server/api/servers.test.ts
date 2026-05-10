// ============================================================
// API-тесты для servers.ts — CRUD серверов + check
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import type { Server, MyrmexState } from '@shared/types.js';

const mockReadState = vi.fn();
const mockWriteState = vi.fn().mockResolvedValue(undefined);
const mockCreateLogEntry = vi.fn();

vi.mock('../../../src/server/myrmex.js', () => ({
  readState: (...args: unknown[]) => mockReadState(...args),
  writeState: (...args: unknown[]) => mockWriteState(...args),
  createLogEntry: (...args: unknown[]) => mockCreateLogEntry(...args),
}));

import { router } from '../../../src/server/api/servers.js';

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

function createServer(overrides: Partial<Server> = {}): Server {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: 'Test Server',
    host: '192.168.1.1',
    port: 22,
    status: 'offline',
    services: [],
    last_check: now,
    meta: {},
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

describe('GET /api/servers', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('возвращает пустой список', () => {
    mockReadState.mockReturnValue(createMockState());
    const req = createMockRequest();
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toEqual([]);
  });

  it('возвращает список серверов', () => {
    const servers = [
      createServer({ id: 'srv-1', name: 'Server A' }),
      createServer({ id: 'srv-2', name: 'Server B' }),
    ];
    mockReadState.mockReturnValue(createMockState({ servers }));
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
    expect(res._json).toEqual({ error: 'Failed to read servers' });
  });
});

describe('GET /api/servers/:id', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('возвращает сервер по ID', () => {
    const server = createServer({ id: 'srv-123', name: 'Find me' });
    mockReadState.mockReturnValue(createMockState({ servers: [server] }));
    const req = createMockRequest({ id: 'srv-123' });
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/:id');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    expect((res._json as Server).id).toBe('srv-123');
    expect((res._json as Server).name).toBe('Find me');
  });

  it('возвращает 404 если сервер не найден', () => {
    mockReadState.mockReturnValue(createMockState({ servers: [] }));
    const req = createMockRequest({ id: 'nonexistent' });
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/:id');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Server not found' });
  });

  it('возвращает 500 при ошибке', () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({ id: 'srv-1' });
    const res = createMockResponse();
    const route = findRouteHandler('GET', '/:id');
    route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to read server' });
  });
});

describe('POST /api/servers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'create', entity_type: 'server', entity_id: 'new', diff: {},
    });
  });

  it('добавляет сервер с полными данными', async () => {
    mockReadState.mockReturnValue(createMockState({ servers: [] }));
    const req = createMockRequest({}, {
      name: 'New Server', host: '10.0.0.1', port: 8080,
      services: ['nginx', 'redis'], meta: { region: 'eu' },
    });
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(201);
    const result = res._json as Server;
    expect(result.name).toBe('New Server');
    expect(result.host).toBe('10.0.0.1');
    expect(result.port).toBe(8080);
    expect(result.services).toEqual(['nginx', 'redis']);
    expect(result.meta).toEqual({ region: 'eu' });
    expect(result.status).toBe('offline');
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('создаёт сервер с defaults', async () => {
    mockReadState.mockReturnValue(createMockState({ servers: [] }));
    const req = createMockRequest({}, {});
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);
    const result = res._json as Server;
    expect(result.name).toBe('Новый сервер');
    expect(result.port).toBe(22);
    expect(result.status).toBe('offline');
    expect(result.services).toEqual([]);
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({}, { name: 'Fail' });
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to create server' });
  });
});

describe('PUT /api/servers/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'update', entity_type: 'server', entity_id: 's1', diff: {},
    });
  });

  it('обновляет сервер', async () => {
    const server = createServer({ id: 'srv-1', name: 'Old Name', host: 'old.host' });
    mockReadState.mockReturnValue(createMockState({ servers: [server] }));
    const req = createMockRequest({ id: 'srv-1' }, { name: 'New Name', host: 'new.host' });
    const res = createMockResponse();
    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    const result = res._json as Server;
    expect(result.name).toBe('New Name');
    expect(result.host).toBe('new.host');
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('не меняет id при обновлении', async () => {
    const server = createServer({ id: 'srv-immutable' });
    mockReadState.mockReturnValue(createMockState({ servers: [server] }));
    const req = createMockRequest({ id: 'srv-immutable' }, { id: 'hacked' });
    const res = createMockResponse();
    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);
    const result = res._json as Server;
    expect(result.id).toBe('srv-immutable');
  });

  it('обновляет last_check при обновлении', async () => {
    const server = createServer({ id: 'srv-1', last_check: '2025-01-01T00:00:00.000Z' });
    mockReadState.mockReturnValue(createMockState({ servers: [server] }));
    const req = createMockRequest({ id: 'srv-1' }, { name: 'Updated' });
    const res = createMockResponse();
    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);
    const result = res._json as Server;
    expect(result.last_check).not.toBe('2025-01-01T00:00:00.000Z');
  });

  it('возвращает 404 если сервер не найден', async () => {
    mockReadState.mockReturnValue(createMockState({ servers: [] }));
    const req = createMockRequest({ id: 'nonexistent' }, { name: 'Ghost' });
    const res = createMockResponse();
    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Server not found' });
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({ id: 'srv-1' }, { name: 'Fail' });
    const res = createMockResponse();
    const route = findRouteHandler('PUT', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to update server' });
  });
});

describe('DELETE /api/servers/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'api', action: 'delete', entity_type: 'server', entity_id: 's1', diff: {},
    });
  });

  it('удаляет сервер', async () => {
    const server = createServer({ id: 'srv-to-delete' });
    mockReadState.mockReturnValue(createMockState({ servers: [server] }));
    const req = createMockRequest({ id: 'srv-to-delete' });
    const res = createMockResponse();
    const route = findRouteHandler('DELETE', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    expect(res._json).toEqual({ success: true, id: 'srv-to-delete' });
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('возвращает 404 если сервер не найден', async () => {
    mockReadState.mockReturnValue(createMockState({ servers: [] }));
    const req = createMockRequest({ id: 'nonexistent' });
    const res = createMockResponse();
    const route = findRouteHandler('DELETE', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Server not found' });
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({ id: 'srv-1' });
    const res = createMockResponse();
    const route = findRouteHandler('DELETE', '/:id');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to delete server' });
  });
});

describe('POST /api/servers/:id/check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLogEntry.mockReturnValue({
      id: 'log-1', timestamp: new Date().toISOString(),
      source: 'watchdog', action: 'check', entity_type: 'server', entity_id: 's1', diff: {},
    });
  });

  it('обновляет статус сервера', async () => {
    const server = createServer({ id: 'srv-1', status: 'offline' });
    mockReadState.mockReturnValue(createMockState({ servers: [server] }));
    const req = createMockRequest({ id: 'srv-1' }, { status: 'online' });
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/:id/check');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(200);
    const result = res._json as Server;
    expect(result.status).toBe('online');
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('обновляет last_check', async () => {
    const server = createServer({ id: 'srv-1', last_check: '2025-01-01T00:00:00.000Z' });
    mockReadState.mockReturnValue(createMockState({ servers: [server] }));
    const req = createMockRequest({ id: 'srv-1' }, { status: 'online' });
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/:id/check');
    await route!.stack[0].handle(req, res);
    const result = res._json as Server;
    expect(result.last_check).not.toBe('2025-01-01T00:00:00.000Z');
  });

  it('возвращает 404 если сервер не найден', async () => {
    mockReadState.mockReturnValue(createMockState({ servers: [] }));
    const req = createMockRequest({ id: 'nonexistent' }, { status: 'online' });
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/:id/check');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: 'Server not found' });
  });

  it('возвращает 500 при ошибке', async () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });
    const req = createMockRequest({ id: 'srv-1' }, { status: 'online' });
    const res = createMockResponse();
    const route = findRouteHandler('POST', '/:id/check');
    await route!.stack[0].handle(req, res);
    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to check server' });
  });
});
