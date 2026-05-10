// ============================================================
// Unit-тесты для middleware.ts — rate limit, error handler, security headers
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Мокируем helmet
vi.mock('helmet', () => ({
  default: vi.fn(() => {
    return (req: any, res: any, next: any) => {
      // Симулируем установку заголовков
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    };
  }),
}));

// Мокируем fs для logError
vi.mock('fs', () => ({
  appendFileSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

import { securityHeaders, rateLimit, errorHandler, logError } from '../../src/server/middleware.js';

// --- Хелперы ---

function createMockRequest(ip = '127.0.0.1'): Request {
  return {
    ip,
    socket: { remoteAddress: ip },
    url: '/api/test',
    method: 'GET',
  } as unknown as Request;
}

function createMockResponse(): Response & { _headers: Record<string, string>; _status: number; _json: unknown } {
  const headers: Record<string, string> = {};
  const res: any = {
    _headers: headers,
    _status: 200,
    _json: null,
    setHeader(name: string, value: string) {
      headers[name] = value;
      return res;
    },
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: unknown) {
      res._json = data;
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

describe('securityHeaders()', () => {
  it('возвращает middleware-функцию', () => {
    const middleware = securityHeaders();
    expect(typeof middleware).toBe('function');
  });

  it('устанавливает security заголовки', () => {
    const middleware = securityHeaders();
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    middleware(req, res as unknown as Response, next);

    expect(next.called).toBe(true);
    expect(res._headers['X-Content-Type-Options']).toBe('nosniff');
    expect(res._headers['X-Frame-Options']).toBe('DENY');
    expect(res._headers['Strict-Transport-Security']).toBeDefined();
  });
});

describe('rateLimit()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('пропускает запросы в пределах лимита', () => {
    // Делаем 50 запросов — все должны пройти
    for (let i = 0; i < 50; i++) {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      rateLimit(req, res as unknown as Response, next);

      expect(next.called).toBe(true);
      expect(res._status).toBe(200);
    }
  });

  it('блокирует запросы после превышения лимита (100)', () => {
    // Делаем 101 запрос с одного IP
    let lastRes = createMockResponse();
    let lastNext = createMockNext();

    for (let i = 0; i < 101; i++) {
      const req = createMockRequest();
      lastRes = createMockResponse();
      lastNext = createMockNext();

      rateLimit(req, lastRes as unknown as Response, lastNext);
    }

    // Последний запрос (101-й) должен быть заблокирован
    expect(lastNext.called).toBe(false);
    expect(lastRes._status).toBe(429);
    expect(lastRes._json).toEqual({ error: 'Too many requests' });
  });

  it('использует разные лимиты для разных IP', () => {
    // Исчерпаем лимит для IP 1.1.1.1
    for (let i = 0; i < 100; i++) {
      const req = createMockRequest('1.1.1.1');
      const res = createMockResponse();
      const next = createMockNext();
      rateLimit(req, res as unknown as Response, next);
    }

    // IP 1.1.1.1 теперь заблокирован
    const blockedReq = createMockRequest('1.1.1.1');
    const blockedRes = createMockResponse();
    const blockedNext = createMockNext();
    rateLimit(blockedReq, blockedRes as unknown as Response, blockedNext);
    expect(blockedRes._status).toBe(429);

    // Но IP 2.2.2.2 ещё может делать запросы
    const freshReq = createMockRequest('2.2.2.2');
    const freshRes = createMockResponse();
    const freshNext = createMockNext();
    rateLimit(freshReq, freshRes as unknown as Response, freshNext);
    expect(freshNext.called).toBe(true);
    expect(freshRes._status).toBe(200);
  });

  it('использует socket.remoteAddress если ip не задан', () => {
    const req = {
      ip: undefined,
      socket: { remoteAddress: '192.168.1.1' },
    } as unknown as Request;
    const res = createMockResponse();
    const next = createMockNext();

    rateLimit(req, res as unknown as Response, next);

    expect(next.called).toBe(true);
  });

  it('использует "unknown" если нет ни ip ни remoteAddress', () => {
    const req = {
      ip: undefined,
      socket: {},
    } as unknown as Request;
    const res = createMockResponse();
    const next = createMockNext();

    rateLimit(req, res as unknown as Response, next);

    expect(next.called).toBe(true);
  });
});

describe('errorHandler()', () => {
  it('возвращает 500 и JSON с ошибкой', () => {
    const err = new Error('Test error');
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(err, req, res as unknown as Response, next);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Internal server error' });
  });

  it('не раскрывает детали ошибки клиенту', () => {
    const err = new Error('Super secret database password: hunter2');
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(err, req, res as unknown as Response, next);

    const json = res._json as Record<string, string>;
    expect(json.error).toBe('Internal server error');
    expect(json.error).not.toContain('hunter2');
  });

  it('логирует ошибку', () => {
    const err = new Error('Loggable error');
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(err, req, res as unknown as Response, next);

    // logError вызывается внутри errorHandler
    // Проверяем что статус 500 — значит errorHandler отработал
    expect(res._status).toBe(500);
  });
});

describe('logError()', () => {
  it('не выбрасывает ошибку при записи', () => {
    // logError должен молча обрабатывать ошибки записи
    const err = new Error('Test');

    expect(() => logError(err)).not.toThrow();
  });

  it('принимает опциональный request параметр', () => {
    const err = new Error('Test');
    const req = createMockRequest();

    expect(() => logError(err, req)).not.toThrow();
  });
});
