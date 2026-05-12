# 🐜 Myrmex Control

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇬🇧-English-2ea043?style=flat-square" alt="English"></a>
  <a href="README.ru.md"><img src="https://img.shields.io/badge/🇷🇺-Русский-2ea043?style=flat-square" alt="Русский"></a>
  <a href="README.zh.md"><img src="https://img.shields.io/badge/🇨🇳-中文-2ea043?style=flat-square" alt="中文"></a>
</p>

<p align="center">
  <strong>Agent Colony Management Dashboard</strong>
</p>

<p align="center">
  <a href="https://myrmexcontrol.shtab-ai.ru"><img src="https://img.shields.io/badge/Live%20Demo-myrmexcontrol.shtab--ai.ru-amber?style=for-the-badge" alt="Live Demo"></a>
  <a href="https://demo.shtab-ai.ru"><img src="https://img.shields.io/badge/Demo%20Instance-demo.shtab--ai.ru-amber?style=for-the-badge" alt="Demo"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white" alt="Express 4">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/Version-1.2.0-amber?style=flat-square" alt="v1.2.0">
  <img src="https://img.shields.io/github/actions/workflow/status/thedoctormes-hue/myrmex-control/ci.yml?branch=main&label=CI&style=flat-square" alt="CI">
  <img src="https://img.shields.io/badge/coverage-tested-brightgreen?style=flat-square" alt="Coverage">
  <img src="https://img.shields.io/badge/tests-174%20passing-brightgreen?style=flat-square" alt="Tests">
</p>

---

<p align="center">
  <a href="https://tgminiappmyrmex.shtab-ai.ru"><img src="https://img.shields.io/badge/✈️%20Telegram%20Web%20App-tgminiappmyrmex.shtab--ai.ru-blue?style=for-the-badge&logo=telegram" alt="TWA"></a>
</p>

## 📋 Table of Contents

