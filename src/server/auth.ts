// ============================================================
// Auth — secure authentication with bcrypt
// Initial setup + cookie session
// ============================================================

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const SESSION_COOKIE = 'myrmex_session';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
const ENV_FILE = join(process.cwd(), '.env');
const SALT_ROUNDS = 12;

// --- Password storage (hashed) ---

function getPassword(): string | null {
  // 1. Priority: environment variable
  if (process.env.MYRMEX_PASSWORD_HASH) return process.env.MYRMEX_PASSWORD_HASH;

  // 2. From .env file (hashed)
  if (existsSync(ENV_FILE)) {
    const env = readFileSync(ENV_FILE, 'utf-8');
    const match = env.match(/^MYRMEX_PASSWORD_HASH=(.+)$/m);
    if (match) return match[1].trim();
  }

  return null; // No password set - needs setup
}

async function setPassword(password: string): Promise<void> {
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  process.env.MYRMEX_PASSWORD_HASH = hashed;
  // Save hashed password to .env
  let env = '';
  if (existsSync(ENV_FILE)) {
    env = readFileSync(ENV_FILE, 'utf-8');
    env = env.replace(/^MYRMEX_PASSWORD_HASH=.*$/m, '').trim();
    env = env.replace(/^MYRMEX_PASSWORD=.*$/m, '').trim(); // Remove old plaintext
  }
  env += `${env ? '\n' : ''}MYRMEX_PASSWORD_HASH=${hashed}\n`;
  writeFileSync(ENV_FILE, env, 'utf-8');
}

// --- Sessions (in-memory) ---

const sessions = new Map<string, { createdAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL) sessions.delete(token);
  }
}, 30 * 60 * 1000);

function createSession(): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { createdAt: Date.now() });
  return token;
}

function isValidSession(token: string): boolean {
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(token);
    return false;
  }
  return true;
}

// Constant-time comparison
function safeCompare(a: string, b: string): boolean {
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// --- Middleware ---

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Demo mode - skip auth
  try { if (existsSync(join(process.cwd(), '.demo'))) return next(); } catch {}

  const passwordHash = getPassword();
  if (!passwordHash) return next();

  const token = req.cookies?.[SESSION_COOKIE];
  if (token && isValidSession(token)) return next();

  res.status(401).json({ error: 'Unauthorized', login: true });
}

// --- Setup (initial password setup) ---

export async function setup(req: Request, res: Response) {
  const existingHash = getPassword();
  if (existingHash) {
    res.status(403).json({ error: 'Password already set. Use login.' });
    return;
  }

  const { password: newPassword } = req.body;
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  await setPassword(newPassword);

  // Auto-login after setup
  const token = createSession();
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL,
  });
  res.json({ success: true });
}

// --- Login ---

export async function login(req: Request, res: Response) {
  const passwordHash = getPassword();
  if (!passwordHash) {
    res.status(400).json({ error: 'Password not set. Run setup first.' });
    return;
  }

  const { password: input } = req.body;
  if (!input) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  const valid = await bcrypt.compare(input, passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  const token = createSession();
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL,
  });
  res.json({ success: true });
}

// --- Logout ---

export function logout(req: Request, res: Response) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) sessions.delete(token);
  res.clearCookie(SESSION_COOKIE);
  res.json({ success: true });
}

// --- Auth status ---

export function authStatus(req: Request, res: Response) {
  const isDemo = existsSync(join(process.cwd(), '.demo'));
  const passwordHash = getPassword();
  const token = req.cookies?.[SESSION_COOKIE];
  const needsAuth = !!passwordHash && !isDemo;
  const isAuth = token && isValidSession(token);
  res.json({
    authenticated: isDemo ? true : !!isAuth,
    needsAuth,
    needsSetup: !passwordHash && !isDemo,
    demo: isDemo,
  });
}