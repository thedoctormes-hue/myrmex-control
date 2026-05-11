// ============================================================
// API-тесты для settings.ts — GET/PUT настроек
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import type { MyrmexState } from '@shared/types.js';

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

import { router } from '../../../src/server/api/settings.js';

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
// GET /api/settings
// ============================================================

describe('GET /api/settings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('возвращает текущие настройки', async () => {
    const state = createMockState();
    mockReadState.mockReturnValue(state);
    const req = createMockReq();
    const res = createMockRes();
    const handler = findHandler('GET', '/');
    await handler(req, res as unknown as Response, () => {});
    expect(res._json).toEqual(state.settings);
    expect((res._json as any).theme).toBe('dark');
  });
});

// ============================================================
// PUT /api/settings
// ============================================================

describe('PUT /api/settings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('обновляет theme', async () => {
    const state = createMockState();
    mockReadState.mockReturnValue(state);
    const req = createMockReq({ body: { theme: 'light' } });
    const res = createMockRes();
    const handler = findHandler('PUT', '/');
    await handler(req, res as unknown as Response, () => {});
    expect(res._status).toBe(200);
    expect((res._json as any).theme).toBe('light');
    expect(mockWriteState).toHaveBeenCalled();
  });

  it('обновляет language', async () => {
    const state = createMockState();
    mockReadState.mockReturnValue(state);
    const req = createMockReq({ body: { language: 'en' } });
    const res = createMockRes();
    const handler = findHandler('PUT', '/');
    await handler(req, res as unknown as Response, () => {});
    expect((res._json as any).language).toBe('en');
  });

  it('обновляет refresh_interval_sec', async () => {
    const state = createMockState();
    mockReadState.mockReturnValue(state);
    const req = createMockReq({ body: { refresh_interval_sec: 60 } });
    const res = createMockRes();
    const handler = findHandler('PUT', '/');
    await handler(req, res as unknown as Response, () => {});
    expect((res._json as any).refresh_interval_sec).toBe(60);
  });

  it('обновляет notifications_enabled', async () => {
    const state = createMockState();
    mockReadState.mockReturnValue(state);
    const req = createMockReq({ body: { notifications_enabled: false } });
    const res = createMockRes();
    const handler = findHandler('PUT', '/');
    await handler(req, res as unknown as Response, () => {});
    expect((res._json as any).notifications_enabled).toBe(false);
  });

  it('мержит custom поля', async () => {
    const state = createMockState({
      settings: { theme: 'dark', language: 'ru', refresh_interval_sec: 30, notifications_enabled: true, custom: { existing: 'value' } },
    });
    mockReadState.mockReturnValue(state);
    const req = createMockReq({ body: { custom: { newKey: 'newVal' } } });
    const res = createMockRes();
    const handler = findHandler('PUT', '/');
    await handler(req, res as unknown as Response, () => {});
    expect((res._json as any).custom).toEqual({ existing: 'value', newKey: 'newVal' });
  });

  it('сохраняет неизменённые поля', async () => {
    const state = createMockState({
      settings: { theme: 'dark', language: 'ru', refresh_interval_sec: 30, notifications_enabled: true, custom: {} },
    });
    mockReadState.mockReturnValue(state);
    const req = createMockReq({ body: { theme: 'light' } });
    const res = createMockRes();
    const handler = findHandler('PUT', '/');
    await handler(req, res as unknown as Response, () => {});
    expect((res._json as any).language).toBe('ru');
    expect((res._json as any).refresh_interval_sec).toBe(30);
  });
});
