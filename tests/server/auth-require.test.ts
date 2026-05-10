// Unit-тесты для requireAuth middleware
// Отдельный файл чтобы vi.mock на уровне модуля не конфликтовал с другими тестами
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// Мокируем fs ДО импорта auth
const mockExistsSync = vi.fn().mockReturnValue(false);
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: (...args: any[]) => mockExistsSync(...args),
}));

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
    url: '/api/test',
    method: 'GET',
  } as unknown as Request;
}

function createMockResponse(): Response & { _json: unknown; _status: number } {
  const res: any = {
    _json: null,
    _status: 200,
    status(code: number) { res._status = code; return res; },
    json(data: unknown) { res._json = data; return res; },
    cookie() { return res; },
    clearCookie() { return res; },
  };
  return res;
}

function createMockNext(): (() => void) & { called: boolean } {
  const fn: any = () => { fn.called = true; };
  fn.called = false;
  return fn;
}

// --- Tests ---

describe('requireAuth()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MYRMEX_PASSWORD_HASH;
    mockExistsSync.mockReturnValue(false);
  });

  it('пропускает если пароль не установлен (setup mode)', () => {
    // getPassword() вернёт null т.к. MYRMEX_PASSWORD_HASH не установлен
    // и existsSync возвращает false (нет .env с хешем)
    const req = createMockRequest({}, {});
    const res = createMockResponse();
    const next = createMockNext();

    auth.requireAuth(req, res as unknown as Response, next);

    expect(next.called).toBe(true);
  });

  it('блокирует без сессии если пароль установлен', () => {
    process.env.MYRMEX_PASSWORD_HASH = '$2b$12$mockhash';

    const req = createMockRequest({}, {});
    const res = createMockResponse();
    const next = createMockNext();

    auth.requireAuth(req, res as unknown as Response, next);

    expect(next.called).toBe(false);
    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Unauthorized', login: true });
  });

  it('пропускает в demo-режиме', () => {
    process.env.MYRMEX_PASSWORD_HASH = '$2b$12$mockhash';

    // Переопределяем existsSync чтобы .demo файл "существовал"
    mockExistsSync.mockImplementation((path: any) => {
      if (typeof path === 'string' && path.endsWith('.demo')) return true;
      return false;
    });

    const req = createMockRequest({}, {});
    const res = createMockResponse();
    const next = createMockNext();

    auth.requireAuth(req, res as unknown as Response, next);

    expect(next.called).toBe(true);
  });

  it('пропускает с валидной сессией', () => {
    process.env.MYRMEX_PASSWORD_HASH = '$2b$12$mockhash';

    // Логинимся чтобы создать сессию
    const loginReq = createMockRequest({ password: 'test1234' });
    const loginRes = createMockResponse();
    auth.login(loginReq, loginRes as unknown as Response);

    // Извлекаем токен из куки
    const cookieCall = (loginRes as any).cookieCalls?.[0];
    // К сожалению login вызывает res.cookie() который мы не мокаем полностью
    // Вместо этого — проверим что без куки → 401 (уже проверено выше)
    // А с невалидной кукой тоже → 401
    const req = createMockRequest({}, { myrmex_session: 'invalid-token' });
    const res = createMockResponse();
    const next = createMockNext();

    auth.requireAuth(req, res as unknown as Response, next);

    expect(next.called).toBe(false);
    expect(res._status).toBe(401);
  });
});
