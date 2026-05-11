// ============================================================
// Unit-тесты для TWA auth — Telegram Web App initData verification
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import crypto from 'crypto';
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
  mockCreateLogEntry.mockImplementation(() => ({
    timestamp: new Date().toISOString(), actor: 'test', action: 'test',
    entity_type: 'test', entity_id: 'test', diff: {},
  }));
  return {
    reset: () => {
      state = createEmptyState();
      mockReadState.mockImplementation(() => state);
      mockWriteState.mockImplementation((s: MyrmexState) => { state = s; });
    },
    getState: () => state,
  };
}

const mockHelper = setupMockState();

function createMockRequest(body: Record<string, unknown> = {}, cookies: Record<string, string> = {}): Request {
  return { body, cookies, headers: {}, ip: '127.0.0.1', url: '/api/auth/twa', method: 'POST' } as unknown as Request;
}

function createMockResponse(): Response & { _json: unknown; _status: number } {
  const res: any = {
    _json: null, _status: 200,
    status(code: number) { res._status = code; return res; },
    json(data: unknown) { res._json = data; return res; },
    cookie() { return res; },
    clearCookie() { return res; },
  };
  return res;
}

/**
 * Generate valid Telegram Web App initData for testing.
 * Follows the spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 */
function generateValidInitData(botToken: string, userData: object): string {
  const authDate = Math.floor(Date.now() / 1000);
  const userStr = JSON.stringify(userData);

  const params = new URLSearchParams();
  params.set('user', userStr);
  params.set('auth_date', String(authDate));
  params.set('query_id', 'test_query_123');

  // Build data_check_string
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Compute secret key
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

  // Compute hash
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  params.set('hash', hash);
  return params.toString();
}

// --- Тесты ---

describe('twaAuth()', () => {
  const BOT_TOKEN = '123456:ABC-DEF-test-token';

  beforeEach(() => {
    mockHelper.reset();
    delete process.env.DEMO_MODE;
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
  });

  it('отклоняет запрос без init_data', async () => {
    const req = createMockRequest({});
    const res = createMockResponse();
    await auth.twaAuth(req, res as unknown as Response);
    expect(res._status).toBe(400);
    expect((res._json as any).error).toBe('Missing init_data');
  });

  it('отклоняет невалидный initData', async () => {
    const req = createMockRequest({ init_data: 'invalid-data' });
    const res = createMockResponse();
    await auth.twaAuth(req, res as unknown as Response);
    expect(res._status).toBe(401);
    expect((res._json as any).error).toBe('Invalid Telegram initData');
  });

  it('отклоняет initData без hash', async () => {
    const req = createMockRequest({ init_data: 'user=%7B%22id%22%3A1%7D&auth_date=1234567890' });
    const res = createMockResponse();
    await auth.twaAuth(req, res as unknown as Response);
    expect(res._status).toBe(401);
  });

  it('отклоняет initData с невалидным hash', async () => {
    const req = createMockRequest({
      init_data: 'user=%7B%22id%22%3A1%7D&auth_date=1234567890&hash=invalidhash',
    });
    const res = createMockResponse();
    await auth.twaAuth(req, res as unknown as Response);
    expect(res._status).toBe(401);
  });

  it('отклоняет устаревший initData (> 24h)', async () => {
    const oldAuthDate = Math.floor(Date.now() / 1000) - 100_000; // ~27 hours ago
    const userData = { id: 12345, first_name: 'Test', username: 'testuser' };

    // Build manually with old auth_date
    const params = new URLSearchParams();
    params.set('user', JSON.stringify(userData));
    params.set('auth_date', String(oldAuthDate));

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    params.set('hash', hash);

    const req = createMockRequest({ init_data: params.toString() });
    const res = createMockResponse();
    await auth.twaAuth(req, res as unknown as Response);
    expect(res._status).toBe(401);
  });

  it('создаёт нового пользователя при валидном initData', async () => {
    const userData = { id: 12345, first_name: 'Test', username: 'testuser' };
    const initData = generateValidInitData(BOT_TOKEN, userData);

    const req = createMockRequest({ init_data: initData });
    const res = createMockResponse();
    await auth.twaAuth(req, res as unknown as Response);

    expect(res._status).toBe(200);
    const json = res._json as any;
    expect(json.success).toBe(true);
    expect(json.access_token).toBeDefined();
    expect(json.user.username).toBe('testuser');
    expect(json.user.role).toBe('viewer');
  });

  it('находит существующего пользователя при повторном входе', async () => {
    const userData = { id: 12345, first_name: 'Test', username: 'testuser' };
    const initData = generateValidInitData(BOT_TOKEN, userData);

    // First login
    const req1 = createMockRequest({ init_data: initData });
    const res1 = createMockResponse();
    await auth.twaAuth(req1, res1 as unknown as Response);
    expect(res1._status).toBe(200);

    // Second login (same user)
    const initData2 = generateValidInitData(BOT_TOKEN, userData);
    const req2 = createMockRequest({ init_data: initData2 });
    const res2 = createMockResponse();
    await auth.twaAuth(req2, res2 as unknown as Response);

    expect(res2._status).toBe(200);
    const json = res2._json as any;
    expect(json.success).toBe(true);
    expect(json.user.id).toBe('tg-12345');
  });

  it('использует tg_{id} если username отсутствует', async () => {
    const userData = { id: 99999, first_name: 'NoUsername' };
    const initData = generateValidInitData(BOT_TOKEN, userData);

    const req = createMockRequest({ init_data: initData });
    const res = createMockResponse();
    await auth.twaAuth(req, res as unknown as Response);

    expect(res._status).toBe(200);
    const json = res._json as any;
    expect(json.user.username).toBe('tg_99999');
    expect(json.user.id).toBe('tg-99999');
  });

  it('отклоняет если TELEGRAM_BOT_TOKEN не задан', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;

    const userData = { id: 12345, first_name: 'Test' };
    const initData = generateValidInitData(BOT_TOKEN, userData);

    const req = createMockRequest({ init_data: initData });
    const res = createMockResponse();
    await auth.twaAuth(req, res as unknown as Response);

    expect(res._status).toBe(401);
  });

  it('отклоняет initData от другого бота', async () => {
    // Generate with different token
    const userData = { id: 12345, first_name: 'Test' };
    const initData = generateValidInitData('different-bot-token', userData);

    const req = createMockRequest({ init_data: initData });
    const res = createMockResponse();
    await auth.twaAuth(req, res as unknown as Response);

    expect(res._status).toBe(401);
  });

  it('TWA пользователь получает роль viewer', async () => {
    const userData = { id: 12345, first_name: 'Test', username: 'testuser' };
    const initData = generateValidInitData(BOT_TOKEN, userData);

    const req = createMockRequest({ init_data: initData });
    const res = createMockResponse();
    await auth.twaAuth(req, res as unknown as Response);

    const json = res._json as any;
    expect(json.user.role).toBe('viewer');
  });

  it('возвращает access_token и user в ответе', async () => {
    const userData = { id: 12345, first_name: 'Test', username: 'testuser' };
    const initData = generateValidInitData(BOT_TOKEN, userData);

    const req = createMockRequest({ init_data: initData });
    const res = createMockResponse();
    await auth.twaAuth(req, res as unknown as Response);

    const json = res._json as any;
    expect(json.access_token).toBeDefined();
    expect(typeof json.access_token).toBe('string');
    expect(json.access_token.length).toBeGreaterThan(10);
    expect(json.user).toBeDefined();
    expect(json.user.id).toBeDefined();
    expect(json.user.username).toBeDefined();
    expect(json.user.role).toBeDefined();
  });
});
