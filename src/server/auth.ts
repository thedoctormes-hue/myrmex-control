// ============================================================
// Auth — JWT access + refresh tokens, TOTP 2FA, RBAC
// ============================================================
//
// Flow:
//   1. POST /api/auth/setup — create admin user (first time)
//   2. POST /api/auth/login — returns access_token (15min) + sets refresh cookie (7d)
//   3. POST /api/auth/refresh — rotate refresh token, return new access token
//   4. POST /api/auth/logout — revoke refresh token
//   5. POST /api/auth/totp/setup — generate TOTP secret + QR code
//   6. POST /api/auth/totp/verify — verify TOTP code + enable 2FA
//   7. GET  /api/auth/status — check auth state
//
// RBAC middleware:
//   requireAuth — valid JWT access token
//   requireRole(role) — user must have role (admin > operator > viewer)
// ============================================================

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { TOTP, Secret } from 'otpauth';
import { readState, writeState, createLogEntry } from './myrmex.js';
import type { User, UserRole, RefreshToken } from '@shared/types.js';

// --- Config ---

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 7;
const SALT_ROUNDS = 12;

// JWT secret: from env or generate (regenerated on restart — acceptable for single-instance)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_ISSUER = 'myrmex-control';

// --- Helpers ---

function findUser(username: string): User | undefined {
  return readState().users.find(u => u.username === username);
}

function findUserById(id: string): User | undefined {
  return readState().users.find(u => u.id === id);
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(user: User): string {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL, issuer: JWT_ISSUER }
  );
}

function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

function storeRefreshToken(userId: string, token: string): RefreshToken {
  const state = readState();
  const tokenHash = hashToken(token);
  const now = new Date();
  const entry: RefreshToken = {
    id: crypto.randomUUID(),
    user_id: userId,
    token_hash: tokenHash,
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    revoked: false,
    replaced_by: null,
  };
  state.refresh_tokens.push(entry);
  // Cleanup: keep only last 50 tokens per user
  const userTokens = state.refresh_tokens.filter(t => t.user_id === userId);
  if (userTokens.length > 50) {
    const toRemove = userTokens.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    for (let i = 0; i < toRemove.length - 50; i++) {
      const idx = state.refresh_tokens.findIndex(t => t.id === toRemove[i].id);
      if (idx !== -1) state.refresh_tokens.splice(idx, 1);
    }
  }
  writeState(state, 'auth', createLogEntry('auth', 'create', 'refresh_token', entry.id, { user_id: userId }));
  return entry;
}

function findRefreshToken(token: string): RefreshToken | undefined {
  const state = readState();
  const hash = hashToken(token);
  return state.refresh_tokens.find(t => t.token_hash === hash);
}

function revokeToken(token: string, replacedBy?: string): void {
  const state = readState();
  const hash = hashToken(token);
  const entry = state.refresh_tokens.find(t => t.token_hash === hash);
  if (entry) {
    entry.revoked = true;
    if (replacedBy) entry.replaced_by = replacedBy;
    writeState(state, 'auth', createLogEntry('auth', 'revoke', 'refresh_token', entry.id, {}));
  }
}

// --- JWT verification ---

export interface AuthPayload {
  sub: string;
  username: string;
  role: UserRole;
}

function verifyAccessToken(token: string): AuthPayload {
  const payload = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER }) as AuthPayload;
  return payload;
}

// --- TOTP ---

function createTOTP(username: string): { secret: string; uri: string } {
  const secret = new Secret({ size: 32 });
  const totp = new TOTP({
    issuer: 'Myrmex Control',
    label: username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });
  return { secret: secret.base32, uri: totp.toString() };
}

function verifyTOTP(encryptedSecret: string, code: string): boolean {
  try {
    const totp = new TOTP({
      issuer: 'Myrmex Control',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(encryptedSecret),
    });
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

// --- Middleware ---

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Demo mode — skip auth
  if (process.env.DEMO_MODE === 'true') return next();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing access token' });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    (req as any).auth = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as any).auth as AuthPayload | undefined;
    if (!auth) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    // Admin always has access
    if (auth.role === 'admin') return next();
    if (!roles.includes(auth.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

// --- Routes ---

// Setup (first user — becomes admin)
export async function setup(req: Request, res: Response) {
  const state = readState();
  if (state.users.length > 0) {
    res.status(403).json({ error: 'Users already exist. Use login.' });
    return;
  }

  const { username, password } = req.body;
  if (!username || typeof username !== 'string' || username.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters' });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user: User = {
    id: crypto.randomUUID(),
    username,
    password_hash: passwordHash,
    role: 'admin',
    totp_secret: null,
    totp_enabled: false,
    created_at: new Date().toISOString(),
    last_login: null,
  };

  state.users.push(user);
  writeState(state, 'auth', createLogEntry('auth', 'create', 'user', user.id, { username, role: user.role }));

  // Auto-login
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  storeRefreshToken(user.id, refreshToken);

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, access_token: accessToken, user: { id: user.id, username: user.username, role: user.role } });
}

// Login (step 1: password → access token, or step 2: password + TOTP)
export async function login(req: Request, res: Response) {
  const { username, password, totp_code } = req.body;
  const user = findUser(username);

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // If TOTP enabled, require code
  if (user.totp_enabled && user.totp_secret) {
    if (!totp_code) {
      res.status(401).json({ error: 'TOTP code required', totp_required: true });
      return;
    }
    if (!verifyTOTP(user.totp_secret, totp_code)) {
      res.status(401).json({ error: 'Invalid TOTP code' });
      return;
    }
  }

  // Update last login
  const state = readState();
  const dbUser = state.users.find(u => u.id === user.id);
  if (dbUser) dbUser.last_login = new Date().toISOString();
  writeState(state, 'auth', createLogEntry('auth', 'login', 'user', user.id, {}));

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  storeRefreshToken(user.id, refreshToken);

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, access_token: accessToken, user: { id: user.id, username: user.username, role: user.role } });
}

