// ============================================================
// BL-047: SaaS Monetization — Pricing Tiers
// 4 pricing tiers, feature gating, usage-based billing, SaaS metrics
// ============================================================

import { Router, Request, Response } from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export const router = Router();

// --- Types ---

type PlanTier = 'free' | 'pro' | 'team' | 'enterprise';
type BillingPeriod = 'monthly' | 'annual';

interface PricingTier {
  id: PlanTier;
  name: string;
  description: string;
  price_monthly: number;       // USD
  price_annual: number;        // USD (with 20% discount)
  agents_limit: number;
  projects_limit: number;
  features: string[];
  popular: boolean;
}

interface FeatureGate {
  feature: string;
  tiers: PlanTier[];
  description: string;
}

interface UsageRecord {
  id: string;
  org_id: string;
  resource: string;            // e.g. 'agents', 'projects', 'api_calls'
  quantity: number;
  timestamp: string;
}

interface Subscription {
  id: string;
  org_id: string;
  tier: PlanTier;
  period: BillingPeriod;
  started_at: string;
  trial_ends_at?: string;
  active: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

interface SaaSMetrics {
  mrr: number;                 // Monthly Recurring Revenue
  arr: number;                 // Annual Recurring Revenue
  total_subscriptions: number;
  active_trials: number;
  churn_rate: number;          // percentage
  ltv_cac_ratio: number;       // Lifetime Value / Customer Acquisition Cost
  nps: number;                 // Net Promoter Score (-100 to 100)
  by_tier: Record<PlanTier, number>;
}

// --- Data ---

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free', name: 'Free', description: 'Для знакомства с Myrmex Control',
    price_monthly: 0, price_annual: 0, agents_limit: 3, projects_limit: 2,
    features: ['Базовый dashboard', 'Kanban доска', 'До 3 агентов', 'До 2 проектов', 'Community support'],
    popular: false,
  },
  {
    id: 'pro', name: 'Pro', description: 'Для индивидуальных разработчиков и малых команд',
    price_monthly: 29, price_annual: 23, agents_limit: 20, projects_limit: 10,
    features: ['Всё из Free', 'До 20 агентов', 'До 10 проектов', 'WebSocket Chat', 'Health Score', 'API access', 'Webhooks', 'Email support'],
    popular: true,
  },
  {
    id: 'team', name: 'Team', description: 'Для растущих команд',
    price_monthly: 99, price_annual: 79, agents_limit: 100, projects_limit: 50,
    features: ['Всё из Pro', 'До 100 агентов', 'До 50 проектов', 'RBAC', 'Knowledge Graph', 'Monitoring', 'Cost Analytics', 'Priority support', 'SSO'],
    popular: false,
  },
  {
    id: 'enterprise', name: 'Enterprise', description: 'Для крупных организаций',
    price_monthly: 0, price_annual: 0, agents_limit: -1, projects_limit: -1, // unlimited
    features: ['Всё из Team', 'Безлимитные агенты', 'Безлимитные проекты', 'Self-hosted option', 'Custom integrations', 'SLA 99.9%', 'Dedicated support', 'Custom training', 'Audit logs'],
    popular: false,
  },
];

const FEATURE_GATES: FeatureGate[] = [
  { feature: 'tasks:create', tiers: ['free', 'pro', 'team', 'enterprise'], description: 'Создание задач' },
  { feature: 'agents:multiple', tiers: ['free', 'pro', 'team', 'enterprise'], description: 'Несколько агентов' },
  { feature: 'chat:ws', tiers: ['pro', 'team', 'enterprise'], description: 'WebSocket чат' },
  { feature: 'rbac:roles', tiers: ['team', 'enterprise'], description: 'RBAC роли' },
  { feature: 'knowledge:graph', tiers: ['team', 'enterprise'], description: 'Knowledge Graph' },
  { feature: 'api:webhooks', tiers: ['pro', 'team', 'enterprise'], description: 'Webhooks' },
  { feature: 'deploy:blue-green', tiers: ['team', 'enterprise'], description: 'Blue-Green Deploy' },
  { feature: 'sso:saml', tiers: ['enterprise'], description: 'SAML SSO' },
  { feature: 'monitoring:advanced', tiers: ['team', 'enterprise'], description: 'Расширенный мониторинг' },
  { feature: 'evolution:auto', tiers: ['enterprise'], description: 'Auto self-improvement' },
  { feature: 'sessions:unlimited', tiers: ['team', 'enterprise'], description: 'Безлимитные сессии' },
  { feature: 'exports:pdf', tiers: ['pro', 'team', 'enterprise'], description: 'PDF экспорт' },
];

// --- Usage tracking ---

function loadUsage(): UsageRecord[] {
  const file = join(process.cwd(), 'data', 'saas-usage.json');
  try {
    if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {}
  return [];
}

function saveUsage(records: UsageRecord[]): void {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'saas-usage.json'), JSON.stringify(records, null, 2), 'utf-8');
}

function loadSubscriptions(): Subscription[] {
  const file = join(process.cwd(), 'data', 'saas-subscriptions.json');
  try {
    if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {}
  return [];
}

function saveSubscriptions(subs: Subscription[]): void {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'saas-subscriptions.json'), JSON.stringify(subs, null, 2), 'utf-8');
}

