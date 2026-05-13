// ============================================================
// BL-046: Session & Memory Management
// Session lifecycle, memory consolidation, context navigation
// ============================================================

import { Router, Request, Response } from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

export const router = Router();

// --- Types ---

type SessionStatus = 'active' | 'idle' | 'archived';

interface SessionMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
}

interface SessionMemory {
  short_term: SessionMessage[];   // recent messages (last 50)
  long_term: string[];            // consolidated summaries
  working: Record<string, unknown>; // current working context
}

interface Session {
  id: string;
  agent_id: string;
  title: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  tags: string[];
  bookmarks: string[];           // message IDs
  memory: SessionMemory;
  summary?: string;
  metadata?: Record<string, string>;
}

// --- Storage ---

const DATA_DIR = join(process.cwd(), 'data', 'sessions');

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadSessions(): Session[] {
  const file = join(DATA_DIR, 'sessions.json');
  try {
    if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {}
  return [];
}

function saveSessions(sessions: Session[]): void {
  ensureDir();
  writeFileSync(join(DATA_DIR, 'sessions.json'), JSON.stringify(sessions, null, 2), 'utf-8');
}

// --- Session lifecycle ---

const IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

function archiveIdleSessions(sessions: Session[]): Session[] {
  const now = Date.now();
  return sessions.map(s => {
    if (s.status === 'active' && now - new Date(s.updated_at).getTime() > IDLE_TIMEOUT_MS) {
      return { ...s, status: 'archived' as const, archived_at: new Date().toISOString() };
    }
    return s;
  });
}

// --- Routes ---

/** GET /api/sessions — list sessions */
router.get('/', (req: Request, res: Response) => {
  const agentId = req.query.agent_id as string | undefined;
  const status = req.query.status as SessionStatus | undefined;
  const tag = req.query.tag as string | undefined;
  const search = (req.query.search as string || '').toLowerCase();

  let sessions = archiveIdleSessions(loadSessions());

  if (agentId) sessions = sessions.filter(s => s.agent_id === agentId);
  if (status) sessions = sessions.filter(s => s.status === status);
  if (tag) sessions = sessions.filter(s => s.tags.includes(tag));
  if (search) {
    sessions = sessions.filter(s =>
      s.title.toLowerCase().includes(search) ||
      (s.summary || '').toLowerCase().includes(search) ||
      s.tags.some(t => t.toLowerCase().includes(search))
    );
  }

  res.json({
    total: sessions.length,
    sessions: sessions.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
  });
});

/** POST /api/sessions — create session */
router.post('/', (req: Request, res: Response) => {
  const { agent_id, title, tags, metadata } = req.body;

  if (!agent_id) {
    res.status(400).json({ error: 'agent_id required' });
    return;
  }

  const sessions = loadSessions();
  const id = crypto.randomUUID().slice(0, 12);
  const now = new Date().toISOString();

  const session: Session = {
    id,
    agent_id,
    title: title || `Session ${id}`,
    status: 'active',
    created_at: now,
    updated_at: now,
    tags: tags || [],
    bookmarks: [],
    memory: { short_term: [], long_term: [], working: {} },
    metadata,
  };

  sessions.unshift(session);
  saveSessions(sessions);

  res.status(201).json(session);
});

/** GET /api/sessions/:id — get session details */
router.get('/:id', (req: Request, res: Response) => {
  const sessions = loadSessions();
  const session = sessions.find(s => s.id === req.params.id);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  res.json(session);
});

/** POST /api/sessions/:id/message — add message to session */
router.post('/:id/message', (req: Request, res: Response) => {
  const sessions = loadSessions();
  const session = sessions.find(s => s.id === req.params.id);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const { role, content } = req.body as { role: 'user' | 'agent' | 'system'; content: string };
  if (!content) {
    res.status(400).json({ error: 'content required' });
    return;
  }

  const msg: SessionMessage = {
    id: crypto.randomUUID().slice(0, 8),
    role: role || 'user',
    content,
    timestamp: new Date().toISOString(),
  };

  session.memory.short_term.push(msg);
  // Keep short_term limited
  if (session.memory.short_term.length > 50) {
    session.memory.short_term = session.memory.short_term.slice(-50);
  }

  session.updated_at = new Date().toISOString();
  session.status = 'active';
  saveSessions(sessions);

  res.json(msg);
});

/** POST /api/sessions/:id/consolidate — memory consolidation */
router.post('/:id/consolidate', (req: Request, res: Response) => {
  const sessions = loadSessions();
  const session = sessions.find(s => s.id === req.params.id);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  // Simple consolidation: summarize recent messages
  const recent = session.memory.short_term.slice(-20);
  if (recent.length === 0) {
    res.json({ message: 'Nothing to consolidate', session });
    return;
  }

  const summary = `Session "${session.title}": ${recent.length} messages. Recent topics: ${
    recent.filter(m => m.role === 'user').map(m => m.content.slice(0, 50)).join('; ')
  }`;

  session.memory.long_term.push(summary);
  session.memory.short_term = [];
  session.summary = summary;
  session.updated_at = new Date().toISOString();
  saveSessions(sessions);

  res.json({ summary, long_term_count: session.memory.long_term.length });
});

/** POST /api/sessions/:id/archive — archive session */
router.post('/:id/archive', (req: Request, res: Response) => {
  const sessions = loadSessions();
  const session = sessions.find(s => s.id === req.params.id);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  session.status = 'archived';
  session.archived_at = new Date().toISOString();
  session.updated_at = new Date().toISOString();
  saveSessions(sessions);

  res.json({ id: session.id, status: 'archived' });
});

/** POST /api/sessions/:id/bookmark — bookmark a message */
router.post('/:id/bookmark', (req: Request, res: Response) => {
  const sessions = loadSessions();
  const session = sessions.find(s => s.id === req.params.id);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const { message_id } = req.body as { message_id: string };
  if (message_id && !session.bookmarks.includes(message_id)) {
    session.bookmarks.push(message_id);
    session.updated_at = new Date().toISOString();
    saveSessions(sessions);
  }

  res.json({ bookmarks: session.bookmarks });
});

/** DELETE /api/sessions/:id — delete session */
router.delete('/:id', (req: Request, res: Response) => {
  const sessions = loadSessions();
  const filtered = sessions.filter(s => s.id !== req.params.id);

  if (filtered.length === sessions.length) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  saveSessions(filtered);
  res.json({ message: 'Deleted', id: req.params.id });
});

/** GET /api/sessions/timeline/:agent — timeline view */
router.get('/timeline/:agent', (req: Request, res: Response) => {
  const { agent } = req.params;
  const sessions = archiveIdleSessions(loadSessions())
    .filter(s => s.agent_id === agent)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const timeline = sessions.map(s => ({
    id: s.id,
    title: s.title,
    status: s.status,
    created_at: s.created_at,
    updated_at: s.updated_at,
    message_count: s.memory.short_term.length,
    summary: s.summary,
  }));

  res.json({ agent, total: timeline.length, timeline });
});