// Refresh token rotation
export function refresh(req: Request, res: Response) {
  const token = req.cookies?.refresh_token;
  if (!token) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  const stored = findRefreshToken(token);
  if (!stored || stored.revoked) {
    // Possible theft — revoke all user tokens
    if (stored) {
      const state = readState();
      state.refresh_tokens
        .filter(t => t.user_id === stored.user_id && !t.revoked)
        .forEach(t => { t.revoked = true; });
      writeState(state, 'auth', createLogEntry('auth', 'revoke_all', 'refresh_token', stored.user_id, { reason: 'suspected_theft' }));
    }
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  if (new Date(stored.expires_at) < new Date()) {
    res.status(401).json({ error: 'Refresh token expired' });
    return;
  }

  const user = findUserById(stored.user_id);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  // Rotate: revoke old, issue new
  const newRefreshToken = generateRefreshToken();
  revokeToken(token, newRefreshToken);
  storeRefreshToken(user.id, newRefreshToken);

  const accessToken = generateAccessToken(user);

  res.cookie('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, access_token: accessToken });
}

// Logout
export function logout(req: Request, res: Response) {
  const token = req.cookies?.refresh_token;
  if (token) revokeToken(token);
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  res.json({ success: true });
}

// Auth status
export function authStatus(req: Request, res: Response) {
  const isDemo = process.env.DEMO_MODE === 'true';
  const state = readState();
  const hasUsers = state.users.length > 0;

  // Check if valid access token present
  const authHeader = req.headers.authorization;
  let authenticated = false;
  let user: { id: string; username: string; role: UserRole } | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(authHeader.slice(7));
      authenticated = true;
      user = { id: payload.sub, username: payload.username, role: payload.role };
    } catch {
      // expired/invalid
    }
  }

  res.json({
    authenticated: isDemo ? true : authenticated,
    needsAuth: hasUsers && !isDemo,
    needsSetup: !hasUsers && !isDemo,
    demo: isDemo,
    user,
  });
}

// --- TOTP Setup ---

export function totpSetup(req: Request, res: Response) {
  const auth = (req as Request & { auth?: AuthPayload }).auth;
  if (!auth) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const user = findUserById(auth.sub);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const { secret, uri } = createTOTP(user.username);
  const state = readState();
  const dbUser = state.users.find(u => u.id === user.id);
  if (dbUser) {
    dbUser.totp_secret = secret;
    writeState(state, 'auth', createLogEntry('auth', 'totp_setup', 'user', user.id, {}));
  }
  res.json({ secret, uri });
}

export async function totpVerify(req: Request, res: Response) {
  const auth = (req as Request & { auth?: AuthPayload }).auth;
  if (!auth) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const { code } = req.body;
  const user = findUserById(auth.sub);
  if (!user || !user.totp_secret) { res.status(400).json({ error: 'TOTP not set up' }); return; }
  if (!verifyTOTP(user.totp_secret, code)) { res.status(400).json({ error: 'Invalid TOTP code' }); return; }

  const state = readState();
  const dbUser = state.users.find(u => u.id === user.id);
  if (dbUser) {
    dbUser.totp_enabled = true;
    writeState(state, 'auth', createLogEntry('auth', 'totp_enable', 'user', user.id, {}));
  }
  res.json({ success: true, message: '2FA enabled' });
}

export function totpDisable(req: Request, res: Response) {
  const auth = (req as Request & { auth?: AuthPayload }).auth;
  if (!auth) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const state = readState();
  const dbUser = state.users.find(u => u.id === auth.sub);
  if (dbUser) {
    dbUser.totp_enabled = false;
    dbUser.totp_secret = null;
    writeState(state, 'auth', createLogEntry('auth', 'totp_disable', 'user', dbUser.id, {}));
  }
  res.json({ success: true });
}
