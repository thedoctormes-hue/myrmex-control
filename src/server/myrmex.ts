// ============================================================
// Myrmex Nerve — ядро хранения
// Атомарная запись + file lock + changelog + merge
// ============================================================

import { readFile, writeFile, rename, stat, mkdir } from 'fs/promises';
import { join } from 'path';
import lockfile from 'proper-lockfile';
import type { MyrmexState, ChangelogEntry } from '@shared/types.js';

const MYRMEX_PATH = join(process.cwd(), 'myrmex.json');
const TMP_PATH = join(process.cwd(), 'myrmex.json.tmp');
const MAX_CHANGELOG = 1000;

// --- BL-022: In-memory cache ---
let cachedState: MyrmexState | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 1000; // 1 секунда

function invalidateCache(): void {
  cachedState = null;
  cacheTime = 0;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

// --- Merge strategies for persistent fields ---
const MERGE_FIELDS = ['users', 'refresh_tokens'];

function deepMerge(target: MyrmexState, source: Partial<MyrmexState>): MyrmexState {
  const result: MyrmexState = { ...target };

  for (const key of Object.keys(source) as (keyof MyrmexState)[]) {
    if (key === '_meta') continue;
    if (key === 'changelog') continue;
    if (MERGE_FIELDS.includes(key as string) && typeof source[key] === 'object' && source[key] !== null) {
      (result[key] as unknown) = {
        ...(target[key] as object),
        ...(source[key] as object),
      };
    } else if (Array.isArray(source[key])) {
      (result[key] as unknown) = source[key];
    } else {
      (result[key] as unknown) = source[key];
    }
  }
  return result;
}

// --- Read (async + cache) ---

export async function readState(): Promise<MyrmexState> {
  const now = Date.now();
  if (cachedState && now - cacheTime < CACHE_TTL_MS) {
    return cachedState;
  }

  if (!(await fileExists(MYRMEX_PATH))) {
    return createDefaultState();
  }
  const raw = await readFile(MYRMEX_PATH, 'utf-8');
  cachedState = JSON.parse(raw) as MyrmexState;
  cacheTime = now;
  return cachedState;
}

// --- Write (атомарная + lock + merge + async I/O) ---

export async function writeState(
  state: Partial<MyrmexState>,
  source: string,
  logEntry: ChangelogEntry
): Promise<void> {
  // 1. Прочитать текущее состояние для мерджа (async)
  let current: MyrmexState;
  try {
    current = await readState();
  } catch {
    current = createDefaultState();
  }

  // 2. Мердж с новым состоянием (сохраняем MERGE_FIELDS)
  const merged = deepMerge(current, state);

  // 3. Обновить мету
  merged._meta.last_updated = new Date().toISOString();
  merged._meta.last_updated_by = source;
  merged._meta.change_count += 1;

  // 4. Добавить в changelog
  merged.changelog.unshift(logEntry);
  if (merged.changelog.length > MAX_CHANGELOG) {
    merged.changelog.length = MAX_CHANGELOG;
  }

  // 5. Атомарная запись через lock (async I/O)
  const release = await lockfile.lock(MYRMEX_PATH, {
    retries: 3,
    stale: 5000,
  });

  try {
    await writeFile(TMP_PATH, JSON.stringify(merged, null, 2), 'utf-8');
    await rename(TMP_PATH, MYRMEX_PATH);
  } finally {
    await release();
  }

  // 6. Инвалидировать кэш
  invalidateCache();
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
    refresh_tokens: {},
  };

  // Создать директории для файлообменника (async fire-and-forget)
  for (const dir of ['inbox', 'outbox']) {
    mkdir(dir, { recursive: true }).catch(() => {});
  }

  return state;
}