// --- Routes ---

/** GET /api/saas/pricing — pricing tiers */
router.get('/pricing', (_req: Request, res: Response) => {
  const annual_discount_pct = 20;
  res.json({
    tiers: PRICING_TIERS,
    annual_discount_pct,
    trial_days: 14,
    currency: 'USD',
  });
});

/** GET /api/saas/features — feature gates */
router.get('/features', (_req: Request, res: Response) => {
  res.json({ features: FEATURE_GATES });
});

/** GET /api/saas/features/check — check if feature is available for tier */
router.get('/features/check', (req: Request, res: Response) => {
  const { feature, tier } = req.query as { feature: string; tier: PlanTier };

  if (!feature || !tier) {
    res.status(400).json({ error: 'feature and tier required' });
    return;
  }

  const gate = FEATURE_GATES.find(g => g.feature === feature);
  const allowed = gate ? gate.tiers.includes(tier) : true;

  res.json({ feature, tier, allowed, gate });
});

/** POST /api/saas/subscriptions — create subscription */
router.post('/subscriptions', (req: Request, res: Response) => {
  const { org_id, tier, period, trial } = req.body;

  if (!org_id || !tier) {
    res.status(400).json({ error: 'org_id and tier required' });
    return;
  }

  const subs = loadSubscriptions();
  const id = `sub_${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const sub: Subscription = {
    id,
    org_id,
    tier,
    period: period || 'monthly',
    started_at: now,
    trial_ends_at: trial ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    active: true,
  };

  subs.push(sub);
  saveSubscriptions(subs);

  res.status(201).json(sub);
});

/** GET /api/saas/subscriptions/:org — get subscription */
router.get('/subscriptions/:org', (req: Request, res: Response) => {
  const subs = loadSubscriptions();
  const sub = subs.find(s => s.org_id === req.params.org);

  if (!sub) {
    res.status(404).json({ error: 'Subscription not found' });
    return;
  }

  const tier = PRICING_TIERS.find(t => t.id === sub.tier);
  res.json({ subscription: sub, tier });
});

/** POST /api/saas/usage — track usage */
router.post('/usage', (req: Request, res: Response) => {
  const { org_id, resource, quantity } = req.body;

  if (!org_id || !resource) {
    res.status(400).json({ error: 'org_id and resource required' });
    return;
  }

  const usage = loadUsage();
  const id = `use_${Date.now().toString(36)}`;

  usage.push({
    id,
    org_id,
    resource,
    quantity: quantity || 1,
    timestamp: new Date().toISOString(),
  });

  saveUsage(usage);

  // Check limits
  const subs = loadSubscriptions();
  const sub = subs.find(s => s.org_id === org_id && s.active);
  const tier = sub ? PRICING_TIERS.find(t => t.id === sub.tier) : PRICING_TIERS[0];

  const currentUsage = usage
    .filter(u => u.org_id === org_id && u.resource === resource)
    .reduce((sum, u) => sum + u.quantity, 0);

  const agentsLimit = tier?.agents_limit ?? -1;
  const projectsLimit = tier?.projects_limit ?? -1;
  const limit: number = resource === 'agents' ? agentsLimit :
                resource === 'projects' ? projectsLimit : -1;

  res.json({
    id,
    resource,
    current: currentUsage,
    limit: limit === -1 ? 'unlimited' : limit,
    over_limit: limit > -1 ? currentUsage > limit : false,
  });
});

/** GET /api/saas/metrics — SaaS metrics */
router.get('/metrics', (_req: Request, res: Response) => {
  const subs = loadSubscriptions();
  const active = subs.filter(s => s.active);

  const byTier: Record<PlanTier, number> = { free: 0, pro: 0, team: 0, enterprise: 0 };
  let mrr = 0;

  for (const sub of active) {
    byTier[sub.tier]++;
    const tier = PRICING_TIERS.find(t => t.id === sub.tier);
    if (tier) {
      mrr += sub.period === 'annual' ? tier.price_annual : tier.price_monthly;
    }
  }

  // In production these would be calculated from actual data
  const metrics: SaaSMetrics = {
    mrr,
    arr: mrr * 12,
    total_subscriptions: subs.length,
    active_trials: active.filter(s => s.trial_ends_at && new Date(s.trial_ends_at) > new Date()).length,
    churn_rate: 0,  // Would need historical data
    ltv_cac_ratio: 0,  // Would need revenue + cost data
    nps: 0,  // Would need survey data
    by_tier: byTier,
  };

  res.json(metrics);
});

/** GET /api/saas/trial/:org — check trial status */
router.get('/trial/:org', (req: Request, res: Response) => {
  const subs = loadSubscriptions();
  const sub = subs.find(s => s.org_id === req.params.org && s.active);

  if (!sub || !sub.trial_ends_at) {
    res.json({ on_trial: false });
    return;
  }

  const endsAt = new Date(sub.trial_ends_at);
  const now = new Date();
  const remainingMs = endsAt.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));

  res.json({
    on_trial: remainingMs > 0,
    ends_at: sub.trial_ends_at,
    remaining_days: remainingDays,
    expired: remainingMs <= 0,
  });
});
