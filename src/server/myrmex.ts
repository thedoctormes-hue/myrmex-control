// ============================================================
// Myrmex Nerve — ядро хранения
// Атомарная запись + file lock + changelog
// ============================================================

import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import lockfile from 'proper-lockfile';
import type { MyrmexState, ChangelogEntry } from '@shared/types.js';

const MYRMEX_PATH = join(process.cwd(), 'myrmex.json');
const TMP_PATH = join(process.cwd(), 'myrmex.json.tmp');
const MAX_CHANGELOG = 1000;

// --- Read ---

export function readState(): MyrmexState {
  if (!existsSync(MYRMEX_PATH)) {
    return createDefaultState();
  }
  const raw = readFileSync(MYRMEX_PATH, 'utf-8');
  return JSON.parse(raw) as MyrmexState;
}

// --- Write (атомарная + lock) ---

export async function writeState(
  state: MyrmexState,
  source: string,
  logEntry: ChangelogEntry
): Promise<void> {
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
  const release = await lockfile.lock(MYRMEX_PATH, {
    retries: 3,
    stale: 5000,
  });

  try {
    writeFileSync(TMP_PATH, JSON.stringify(state, null, 2), 'utf-8');
    renameSync(TMP_PATH, MYRMEX_PATH);
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

  // Создать директории для файлообменника
  for (const dir of ['inbox', 'outbox']) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  return state;
}
