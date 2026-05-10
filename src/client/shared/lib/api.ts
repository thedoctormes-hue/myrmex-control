// ============================================================
// API клиент — fetch обёртки для всех эндпоинтов
// ============================================================

import type { MyrmexState, Task, Project, Skill, MyrmexFile, Server } from '@shared/types';

const BASE = '/api';

// Token storage
let accessToken: string | null = localStorage.getItem('access_token');
let refreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export function getToken(): string | null {
  return accessToken;
}

export function setToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem('access_token', token);
  else localStorage.removeItem('access_token');
}

// Try to refresh token
async function tryRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.access_token) {
        setToken(data.access_token);
        return data.access_token;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

// Колбэк для обработки 401 когда refresh тоже не сработал
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(cb: () => void) {
  onUnauthorized = cb;
}

async function request<T>(url: string, options?: RequestInit, retry = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string> || {}) },
  });

  if (res.status === 401 && retry) {
    // Try refresh once
    const newToken = await tryRefresh();
    if (newToken) {
      return request<T>(url, options, false);
    }
    // Refresh failed — clear and notify
    setToken(null);
    onUnauthorized?.();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// --- State ---

export const getState = () => request<MyrmexState>('/state');

// --- Tasks ---

export const getTasks = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<Task[]>(`/tasks${qs}`);
};

export const getTask = (id: string) => request<Task>(`/tasks/${id}`);

export const createTask = (data: Partial<Task>) =>
  request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) });

export const updateTask = (id: string, data: Partial<Task>) =>
  request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteTask = (id: string) =>
  request<{ success: boolean; id: string }>(`/tasks/${id}`, { method: 'DELETE', body: JSON.stringify({}) });

export const moveTask = (id: string, status: string) =>
  request<Task>(`/tasks/${id}/move`, { method: 'POST', body: JSON.stringify({ status }) });

// --- Projects ---

export const getProjects = () => request<Project[]>('/projects');

export const getProject = (id: string) => request<Project>(`/projects/${id}`);

export const createProject = (data: Partial<Project>) =>
  request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) });

export const updateProject = (id: string, data: Partial<Project>) =>
  request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteProject = (id: string) =>
  request<{ success: boolean; id: string }>(`/projects/${id}`, { method: 'DELETE', body: JSON.stringify({}) });

// --- Library ---

export const getLibrary = (type?: string) => {
  const qs = type ? `?type=${type}` : '';
  return request<Skill[]>(`/library${qs}`);
};

export const getSkill = (id: string) => request<Skill>(`/library/${id}`);

export const createSkill = (data: Partial<Skill>) =>
  request<Skill>('/library', { method: 'POST', body: JSON.stringify(data) });

export const updateSkill = (id: string, data: Partial<Skill>) =>
  request<Skill>(`/library/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteSkill = (id: string) =>
  request<{ success: boolean; id: string }>(`/library/${id}`, { method: 'DELETE', body: JSON.stringify({}) });

// --- Files ---

export const getFiles = (dir: 'inbox' | 'outbox' = 'inbox') =>
  request<MyrmexFile[]>(`/files?dir=${dir}`);

// --- Servers ---

export const getServers = () => request<Server[]>('/servers');

export const getServer = (id: string) => request<Server>(`/servers/${id}`);

export const createServer = (data: Partial<Server>) =>
  request<Server>('/servers', { method: 'POST', body: JSON.stringify(data) });

export const updateServer = (id: string, data: Partial<Server>) =>
  request<Server>(`/servers/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteServer = (id: string) =>
  request<{ success: boolean; id: string }>(`/servers/${id}`, { method: 'DELETE', body: JSON.stringify({}) });

export const checkServer = (id: string, status: string) =>
  request<Server>(`/servers/${id}/check`, { method: 'POST', body: JSON.stringify({ status }) });

// --- Auth (JWT) ---

export interface AuthResponse {
  success: boolean;
  access_token: string;
  user: { id: string; username: string; role: string };
  totp_required?: boolean;
}

export const login = (username: string, password: string, totp_code?: string) =>
  request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, totp_code }),
  });

export const refreshToken = () =>
  request<{ success: boolean; access_token: string }>('/auth/refresh', { method: 'POST' });

export const logout = () =>
  request<{ success: boolean }>('/auth/logout', { method: 'POST' });

export const authStatus = () =>
  request<{ authenticated: boolean; needsAuth: boolean; needsSetup: boolean; demo?: boolean; user: { id: string; username: string; role: string } | null }>('/auth/status');

export const setup = (username: string, password: string) =>
  request<AuthResponse>('/auth/setup', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

// --- TOTP ---

export const totpSetup = () =>
  request<{ secret: string; uri: string }>('/auth/totp/setup', { method: 'POST' });

export const totpVerify = (code: string) =>
  request<{ success: boolean; message: string }>('/auth/totp/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });

export const totpDisable = () =>
  request<{ success: boolean }>('/auth/totp/disable', { method: 'POST' });

// --- Health Score ---

export interface HealthScore {
  overall: number;
  servers: { online: number; total: number; score: number };
  tasks: { total: number; done: number; inProgress: number; score: number };
  agents: { active: number; total: number; score: number };
  timestamp: string;
}

export const getHealthScore = () => request<HealthScore>('/health');

// --- Audit Log ---

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  source: string;
  action: string;
  entity_type: string;
  entity_id: string;
  diff: Record<string, unknown>;
}

export interface AuditLogResult {
  entries: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export const getAuditLog = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<AuditLogResult>(`/audit${qs}`);
};

export const getAuditEntityTypes = () => request<string[]>('/audit/entity-types');
export const getAuditSources = () => request<string[]>('/audit/sources');

// --- Version check ---

export interface VersionResponse {
  version: string;
}

export const getVersion = () => request<VersionResponse>('/version');

// --- Analytics ---

export interface AnalyticsResult {
  tasks: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byProject: { name: string; count: number }[];
    completedLast7Days: number;
    createdLast7Days: number;
    avgCompletionHours: number | null;
  };
  projects: { total: number; active: number; paused: number; archived: number };
  agents: { byStatus: Record<string, number>; byProject: { name: string; count: number }[] };
  servers: { byStatus: Record<string, number>; total: number };
  activity: { last24h: number; last7d: number; last30d: number };
  timestamp: string;
}

export const getAnalytics = () => request<AnalyticsResult>('/analytics');
