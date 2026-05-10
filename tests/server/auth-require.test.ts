// ============================================================
// Unit-тесты для requireAuth + requireRole middleware
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
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

let mockState = createEmptyState();

function resetMockState() {
  mockState = createEmptyState();
  mockReadState.mockImplementation(() => mockState);
  mockWriteState.mockImplementation((s: MyrmexState) => { mockState = s; });
  mockCreateLogEntry.mockImplementation(() => ({ timestamp: new Date().toISOString(), actor: 'test', action: 'test', entity_type: 'test', entity_id: 'test', diff: {} }));
}

function createMockRequest(body: Record<string, unknown> = {}, cookies: Record<string, string> = {}, headers: Record<string, string> = {}): Request {
  return { body, cookies, headers, ip: '127.0.0.1', url: '/api/test', method: 'GET' } as unknown as Request;
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

function createMockNext(): (() => void) & { called: boolean } {
  const fn: any = () => { fn.called = true; };
  fn.called = false;
  return fn;
}

describe('requireAuth() middleware', () => {
  beforeEach(() => {
    
    resetMockState();
    delete process.env.DEMO_MODE;
  });

  it('пропускает в demo-режиме', () => {
    process.env.DEMO_MODE = 'true';
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();
    auth.requireAuth(req, res as unknown as Response, next);
    expect(next.called).toBe(true);
  });

  it('блокирует без Authorization header', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();
    auth.requireAuth(req, res as unknown as Response, next);
    expect(next.called).toBe(false);
    expect(res._status).toBe(401);
    expect((res._json as any).error).toBe('Missing access token');
  });

  it('блокирует с невалидным токеном', () => {
    const req = createMockRequest({}, {}, { authorization: 'Bearer invalid' });
    const res = createMockResponse();
    const next = createMockNext();
    auth.requireAuth(req, res as unknown as Response, next);
    expect(next.called).toBe(false);
    expect(res._status).toBe(401);
  });

  it('пропускает с валидным JWT', async () => {
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

describe('requireRole() middleware', () => {
  beforeEach(() => {
    
    resetMockState();
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
