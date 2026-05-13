// ============================================================
// BL-045: Self-Improvement Loop
// Observe → Analyze → Plan → Implement → Verify
// ============================================================

import { Router, Request, Response } from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

export const router = Router();

// --- Types ---

type ImprovementRisk = 'low' | 'medium' | 'high';
type ImprovementStatus = 'proposed' | 'approved' | 'implementing' | 'verified' | 'rolled_back';

interface ImprovementProposal {
  id: string;
  title: string;
  description: string;
  category: 'performance' | 'security' | 'ux' | 'code_quality' | 'infrastructure';
  risk: ImprovementRisk;
  status: ImprovementStatus;
  source: 'metrics' | 'error_analysis' | 'user_feedback' | 'agent' | 'manual';
  impact_score: number;       // 1-10
  created_at: string;
  approved_at?: string;
  implemented_at?: string;
  verified_at?: string;
  rolled_back_at?: string;
  changes?: string[];
  metrics_before?: Record<string, number>;
  metrics_after?: Record<string, number>;
}

interface EvolutionMetrics {
  total_improvements: number;
  active_improvements: number;
  rolled_back: number;
  avg_impact_score: number;
  by_category: Record<string, number>;
}

interface EvolutionConfig {
  auto_improve_enabled: boolean;
  human_override_categories: string[];
  max_auto_risk: ImprovementRisk;
  ab_testing_enabled: boolean;
}

// --- State ---

const DATA_DIR = join(process.cwd(), 'data', 'evolution');

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadProposals(): ImprovementProposal[] {
  const file = join(DATA_DIR, 'proposals.json');
  try {
    if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {}
  return [];
}

function saveProposals(proposals: ImprovementProposal[]): void {
  ensureDir();
  writeFileSync(join(DATA_DIR, 'proposals.json'), JSON.stringify(proposals, null, 2), 'utf-8');
}

function loadConfig(): EvolutionConfig {
  const file = join(DATA_DIR, 'config.json');
  try {
    if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {}
  return {
    auto_improve_enabled: true,
    human_override_categories: ['security', 'infrastructure'],
    max_auto_risk: 'low',
    ab_testing_enabled: false,
  };
}

function saveConfig(config: EvolutionConfig): void {
  ensureDir();
  writeFileSync(join(DATA_DIR, 'config.json'), JSON.stringify(config, null, 2), 'utf-8');
}

// --- Routes ---

/** GET /api/evolution/proposals — list improvement proposals */
router.get('/proposals', (req: Request, res: Response) => {
  const status = req.query.status as ImprovementStatus | undefined;
  const category = req.query.category as string | undefined;

  let proposals = loadProposals();
  if (status) proposals = proposals.filter(p => p.status === status);
  if (category) proposals = proposals.filter(p => p.category === category);

  res.json({ total: proposals.length, proposals });
});

/** POST /api/evolution/proposals — create improvement proposal */
router.post('/proposals', (req: Request, res: Response) => {
  const { title, description, category, risk, source, impact_score } = req.body;

  if (!title || !description) {
    res.status(400).json({ error: 'title and description required' });
    return;
  }

  const proposals = loadProposals();
  const id = `IMP-${Date.now().toString(36).toUpperCase()}`;

  const proposal: ImprovementProposal = {
    id,
    title,
    description,
    category: category || 'code_quality',
    risk: risk || 'low',
    status: 'proposed',
    source: source || 'manual',
    impact_score: impact_score || 5,
    created_at: new Date().toISOString(),
  };

  proposals.unshift(proposal);
  saveProposals(proposals);

  res.status(201).json(proposal);
});

/** POST /api/evolution/proposals/:id/approve — approve proposal */
router.post('/proposals/:id/approve', (req: Request, res: Response) => {
  const proposals = loadProposals();
  const proposal = proposals.find(p => p.id === req.params.id);

  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found' });
    return;
  }

  proposal.status = 'approved';
  proposal.approved_at = new Date().toISOString();
  saveProposals(proposals);

  res.json(proposal);
});

/** POST /api/evolution/proposals/:id/implement — mark as implemented */
router.post('/proposals/:id/implement', (req: Request, res: Response) => {
  const proposals = loadProposals();
  const proposal = proposals.find(p => p.id === req.params.id);

  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found' });
    return;
  }

  // Check if auto-improve is allowed
  const config = loadConfig();
  if (config.human_override_categories.includes(proposal.category) || proposal.risk !== 'low') {
    if (!proposal.approved_at) {
      res.status(403).json({ error: 'Human approval required for this category/risk level' });
      return;
    }
  }

  proposal.status = 'implementing';
  proposal.implemented_at = new Date().toISOString();
  proposal.metrics_before = req.body.metrics_before;
  saveProposals(proposals);

  res.json(proposal);
});

