# 🐜 Myrmex Control

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇬🇧-English-2ea043?style=flat-square" alt="English"></a>
  <a href="README.ru.md"><img src="https://img.shields.io/badge/🇷🇺-Русский-2ea043?style=flat-square" alt="Русский"></a>
  <a href="README.zh.md"><img src="https://img.shields.io/badge/🇨🇳-中文-2ea043?style=flat-square" alt="中文"></a>
</p>

<p align="center">
  <strong>Hive Control Center — пульт управления муравейником агентов</strong>
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
  <img src="https://img.shields.io/badge/Version-0.1.0-amber?style=flat-square" alt="v0.1.0">
  <img src="https://img.shields.io/github/actions/workflow/status/doctormai/myrmex-control/ci.yml?branch=main&label=CI&style=flat-square" alt="CI">
  <img src="https://img.shields.io/badge/coverage-94%25-brightgreen?style=flat-square" alt="Coverage">
  <img src="https://img.shields.io/badge/tests-141%20passing-brightgreen?style=flat-square" alt="Tests">
</p>

---

<!-- ![Myrmex Control Dashboard](docs/screenshot.png) -->

## 📖 Description

**Myrmex Control** is a full-stack management dashboard for AI agents — a "hive control center" that gives you a single pane of glass over your entire agent infrastructure. Built with a deep navy color palette and amber accents, it combines a React 19 frontend with an Express 4 backend, using JSON files as a lightweight database.

The name *Myrmex* (μύρμηξ) is Greek for "ant" — a nod to the project's purpose: managing a colony of AI agents working together like an ant hive.

