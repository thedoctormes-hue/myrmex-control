// ============================================================
// BL-038: Webhook System
// Подписки, HMAC-SHA256 верификация, retry с exponential backoff, dead letter queue
// ============================================================

import { Router, Request, Response } from 'express';
import crypto from 'crypto';

export const router = Router();

// --- Types ---

type WebhookEvent =
  | 'task.created' | 'task.completed' | 'task.updated'
  | 'agent.status_changed' | 'agent.online' | 'agent.offline'
  | 'deploy.started' | 'deploy.completed' | 'deploy.failed'
  | 'artifact.created' | 'artifact.updated';

interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  created_at: string;
  last_delivery: string | null;
  failure_count: number;
  metadata?: Record<string, string>;
}

interface DeliveryLog {
  id: string;
  webhook_id: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  status_code: number | null;
  success: boolean;
  response_body?: string;
  attempted_at: string;
  attempt_number: number;
}

// --- State ---

const subscriptions = new Map<string, WebhookSubscription>();
const deliveryLogs: DeliveryLog[] = [];
const deadLetterQueue: DeliveryLog[] = [];
const MAX_LOGS = 1000;
const MAX_DEAD_LETTER = 100;
const MAX_RETRIES = 10;
const BACKOFF_MS = [1000, 2000, 5000, 10000, 30000, 60000, 120000, 300000, 600000, 1800000];

// --- HMAC Helper ---

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = signPayload(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// --- Internal: deliver webhook ---

async function deliverWebhook(sub: WebhookSubscription, event: WebhookEvent, payload: Record<string, unknown>, attempt: number = 1): Promise<void> {
  const deliveryId = crypto.randomUUID().slice(0, 12);
  const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
  const signature = signPayload(body, sub.secret);

  let log: DeliveryLog = {
    id: deliveryId,
    webhook_id: sub.id,
    event,
    payload,
    status_code: null,
    success: false,
    attempted_at: new Date().toISOString(),
    attempt_number: attempt,
  };

  try {
    const res = await fetch(sub.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Id': sub.id,
        'X-Webhook-Event': event,
        'X-Delivery-Id': deliveryId,
        'X-Attempt': String(attempt),
        'User-Agent': 'Myrmex-Control-Webhook/1.0',
      },
      body,
      signal: AbortSignal.timeout(30_000),
    });

    log.status_code = res.status;
    log.response_body = (await res.text()).slice(0, 500);

    if (res.ok) {
      log.success = true;
      sub.last_delivery = new Date().toISOString();
      sub.failure_count = 0;
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err: any) {
    log.response_body = err.message;
    sub.failure_count++;

    if (attempt < MAX_RETRIES) {
      const delay = BACKOFF_MS[attempt - 1] || BACKOFF_MS[BACKOFF_MS.length - 1];
      setTimeout(() => deliverWebhook(sub, event, payload, attempt + 1), delay);
    } else {
      // Dead letter queue
      deadLetterQueue.push(log);
      if (deadLetterQueue.length > MAX_DEAD_LETTER) deadLetterQueue.shift();
      sub.active = false; // Auto-disable
    }
  }

  deliveryLogs.unshift(log);
  if (deliveryLogs.length > MAX_LOGS) deliveryLogs.pop();
}

// --- Public: emit event (called from other modules) ---

export function emitWebhookEvent(event: WebhookEvent, payload: Record<string, unknown>): void {
  for (const sub of subscriptions.values()) {
    if (sub.active && (sub.events.includes(event) || sub.events.includes('*' as any))) {
      deliverWebhook(sub, event, payload).catch(() => {});
    }
  }
}

// --- Verification endpoint for clients ---

const WEBHOOK_VERIFY_SECRET = process.env.WEBHOOK_SECRET || 'myrmex-webhook-secret';

