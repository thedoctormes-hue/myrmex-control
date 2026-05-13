// ============================================================
// BL-037: Skill Registry System
// Централизованный реестр скиллов с манифестами, зависимостями, аналитикой
// ============================================================

import { Router, Request, Response } from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

export const router = Router();

// --- Types ---

type SkillCategory = 'testing' | 'security' | 'deployment' | 'content' | 'infrastructure' | 'analytics' | 'communication' | 'automation';

interface SkillManifest {
  id: string;
  name: string;
  version: string;           // semver: MAJOR.MINOR.PATCH
  description: string;
  author: string;
  category: SkillCategory;
  triggers: string[];        // keywords for discovery
  dependencies: string[];    // skill IDs
  permissions: string[];     // required permissions
  status: 'inactive' | 'testing' | 'active' | 'deprecated';
  created: string;
  updated: string;
  usage_count: number;
  success_rate: number;      // 0-100
}

interface SkillRegistry {
  version: string;
  skills: SkillManifest[];
  dependency_graph: Record<string, string[]>; // skill_id -> dependency_ids
}

// --- Storage ---

const REGISTRY_PATH = join(process.cwd(), 'skill-registry.json');

function loadRegistry(): SkillRegistry {
  try {
    if (existsSync(REGISTRY_PATH)) {
      return JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
    }
  } catch {}
  return { version: '1.0.0', skills: [], dependency_graph: {} };
}