- [What is Myrmex Control?](#-what-is-myrmex-control)
- [Why This Exists](#-why-this-exists)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Documentation](#-documentation)
- [Deployment](#-deployment)
- [Design System](#-design-system)
- [Trade-offs](#️-trade-offs)
- [Roadmap](#️-roadmap)
- [License](#-license)
- [Author](#-author)

## 📖 What is Myrmex Control?

**Myrmex Control** is a full-stack management dashboard for AI agent colonies — a single pane of glass over your entire agent infrastructure. Built with a deep navy color palette and amber accents, it combines a React 19 frontend with an Express 4 backend, using JSON files as a lightweight database.

The name *Myrmex* (μύρμηξ) is Greek for "ant" — a nod to the project's purpose: managing a colony of AI agents working together like an ant hive.

### Live Instances

| Instance | URL | Auth |
|---|---|---|
| Production | [myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru) | JWT + TOTP 2FA |
| Demo | [demo.shtab-ai.ru](https://demo.shtab-ai.ru) | None |
| Telegram Web App | [tgminiappmyrmex.shtab-ai.ru](https://tgminiappmyrmex.shtab-ai.ru) | JWT + TOTP 2FA |

## 🤔 Why This Exists

Managing multiple AI agents — each with their own tasks, configs, and state — quickly becomes chaotic. Existing solutions are either overkill (Kubernetes dashboards) or too simplistic (spreadsheets).

Myrmex Control fills the gap: a **single-file database** dashboard that's powerful enough to be useful, simple enough to deploy in one command, and clean enough to serve as a portfolio piece.

**The philosophy:**
- **Zero external dependencies** — no PostgreSQL, no Redis, no Docker required
- **Single source of truth** — one `myrmex.json` file holds everything
- **Human-readable** — open the DB in any text editor
- **Deploy anywhere** — Node.js + one `npm start`

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Dashboard** | Real-time overview with health score, server status, and signals feed |
| 📋 **Kanban Board** | Drag-and-drop task management with customizable columns |
| 📁 **Project Management** | Create, organize, and track projects with status and metadata |
| 📚 **Artifact Library** | Manage skills, hooks, cards, configs, and knowledge base entries |
| 📂 **File Exchange** | Inbox/outbox file sharing between agents and operators |
| 🕸️ **Dependency Graph** | Interactive D3.js visualization of agent dependencies |
| 📈 **Analytics** | Agent productivity metrics, task velocity, burndown charts |
| 📋 **Audit Log** | Full changelog browser with filtering and search |
| 🔐 **Authentication** | JWT access + refresh tokens, TOTP 2FA, RBAC (admin/operator/viewer) |
| 🎭 **Demo Mode** | Instant demo instance without authentication |
| 🌐 **i18n** | Full English (EN) and Russian (RU) localization |
| 📱 **PWA** | Installable, offline-capable, with service worker auto-update |
| ✈️ **Telegram Web App** | Native Telegram Mini App integration |
| 🔔 **Toast Notifications** | Real-time feedback for user actions |
| 🛡️ **Rate Limiting** | 100 req/min per IP + auth lockout after 5 failures |
| 🔒 **Security Headers** | HSTS, CSP (telegram.org for TWA), hardening headers |
| 🐕 **Watchdog** | Background server monitoring (5-min TCP checks) |
| 💾 **Automated Backups** | Daily systemd timer + manual create/restore API |
| 🔐 **TWA Auth** | Telegram Web App auth with timingSafeEqual + replay protection |
| ✅ **Zod Validation** | All POST/PUT endpoints validated with Zod schemas |
| ⚡ **Async I/O** | Non-blocking file operations + 1s in-memory cache |

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.6 | Type safety |
| Vite | 6 | Build tool & dev server |
| Tailwind CSS | 3.4 | Utility-first styling |
| React Router DOM | 7 | Client-side routing |
| Lucide React | 1.14 | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Express | 4 | HTTP server |
| TypeScript | 5.6 | Type safety |
| tsx | 4.19 | Runtime TS execution |
| cookie-parser | 1.4.7 | Session management |
| cors | 2.8.5 | Cross-origin support |
| otpauth | 9.3.2 | TOTP two-factor authentication |

### Database
**JSON file-based** — `myrmex.json` serves as the single source of truth. Atomic writes via temp file + rename. No external database required.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/thedoctormes-hue/myrmex-control.git
cd myrmex-control

# Install dependencies
npm install

# Start in development mode (both client + server)
npm run dev
```

The dev server starts two processes concurrently:
- **Vite dev server** — `http://localhost:5173` (frontend with HMR)
- **Express API server** — `http://localhost:3000` (backend with watch mode)

### Production Build

```bash
# Build both client and server
npm run build

# Start production server
npm start
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin for API requests |
| `SETUP_TOKEN` | *(none)* | Required for initial admin registration |
| `JWT_SECRET` | *(none)* | Secret for JWT signing (auto-generated if absent) |
| `TELEGRAM_BOT_TOKEN` | *(none)* | Telegram bot token for TWA authentication |
| `MYRMEX_PASSWORD` | *(none)* | Plaintext password (set via /api/auth/setup) |
| `NODE_ENV` | `development` | Set to `production` for HSTS and secure cookies |

## 📁 Project Structure

```
myrmex-control/
├── src/
│   ├── __tests__/               # 145 tests (Vitest)
│   ├── client/                  # React frontend (FSD architecture)
│   │   ├── app/                 # App shell: routing, providers, entry
│   │   │   ├── App.tsx          # Root component with routing
│   │   │   ├── main.tsx         # React entry point
│   │   │   ├── index.html       # HTML entry point
│   │   │   ├── index.css        # Tailwind + custom theme
│   │   │   └── tokens.css       # CSS custom properties
│   │   ├── pages/               # Route-level page components
│   │   │   ├── Dashboard.tsx    # Main dashboard
│   │   │   ├── Board.tsx        # Kanban board
│   │   │   ├── Projects.tsx     # Project management
│   │   │   ├── Library.tsx      # Artifact library
│   │   │   ├── Files.tsx        # File exchange
│   │   │   ├── Graph.tsx        # Dependency graph
│   │   │   ├── Analytics.tsx    # Analytics & metrics
│   │   │   ├── AuditLog.tsx     # Audit log viewer
│   │   │   ├── Login.tsx        # Login page
│   │   │   └── Setup.tsx        # Initial setup
│   │   ├── features/            # Feature modules
│   │   │   └── dashboard/       # HealthScore, BalanceWidget, etc.
│   │   └── shared/              # Shared utilities
│   │       ├── ui/              # Sidebar, BottomBar, ToastContainer
│   │       ├── hooks/           # useMyrmex, useTheme, useToast
│   │       ├── lib/             # api.ts, i18n.ts, twa.ts
│   │       └── types.ts         # Re-exported shared types
│   ├── server/                  # Express backend
│   │   ├── api/                 # Route handlers
│   │   │   ├── tasks.ts         # Task CRUD
│   │   │   ├── projects.ts      # Project CRUD
│   │   │   ├── library.ts       # Artifact library CRUD
│   │   │   ├── files.ts         # File exchange
│   │   │   ├── servers.ts       # Server monitoring
│   │   │   ├── agents.ts        # Agent management
│   │   │   ├── analytics.ts     # Analytics data
│   │   │   ├── audit.ts         # Audit log
│   │   │   ├── state.ts         # Global state read/write
│   │   │   ├── settings.ts      # Settings management
│   │   │   ├── health.ts        # Health score endpoint
│   │   │   └── backup.ts        # Backup create/list/restore
│   │   ├── auth.ts              # Auth: login, setup, TWA, change-password
│   │   ├── middleware.ts        # Rate limiter + auth lockout + error logger
│   │   ├── myrmex.ts            # Async JSON DB read/write + cache + audit log
│   │   ├── watchdog.ts          # Background server monitoring
│   │   ├── validation/          # Zod schemas + validate middleware
│   │   └── index.ts             # Express app entry point
│   └── shared/
│       └── types.ts             # Shared TypeScript interfaces
├── docs/                        # Documentation
│   ├── adr/                     # Architecture Decision Records
│   └── api/openapi.yaml         # OpenAPI 3.0 specification
├── public/                      # Static assets & PWA icons
├── dist/                        # Build output
│   ├── client/                  # Built frontend
│   └── server/                  # Built backend
├── myrmex.json                  # Primary database file
├── myrmex-demo.json             # Demo database snapshot
├── myrmex-demo-seed.json        # Demo seed data
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind theme (navy + amber)
├── tsconfig.json                # Base TypeScript config
├── tsconfig.client.json         # Client-specific TS config
├── tsconfig.server.json         # Server-specific TS config
└── package.json
```

## 🔌 API Reference

### Authentication
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/setup` | ❌ | Initial admin registration (requires SETUP_TOKEN) |
| `POST` | `/api/auth/login` | ❌ | Login with credentials |
| `POST` | `/api/auth/refresh` | ❌ | Refresh access token |
| `POST` | `/api/auth/logout` | ✅ | Revoke refresh token |
| `GET` | `/api/auth/status` | ❌ | Check auth state |
| `POST` | `/api/auth/totp/setup` | ✅ | Configure TOTP 2FA |
| `POST` | `/api/auth/totp/verify` | ✅ | Verify TOTP code |
| `POST` | `/api/auth/twa` | ❌ | Telegram Web App authentication |
| `POST` | `/api/auth/change-password` | ✅ | Change user password (bcrypt) |

### State
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/state` | ✅ | Read full application state |
| `GET` | `/api/version` | ❌ | Server version (for client update check) |

### Tasks (Kanban)
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | ✅ | List all tasks |
| `POST` | `/api/tasks` | ✅ | Create a task |
| `PUT` | `/api/tasks/:id` | ✅ | Update a task |
| `DELETE` | `/api/tasks/:id` | ✅ | Delete a task |

### Projects
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/projects` | ✅ | List all projects |
| `POST` | `/api/projects` | ✅ | Create a project |
| `PUT` | `/api/projects/:id` | ✅ | Update a project |
| `DELETE` | `/api/projects/:id` | ✅ | Delete a project |

### Library
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/library` | ✅ | List library items |
| `POST` | `/api/library` | ✅ | Add library item |
| `PUT` | `/api/library/:id` | ✅ | Update library item |
| `DELETE` | `/api/library/:id` | ✅ | Delete library item |

### File Exchange
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/files` | ✅ | List files (inbox/outbox) |
| `POST` | `/api/files` | ✅ | Upload/send a file |
| `DELETE` | `/api/files/:id` | ✅ | Delete a file |

### Servers
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/servers` | ✅ | List monitored servers |
| `POST` | `/api/servers` | ✅ | Add a server to monitor |
| `PUT` | `/api/servers/:id` | ✅ | Update server entry |
| `DELETE` | `/api/servers/:id` | ✅ | Remove server |

### Analytics & Audit
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics` | ✅ | Get analytics data |
| `GET` | `/api/audit` | ✅ | Get audit log entries |

### Agents
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/agents` | ✅ | List all agents |
| `GET` | `/api/agents/:id` | ✅ | Get agent by ID |
| `POST` | `/api/agents` | ✅ | Create agent |
| `PUT` | `/api/agents/:id` | ✅ | Update agent |
| `DELETE` | `/api/agents/:id` | ✅ | Delete agent |

### Settings
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/settings` | ✅ | Read settings |
| `PUT` | `/api/settings` | ✅ | Update settings |

### Backup
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/backup/create` | ✅ | Create backup |
| `GET` | `/api/backup/list` | ✅ | List backups |
| `POST` | `/api/backup/restore` | ✅ | Restore from backup |

### System
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | ❌ | Health check (uptime, timestamp) |
| `GET` | `/api/health/score` | ❌ | Aggregated health score (0-100) |
| `GET` | `/api/version` | ❌ | Server version (for client update check) |

## 📚 Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture overview: layers, components, data flow |
| [docs/adr/](docs/adr/index.md) | Architecture Decision Records |
| [docs/api/openapi.yaml](docs/api/openapi.yaml) | OpenAPI 3.0 API specification |
| [GETTING_STARTED.md](GETTING_STARTED.md) | Developer onboarding guide |
| [SECURITY.md](SECURITY.md) | Security policy and vulnerability reporting |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [CHANGELOG.md](CHANGELOG.md) | Version history and backlog |

## 🚢 Deployment

### Production Instance

```bash
npm run build
# Deploy dist/client/* to your web server (e.g. Nginx)
# Deploy dist/server/* to your app server
# Restart the service manager (systemd, pm2, etc.)
```

### Demo Instance

```bash
npm run build
# Deploy dist/client/* to your web server
# Deploy dist/server/* to your app server
# Restart the service manager
```

### Systemd Services

| Service | Instance | Purpose |
|---|---|---|
| `myrmex-control` | Production | Full auth dashboard |
| `myrmex-demo` | Demo | Open demo instance |
| `myrmex-demo-reset` | Demo | Hourly demo data reset (timer) |

Manage with:
```bash
systemctl status myrmex-control
journalctl -u myrmex-control -f
```

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0a0e1a` | Deep navy background |
| `--bg-secondary` | `#111827` | Card/panel backgrounds |
| `--accent` | `#f59e0b` | Amber primary accent |
| `--accent-hover` | `#d97706` | Amber hover state |
| `--text-primary` | `#f1f5f9` | Primary text |
| `--text-secondary` | `#94a3b8` | Secondary/muted text |

**Logo:** Bug icon from [Lucide Icons](https://lucide.dev/)

## ⚖️ Trade-offs

Every design decision has a cost. Here's what we gave up and why:

| Decision | What we lose | Why it's worth it |
|---|---|---|
| JSON file as DB | SQL queries, concurrent writes, indexing | Zero-config, human-readable, sufficient for single-user |
| File-based sessions | Horizontal scaling, survive restarts | Simplicity, no Redis, instant invalidation |
| In-memory rate limiting | Works behind proxy, multi-instance | Zero dependencies, fast, enough for personal dashboard |
| No SSR/SSG | SEO (not needed for a dashboard) | Simpler architecture, no framework lock-in |
| Sync → Async I/O | Slightly more complex code | Non-blocking file ops, better concurrency |

## 🗺️ Roadmap

### v1.0 — Foundation ✅
- [x] Full-stack React + Express architecture
- [x] JSON file-based database with atomic writes
- [x] JWT authentication with refresh token rotation
- [x] TOTP two-factor authentication
- [x] RBAC (admin/operator/viewer)
- [x] Kanban board, Projects, Library, Files, Servers
- [x] Analytics page, Audit log viewer, Dependency graph
- [x] Health Score dashboard widget
- [x] PWA with offline support and auto-update
- [x] Telegram Web App integration
- [x] i18n (EN + RU)
- [x] Demo mode with nginx header detection
- [x] Rate limiting, security headers, error logging
- [x] 145 tests, 94%+ coverage
- [x] CI/CD pipeline with quality gates
- [x] Architecture documentation + ADR

### v1.1 — Hardening ✅
- [x] Zod validation on all POST/PUT endpoints
- [x] Auth rate limiting + account lockout
- [x] TWA security hardening (timingSafeEqual, replay protection)
- [x] Async I/O + in-memory caching
- [x] Automated backup system (systemd timer)
- [x] Secure secrets generation
- [x] UX fixes (ARIA, confirm dialogs, navigation)
- [x] CSP headers for Telegram Web App

### v1.2 — Polish 🚧
- [ ] Visual design overhaul (animations, cards, charts, empty states)
- [ ] Smart auto-refresh (visibilitychange, WebSocket, adaptive interval)
- [ ] Docker Compose deployment
- [ ] Automated demo instance deployment
- [ ] Monitoring dashboard + alerting
- [ ] CDN and VPN integration

### v2.0 — Scale 📋
- [ ] PostgreSQL backend option
- [ ] WebSocket real-time updates
- [ ] Multi-colony support
- [ ] Plugin system for custom widgets
- [ ] OpenRouter balance integration

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Evgeny (DoctorM)** — physician, developer, AI evangelist.

Part of the [LabDoctorM](https://github.com/thedoctormes-hue) laboratory.

---

<p align="center">
  <em>Built with 🧠 and ☕ by the DoctorM&Ai team</em>
</p>