/** POST /api/webhooks/verify — verify a webhook signature (for testing) */
router.post('/verify', (req: Request, res: Response) => {
  const { payload, signature } = req.body;
  if (!payload || !signature) {
    res.status(400).json({ error: 'payload and signature required' });
    return;
  }
  const valid = verifySignature(JSON.stringify(payload), signature, WEBHOOK_VERIFY_SECRET);
  res.json({ valid });
});

// --- Routes ---

/** POST /api/webhooks — create subscription */
router.post('/', (req: Request, res: Response) => {
  const { url, events, metadata } = req.body as {
    url: string; events: WebhookEvent[]; metadata?: Record<string, string>;
  };

  if (!url || !events || !Array.isArray(events)) {
    res.status(400).json({ error: 'url and events array required' });
    return;
  }

  const id = crypto.randomUUID().slice(0, 12);
  const sub: WebhookSubscription = {
    id,
    url,
    events,
    secret: crypto.randomBytes(32).toString('hex'),
    active: true,
    created_at: new Date().toISOString(),
    last_delivery: null,
    failure_count: 0,
    metadata,
  };

  subscriptions.set(id, sub);
  res.status(201).json({ ...sub, secret: sub.secret.slice(0, 8) + '...' });
});

/** GET /api/webhooks — list subscriptions */
router.get('/', (_req: Request, res: Response) => {
  const list = Array.from(subscriptions.values()).map(s => ({
    id: s.id,
    url: s.url,
    events: s.events,
    active: s.active,
    created_at: s.created_at,
    last_delivery: s.last_delivery,
    failure_count: s.failure_count,
  }));
  res.json({ total: list.length, subscriptions: list });
});

/** GET /api/webhooks/:id — get subscription details */
router.get('/:id', (req: Request, res: Response) => {
  const sub = subscriptions.get(req.params.id);
  if (!sub) {
    res.status(404).json({ error: 'Subscription not found' });
    return;
  }
  res.json({ ...sub, secret: sub.secret.slice(0, 8) + '...' });
});

/** DELETE /api/webhooks/:id — delete subscription */
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = subscriptions.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Subscription not found' });
    return;
  }
  res.json({ message: 'Deleted', id: req.params.id });
});

/** POST /api/webhooks/:id/toggle — enable/disable subscription */
router.post('/:id/toggle', (req: Request, res: Response) => {
  const sub = subscriptions.get(req.params.id);
  if (!sub) {
    res.status(404).json({ error: 'Subscription not found' });
    return;
  }
  sub.active = !sub.active;
  sub.failure_count = 0;
  res.json({ id: sub.id, active: sub.active });
});

/** GET /api/webhooks/:id/logs — delivery logs */
router.get('/:id/logs', (req: Request, res: Response) => {
  const { id } = req.params;
  const logs = deliveryLogs.filter(l => l.webhook_id === id).slice(0, 100);
  res.json({ total: logs.length, logs });
});

/** GET /api/webhooks/dead-letter — dead letter queue */
router.get('/queue/dead-letter', (_req: Request, res: Response) => {
  res.json({ total: deadLetterQueue.length, entries: deadLetterQueue.slice(-50) });
});

/** POST /api/webhooks/:id/replay — replay a delivery */
router.post('/:id/replay', (req: Request, res: Response) => {
  const { id } = req.params;
  const sub = subscriptions.get(id);
  if (!sub) {
    res.status(404).json({ error: 'Subscription not found' });
    return;
  }

  const { deliveryId } = req.body as { deliveryId?: string };
  const failed = deliveryId
    ? deadLetterQueue.find(l => l.id === deliveryId)
    : deadLetterQueue.find(l => l.webhook_id === id);

  if (!failed) {
    res.status(404).json({ error: 'No failed delivery to replay' });
    return;
  }

  sub.active = true;
  sub.failure_count = 0;
  deliverWebhook(sub, failed.event, failed.payload);

  res.json({ message: 'Replay started', delivery_id: failed.id });
});

export { subscriptions, deliveryLogs, deadLetterQueue };