function saveRegistry(registry: SkillRegistry): void {
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

// --- Seed built-in skills ---

function ensureBuiltinSkills(): void {
  const registry = loadRegistry();
  if (registry.skills.length > 0) return;

  const builtins: SkillManifest[] = [
    { id: 'skill-testing', name: 'add-pytest', version: '1.0.0', description: 'Добавляет pytest тесты к Python коду', author: 'system', category: 'testing', triggers: ['тест', 'pytest', 'test', 'покрытие'], dependencies: [], permissions: ['files:write'], status: 'active', created: new Date().toISOString(), updated: new Date().toISOString(), usage_count: 0, success_rate: 0 },
    { id: 'skill-security', name: 'security-audit', version: '1.0.0', description: 'Полный аудит безопасности кода', author: 'system', category: 'security', triggers: ['безопасность', 'уязвимость', 'security', 'audit'], dependencies: [], permissions: ['files:read'], status: 'active', created: new Date().toISOString(), updated: new Date().toISOString(), usage_count: 0, success_rate: 0 },
    { id: 'skill-deploy', name: 'auto-deploy-check', version: '1.0.0', description: 'Проверка готовности к деплою', author: 'system', category: 'deployment', triggers: ['деплой', 'deploy', 'production', 'rollback'], dependencies: ['skill-ci-cd'], permissions: ['files:read', 'deploy:execute'], status: 'active', created: new Date().toISOString(), updated: new Date().toISOString(), usage_count: 0, success_rate: 0 },
    { id: 'skill-ci-cd', name: 'ci-cd-and-automation', version: '1.0.0', description: 'Настройка CI/CD pipeline', author: 'system', category: 'automation', triggers: ['ci', 'cd', 'pipeline', 'github actions', 'automation'], dependencies: [], permissions: ['files:write'], status: 'active', created: new Date().toISOString(), updated: new Date().toISOString(), usage_count: 0, success_rate: 0 },
    { id: 'skill-lint', name: 'add-linter', version: '1.0.0', description: 'Настройка линтера (ruff/eslint)', author: 'system', category: 'automation', triggers: ['линтер', 'ruff', 'eslint', 'style', 'lint'], dependencies: [], permissions: ['files:write'], status: 'active', created: new Date().toISOString(), updated: new Date().toISOString(), usage_count: 0, success_rate: 0 },
    { id: 'skill-docs', name: 'docs-writer', version: '1.0.0', description: 'Генерация документации для проектов', author: 'system', category: 'content', triggers: ['документация', 'readme', 'docs', 'api docs'], dependencies: [], permissions: ['files:write'], status: 'active', created: new Date().toISOString(), updated: new Date().toISOString(), usage_count: 0, success_rate: 0 },
    { id: 'skill-frontend', name: 'frontend-ui-engineering', version: '1.0.0', description: 'Создание production-quality UI', author: 'system', category: 'content', triggers: ['ui', 'react', 'frontend', 'компонент', 'интерфейс'], dependencies: [], permissions: ['files:write'], status: 'active', created: new Date().toISOString(), updated: new Date().toISOString(), usage_count: 0, success_rate: 0 },
    { id: 'skill-evo', name: 'evolve-activator', version: '1.0.0', description: 'Оркестратор эволюции лаборатории', author: 'system', category: 'automation', triggers: ['эволюция', 'evolve', 'self-improve', 'улучшение'], dependencies: ['skill-monitoring'], permissions: ['files:write', 'system:evolve'], status: 'active', created: new Date().toISOString(), updated: new Date().toISOString(), usage_count: 0, success_rate: 0 },
    { id: 'skill-monitoring', name: 'metrics-storyteller', version: '1.0.0', description: 'Сбор и анализ метрик', author: 'system', category: 'analytics', triggers: ['метрики', 'metrics', 'health', 'kpi', 'dashboard'], dependencies: [], permissions: ['analytics:read'], status: 'active', created: new Date().toISOString(), updated: new Date().toISOString(), usage_count: 0, success_rate: 0 },
    { id: 'skill-api', name: 'api-and-interface-design', version: '1.0.0', description: 'Проектирование API и интерфейсов', author: 'system', category: 'content', triggers: ['api', 'rest', 'graphql', 'endpoint', 'интерфейс'], dependencies: [], permissions: ['files:write'], status: 'active', created: new Date().toISOString(), updated: new Date().toISOString(), usage_count: 0, success_rate: 0 },
  ];

  registry.skills = builtins;
  registry.dependency_graph = {};
  for (const skill of builtins) {
    registry.dependency_graph[skill.id] = skill.dependencies;
  }
  saveRegistry(registry);
}

// Initialize on module load
ensureBuiltinSkills();

// --- Routes ---

/** GET /api/skills — list all skills */
router.get('/', (req: Request, res: Response) => {
  const registry = loadRegistry();
  const category = req.query.category as SkillCategory | undefined;
  const search = (req.query.search as string || '').toLowerCase();

  let skills = registry.skills;

  if (category) {
    skills = skills.filter(s => s.category === category);
  }

  if (search) {
    skills = skills.filter(s =>
      s.name.toLowerCase().includes(search) ||
      s.description.toLowerCase().includes(search) ||
      s.triggers.some(t => t.toLowerCase().includes(search))
    );
  }

  res.json({ total: skills.length, skills });
});

/** GET /api/skills/:id — get skill details */
router.get('/:id', (req: Request, res: Response) => {
  const registry = loadRegistry();
  const skill = registry.skills.find(s => s.id === req.params.id || s.name === req.params.id);

  if (!skill) {
    res.status(404).json({ error: 'Skill not found' });
    return;
  }

  res.json(skill);
});

/** POST /api/skills/discover — trigger-based discovery */
router.post('/discover', (req: Request, res: Response) => {
  const { query, limit } = req.body as { query: string; limit?: number };
  const registry = loadRegistry();
  const q = query.toLowerCase();

  // Score each skill
  const scored = registry.skills
    .filter(s => s.status === 'active')
    .map(s => {
      let score = 0;
      // Exact name match
      if (s.name.toLowerCase().includes(q)) score += 10;
      // Description match
      if (s.description.toLowerCase().includes(q)) score += 5;
      // Trigger match
      for (const t of s.triggers) {
        if (q.includes(t.toLowerCase())) score += 8;
        if (t.toLowerCase().includes(q)) score += 4;
      }
      // Tag/category match
      if (s.category.includes(q)) score += 3;

      return { skill: s, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit || 5);

  res.json({ results: scored.map(s => ({ ...s.skill, match_score: s.score })) });
});

/** GET /api/skills/graph/dependencies — dependency graph */
router.get('/graph/dependencies', (_req: Request, res: Response) => {
  const registry = loadRegistry();
  res.json(registry.dependency_graph);
});

/** POST /api/skills/:id/activate — activate skill */
router.post('/:id/activate', (req: Request, res: Response) => {
  const registry = loadRegistry();
  const skill = registry.skills.find(s => s.id === req.params.id || s.name === req.params.id);

  if (!skill) {
    res.status(404).json({ error: 'Skill not found' });
    return;
  }

  // Check dependencies
  const missing = skill.dependencies.filter(depId => {
    const dep = registry.skills.find(s => s.id === depId);
    return !dep || dep.status !== 'active';
  });

  if (missing.length > 0) {
    res.status(409).json({ error: 'Missing dependencies', missing });
    return;
  }

  skill.status = 'active';
  skill.updated = new Date().toISOString();
  saveRegistry(registry);

  res.json({ message: `Skill ${skill.name} activated`, skill });
});

/** POST /api/skills/:id/track — track skill usage */
router.post('/:id/track', (req: Request, res: Response) => {
  const registry = loadRegistry();
  const skill = registry.skills.find(s => s.id === req.params.id || s.name === req.params.id);

  if (!skill) {
    res.status(404).json({ error: 'Skill not found' });
    return;
  }

  const { success } = req.body as { success: boolean };
  skill.usage_count++;
  if (success !== undefined) {
    const total = skill.usage_count;
    skill.success_rate = Math.round(((skill.success_rate * (total - 1)) + (success ? 100 : 0)) / total);
  }
  skill.updated = new Date().toISOString();
  saveRegistry(registry);

  res.json({ skill });
});

/** POST /api/skills — register new skill */
router.post('/', (req: Request, res: Response) => {
  const { name, description, category, triggers, dependencies, author } = req.body;

  if (!name || !description) {
    res.status(400).json({ error: 'name and description required' });
    return;
  }

  const registry = loadRegistry();
  const id = `skill-${name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

  const skill: SkillManifest = {
    id,
    name,
    version: '1.0.0',
    description,
    author: author || 'system',
    category: category || 'automation',
    triggers: triggers || [],
    dependencies: dependencies || [],
    permissions: [],
    status: 'inactive',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    usage_count: 0,
    success_rate: 0,
  };

  registry.skills.push(skill);
  registry.dependency_graph[id] = skill.dependencies;
  saveRegistry(registry);

  res.status(201).json(skill);
});
