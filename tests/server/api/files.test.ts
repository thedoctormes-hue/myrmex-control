// ============================================================
// API-тесты для files.ts — список файлов
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// Мокируем fs (readdirSync, statSync, existsSync) ДО импорта роутера
const mockReaddirSync = vi.fn();
const mockStatSync = vi.fn();
const mockExistsSync = vi.fn();

vi.mock('fs', () => ({
  readdirSync: (...args: unknown[]) => mockReaddirSync(...args),
  statSync: (...args: unknown[]) => mockStatSync(...args),
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
}));

// proper-lockfile не нужен для files.ts, но мокаем safety
vi.mock('proper-lockfile', () => ({
  default: { lock: vi.fn().mockResolvedValue(vi.fn()) },
}));

import { router } from '../../../src/server/api/files.js';

// --- Хелперы ---

function createMockRequest(params: Record<string, string> = {}, query: Record<string, string> = {}): Request {
  return { params, query } as unknown as Request;
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

describe('GET /api/files', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('возвращает пустой список если директория не существует', () => {
    mockExistsSync.mockReturnValue(false);

    const req = createMockRequest({}, {});
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(200);
    expect(res._json).toEqual([]);
  });

  it('возвращает список файлов из inbox', () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['report.txt', 'data.json', '.hidden']);
    mockStatSync.mockReturnValue({
      size: 1024,
      birthtime: new Date('2025-06-01T10:00:00.000Z'),
    });

    const req = createMockRequest({}, {});
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(200);
    const result = res._json as any[];
    expect(result).toHaveLength(2); // .hidden отфильтрован
    expect(result[0].name).toBe('report.txt');
    expect(result[0].size).toBe(1024);
    expect(result[0].path).toBe('inbox/report.txt');
  });

  it('возвращает список файлов из outbox при dir=outbox', () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['result.pdf']);
    mockStatSync.mockReturnValue({
      size: 2048,
      birthtime: new Date('2025-06-02T12:00:00.000Z'),
    });

    const req = createMockRequest({}, { dir: 'outbox' });
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    const result = res._json as any[];
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('outbox/result.pdf');
    expect(result[0].id).toBe('outbox/result.pdf');
  });

  it('определяет mime_type по расширению', () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['image.png', 'doc.pdf', 'readme.txt', 'unknown.bin']);
    mockStatSync.mockReturnValue({
      size: 100,
      birthtime: new Date(),
    });

    const req = createMockRequest({}, {});
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    const result = res._json as any[];
    const png = result.find(f => f.name === 'image.png');
    const pdf = result.find(f => f.name === 'doc.pdf');
    const txt = result.find(f => f.name === 'readme.txt');
    const bin = result.find(f => f.name === 'unknown.bin');

    expect(png.mime_type).toBe('image/png');
    expect(pdf.mime_type).toBe('application/pdf');
    expect(txt.mime_type).toBe('text/plain');
    expect(bin.mime_type).toBe('application/octet-stream');
  });

  it('фильтрует dotfiles', () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['.gitignore', '.env', 'normal.txt']);
    mockStatSync.mockReturnValue({
      size: 10,
      birthtime: new Date(),
    });

    const req = createMockRequest({}, {});
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    const result = res._json as any[];
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('normal.txt');
  });

  it('устанавливает uploaded_by в system', () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['test.txt']);
    mockStatSync.mockReturnValue({
      size: 50,
      birthtime: new Date('2025-01-01T00:00:00.000Z'),
    });

    const req = createMockRequest({}, {});
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    const result = res._json as any[];
    expect(result[0].uploaded_by).toBe('system');
  });

  it('использует inbox по умолчанию если dir не указан', () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([]);
    mockStatSync.mockReturnValue({ size: 0, birthtime: new Date() });

    const req = createMockRequest({}, {});
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    // existsSync должен быть вызван с inbox путём
    expect(mockExistsSync).toHaveBeenCalledWith(
      expect.stringContaining('inbox')
    );
  });

  it('возвращает 500 при ошибке', () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockImplementation(() => { throw new Error('FS error'); });

    const req = createMockRequest({}, {});
    const res = createMockResponse();

    const route = findRouteHandler('GET', '/');
    route!.stack[0].handle(req, res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: 'Failed to list files' });
  });
});