/** POST /api/evolution/proposals/:id/verify — verify improvement */
router.post('/proposals/:id/verify', (req: Request, res: Response) => {
  const proposals = loadProposals();
  const proposal = proposals.find(p => p.id === req.params.id);

  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found' });
    return;
  }

  proposal.status = 'verified';
  proposal.verified_at = new Date().toISOString();
  proposal.metrics_after = req.body.metrics_after;
  saveProposals(proposals);

  res.json(proposal);
});

/** POST /api/evolution/proposals/:id/rollback — rollback improvement */
router.post('/:id/rollback', (req: Request, res: Response) => {
  const proposals = loadProposals();
  const proposal = proposals.find(p => p.id === req.params.id);

  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found' });
    return;
  }

  proposal.status = 'rolled_back';
  proposal.rolled_back_at = new Date().toISOString();
  saveProposals(proposals);

  res.json(proposal);
});

/** GET /api/evolution/metrics — evolution metrics */
router.get('/metrics', (_req: Request, res: Response) => {
  const proposals = loadProposals();

  const byCategory: Record<string, number> = {};
  let totalImpact = 0;
  let rolledBack = 0;

  for (const p of proposals) {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    totalImpact += p.impact_score;
    if (p.status === 'rolled_back') rolledBack++;
  }

  const metrics: EvolutionMetrics = {
    total_improvements: proposals.length,
    active_improvements: proposals.filter(p => p.status === 'implementing' || p.status === 'verified').length,
    rolled_back: rolledBack,
    avg_impact_score: proposals.length > 0 ? Math.round(totalImpact / proposals.length * 10) / 10 : 0,
    by_category: byCategory,
  };

  res.json(metrics);
});

/** GET /api/evolution/config — evolution config */
router.get('/config', (_req: Request, res: Response) => {
  res.json(loadConfig());
});

/** PUT /api/evolution/config — update config */
router.put('/config', (req: Request, res: Response) => {
  const config = { ...loadConfig(), ...req.body };
  saveConfig(config);
  res.json(config);
});

/** POST /api/evolution/analyze — trigger analysis (observe → analyze) */
router.post('/analyze', (req: Request, res: Response) => {
  // This is a simplified analysis — in production this would:
  // 1. Query monitoring metrics
  // 2. Analyze error patterns
  // 3. Check unused features
  // 4. Generate proposals

  const proposals = loadProposals();

  // Sample analysis: check for performance bottlenecks
  const analysis = {
    timestamp: new Date().toISOString(),
    findings: [
      { type: 'performance', detail: 'Consider caching for /api/state endpoint', priority: 'medium' },
      { type: 'ux', detail: 'Add keyboard shortcuts reference panel', priority: 'low' },
    ],
    proposed: [] as ImprovementProposal[],
  };

  for (const finding of analysis.findings) {
    const id = `IMP-${Date.now().toString(36).toUpperCase()}`;
    const proposal: ImprovementProposal = {
      id,
      title: finding.detail,
      description: `Auto-generated from analysis: ${finding.detail}`,
      category: finding.type as any,
      risk: 'low',
      status: 'proposed',
      source: 'metrics',
      impact_score: finding.priority === 'high' ? 8 : finding.priority === 'medium' ? 5 : 3,
      created_at: new Date().toISOString(),
    };
    proposals.unshift(proposal);
    analysis.proposed.push(proposal);
  }

  saveProposals(proposals);
  res.json(analysis);
});
