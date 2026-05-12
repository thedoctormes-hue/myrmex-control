// ============================================================
// Auth — простая авторизация через пароль
// Первичная установка пароля + сессия в cookie + change password
// ============================================================

import { Request, Response, NextFunction } from 'express';
import crypto, { timingSafeEqual } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';
import { readState, writeState, createLogEntry } from './myrmex.js';
import { recordAuthFailure, clearAuthFailures } from './middleware.js';
import { validate } from './validation/validate.js';
import { loginSchema, setupSchema, changePasswordSchema } from './validation/schemas.js';

const SESSION_COOKIE = 'myrmex_session';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 часа
const ENV_FILE = join(process.cwd(), '.env');

// --- BL-019: TWA replay protection ---
const usedQueryIds = new Map<string, number>(); // query_id → timestamp
const QUERY_ID_TTL = 24 * 60 * 60 * 1000; // 24 часа

// Периодическая очистка старых query_id
setInterval(() => {
  const now = Date.now();
  for (const [id, ts] of usedQueryIds) {
    if (now - ts > QUERY_ID_TTL) usedQueryIds.delete(id);
  }
}, 60 * 60 * 1000); // каждый час

function isReplayAttack(queryId: string): boolean {
  return usedQueryIds.has(queryId);
}

function markQueryIdUsed(queryId: string): void {
  usedQueryIds.set(queryId, Date.now());
}

// --- Password storage ---

function getPasswordHash(): string | null {
  // 1. Приоритет: переменная окружения
  if (process.env.MYRMEX_PASSWORD_HASH) return process.env.MYRMEX_PASSWORD_HASH;
  if (process.env.MYRMEX_PASSWORD) return process.env.MYRMEX_PASSWORD;

  // 2. Из .env файла
  try {
    // readFileSync imported from 'fs' at top
    if (existsSync(ENV_FILE)) {
      const env = readFileSync(ENV_FILE, 'utf-8');
      const hashMatch = env.match(/^MYRMEX_PASSWORD_HASH=(.+)$/m);
      if (hashMatch) return hashMatch[1].trim();
      const passMatch = env.match(/^MYRMEX_PASSWORD=(.+)$/m);
      if (passMatch) return passMatch[1].trim();
    }
  } catch (e) {
    console.error('[getPasswordHash] error:', e);
  }

  return null;
}

function getPassword(): string | null {
  return getPasswordHash();
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

// --- Middleware ---

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Демо-процесс: авторизация не требуется
  if (process.env.MYRMEX_FILE === 'myrmex-demo.json') return next();

  const password = getPassword();
  // Если пароль не задан — пропускаем (режим setup)
  if (!password) return next();

  const token = req.cookies?.[SESSION_COOKIE];
  if (token && isValidSession(token)) return next();

  res.status(401).json({ error: 'Unauthorized', login: true });
}

// --- Setup (первичная установка пароля) ---

