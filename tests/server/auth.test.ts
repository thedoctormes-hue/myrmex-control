// ============================================================
// Unit-тесты для auth.ts — JWT + TOTP + RBAC
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import type { MyrmexState } from '@shared/types.js';

function createEmptyState(): MyrmexState {
  const now = new Date().toISOString();
  return {
    _meta: { version: '0.1.0', last_updated: now, last_updated_by: 'test', change_count: 0 },
    workspace: { name: 'Test', description: '', owner: 'tester', created_at: now },
    projects: [], tasks: [], skills: [], files: [], servers: [],
    settings: { theme: 'dark', language: 'ru', auto_save: true, demo_mode: false, sidebar_collapsed: false },
    mcp_servers: [], changelog: [], users: [], refresh_tokens: [],
  };
}

// Мокируем myrmex.ts ДО импорта auth
const mockReadState = vi.fn();
const mockWriteState = vi.fn();
const mockCreateLogEntry = vi.fn();

vi.mock('/root/LabDoctorM/projects/myrmex-control/src/server/myrmex.js', () => ({
  readState: (...args: unknown[]) => mockReadState(...args),
  writeState: (...args: unknown[]) => mockWriteState(...args),
  createLogEntry: (...args: unknown[]) => mockCreateLogEntry(...args),
  isDemo: () => false,
  runAsDemo: <T>(fn: () => T) => fn(),
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$mockhash'),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue('$2b$12$mockhash'),
  compare: vi.fn().mockResolvedValue(true),
}));

vi.mock('otpauth', () => ({
  TOTP: class FakeTOTP { validate() { return 0; } },
  Secret: { fromBase32: vi.fn() },
}));

import * as auth from '../../../src/server/auth.js';

// --- Хелперы ---

function setupMockState() {
  let state = createEmptyState();
  mockReadState.mockImplementation(() => state);
  mockWriteState.mockImplementation((s: MyrmexState) => { state = s; });
  mockCreateLogEntry.mockImplementation(() => ({ timestamp: new Date().toISOString(), actor: 'test', action: 'test', entity_type: 'test', entity_id: 'test', diff: {} }));
  return {
    reset: () => {
      state = createEmptyState();
      mockReadState.mockImplementation(() => state);
      mockWriteState.mockImplementation((s: MyrmexState) => { state = s; });
    },
  };
}

const mockHelper = setupMockState();

function createMockRequest(body: Record<string, unknown> = {}, cookies: Record<string, string> = {}, headers: Record<string, string> = {}): Request {
  return { body, cookies, headers, ip: '127.0.0.1', url: '/api/auth/test', method: 'POST' } as unknown as Request;
}

function createMockResponse(): Response & { _json: unknown; _status: number; _cookies: Record<string, unknown>; _cleared: boolean } {
  const res: any = {
    _json: null, _status: 200, _cookies: {}, _cleared: false,
    status(code: number) { res._status = code; return res; },
    json(data: unknown) { res._json = data; return res; },
    cookie(_n: string, _v: string, _o: Record<string, unknown>) { return res; },
    clearCookie(_n: string) { res._cleared = true; return res; },
  };
  return res;
}

function createMockNext(): NextFunction & { called: boolean } {
  const fn: any = vi.fn(() => { fn.called = true; });
  fn.called = false;
  return fn;
}

// --- Тесты ---

describe('setup()', () => {
  beforeEach(() => {
    mockHelper.reset();
    delete process.env.DEMO_MODE;
  });

  it('создаёт admin при валидном запросе', async () => {
    const req = createMockRequest({ username: 'admin', password: 'securePass123' });
    const res = createMockResponse();
    await auth.setup(req, res as unknown as Response);
    expect(res._status).toBe(200);
    expect((res._json as any).success).toBe(true);
    expect((res._json as any).access_token).toBeDefined();
    expect((res._json as any).user.role).toBe('admin');
  });

  it('отклоняет username короче 3 символов', async () => {
    const req = createMockRequest({ username: 'ab', password: 'securePass123' });
    const res = createMockResponse();
    await auth.setup(req, res as unknown as Response);
    expect(res._status).toBe(400);
  });

  it('отклоняет пароль короче 8 символов', async () => {
    const req = createMockRequest({ username: 'admin', password: 'short' });
    const res = createMockResponse();
    await auth.setup(req, res as unknown as Response);
    expect(res._status).toBe(400);
    expect((res._json as any).error).toContain('8');
  });

  it('отклоняет пустой пароль', async () => {
    const req = createMockRequest({ username: 'admin', password: '' });
    const res = createMockResponse();
    await auth.setup(req, res as unknown as Response);
    expect(res._status).toBe(400);
  });

  it('отклоняет отсутствующий username', async () => {
    const req = createMockRequest({ password: 'securePass123' });
    const res = createMockResponse();
    await auth.setup(req, res as unknown as Response);
    expect(res._status).toBe(400);
  });

  it('отклоняет повторный setup если пользователь уже существует', async () => {
    const req1 = createMockRequest({ username: 'admin', password: 'securePass123' });
    const res1 = createMockResponse();
    await auth.setup(req1, res1 as unknown as Response);

    const req2 = createMockRequest({ username: 'admin2', password: 'anotherPass123' });
    const res2 = createMockResponse();
    await auth.setup(req2, res2 as unknown as Response);
    expect(res2._status).toBe(403);
  });

  it('возвращает access_token и user после setup', async () => {
    const req = createMockRequest({ username: 'admin', password: 'securePass123' });
    const res = createMockResponse();
    await auth.setup(req, res as unknown as Response);
    const json = res._json as any;
    expect(json.access_token).toBeDefined();
    expect(json.user.username).toBe('admin');
    expect(json.user.role).toBe('admin');
  });
});

