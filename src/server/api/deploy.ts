// ============================================================
// BL-034: Blue-Green Deployment с Auto-Rollback
// Управление деплоем: статус, история, rollback, health check
// ============================================================

import { Router, Request, Response } from 'express';
import { execSync, exec } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

export const router = Router();

// --- Types ---

type DeployColor = 'blue' | 'green';
type DeployStatus = 'idle' | 'deploying' | 'healthy' | 'unhealthy' | 'rolling_back';

interface DeployEntry {
  id: string;
  color: DeployColor;
  version: string;
  status: DeployStatus;
  started_at: string;
  finished_at: string | null;
  health_check_passed: boolean | null;
  rollback_triggered: boolean;
  commit_sha?: string;
  deploy_log: string[];
}

interface DeployState {
  current_color: DeployColor;
  current_version: string;
  history: DeployEntry[];
  last_health_check: string | null;
}

// --- State ---

const DEPLOY_STATE_PATH = join(process.cwd(), 'deploy-state.json');
const DEPLOY_HISTORY_LIMIT = 20;

function loadDeployState(): DeployState {
  try {
    if (existsSync(DEPLOY_STATE_PATH)) {
      return JSON.parse(readFileSync(DEPLOY_STATE_PATH, 'utf-8'));
    }
  } catch {}
  return {
    current_color: 'blue',
    current_version: '0.1.0',
    history: [],
    last_health_check: null,
  };
}

function saveDeployState(state: DeployState): void {
  writeFileSync(DEPLOY_STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

// --- Health check ---

async function runHealthCheck(baseUrl: string): Promise<{ passed: boolean; latency_ms: number; details: string }> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    const latency = Date.now() - start;
    if (!res.ok) {
      return { passed: false, latency_ms: latency, details: `Health check failed: HTTP ${res.status}` };
    }
    const body = await res.json() as { status?: string };
    const isHealthy = body.status === 'ok' || body.status === 'healthy';
    return { passed: isHealthy, latency_ms: latency, details: JSON.stringify(body) };
  } catch (err: any) {
    return { passed: false, latency_ms: Date.now() - start, details: err.message };
  }
}

// --- Routes ---

/** GET /api/deploy/status — текущий статус деплоя */
router.get('/status', (_req: Request, res: Response) => {
  const state = loadDeployState();
  res.json(state);
});

/** GET /api/deploy/history — история деплоев */
router.get('/history', (_req: Request, res: Response) => {
  const state = loadDeployState();
  res.json(state.history.slice(0, DEPLOY_HISTORY_LIMIT));
});

/** POST /api/deploy — запустить blue-green деплой */
router.post('/', async (req: Request, res: Response) => {
  const state = loadDeployState();

  // Prevent concurrent deploys
  const active = state.history.find(h => h.status === 'deploying');
  if (active) {
    res.status(409).json({ error: 'Deployment already in progress', deploy: active });
    return;
  }

  const newColor: DeployColor = state.current_color === 'blue' ? 'green' : 'blue';
  const deployId = crypto.randomUUID().slice(0, 8);
  const version = process.env.npm_package_version || '0.1.0';
  const commitSha = getGitCommitSha();

  const entry: DeployEntry = {
    id: deployId,
    color: newColor,
    version,
    status: 'deploying',
    started_at: new Date().toISOString(),
    finished_at: null,
    health_check_passed: null,
    rollback_triggered: false,
    commit_sha: commitSha,
    deploy_log: [`Deploy ${deployId} started for ${newColor} (${version})`],
  };

  state.history.unshift(entry);
  saveDeployState(state);

  // Execute deploy asynchronously
  executeDeploy(entry, state, newColor);

  res.json({ message: 'Deployment started', deploy: entry });
});

/** POST /api/deploy/rollback — откат к предыдущей версии */
router.post('/rollback', async (req: Request, res: Response) => {
  const state = loadDeployState();

  const current = state.history[0];
  if (!current) {
    res.status(400).json({ error: 'No deployment to rollback' });
    return;
  }

  if (current.status === 'rolling_back') {
    res.status(409).json({ error: 'Rollback already in progress' });
    return;
  }

  const prevColor: DeployColor = state.current_color === 'blue' ? 'green' : 'blue';

  current.status = 'rolling_back';
  current.rollback_triggered = true;
  current.deploy_log.push(`Rollback triggered to ${prevColor}`);

  // Switch back
  state.current_color = prevColor;
  saveDeployState(state);

  res.json({ message: `Rolled back to ${prevColor}`, deploy: current });
});

/** POST /api/deploy/health-check — ручной health check */
router.post('/health-check', async (req: Request, res: Response) => {
  const state = loadDeployState();
  const targetPort = state.current_color === 'blue' ? 3000 : 3001;
  const result = await runHealthCheck(`http://localhost:${targetPort}`);

  state.last_health_check = new Date().toISOString();

  const current = state.history[0];
  if (current && current.status === 'deploying') {
    current.health_check_passed = result.passed;
    if (result.passed) {
      current.status = 'healthy';
      current.finished_at = new Date().toISOString();
      state.current_color = current.color;
      state.current_version = current.version;
      current.deploy_log.push(`Health check passed in ${result.latency_ms}ms`);
    } else {
      current.status = 'unhealthy';
      current.deploy_log.push(`Health check FAILED: ${result.details}`);
    }
  }

  saveDeployState(state);
  res.json(result);
});

// --- Internal ---

function getGitCommitSha(): string | undefined {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: process.cwd(), encoding: 'utf-8' }).trim();
  } catch {
    return undefined;
  }
}

async function executeDeploy(entry: DeployEntry, state: DeployState, color: DeployColor): Promise<void> {
  const targetPort = color === 'blue' ? 3000 : 3001;

  try {
    // Step 1: Build
    entry.deploy_log.push('Building client...');
    execSync('cd client && npm run build', { cwd: process.cwd(), stdio: 'pipe', timeout: 120_000 });
    entry.deploy_log.push('Client build complete');

    // Step 2: Deploy to target color directory
    const targetDir = `/var/www/myrmex-${color}`;
    entry.deploy_log.push(`Deploying to ${targetDir}...`);

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    execSync(`cp -r client/dist/* ${targetDir}/`, { cwd: process.cwd() });
    entry.deploy_log.push('Files deployed');

    // Step 3: Health check
    entry.deploy_log.push('Running health check...');
    const hc = await runHealthCheck(`http://localhost:${targetPort}`);
    entry.health_check_passed = hc.passed;

    if (hc.passed) {
      entry.status = 'healthy';
      entry.deploy_log.push(`✅ Deploy successful! Health check passed in ${hc.latency_ms}ms`);
      state.current_color = color;
      state.current_version = entry.version;
    } else {
      entry.status = 'unhealthy';
      entry.deploy_log.push(`❌ Health check failed: ${hc.details}`);

      // Auto-rollback
      entry.rollback_triggered = true;
      const prevColor = color === 'blue' ? 'green' : 'blue';
      state.current_color = prevColor;
      entry.deploy_log.push(`Auto-rollback to ${prevColor}`);
    }

    entry.finished_at = new Date().toISOString();
  } catch (err: any) {
    entry.status = 'unhealthy';
    entry.health_check_passed = false;
    entry.deploy_log.push(`❌ Deploy error: ${err.message}`);
    entry.rollback_triggered = true;
    entry.finished_at = new Date().toISOString();

    // Auto-rollback
    const prevColor = color === 'blue' ? 'green' : 'blue';
    state.current_color = prevColor;
  }

  saveDeployState(state);
}

export { loadDeployState, DeployState, DeployEntry, DeployColor };
