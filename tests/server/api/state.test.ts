// ============================================================
// API-тесты для state.ts — чтение полного состояния
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import type { MyrmexState } from '@shared/types.js';

const mockReadState = vi.fn();

vi.mock('../../../src/server/myrmex.js', () => ({
  readState: (...args: unknown[]) => mockReadState(...args),
  writeState: vi.fn().mockResolvedValue(undefined),
  createLogEntry: vi.fn(),
}));

import { router } from '../../../src/server/api/state.js';

// --- Хелперы ---

function createMockState(overrides: Partial<MyrmexState> = {}): MyrmexState {
  const now = new Date().toISOString();
  return {
    _meta: { version: '0.1.0', last_updated: now, last_updated_by: 'test', change_count: 5 },
    workspace: { name: 'Test Workspace', description: 'Test', owner: 'tester', created_at: now },
    projects: [{ id: 'p1', name: 'Project A', description: '', color: '#6366f1', icon: '📦', status: 'active', created_at: now, updated_at: now }],
    agents: [],
    tasks: [{ id: 't1', project_id: 'p1', title: 'Task 1', description: '', status: 'backlog', priority: 'medium', assignee_id: null, parent_id: null, dependencies: [], tags: [], created_at: now, updated_at: now, completed_at: null }],
    library: [],
    files: [],
    servers: [],
    settings: { theme: 'dark', language: 'ru', refresh_interval_sec: 30, notifications_enabled: true, custom: {} },
    mcp_servers: [],
    changelog: [],
    ...overrides,
  };
}

function createMockRequest(): Request {
  return {} as unknown as Request;
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

describe('GET /api/state', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('возвращает полное состояние', () => {
    const state = createMockState();
    mockReadState.mockReturnValue(state);

    const req = createMockRequest();
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(200);
    const result = res._json as MyrmexState;
    expect(result).toBeDefined();
    expect(result._meta).toBeDefined();
    expect(result.workspace).toBeDefined();
    expect(result.tasks).toBeDefined();
    expect(result.projects).toBeDefined();
    expect(result.library).toBeDefined();
    expect(result.servers).toBeDefined();
    expect(result.settings).toBeDefined();
    expect(result.changelog).toBeDefined();
  });

  it('возвращает state с корректной метой', () => {
    const state = createMockState();
    mockReadState.mockReturnValue(state);

    const req = createMockRequest();
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    const result = res._json as MyrmexState;
    expect(result._meta.version).toBe('0.1.0');
    expect(result._meta.change_count).toBe(5);
    expect(result._meta.last_updated).toBeDefined();
  });

  it('возвращает state с данными (tasks, projects)', () => {
    const state = createMockState();
    mockReadState.mockReturnValue(state);

    const req = createMockRequest();
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    const result = res._json as MyrmexState;
    expect(result.tasks).toHaveLength(1);
    expect(result.projects).toHaveLength(1);
    expect(result.tasks[0].title).toBe('Task 1');
    expect(result.projects[0].name).toBe('Project A');
  });

  it('возвращает пустые массивы для пустого state', () => {
    const state = createMockState({
      tasks: [],
      projects: [],
      library: [],
      servers: [],
      changelog: [],
    });
    mockReadState.mockReturnValue(state);

    const req = createMockRequest();
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    const result = res._json as MyrmexState;
    expect(result.tasks).toEqual([]);
    expect(result.projects).toEqual([]);
    expect(result.library).toEqual([]);
    expect(result.servers).toEqual([]);
  });

  it('возвращает 500 при ошибке readState', () => {
    mockReadState.mockImplementation(() => { throw new Error('FS error'); });

    const req = createMockRequest();
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to read myrmex state' });
  });
});