describe('login()', () => {
  beforeEach(async () => {

    mockHelper.reset();
    delete process.env.DEMO_MODE;
    const req = createMockRequest({ username: 'testuser', password: 'testPass123' });
    const res = createMockResponse();
    await auth.setup(req, res as unknown as Response);
  });

  it('авторизует с правильным паролем', async () => {
    const req = createMockRequest({ username: 'testuser', password: 'testPass123' });
    const res = createMockResponse();
    await auth.login(req, res as unknown as Response);
    expect(res._status).toBe(200);
    expect((res._json as any).success).toBe(true);
    expect((res._json as any).access_token).toBeDefined();
  });

  it('отклоняет неправильный пароль', async () => {
    const bcrypt = await import('bcrypt');
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(false as never);
    const req = createMockRequest({ username: 'testuser', password: 'wrongPass' });
    const res = createMockResponse();
    await auth.login(req, res as unknown as Response);
    expect(res._status).toBe(401);
    expect((res._json as any).error).toBe('Invalid credentials');
  });

  it('отклоняет несуществующего пользователя', async () => {
    const req = createMockRequest({ username: 'nobody', password: 'testPass123' });
    const res = createMockResponse();
    await auth.login(req, res as unknown as Response);
    expect(res._status).toBe(401);
  });
});

describe('logout()', () => {
  beforeEach(() => mockHelper.reset());
  it('возвращает success', () => {
    const req = createMockRequest({}, {});
    const res = createMockResponse();
    auth.logout(req, res as unknown as Response);
    expect((res._json as any).success).toBe(true);
  });
});

describe('authStatus()', () => {
  beforeEach(() => {

    mockHelper.reset();
    delete process.env.DEMO_MODE;
  });

  it('показывает needsSetup=true когда нет пользователей', () => {
    const req = createMockRequest({}, {});
    const res = createMockResponse();
    auth.authStatus(req, res as unknown as Response);
    expect((res._json as any).needsSetup).toBe(true);
    expect((res._json as any).needsAuth).toBe(false);
  });

  it('показывает needsAuth=true когда есть пользователи', async () => {
    const setupReq = createMockRequest({ username: 'admin', password: 'securePass123' });
    const setupRes = createMockResponse();
    await auth.setup(setupReq, setupRes as unknown as Response);

    const req = createMockRequest({}, {});
    const res = createMockResponse();
    auth.authStatus(req, res as unknown as Response);
    expect((res._json as any).needsAuth).toBe(true);
    expect((res._json as any).needsSetup).toBe(false);
  });

});

describe('requireAuth()', () => {
  beforeEach(() => {

    mockHelper.reset();
    delete process.env.DEMO_MODE;
  });

  it('блокирует без токена', () => {
    const req = createMockRequest({}, {});
    const res = createMockResponse();
    const next = createMockNext();
    auth.requireAuth(req, res as unknown as Response, next);
    expect(next.called).toBe(false);
    expect(res._status).toBe(401);
  });

  it('блокирует с невалидным токеном', () => {
    const req = createMockRequest({}, {}, { authorization: 'Bearer invalid-token' });
    const res = createMockResponse();
    const next = createMockNext();
    auth.requireAuth(req, res as unknown as Response, next);
    expect(next.called).toBe(false);
    expect(res._status).toBe(401);
  });

  it('пропускает с валидным JWT токеном', async () => {
    const setupReq = createMockRequest({ username: 'admin', password: 'securePass123' });
    const setupRes = createMockResponse();
    await auth.setup(setupReq, setupRes as unknown as Response);
    const token = (setupRes._json as any).access_token;

    const req = createMockRequest({}, {}, { authorization: `Bearer ${token}` });
    const res = createMockResponse();
    const next = createMockNext();
    auth.requireAuth(req, res as unknown as Response, next);
    expect(next.called).toBe(true);
  });
});

describe('requireRole()', () => {
  beforeEach(() => {

    mockHelper.reset();
    delete process.env.DEMO_MODE;
  });

  it('блокирует без аутентификации', () => {
    const middleware = auth.requireRole('admin');
    const req = createMockRequest() as any;
    const res = createMockResponse();
    const next = createMockNext();
    middleware(req, res as unknown as Response, next);
    expect(next.called).toBe(false);
    expect(res._status).toBe(401);
  });

  it('admin имеет доступ ко всему', async () => {
    const setupReq = createMockRequest({ username: 'admin', password: 'securePass123' });
    const setupRes = createMockResponse();
    await auth.setup(setupReq, setupRes as unknown as Response);
    const token = (setupRes._json as any).access_token;

    const middleware = auth.requireRole('operator');
    const req = createMockRequest({}, {}, { authorization: `Bearer ${token}` }) as any;
    const res = createMockResponse();
    const next = createMockNext();

    auth.requireAuth(req, res as unknown as Response, () => {
      middleware(req, res as unknown as Response, next);
    });
    expect(next.called).toBe(true);
  });
});
