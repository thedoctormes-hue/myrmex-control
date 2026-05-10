# Changelog

All notable changes to Myrmex Control will be documented in this file.

## [1.1.0] — 2026-05-11

### 🔒 Security
- **SETUP_TOKEN** — initial admin registration now requires a secret token (prevents unauthorized access if DB is reset)
- Auth debug logging for failed login attempts

### 📱 Mobile Fixes
- **BottomBar** — added Library and Files to mobile navigation (was missing on iPhone Safari and Telegram Mini App)
- **Service Worker** — version check + auto-reload when stale JS is detected
- Removed 30s auto-refresh (was resetting form input)

### 📚 Library
- **5 artifact types**: skill, hook, card, config, knowledge (replaced mask/template)
- Demo seed data updated with examples for each type

### 🐛 Bug Fixes
- Fixed VitePWA outDir (was outputting to src/dist/client instead of dist/client)
- Fixed writeState async bug (user data was never persisting)
- Fixed CORS for production domains
- Added silent refresh to prevent form data loss

### 📖 Documentation
- Rewrote all 3 READMEs (EN/RU/ZH) — clean native language, no mixed translations
- Updated version badges to v1.1.0
- Updated GitHub repo description and topics

---

## [1.0.0] — 2026-05-10

### 🎉 First Stable Release

**Myrmex Control** — Hive Control Center for AI agent infrastructure.
React 19 + TypeScript + Vite + Tailwind CSS + Express + JWT/TOTP/RBAC.

#### Features
- **Dashboard** — real-time agent monitoring, task board, health score
- **Projects** — Kanban board with drag-and-drop, project CRUD
- **Library** — artifact storage (skills, masks, hooks, templates)
- **Files** — file management with upload/download
- **Graph** — visual dependency graph of agents and tasks
- **Analytics** — charts and metrics (Chart.js)
- **Audit Log** — full action history with filtering

#### Security
- JWT access tokens (15 min) + refresh tokens (7 days) with rotation
- TOTP 2FA (Google Authenticator compatible)
- RBAC: admin / operator / viewer roles
- HttpOnly cookies, CORS, Helmet headers

#### Architecture
- FSD (Feature-Sliced Design) client structure
- REST API with OpenAPI 3.0 spec
- JSON file-based database with atomic writes
- 148 tests, 94%+ coverage

#### DevOps
- GitHub Actions CI/CD pipeline
- ESLint flat config, Prettier, pre-commit hooks
- Docker-ready (Dockerfile + docker-compose.yml)
- Semantic versioning

#### Mobile & PWA
- Progressive Web App (manifest, service worker, offline)
- Touch-optimized (44px tap targets, swipe navigation)
- Telegram Web App integration (TWA SDK, theme sync)
- Responsive design (mobile-first)

#### i18n
- English / Russian support
- Auto-detection (browser, Telegram, localStorage)
- Language toggle in sidebar

#### Demo Mode
- One server, two modes via nginx `X-Demo-Mode` header
- Demo data: 8 agents, 20 tasks, 5 projects, 6 library items
- `AsyncLocalStorage` for per-request demo context (no separate process)
- systemd timer for automatic hourly demo data reset
- Demo banner in UI: "🎮 Демо-режим — данные сбрасываются каждый час"
- Accessible at `demo.shtab-ai.ru`

#### Infrastructure
- nginx reverse proxy (main + TWA + demo subdomains)
- Let's Encrypt SSL certificates
- systemd services with watchdog + timer
- Telegram bot (@tgminiappmyrmex_bot)

---

## Backlog

### 🧠 Brainstorm: Smart Auto-Refresh
**Problem:** Simple interval-based polling (every 30s) wastes resources and can disrupt user input.
**Goal:** Design intelligent auto-refresh that updates data only when needed.
**Ideas to explore:**
- `visibilitychange` — pause when tab is hidden, refresh on focus
- `focus` event — refresh when user returns to the app
- WebSocket / Server-Sent Events — push updates instead of polling
- Adaptive interval — longer when idle, shorter when active
- Stale-while-revalidate — show cached data, update in background
**Status:** 📋 Pending brainstorm session

---

## [0.1.0] — 2026-05-09

### Initial Release
- Basic dashboard, projects, tasks, agents
- JWT authentication
- File management
- Server monitoring
- 14 test files, 141 tests
