// ============================================================
// Myrmex Nerve — ядро хранения
// Атомарная запись + file lock + changelog
// ============================================================

import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AsyncLocalStorage } from 'async_hooks';
import lockfile from 'proper-lockfile';
import type { MyrmexState, ChangelogEntry } from '@shared/types.js';

const IS_DEMO_ENV = process.env.DEMO_MODE === 'true';
const PATH_PROD = join(process.cwd(), 'myrmex.json');
const PATH_DEMO = join(process.cwd(), 'myrmex-demo.json');
const MAX_CHANGELOG = 1000;

// AsyncLocalStorage for per-request demo context
const demoStorage = new AsyncLocalStorage<boolean>();

// Run function in demo context
export function runAsDemo<T>(fn: () => T): T {
  return demoStorage.run(true, fn);
}

// --- Path resolution ---

function getDataPath(): string {
  if (IS_DEMO_ENV) return PATH_DEMO;
  const isDemo = demoStorage.getStore();
  return isDemo ? PATH_DEMO : PATH_PROD;
}

// --- Read ---

export function readState(): MyrmexState {
  const path = getDataPath();
  if (!existsSync(path)) {
    return createDefaultState();
  }
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw) as MyrmexState;
}

// --- Write (атомарная + lock) ---

export async function writeState(
  state: MyrmexState,
  source: string,
  logEntry: ChangelogEntry
): Promise<void> {
  const path = getDataPath();
  const tmpPath = path + '.tmp';

  // 1. Обновить мету
  state._meta.last_updated = new Date().toISOString();
  state._meta.last_updated_by = source;
  state._meta.change_count += 1;

  // 2. Добавить в changelog
  state.changelog.unshift(logEntry);
  if (state.changelog.length > MAX_CHANGELOG) {
    state.changelog.length = MAX_CHANGELOG;
  }

  // 3. Атомарная запись через lock
  const release = await lockfile.lock(path, {
    retries: 3,
    stale: 5000,
  });

  try {
    writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
    renameSync(tmpPath, path);
  } finally {
    await release();
  }
}

// --- Changelog helper ---

export function createLogEntry(
  source: string,
  action: string,
  entityType: string,
  entityId: string,
  diff: Record<string, unknown> = {}
): ChangelogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source,
    action,
    entity_type: entityType,
    entity_id: entityId,
    diff,
  };
}

// --- Check if current context is demo ---

export function isDemo(): boolean {
  return IS_DEMO_ENV || demoStorage.getStore() === true;
}

// --- Default state ---

function createDefaultState(): MyrmexState {
  const now = new Date().toISOString();
  const state: MyrmexState = {
    _meta: {
      version: '0.1.0',
      last_updated: now,
      last_updated_by: 'system',
      change_count: 0,
    },
    workspace: {
      name: 'Myrmex Control',
      description: 'Муравейник агентов',
      owner: 'admin',
      created_at: now,
    },
    projects: [],
    agents: [],
    tasks: [],
    library: [],
    files: [],
    servers: [],
    settings: {
      theme: 'dark',
      language: 'ru',
      refresh_interval_sec: 30,
      notifications_enabled: true,
      custom: {},
    },
    mcp_servers: [],
    changelog: [],
    users: [],
    refresh_tokens: [],
  };

  for (const dir of ['inbox', 'outbox']) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  return state;
}
