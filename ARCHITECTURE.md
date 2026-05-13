---
description: "ARCHITECTURE.md — Myrmex Control"
type: guide
last_reviewed: 2026-05-12
last_code_change: 2026-05-12
status: active
---
# ARCHITECTURE.md — Myrmex Control

> Архитектурный обзор проекта. Последнее обновление: 2026-05-10.

## Обзор

Myrmex Control — full-stack dashboard для управления AI-агентами. «Пульт управления муравейником»: один экран для контроля всей инфраструктуры агентов.

**Ключевая архитектурная идея:** JSON-first persistence. Вся state приложения хранится в одном `myrmex.json` файле. Никакого ORM, никакой внешней БД. Атомарная запись через tmp-файл + rename, file locking через `proper-lockfile`.

## Схема слоёв

```
┌─────────────────────────────────────────────────┐
│                   Browser                       │
│  React 19 + React Router 7 + Tailwind CSS 3.4  │
│  TypeScript 5.6 • Vite 5 • Lucide Icons         │
└──────────────────────┬──────────────────────────┘
                       │ HTTP (JSON API)
                       │ CORS + Helmet + Rate Limit
┌──────────────────────┴──────────────────────────┐
│               Express 4 Server                   │
│  Auth (bcookie + bcrypt) • 6 API routers        │
│  Middleware: security → CORS → JSON → cookies    │
└──────────────────────┬──────────────────────────┘
                       │ read / write
┌──────────────────────┴──────────────────────────┐
│             myrmex.json (JSON DB)                │
│  Atomic writes • File locking • Changelog        │
│  proper-lockfile • UUID • In-memory sessions     │
└─────────────────────────────────────────────────┘
```

## Frontend (Клиент)

### Точка входа
- `src/client/main.tsx` → `createRoot` + `BrowserRouter` + `StrictMode`
- `src/client/App.tsx` → Root component, auth state machine

### Auth State Machine

```
                    ┌─────────────┐
                    │  /api/auth  │
                    │   /status   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  needs   │ │  needs   │ │   demo   │
        │  Setup   │ │  Login   │ │   mode   │
        │ (no pwd) │ │ (has pwd)│ │(.demo f) │
        └──────────┘ └──────────┘ └──────────┘
              │            │            │
              ▼            ▼            ▼
          <Setup />    <Login />   <Dashboard />
                                      + Layout
```

### Маршрутизация (React Router 7)

| Path | Компонент | Описание |
|---|---|---|
| `/` | `<Dashboard>` | Обзор: баланс, серверы, сигналы |
| `/projects` | `<Projects>` | Список проектов |
| `/project/:id` | `<Board>` | Kanban-доска проекта |
| `/library` | `<Library>` | Библиотека skills/hooks/agents |
| `/files` | `<Files>` | Файловый обмен (inbox/outbox) |
| `/graph` | `<Graph>` | Граф зависимостей |

### Layout
- `Sidebar` (левая навигация) + `main` (контент) + `BottomBar` (нижняя панель)
- В demo-режиме — фиксированный amber-баннер «Demo-mode — data resets every hour»

### API Client (`src/client/lib/api.ts`)
- Единая функция `request<T>` с JSON-сериализацией
- 401-перехватчик: сбрасывает auth-state → redirect на login
- Полный CRUD для каждой entity: Tasks, Projects, Library, Files, Servers, State

### State Management
- **Без Redux/Zustand** — только React hooks
- `useMyrmex()` → загрузка `/api/state`, ручной `refresh()` после мутаций
- `useTheme()` → dark/light/auto, localStorage persistence

### Theming (Tailwind CSS)
- CSS-переменные (shadcn/ui pattern) — `hsl(var(--color-name))`
- Тёмная тема по умолчанию, переключатель
- `tokens.css` — дизайн-токены, `index.css` — Tailwind directives + кастомные стили

## Backend (Сервер)

### Точка входа: `src/server/index.ts`

```typescript
// Middleware pipeline (строгий порядок):
securityHeaders() → cors() → express.json() → cookieParser() → rateLimit

// Routes:
/api/auth/*     → публичные (setup, login, logout, status)
/api/state      → requireAuth → stateRouter
/api/tasks      → requireAuth → tasksRouter
/api/projects   → requireAuth → projectsRouter
/api/library    → requireAuth → libraryRouter
/api/files      → requireAuth → filesRouter
/api/servers    → requireAuth → serversRouter

// SPA fallback:
app.get('*', serveClientDist)
```

### Auth (`src/server/auth.ts`)

| Этап | Описание |
|---|---|
| **Setup** | Пароль (мин. 8 символов) → bcrypt (12 salt rounds) → `.env` (MYRMEX_PASSWORD_HASH) |
| **Login** | POST пароль → `bcrypt.compare` → session token → httpOnly cookie |
| **Session** | In-memory `Map<token, {user, expires}>` → TTL 24ч → cleanup каждые 30мин |
| **Demo** | Файл `.demo` в cwd → `requireAuth` пропускает (`next()`) |
| **Password storage** | Приоритет: env var → `.env` файл. Старый `MYRMEX_PASSWORD` удаляется |

