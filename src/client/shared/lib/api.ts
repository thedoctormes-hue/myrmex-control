// ============================================================
// API клиент — fetch обёртки для всех эндпоинтов
// ============================================================

import type { MyrmexState, Task, Project, Skill, MyrmexFile, Server } from '@shared/types';

const BASE = '/api';

// Колбэк для обработки 401 (вызывается из App.tsx)
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(cb: () => void) {
  onUnauthorized = cb;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 401) {
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

// --- Auth ---

export const login = (password: string) =>
  request<{ success: boolean }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });

export const logout = () =>
  request<{ success: boolean }>('/auth/logout', { method: 'POST' });

export const authStatus = () =>
  request<{ authenticated: boolean; needsAuth: boolean; needsSetup: boolean; demo?: boolean }>('/auth/status');

export const setup = (password: string) =>
  request<{ success: boolean }>('/auth/setup', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
