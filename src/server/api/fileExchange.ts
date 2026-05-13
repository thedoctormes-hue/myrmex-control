// ============================================================
// BL-039: File Exchange — Inbox/Outbox System
// ============================================================

import { Router, Request, Response } from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { emitWebhookEvent } from './webhooks.js';

export const router = Router();

// --- Types ---

type FilePriority = 'urgent' | 'normal' | 'low';
type MessageStatus = 'unread' | 'read' | 'processed' | 'archived';

interface FileMessage {
  id: string;
  sender: string;
  receiver: string;
  type: 'inbox' | 'outbox';
  priority: FilePriority;
  subject: string;
  content: string;
  file_name?: string;
  file_hash?: string;
  file_size?: number;
  status: MessageStatus;
  tags: string[];
  created_at: string;
  read_at?: string;
}

// --- Storage ---

const DATA_DIR = join(process.cwd(), 'data', 'file-exchange');

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function getInboxFile(receiver: string): string {
  return join(DATA_DIR, `inbox-${receiver}.json`);
}

function getOutboxFile(sender: string): string {
  return join(DATA_DIR, `outbox-${sender}.json`);
}

function loadMessages(path: string): FileMessage[] {
  try {
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveMessages(path: string, messages: FileMessage[]): void {
  ensureDir();
  writeFileSync(path, JSON.stringify(messages, null, 2), 'utf-8');
}

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

// --- Quotas ---

const QUOTA_PER_AGENT = 50 * 1024 * 1024; // 50MB
const QUOTA_WARNING = 0.8;

function getUsedBytes(messages: FileMessage[]): number {
  return messages.reduce((sum, m) => sum + (m.file_size || m.content.length), 0);
}

// --- Routes ---

/** POST /api/files/send — send file/message */
router.post('/send', (req: Request, res: Response) => {
  const { sender, receiver, subject, content, priority, file_name, file_size, tags } = req.body;

  if (!sender || !receiver || !subject) {
    res.status(400).json({ error: 'sender, receiver, subject required' });
    return;
  }

  const id = crypto.randomUUID().slice(0, 12);
  const now = new Date().toISOString();
  const hash = hashContent(content || '');

  const msg: FileMessage = {
    id,
    sender,
    receiver,
    type: 'outbox',
    priority: priority || 'normal',
    subject,
    content: content || '',
    file_hash: hash,
    file_name,
    file_size: file_size || (content?.length || 0),
    status: 'unread',
    tags: tags || [],
    created_at: now,
  };

  // Check quota for receiver
  const inboxFile = getInboxFile(receiver);
  const inbox = loadMessages(inboxFile);
  const usedBytes = getUsedBytes(inbox) + (msg.file_size || 0);
  if (usedBytes > QUOTA_PER_AGENT) {
    res.status(413).json({ error: 'Quota exceeded for receiver', quota: QUOTA_PER_AGENT, used: usedBytes });
    return;
  }

  // Save to outbox (sender)
  const outboxFile = getOutboxFile(sender);
  const outbox = loadMessages(outboxFile);
  outbox.unshift(msg);
  saveMessages(outboxFile, outbox);

  // Save to inbox (receiver)
  const inboxMsg = { ...msg, type: 'inbox' as const };
  inbox.unshift(inboxMsg);
  saveMessages(inboxFile, inbox);

  // Emit webhook
  emitWebhookEvent('task.created', { message_id: id, sender, receiver, subject });

  res.status(201).json({ id, message: 'Sent', quota_used_pct: Math.round((usedBytes / QUOTA_PER_AGENT) * 100) });
});

/** GET /api/files/inbox/:agent — get inbox */
router.get('/inbox/:agent', (req: Request, res: Response) => {
  const { agent } = req.params;
  const priority = req.query.priority as FilePriority | undefined;
  const status = req.query.status as MessageStatus | undefined;

  let inbox = loadMessages(getInboxFile(agent));

  if (priority) inbox = inbox.filter(m => m.priority === priority);
  if (status) inbox = inbox.filter(m => m.status === status);

  // Dedup by hash
  const seen = new Set<string>();
  const deduped = inbox.filter(m => {
    if (m.file_hash && seen.has(m.file_hash)) return false;
    if (m.file_hash) seen.add(m.file_hash);
    return true;
  });

  res.json({ total: deduped.length, messages: deduped.slice(0, 50) });
});

/** GET /api/files/outbox/:agent — get outbox */
router.get('/outbox/:agent', (req: Request, res: Response) => {
  const { agent } = req.params;
  const messages = loadMessages(getOutboxFile(agent));
  res.json({ total: messages.length, messages: messages.slice(0, 50) });
});

/** POST /api/files/:id/read — mark as read */
router.post('/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const { agent } = req.body as { agent: string };

  const inboxFile = getInboxFile(agent);
  const inbox = loadMessages(inboxFile);
  const msg = inbox.find(m => m.id === id);

  if (!msg) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  msg.status = 'read';
  msg.read_at = new Date().toISOString();
  saveMessages(inboxFile, inbox);

  res.json({ id, status: 'read' });
});

/** POST /api/files/:id/archive — archive message */
router.post('/:id/archive', (req: Request, res: Response) => {
  const { id } = req.params;
  const { agent } = req.body as { agent: string };

  const inboxFile = getInboxFile(agent);
  const inbox = loadMessages(inboxFile);
  const msg = inbox.find(m => m.id === id);

  if (!msg) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  msg.status = 'archived';
  saveMessages(inboxFile, inbox);

  res.json({ id, status: 'archived' });
});

/** DELETE /api/files/:id — delete message */
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { agent } = req.body as { agent: string };

  const inboxFile = getInboxFile(agent);
  const inbox = loadMessages(inboxFile);
  const filtered = inbox.filter(m => m.id !== id);

  if (filtered.length === inbox.length) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  saveMessages(inboxFile, filtered);
  res.json({ message: 'Deleted', id });
});

/** GET /api/files — list files (inbox/outbox) for current session */
router.get('/', (req: Request, res: Response) => {
  const dir = (req.query.dir as 'inbox' | 'outbox') || 'inbox';
  const agent = (req.query.agent as string) || 'default';

  const filePath = dir === 'inbox' ? getInboxFile(agent) : getOutboxFile(agent);
  const messages = loadMessages(filePath);

  res.json(messages);
});

/** GET /api/files/quota/:agent — quota info */
router.get('/quota/:agent', (req: Request, res: Response) => {
  const { agent } = req.params;
  const inbox = loadMessages(getInboxFile(agent));
  const used = getUsedBytes(inbox);
  const pct = Math.round((used / QUOTA_PER_AGENT) * 100);
  const warning = pct >= QUOTA_WARNING * 100;

  res.json({
    used_bytes: used,
    quota_bytes: QUOTA_PER_AGENT,
    percentage: pct,
    warning,
    blocked: pct >= 100,
  });
});