export function setup(req: Request, res: Response) {
  const password = getPassword();
  if (password) {
    res.status(403).json({ error: 'Пароль уже задан. Используйте логин.' });
    return;
  }

  // BL-017: Setup требует SETUP_TOKEN
  const setupToken = process.env.SETUP_TOKEN;
  if (setupToken) {
    const providedToken = req.headers['x-setup-token'] || req.body?.setupToken;
    if (providedToken !== setupToken) {
      res.status(403).json({ error: 'SETUP_TOKEN required' });
      return;
    }
  }

  // BL-014: Zod validation
  const parsed = setupSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = (parsed.error as unknown as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
    return res.status(400).json({
      error: 'Validation error',
      details: issues.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }
  const { password: newPassword } = parsed.data;

  // Сохраняем в .env
  process.env.MYRMEX_PASSWORD = newPassword;
  const { writeFileSync, readFileSync } = require('fs');
  let env = '';
  if (existsSync(ENV_FILE)) {
    env = readFileSync(ENV_FILE, 'utf-8');
    env = env.replace(/^MYRMEX_PASSWORD=.*$/m, '').trim();
  }
  env += `${env ? '\n' : ''}MYRMEX_PASSWORD=${newPassword}\n`;
  writeFileSync(ENV_FILE, env, 'utf-8');

  // Автоматически логиним после установки
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

export function login(req: Request, res: Response) {
  const password = getPassword();
  if (!password) {
    res.status(400).json({ error: 'Пароль не задан. Сначала выполните настройку.' });
    return;
  }

  // BL-014: Zod validation
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = (parsed.error as unknown as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
    return res.status(400).json({
      error: 'Validation error',
      details: issues.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }
  const { password: input } = parsed.data;

  // Сравнение: bcrypt hash или plain text
  let valid = false;
  if (password.startsWith('$2')) {
    valid = bcrypt.compareSync(input, password);
  } else {
    valid = input === password;
  }

  if (!valid) {
    recordAuthFailure(req);
    res.status(401).json({ error: 'Неверный пароль' });
    return;
  }

  clearAuthFailures(req);
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
  const isDemo = process.env.MYRMEX_FILE === 'myrmex-demo.json';
  const password = getPassword();
  const token = req.cookies?.[SESSION_COOKIE];
  const isAuth = token && isValidSession(token);
  res.json({
    authenticated: isDemo ? true : !!isAuth,
    needsAuth: isDemo ? false : !!password,
    needsSetup: !password && !isDemo,
    demo: isDemo,
  });
}

// --- Change password ---

export async function changePassword(req: Request, res: Response) {
  const password = getPassword();
  if (!password) {
    res.status(400).json({ error: 'Пароль не задан. Сначала выполните настройку.' });
    return;
  }

  // BL-014: Zod validation
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = (parsed.error as unknown as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
    return res.status(400).json({
      error: 'Validation error',
      details: issues.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }
  const { current_password, new_password } = parsed.data;

  // Проверка текущего пароля
  if (current_password !== password) {
    res.status(401).json({ error: 'Неверный текущий пароль' });
    return;
  }

  // Хешируем новый пароль
  const password_hash = await bcrypt.hash(new_password, 12);

  // Сохраняем в myrmex.json
  try {
    const state = await readState();
    const adminUser = state.users?.[0];

    if (adminUser) {
      adminUser.password_hash = password_hash;
      adminUser.last_login = new Date().toISOString();
    } else {
      // Создаём пользователя если нет
      state.users = [{
        id: crypto.randomUUID(),
        username: 'admin',
        password_hash,
        role: 'admin',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      }];
    }

    await writeState(
      { users: state.users },
      'auth-change-password',
      createLogEntry('auth', 'update', 'user', state.users[0]?.id || 'admin', {
        action: 'password_changed',
      })
    );

    // Обновляем .env (обратная совместимость)
    process.env.MYRMEX_PASSWORD = new_password;
    const { writeFileSync, readFileSync } = require('fs');
    let env = '';
    if (existsSync(ENV_FILE)) {
      env = readFileSync(ENV_FILE, 'utf-8');
      env = env.replace(/^MYRMEX_PASSWORD=.*$/m, '').trim();
    }
    env += `${env ? '\n' : ''}MYRMEX_PASSWORD=${new_password}\n`;
    writeFileSync(ENV_FILE, env, 'utf-8');

    res.json({ success: true, message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ error: 'Ошибка сервера при смене пароля' });
  }
}

// --- BL-019: TWA Authentication ---

/**
 * Верификация Telegram Web App initData.
 * 1. Парсит query string
 * 2. Проверяет replay attack (query_id уникальность)
 * 3. Вычисляет HMAC-SHA256 от data_check_string
 * 4. Сравнивает hash через timingSafeEqual
 */
export function twaAuth(initData: string): { user: { id: number; first_name: string; username?: string } } | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const queryId = params.get('query_id');
    const userStr = params.get('user');

    if (!hash || !queryId || !userStr) return null;

    // Replay protection
    if (isReplayAttack(queryId)) {
      console.warn('[TWA] Replay attack detected:', queryId);
      return null;
    }

    // Формируем data_check_string (все поля кроме hash, отсортированные)
    params.delete('hash');
    const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = sortedParams.map(([k, v]) => `${k}=${v}`).join('\n');

    // Вычисляем секрет: HMAC-SHA256 от "WebAppData" и BOT_TOKEN
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('[TWA] TELEGRAM_BOT_TOKEN not set');
      return null;
    }

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    // BL-019: Timing-safe comparison
    const computedBuf = Buffer.from(computedHash, 'hex');
    const providedBuf = Buffer.from(hash, 'hex');
    if (computedBuf.length !== providedBuf.length) return null;
    if (!timingSafeEqual(computedBuf, providedBuf)) return null;

    // Помечаем query_id как использованный
    markQueryIdUsed(queryId);

    return JSON.parse(userStr);
  } catch (err) {
    console.error('[TWA] Auth error:', err);
    return null;
  }
}

// POST /api/auth/twa — TWA login endpoint
export function twaLogin(req: Request, res: Response) {
  const { initData } = req.body;
  if (!initData || typeof initData !== 'string') {
    return res.status(400).json({ error: 'initData is required' });
  }

  const authResult = twaAuth(initData);
  if (!authResult) {
    return res.status(401).json({ error: 'TWA auth failed' });
  }

  const token = createSession();
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL,
  });

  res.json({ success: true, user: { id: authResult.user.id, first_name: authResult.user.first_name, username: authResult.user.username } });
}