### JSON DB (`src/server/myrmex.ts`)

```
myrmex.json
├── _meta: { version, last_updated, last_updated_by, change_count }
├── workspace: { name, description, owner, created_at }
├── projects: Project[]
├── agents: Agent[]
├── tasks: Task[]
├── library: Skill[]
├── files: MyrmexFile[]
├── servers: Server[]
├── mcp_servers: MCPServer[]
├── settings: Settings
└── changelog: ChangelogEntry[] (max 1000, FIFO)
```

**Атомарная запись:**
1. Update `_meta` (timestamp, source, change_count)
2. Prepend `ChangelogEntry` to `changelog`, cap at 1000
3. `proper-lockfile.lock()` (3 retries, 5s stale)
4. Write to `myrmex.json.tmp` → `rename()` → `myrmex.json`
5. `lock.release()` в `finally`

### API Endpoints

| Router | Endpoints | Auth |
|---|---|---|
| **auth** | POST /setup, POST /login, POST /logout, GET /status | ❌ |
| **state** | GET /, PUT / | ✅ |
| **tasks** | GET /, GET /:id, POST /, PUT /:id, DELETE /:id | ✅ |
| **projects** | GET /, GET /:id, POST /, PUT /:id, DELETE /:id | ✅ |
| **library** | GET /, GET /:id, POST /, PUT /:id, DELETE /:id | ✅ |
| **files** | GET / (inbox/outbox) | ✅ |
| **servers** | GET /, GET /:id, POST /, PUT /:id, DELETE /:id | ✅ |

### Middleware (`src/server/middleware.ts`)

| Middleware | Описание |
|---|---|
| **securityHeaders()** | Helmet: CSP (allow unsafe-inline для Tailwind), HSTS 1 year |
| **rateLimit** | 100 req/60s per IP. In-memory Map. Cleanup каждые 5мин. |
| **errorHandler** | Глобальный error handler → 500 + generic message. Без stack trace. |
| **logError()** | JSON-lines в `logs/error.log`. Auto-create dir. |

### Watchdog (`src/server/watchdog.ts`)
- TCP connect ping каждые 5 минут (3s timeout)
- Обновляет server status в `myrmex.json` при смене state
- Placeholder: проверка баланса (планируется в v0.2 с OpenRouter)

## Shared Types (`src/shared/types.ts`)

Единый источник типов для server + client:

- `TaskStatus`: backlog | todo | in_progress | review | done | cancelled
- `TaskPriority`: low | medium | high | critical
- `AgentStatus`: idle | working | error | offline
- `ServerStatus`: online | offline | degraded
- `SkillType`: skill | mask | hook | template
- Root: `MyrmexState` содержит `_meta` + 8 entity arrays + `settings` + `changelog`

## Build System

| Компонент | Инструмент | Output |
|---|---|---|
| Client | Vite 5 + @vitejs/plugin-react | `dist/client/` |
| Server | tsc (tsconfig.server.json) | `dist/server/` → `dist/index.js` |
| Both | `npm run build` | Последовательно: server → client |

### TypeScript Configs
- `tsconfig.json` — base: ES2022, ESNext modules, strict
- `tsconfig.client.json` — extends base, includes client + shared, DOM libs
- `tsconfig.server.json` — NodeNext module resolution, server + shared, no DOM

> **Примечание:** три tsconfig файла независимы (без extends) — настройки дублируются.

## Deployment

### Production (с авторизацией)
```bash
npm run build
# dist/client/* → Nginx (статика)
# dist/server/* → Node.js / systemd
```

### Demo (без авторизации)
- Тот же build + файл `.demo` в рабочей директории
- Auth полностью пропускается

### Systemd сервисы
| Сервис | Назначение |
|---|---|
| `myrmex-control` | Production (полная авторизация) |
| `myrmex-demo` | Demo (открытый доступ) |

## Безопасность

| Аспект | Реализация |
|---|---|
| Auth | bcrypt (12 rounds), httpOnly cookies, SameSite=strict |
| Rate limiting | 100 req/min per IP, in-memory |
| CORS | Whitelist через `CORS_ORIGIN` env var |
| Headers | Helmet: CSP, HSTS, X-Frame-Options, etc. |
| Error handling | Generic 500, stack traces НЕ утекают |
| Input validation | Минимальная (длина пароля ≥ 8) |

## Ограничения и trade-offs

| Ограничение | Обоснование |
|---|---|
| JSON file как БД | Простота, zero-config, достаточно для single-user dashboard |
| In-memory rate limiting | Не работает за балансировщиком (все запросы с одного IP) |
| In-memory sessions | Сессии при рестарте теряются. Приемлемо для демо/портфолио |
| Нет валидации на уровне API | Минимальная валидация (пароль ≥ 8), нет Zod/Joi |
| Backup scheduler commented out | Функционал запланирован, но не реализован |

## Version

**Current:** 0.1.0
**Live:** [myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru)
**Demo:** [demo.shtab-ai.ru](https://demo.shtab-ai.ru)
