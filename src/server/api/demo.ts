// ============================================================
// BL-042: Demo Mode с Auto-Reset
// Seed data, auto-reset, feature flags, guided tour
// ============================================================

import { Router, Request, Response } from 'express';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join } from 'path';

export const router = Router();

// --- Types ---

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'ui' | 'feature' | 'experimental';
}

interface DemoAnalytics {
  page_views: Record<string, number>;
  features_tried: Record<string, number>;
  session_start: string;
  total_interactions: number;
}

interface DemoState {
  is_demo: boolean;
  reset_interval_hours: number;
  last_reset: string;
  next_reset: string;
  feature_flags: FeatureFlag[];
  analytics: DemoAnalytics;
}

// --- Feature flags ---

const FEATURE_FLAGS: FeatureFlag[] = [
  { id: 'chat_panel', name: 'Chat Panel', description: 'WebSocket чат с агентами', enabled: true, category: 'feature' },
  { id: 'health_score', name: 'Health Score', description: 'Виджет здоровья системы', enabled: true, category: 'ui' },
  { id: 'dark_theme', name: 'Dark Theme', description: 'Тёмная тема', enabled: true, category: 'ui' },
  { id: 'knowledge_graph', name: 'Knowledge Graph', description: 'Граф знаний лаборатории', enabled: true, category: 'feature' },
  { id: 'monitoring', name: 'Monitoring', description: 'Мониторинг серверов', enabled: true, category: 'feature' },
  { id: 'cost_tracking', name: 'Cost Tracking', description: 'Отслеживание затрат', enabled: false, category: 'feature' },
  { id: 'rbac', name: 'RBAC', description: 'Ролевая модель доступа', enabled: true, category: 'feature' },
  { id: 'webhooks', name: 'Webhooks', description: 'Webhook интеграции', enabled: false, category: 'experimental' },
  { id: 'evolution', name: 'Self-Improvement', description: 'Автоулучшение системы', enabled: false, category: 'experimental' },
  { id: 'guided_tour', name: 'Guided Tour', description: 'Пошаговый тур по фичам', enabled: true, category: 'ui' },
];

// --- Demo analytics ---

function loadAnalytics(): DemoAnalytics {
  const file = join(process.cwd(), 'data', 'demo-analytics.json');
  try {
    if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {}
  return {
    page_views: {},
    features_tried: {},
    session_start: new Date().toISOString(),
    total_interactions: 0,
  };
}

function saveAnalytics(analytics: DemoAnalytics): void {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) {
    const { mkdirSync } = require('fs');
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(join(dir, 'demo-analytics.json'), JSON.stringify(analytics, null, 2), 'utf-8');
}

// --- Routes ---

/** GET /api/demo/state — demo state */
router.get('/state', (_req: Request, res: Response) => {
  const demoFile = join(process.cwd(), '../../.demo');
  const isDemo = existsSync(demoFile);

  const state: DemoState = {
    is_demo: isDemo,
    reset_interval_hours: 24,
    last_reset: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    next_reset: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    feature_flags: FEATURE_FLAGS,
    analytics: loadAnalytics(),
  };

  res.json(state);
});

/** GET /api/demo/features — feature flags */
router.get('/features', (_req: Request, res: Response) => {
  res.json({ flags: FEATURE_FLAGS });
});

/** POST /api/demo/features/:id/toggle — toggle feature flag */
router.post('/features/:id/toggle', (req: Request, res: Response) => {
  const flag = FEATURE_FLAGS.find(f => f.id === req.params.id);
  if (!flag) {
    res.status(404).json({ error: 'Feature flag not found' });
    return;
  }

  flag.enabled = !flag.enabled;
  res.json(flag);
});

/** POST /api/demo/reset — trigger demo reset */
router.post('/reset', (_req: Request, res: Response) => {
  // In production this would:
  // 1. Restore myrmex-demo.json from seed
  // 2. Clear session data
  // 3. Reset analytics
  // 4. Notify connected clients via WebSocket

  const analytics: DemoAnalytics = {
    page_views: {},
    features_tried: {},
    session_start: new Date().toISOString(),
    total_interactions: 0,
  };
  saveAnalytics(analytics);

  res.json({ message: 'Demo reset triggered', timestamp: new Date().toISOString() });
});

/** POST /api/demo/analytics/track — track interaction */
router.post('/analytics/track', (req: Request, res: Response) => {
  const { page, feature } = req.body as { page?: string; feature?: string };
  const analytics = loadAnalytics();

  if (page) analytics.page_views[page] = (analytics.page_views[page] || 0) + 1;
  if (feature) analytics.features_tried[feature] = (analytics.features_tried[feature] || 0) + 1;
  analytics.total_interactions++;

  saveAnalytics(analytics);
  res.json({ tracked: true });
});

/** GET /api/demo/analytics — get analytics */
router.get('/analytics', (_req: Request, res: Response) => {
  res.json(loadAnalytics());
});

/** GET /api/demo/tour — guided tour steps */
router.get('/tour', (_req: Request, res: Response) => {
  const steps = [
    { id: 1, title: 'Добро пожаловать!', description: 'Myrmex Control — операционная система для AI-агентов. Давайте покажем основные возможности.', target: 'body' },
    { id: 2, title: 'Dashboard', description: 'Главная панель с метриками: задачи, агенты, проекты и Health Score.', target: '/dashboard' },
    { id: 3, title: 'Kanban Доска', description: 'Управляйте задачами через drag-and-drop доску с колонками: Backlog → Todo → In Progress → Review → Done.', target: '/projects' },
    { id: 4, title: 'Агенты', description: 'Мониторинг AI-агентов в реальном времени: статус, текущая задача, модель.', target: '/agents' },
    { id: 5, title: 'Чат с агентами', description: 'WebSocket чат для коммуникации с агентами. Команды: /status, /assign, /deploy, /logs.', target: '/chat' },
    { id: 6, title: 'Knowledge Graph', description: 'Визуализация связей между сущностями лаборатории: агенты, проекты, задачи, артефакты.', target: '/graph' },
    { id: 7, title: 'Мониторинг', description: 'Мониторинг серверов и метрик системы с алертами.', target: '/servers' },
    { id: 8, title: 'Готово!', description: 'Вы ознакомились с основными возможностями. Начните использовать Myrmex Control!', target: 'body' },
  ];

  res.json({ steps });
});

export { FEATURE_FLAGS, DemoState };
