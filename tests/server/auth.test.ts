// ============================================================
// Unit-тесты для auth.ts — аутентификация
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Мокируем fs ДО импорта auth
const mockExistsSync = vi.fn().mockReturnValue(false);
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: (...args: any[]) => mockExistsSync(...args),
}));

// Мокируем bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$12$mockhash'),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue('$2b$12$mockhash'),
  compare: vi.fn().mockResolvedValue(true),
}));

import * as auth from '../../src/server/auth.js';

// --- Хелперы ---

function createMockRequest(body: Record<string, unknown> = {}, cookies: Record<string, string> = {}): Request {
  return {
    body,
    cookies,
    ip: '127.0.0.1',
    url: '/api/auth/test',
    method: 'POST',
  } as unknown as Request;
}

function createMockResponse(): Response & { _json: unknown; _status: number; _cookies: Record<string, unknown>; _cleared: boolean } {
  const res: any = {
    _json: null,
    _status: 200,
    _cookies: {},
    _cleared: false,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: unknown) {
      res._json = data;
      return res;
    },
    cookie(name: string, value: string, opts: Record<string, unknown>) {
      res._cookies[name] = { value, opts };
      return res;
    },
    clearCookie(name: string) {
      res._cleared = true;
      delete res._cookies[name];
      return res;
    },
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
    vi.clearAllMocks();
    // Сбрасываем env
    delete process.env.MYRMEX_PASSWORD_HASH;
  });

  it('создаёт пароль при валидном запросе', async () => {
    const req = createMockRequest({ password: 'securePass123' });
    const res = createMockResponse();

    await auth.setup(req, res as unknown as Response);

    expect(res._status).toBe(200);
    expect(res._json).toEqual({ success: true });
    expect(res._cookies['myrmex_session']).toBeDefined();
  });

  it('отклоняет пароль короче 8 символов', async () => {
    const req = createMockRequest({ password: 'short' });
    const res = createMockResponse();

    await auth.setup(req, res as unknown as Response);

    expect(res._status).toBe(400);
    expect(res._json).toEqual({ error: 'Password must be at least 8 characters' });
  });

  it('отклоняет пустой пароль', async () => {
    const req = createMockRequest({ password: '' });
    const res = createMockResponse();

    await auth.setup(req, res as unknown as Response);

    expect(res._status).toBe(400);
  });

  it('отклоняет отсутствующий пароль в теле', async () => {
    const req = createMockRequest({});
    const res = createMockResponse();

    await auth.setup(req, res as unknown as Response);

    expect(res._status).toBe(400);
  });

  it('отклоняет повторный setup если пароль уже установлен', async () => {
    process.env.MYRMEX_PASSWORD_HASH = '$2b$12$existinghash';

    const req = createMockRequest({ password: 'newPassword123' });
    const res = createMockResponse();

    await auth.setup(req, res as unknown as Response);

    expect(res._status).toBe(403);
    expect(res._json).toEqual({ error: 'Password already set. Use login.' });
  });

  it('устанавливает httpOnly cookie после setup', async () => {
    const req = createMockRequest({ password: 'securePass123' });
    const res = createMockResponse();

    await auth.setup(req, res as unknown as Response);

    const cookie = res._cookies['myrmex_session'];
    expect(cookie).toBeDefined();
    expect(cookie.opts.httpOnly).toBe(true);
    expect(cookie.opts.sameSite).toBe('strict');
  });
});

describe('login()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MYRMEX_PASSWORD_HASH;
  });

  it('авторизует с правильным паролем', async () => {
    process.env.MYRMEX_PASSWORD_HASH = '$2b$12$mockhash';

    const req = createMockRequest({ password: 'correctPassword' });
    const res = createMockResponse();

    await auth.login(req, res as unknown as Response);

    expect(res._status).toBe(200);
    expect(res._json).toEqual({ success: true });
    expect(res._cookies['myrmex_session']).toBeDefined();
  });

  it('отклоняет неправильный пароль', async () => {
    process.env.MYRMEX_PASSWORD_HASH = '$2b$12$mockhash';

    // Переопределяем default.compare чтобы вернуть false
    const bcrypt = await import('bcrypt');
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(false as never);

    const req = createMockRequest({ password: 'wrongPassword' });
    const res = createMockResponse();

    await auth.login(req, res as unknown as Response);

    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Invalid password' });
  });

  it('отклоняет если setup не выполнен', async () => {
    const req = createMockRequest({ password: 'anyPassword' });
    const res = createMockResponse();

    await auth.login(req, res as unknown as Response);

    expect(res._status).toBe(400);
    expect(res._json).toEqual({ error: 'Password not set. Run setup first.' });
  });

  it('отклоняет пустой пароль', async () => {
    process.env.MYRMEX_PASSWORD_HASH = '$2b$12$mockhash';

    const req = createMockRequest({});
    const res = createMockResponse();

    await auth.login(req, res as unknown as Response);

    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Invalid password' });
  });
});

describe('logout()', () => {
  it('очищает сессию и куку', () => {
    const req = createMockRequest({}, { myrmex_session: 'valid-token-123' });
    const res = createMockResponse();

    auth.logout(req, res as unknown as Response);

    expect(res._json).toEqual({ success: true });
    expect(res._cleared).toBe(true);
  });

  it('работает даже без куки', () => {
    const req = createMockRequest({}, {});
    const res = createMockResponse();

    auth.logout(req, res as unknown as Response);

    expect(res._json).toEqual({ success: true });
  });
});

describe('authStatus()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MYRMEX_PASSWORD_HASH;
  });

  it('показывает needsSetup=true когда пароль не установлен', () => {
    const req = createMockRequest({}, {});
    const res = createMockResponse();

    auth.authStatus(req, res as unknown as Response);

    expect(res._json).toMatchObject({
      needsSetup: true,
      needsAuth: false,
    });
  });

  it('показывает needsAuth=true когда пароль установлен', () => {
    process.env.MYRMEX_PASSWORD_HASH = '$2b$12$mockhash';

    const req = createMockRequest({}, {});
    const res = createMockResponse();

    auth.authStatus(req, res as unknown as Response);

    expect(res._json).toMatchObject({
      needsAuth: true,
      needsSetup: false,
    });
  });

  it('показывает authenticated=true в demo-режиме', () => {
    // Переопределяем existsSync чтобы .demo файл "существовал"
    mockExistsSync.mockImplementation((path: any) => {
      if (typeof path === 'string' && path.endsWith('.demo')) return true;
      return false;
    });

    const req = createMockRequest({}, {});
    const res = createMockResponse();

    auth.authStatus(req, res as unknown as Response);

    expect(res._json).toMatchObject({
      authenticated: true,
      demo: true,
    });

    // Сбрасываем обратно
    mockExistsSync.mockReturnValue(false);
  });
});

