// ============================================================
// Unit-тесты для myrmex.ts — ядро хранения
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'fs';

// Мокируем зависимости ДО импорта модуля
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  renameSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('proper-lockfile', () => ({
  default: {
    lock: vi.fn().mockResolvedValue(vi.fn().mockResolvedValue(undefined)),
  },
}));

// Импортируем после моков
import { readState, writeState, createLogEntry } from '../../src/server/myrmex.js';
import type { MyrmexState, ChangelogEntry } from '../../src/shared/types.js';

// --- Хелперы ---

function createMockState(overrides: Partial<MyrmexState> = {}): MyrmexState {
  const now = new Date().toISOString();
  return {
    _meta: {
      version: '0.1.0',
      last_updated: now,
      last_updated_by: 'test',
      change_count: 0,
    },
    workspace: {
      name: 'Test Workspace',
      description: 'Test',
      owner: 'tester',
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
    ...overrides,
  };
}

// --- Тесты ---

describe('readState()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('возвращает default state если файл не существует', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const state = readState();

    expect(state).toBeDefined();
    expect(state._meta.version).toBe('0.1.0');
    expect(state.tasks).toEqual([]);
    expect(state.projects).toEqual([]);
    expect(state.changelog).toEqual([]);
  });

  it('читает и парсит существующий файл', () => {
    const mockState = createMockState();
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockState));

    const state = readState();

    expect(state._meta.version).toBe('0.1.0');
    expect(state.workspace.name).toBe('Test Workspace');
    expect(readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('myrmex.json'),
      'utf-8'
    );
  });

  it('выбрасывает ошибку при невалидном JSON', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue('{ invalid json }');

    expect(() => readState()).toThrow();
  });
});

describe('writeState()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('обновляет мета-данные перед записью', async () => {
    const state = createMockState();
    const entry: ChangelogEntry = {
      id: 'entry-1',
      timestamp: new Date().toISOString(),
      source: 'test',
      action: 'create',
      entity_type: 'task',
      entity_id: 'task-1',
      diff: {},
    };

    vi.mocked(existsSync).mockReturnValue(true);

    await writeState(state, 'test-source', entry);

    expect(state._meta.last_updated_by).toBe('test-source');
    expect(state._meta.change_count).toBe(1);
    expect(state._meta.last_updated).toBeDefined();
  });

  it('добавляет changelog entry в начало массива', async () => {
    const state = createMockState({
      changelog: [
        {
          id: 'old-entry',
          timestamp: '2025-01-01T00:00:00.000Z',
          source: 'system',
          action: 'create',
          entity_type: 'project',
          entity_id: 'proj-1',
          diff: {},
        },
      ],
    });

    const newEntry: ChangelogEntry = {
      id: 'new-entry',
      timestamp: new Date().toISOString(),
      source: 'test',
      action: 'create',
      entity_type: 'task',
      entity_id: 'task-1',
      diff: {},
    };

    await writeState(state, 'test', newEntry);

    expect(state.changelog[0].id).toBe('new-entry');
    expect(state.changelog).toHaveLength(2);
  });

  it('обрезает changelog до MAX_CHANGELOG (1000)', async () => {
    const manyEntries = Array.from({ length: 1000 }, (_, i) => ({
      id: `entry-${i}`,
      timestamp: new Date().toISOString(),
      source: 'test',
      action: 'create',
      entity_type: 'task',
      entity_id: `task-${i}`,
      diff: {},
    }));

    const state = createMockState({ changelog: manyEntries });

    const newEntry: ChangelogEntry = {
      id: 'overflow-entry',
      timestamp: new Date().toISOString(),
      source: 'test',
      action: 'create',
      entity_type: 'task',
      entity_id: 'overflow',
      diff: {},
    };

    await writeState(state, 'test', newEntry);

    expect(state.changelog).toHaveLength(1000);
    expect(state.changelog[0].id).toBe('overflow-entry');
  });

  it('выполняет атомарную запись через tmp файл', async () => {
    const state = createMockState();
    const entry: ChangelogEntry = {
      id: 'entry-1',
      timestamp: new Date().toISOString(),
      source: 'test',
      action: 'create',
      entity_type: 'task',
      entity_id: 'task-1',
      diff: {},
    };

    await writeState(state, 'test', entry);

    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.tmp'),
      expect.any(String),
      'utf-8'
    );
    expect(renameSync).toHaveBeenCalledWith(
      expect.stringContaining('.tmp'),
      expect.stringContaining('myrmex.json')
    );
  });
});

describe('createLogEntry()', () => {
  it('создаёт запись с корректной структурой', () => {
    const entry = createLogEntry('api', 'create', 'task', 'task-123', { title: 'Test' });

    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('timestamp');
    expect(entry.source).toBe('api');
    expect(entry.action).toBe('create');
    expect(entry.entity_type).toBe('task');
    expect(entry.entity_id).toBe('task-123');
    expect(entry.diff).toEqual({ title: 'Test' });
  });

  it('генерирует уникальные ID для разных записей', () => {
    const entry1 = createLogEntry('api', 'create', 'task', 't1');
    const entry2 = createLogEntry('api', 'create', 'task', 't2');

    expect(entry1.id).not.toBe(entry2.id);
  });

  it('использует пустой diff по умолчанию', () => {
    const entry = createLogEntry('api', 'delete', 'task', 't1');

    expect(entry.diff).toEqual({});
  });

  it('timestamp — валидная ISO строка', () => {
    const entry = createLogEntry('api', 'create', 'task', 't1');
    const parsed = new Date(entry.timestamp);

    expect(parsed.toISOString()).toBe(entry.timestamp);
  });
});

describe('createDefaultState() (через readState при отсутствии файла)', () => {
  it('содержит все обязательные поля', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const state = readState();

    // Meta
    expect(state._meta).toBeDefined();
    expect(state._meta.version).toBe('0.1.0');
    expect(state._meta.last_updated).toBeDefined();
    expect(state._meta.last_updated_by).toBe('system');
    expect(state._meta.change_count).toBe(0);

    // Workspace
    expect(state.workspace).toBeDefined();
    expect(state.workspace.name).toBe('Myrmex Control');
    expect(state.workspace.owner).toBe('admin');

    // Массивы инициализированы пустыми
    expect(state.projects).toEqual([]);
    expect(state.agents).toEqual([]);
    expect(state.tasks).toEqual([]);
    expect(state.library).toEqual([]);
    expect(state.files).toEqual([]);
    expect(state.servers).toEqual([]);
    expect(state.mcp_servers).toEqual([]);
    expect(state.changelog).toEqual([]);

    // Settings
    expect(state.settings).toBeDefined();
    expect(state.settings.theme).toBe('dark');
    expect(state.settings.language).toBe('ru');
    expect(state.settings.refresh_interval_sec).toBe(30);
    expect(state.settings.notifications_enabled).toBe(true);
    expect(state.settings.custom).toEqual({});
  });

  it('создаёт директории inbox и outbox', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    readState();

    expect(mkdirSync).toHaveBeenCalledWith('inbox', { recursive: true });
    expect(mkdirSync).toHaveBeenCalledWith('outbox', { recursive: true });
  });
});