Two instances are deployed:
- **[myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru)** — production instance with full authentication
- **[demo.shtab-ai.ru](https://demo.shtab-ai.ru)** — demo mode, no login required

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Dashboard** | Real-time overview with balance, server status, and signals feed widgets |
| 📋 **Kanban Board** | Drag-and-drop task management with customizable columns |
| 📁 **Project Management** | Create, organize, and track projects with status and metadata |
| 📚 **Library** | Browse and manage skills, hooks, and agent configurations |
| 📂 **File Exchange** | Inbox/outbox file sharing between agents and operators |
| 🕸️ **Graph Visualization** | Text-based dependency graph (D3.js interactive graph coming in v0.2) |
| 🔐 **Authentication** | Cookie-based sessions with 24h TTL, first-time setup flow |
| 🎭 **Demo Mode** | Instant demo instance without authentication |
| 🌐 **i18n** | Full Russian (RU) and English (EN) localization |
| 🔔 **Toast Notifications** | Real-time feedback for user actions |
| 🛡️ **Rate Limiting** | 100 requests/minute per IP |
| 🔒 **Security Headers** | HSTS, CSP, and other hardening headers |
| 💾 **Auto-Backup** | Hourly backups of state, keeping last 10 snapshots |
| 🐕 **Watchdog** | Background server monitoring (5-min checks) and balance alerts |

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
| proper-lockfile | 4.1.2 | File locking for JSON DB |

### Database
**JSON file-based** — `myrmex.json` serves as the single source of truth. File locking via `proper-lockfile` ensures safe concurrent access. No external database required.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/doctormai/myrmex-control.git
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
| `MYRMEX_PASSWORD` | *(none)* | Admin password (set via setup UI or `.env`) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin for API requests |
| `NODE_ENV` | `development` | Set to `production` for HSTS and secure cookies |

## 📁 Project Structure

```
myrmex-control/
├── src/
│   ├── client/                  # React frontend
│   │   ├── components/
│   │   │   ├── dashboard/       # BalanceWidget, ServerWidget, SignalsFeed
│   │   │   ├── layout/          # Sidebar, BottomBar
│   │   │   ├── tasks/           # (empty — reserved for future)
│   │   │   ├── shared/          # (empty — reserved for future)
│   │   │   └── ui/              # CatMascot, ErrorBanner, ToastContainer
│   │   ├── hooks/               # useMyrmex, useTheme, useToast
│   │   ├── lib/                 # api.ts, i18n.tsx
│   │   ├── pages/               # Dashboard, Board, Projects, Library,
│   │   │                        # Files, Graph, Login, Setup
│   │   ├── public/              # favicon.svg
│   │   ├── App.tsx              # Root component with routing
│   │   ├── index.html           # HTML entry point
│   │   ├── main.tsx             # React entry point
│   │   └── index.css            # Tailwind imports + custom theme
│   ├── server/                  # Express backend
│   │   ├── api/                 # Route handlers
│   │   │   ├── tasks.ts         # Task CRUD
│   │   │   ├── projects.ts      # Project CRUD
│   │   │   ├── library.ts       # Skills/hooks/agents library
│   │   │   ├── files.ts         # File exchange (inbox/outbox)
│   │   │   ├── servers.ts       # Server monitoring
│   │   │   └── state.ts         # Global state read/write
│   │   ├── auth.ts              # Password setup, login, sessions
│   │   ├── backup.ts            # Hourly auto-backup scheduler
│   │   ├── demo-sim.ts          # Demo mode data simulator
│   │   ├── middleware.ts        # Rate limiter + error logger
│   │   ├── myrmex.ts            # JSON DB read/write + audit log
│   │   ├── watchdog.ts          # Background server monitoring
│   │   └── index.ts             # Express app entry point
│   └── shared/
│       └── types.ts             # Shared TypeScript interfaces
├── backups/                     # Auto-generated backup files
├── logs/                        # Error logs
├── myrmex.json                  # Primary database file
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind theme (navy + amber)
├── postcss.config.js            # PostCSS configuration
├── tsconfig.json                # Base TypeScript config
├── tsconfig.client.json         # Client-specific TS config
├── tsconfig.server.json         # Server-specific TS config
└── package.json
```

## 🔌 API Endpoints

### Authentication
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/setup` | ❌ | First-time password setup |
| `POST` | `/api/auth/login` | ❌ | Login with password |
| `POST` | `/api/auth/logout` | ❌ | Clear session cookie |
| `GET` | `/api/auth/status` | ❌ | Check auth state |

### State
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/state` | ✅ | Read full application state |
| `PUT` | `/api/state` | ✅ | Write application state |

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

### System
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | ❌ | Health check (uptime, timestamp) |

## 📚 Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Архитектурный обзор: слои, компоненты, data flow |
| [docs/adr/](docs/adr/index.md) | Architecture Decision Records — ключевые решения |
| [docs/api/openapi.yaml](docs/api/openapi.yaml) | OpenAPI 3.0 спецификация API |
| [GETTING_STARTED.md](GETTING_STARTED.md) | Гайд для новых разработчиков |

## 🚢 Deployment

### Production Instance (with auth)

```bash
npm run build
# Deploy dist/client/* to your web server (e.g. Nginx)
# Deploy dist/server/* to your app server
# Restart the service manager (systemd, pm2, etc.)
```

Deployed at: **[myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru)**

### Demo Instance (no auth)

```bash
npm run build
# Deploy dist/client/* to your web server
# Deploy dist/server/* to your app server with DEMO_MODE=true
# Restart the service manager
```

Deployed at: **[demo.shtab-ai.ru](https://demo.shtab-ai.ru)**

### Systemd Services (example)

| Service | Instance | Purpose |
|---|---|---|
| `myrmex-control` | Production | Full auth dashboard |
| `myrmex-demo` | Demo | Open demo instance |

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
**Mascot:** 🐱 Cat (ЗавЛаб's mascot)

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](https://github.com/doctormai/LabDoctorM/blob/main/LICENSE) file for details.

## 👤 Author

**ЗавЛаб (Evgeny)** — medic, developer, AI evangelist.

Part of the [LabDoctorM](https://github.com/doctormai/LabDoctorM) laboratory.

---

<p align="center">
  <em>Built with 🧠 and ☕ by the Doctorm&Ai team</em>
</p>
