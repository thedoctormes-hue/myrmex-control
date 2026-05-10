# 🐜 Myrmex Control

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇬🇧-English-2ea043?style=flat-square" alt="English"></a>
  <a href="README.ru.md"><img src="https://img.shields.io/badge/🇷🇺-Русский-2ea043?style=flat-square" alt="Русский"></a>
  <a href="README.zh.md"><img src="https://img.shields.io/badge/🇨🇳-中文-2ea043?style=flat-square" alt="中文"></a>
</p>

<p align="center">
  <strong>Hive Control Center — AI 智能体蜂巢控制中心</strong>
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
  <img src="https://img.shields.io/badge/Version-1.0.0-amber?style=flat-square" alt="v1.0.0">
  <img src="https://img.shields.io/github/actions/workflow/status/doctormai/myrmex-control/ci.yml?branch=main&label=CI&style=flat-square" alt="CI">
  <img src="https://img.shields.io/badge/coverage-94%25-brightgreen?style=flat-square" alt="Coverage">
  <img src="https://img.shields.io/badge/tests-141%20passing-brightgreen?style=flat-square" alt="Tests">
</p>

---

## 📋 目录

- [项目简介](#-项目简介)
- [为什么创建这个项目](#-为什么创建这个项目)
- [功能特性](#-功能特性)
- [设计权衡](#-设计权衡)
- [路线图](#-路线图)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [API 接口](#-api-接口)
- [文档](#-文档)
- [部署](#-部署)
- [设计系统](#-设计系统)
- [许可证](#-许可证)
- [作者](#-作者)

## 📖 项目简介

**Myrmex Control** 是一个全栈 AI 智能体管理仪表盘——"蜂巢控制中心"，为整个智能体基础设施提供统一视图。采用深海军蓝配色和琥珀色点缀，React 19 前端 + Express 4 后端，使用 JSON 文件作为轻量级数据库。

*Myrmex*（μύρμηξ）在希腊语中意为"蚂蚁"——寓意项目目标：像管理蚁群一样协调多个 AI 智能体协同工作。

两个实例已部署：
- **[myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru)** — 生产实例，完整认证
- **[demo.shtab-ai.ru](https://demo.shtab-ai.ru)** — 演示模式，无需登录

## 🤔 为什么创建这个项目

管理多个 AI 智能体——每个都有自己的任务、配置和状态——很快就会变得混乱。现有解决方案要么过于复杂（Kubernetes 仪表盘），要么过于简单（电子表格）。

Myrmex Control 填补了这一空白：一个**单文件数据库**仪表盘，功能强大到足以实用，简单到一条命令即可部署，代码整洁到可以作为作品集展示。

**设计理念：**
- **零外部依赖** — 不需要 PostgreSQL、Redis、Docker
- **单一数据源** — 一个 `myrmex.json` 文件存储一切
- **人类可读** — 用任何文本编辑器打开即可查看
- **随处可部署** — Node.js + 一条 `npm start`

## ⚖️ 设计权衡

| 决策 | 失去什么 | 为什么值得 |
|---|---|---|
| JSON 文件作为数据库 | SQL 查询、并发写入、索引 | 零配置、人类可读、单用户足够 |
| Cookie 会话 | 水平扩展、重启保持 | 简单、无需 JWT、即时失效 |
| 内存限流 | 代理后可用、多实例 | 零依赖、快速、个人仪表盘够用 |
| 无 SSR/SSG | SEO（仪表盘不需要） | 架构更简单、无框架锁定 |
| 最小化输入验证 | 运行时类型安全 | v0.1 权衡——v0.2 可加入 Zod |
| CSP 中 CSS `'unsafe-inline'` | XSS 防护缺口 | Tailwind 需要——认证仪表盘可接受 |

## 🗺️ 路线图

### v0.1 — 基础 ✅
- [x] 全栈 React + Express 架构
- [x] JSON 文件数据库，原子写入
- [x] Cookie 认证 + 演示模式
- [x] 看板、项目、资料库、文件、服务器
- [x] 限流、安全头、错误日志
- [x] 141 个测试，94%+ 覆盖率
- [x] CI/CD + 质量门禁
- [x] 架构文档 + ADR

### v0.2 — 智能化 🚧
- [ ] WebSocket 实时更新（替代轮询）
- [ ] 健康评分仪表盘组件
- [ ] 分析页面（智能体效率、任务速度）
- [ ] 审计日志查看器
- [ ] D3.js 交互式依赖图
- [ ] OpenRouter 余额集成

### v1.0 — 生产就绪 📋
- [ ] JWT 刷新令牌轮换
- [ ] TOTP 双因素认证
- [ ] RBAC（基于角色的访问控制）
- [ ] PWA 离线支持
- [ ] Telegram Web App 集成
- [ ] Docker Compose 部署
- [ ] 演示实例自动部署

## ✨ 功能特性

| 功能 | 描述 |
|---|---|
| 📊 **仪表盘** | 实时概览：余额、服务器状态、信号流 |
| 📋 **看板** | 拖拽式任务管理，可自定义列 |
| 📁 **项目管理** | 创建、组织和跟踪项目 |
| 📚 **资料库** | 浏览和管理技能、钩子、智能体配置 |
| 📂 **文件交换** | 智能体与操作员之间的收/发件箱 |
| 🕸️ **依赖图** | 文本依赖图（D3.js 交互式图表将在 v0.2 推出） |
| 🔐 **认证** | Cookie 会话，24 小时 TTL，首次设置流程 |
| 🎭 **演示模式** | 无需认证的即时演示实例 |
| 🌐 **国际化** | 完整俄语 (RU) 和英语 (EN) 本地化 |
| 🔔 **通知** | 实时 Toast 通知 |
| 🛡️ **限流** | 每 IP 每分钟 100 次请求 |
| 🔒 **安全头** | HSTS、CSP 等安全加固头 |
| 🐕 **看门狗** | 后台服务器监控（5 分钟 TCP 检查） |

## 🛠 技术栈

### 前端
| 技术 | 版本 | 用途 |
|---|---|---|
| React | 19 | UI 框架 |
| TypeScript | 5.6 | 类型安全 |
| Vite | 6 | 构建工具 & 开发服务器 |
| Tailwind CSS | 3.4 | 样式 |
| React Router DOM | 7 | 客户端路由 |
| Lucide React | 1.14 | 图标库 |

### 后端
| 技术 | 版本 | 用途 |
|---|---|---|
| Express | 4 | HTTP 服务器 |
| TypeScript | 5.6 | 类型安全 |
| tsx | 4.19 | 运行时 TS 执行 |
| cookie-parser | 1.4.7 | 会话管理 |
| cors | 2.8.5 | 跨域支持 |
| proper-lockfile | 4.1.2 | JSON 数据库文件锁 |

### 数据库
**JSON 文件型** — `myrmex.json` 作为单一数据源。通过 `proper-lockfile` 文件锁确保并发安全。无需外部数据库。

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 9+

### 安装

```bash
git clone https://github.com/doctormai/myrmex-control.git
cd myrmex-control
npm install
npm run dev
```

开发服务器同时启动两个进程：
- **Vite 开发服务器** — `http://localhost:5173`（前端 + HMR）
- **Express API 服务器** — `http://localhost:3000`（后端 + watch 模式）

### 生产构建

```bash
npm run build
npm start
```

### 环境变量

| 变量 | 默认值 | 描述 |
|---|---|---|
| `PORT` | `3000` | 服务器端口 |
| `MYRMEX_PASSWORD` | *(无)* | 管理员密码（通过 UI 设置） |
| `CORS_ORIGIN` | `http://localhost:5173` | 允许的 CORS 来源 |
| `NODE_ENV` | `development` | `production` 启用 HSTS 和安全 cookies |

## 📁 项目结构

```
myrmex-control/
├── src/
│   ├── client/                  # React 前端
│   │   ├── components/
│   │   │   ├── dashboard/       # BalanceWidget, ServerWidget, SignalsFeed
│   │   │   ├── layout/          # Sidebar, BottomBar
│   │   │   ├── ui/              # CatMascot, ErrorBanner, ToastContainer
│   │   ├── hooks/               # useMyrmex, useTheme, useToast
│   │   ├── lib/                 # api.ts, i18n.tsx
│   │   ├── pages/               # Dashboard, Board, Projects, Library...
│   │   ├── App.tsx              # 根组件 + 路由
│   │   ├── main.tsx             # React 入口
│   │   └── index.css            # Tailwind + 自定义样式
│   ├── server/                  # Express 后端
│   │   ├── api/                 # 路由处理器
│   │   │   ├── tasks.ts         # 任务 CRUD
│   │   │   ├── projects.ts      # 项目 CRUD
│   │   │   ├── library.ts       # 技能/钩子/智能体资料库
│   │   │   ├── files.ts         # 文件交换（收件箱/发件箱）
│   │   │   ├── servers.ts       # 服务器监控
│   │   │   └── state.ts         # 全局状态读写
│   │   ├── auth.ts              # 密码设置、登录、会话
│   │   ├── middleware.ts        # 限流 + 错误日志
│   │   ├── myrmex.ts            # JSON 数据库读写 + 审计日志
│   │   ├── watchdog.ts          # 后台服务器监控
│   │   └── index.ts             # Express 应用入口
│   └── shared/
│       └── types.ts             # 共享 TypeScript 接口
├── logs/                        # 错误日志
├── myrmex.json                  # 主数据库文件
├── vite.config.ts               # Vite 配置
├── tailwind.config.js           # Tailwind 主题（深蓝 + 琥珀）
├── tsconfig.json                # TypeScript 基础配置
├── tsconfig.client.json         # 客户端 TS 配置
├── tsconfig.server.json         # 服务端 TS 配置
└── package.json
```

## 🔌 API 接口

### 认证
| 方法 | 路径 | 认证 | 描述 |
|---|---|---|---|
| `POST` | `/api/auth/setup` | ❌ | 首次密码设置 |
| `POST` | `/api/auth/login` | ❌ | 密码登录 |
| `POST` | `/api/auth/logout` | ❌ | 清除会话 cookie |
| `GET` | `/api/auth/status` | ❌ | 检查认证状态 |

### 状态
| 方法 | 路径 | 认证 | 描述 |
|---|---|---|---|
| `GET` | `/api/state` | ✅ | 读取完整应用状态 |
| `PUT` | `/api/state` | ✅ | 写入应用状态 |

### 任务（看板）
| 方法 | 路径 | 认证 | 描述 |
|---|---|---|---|
| `GET` | `/api/tasks` | ✅ | 获取所有任务 |
| `POST` | `/api/tasks` | ✅ | 创建任务 |
| `PUT` | `/api/tasks/:id` | ✅ | 更新任务 |
| `DELETE` | `/api/tasks/:id` | ✅ | 删除任务 |

### 项目
| 方法 | 路径 | 认证 | 描述 |
|---|---|---|---|
| `GET` | `/api/projects` | ✅ | 获取所有项目 |
| `POST` | `/api/projects` | ✅ | 创建项目 |
| `PUT` | `/api/projects/:id` | ✅ | 更新项目 |
| `DELETE` | `/api/projects/:id` | ✅ | 删除项目 |

### 资料库
| 方法 | 路径 | 认证 | 描述 |
|---|---|---|---|
| `GET` | `/api/library` | ✅ | 获取资料库条目 |
| `POST` | `/api/library` | ✅ | 添加条目 |
| `PUT` | `/api/library/:id` | ✅ | 更新条目 |
| `DELETE` | `/api/library/:id` | ✅ | 删除条目 |

### 文件交换
| 方法 | 路径 | 认证 | 描述 |
|---|---|---|---|
| `GET` | `/api/files` | ✅ | 列出文件（收件箱/发件箱） |

### 服务器
| 方法 | 路径 | 认证 | 描述 |
|---|---|---|---|
| `GET` | `/api/servers` | ✅ | 列出监控的服务器 |
| `POST` | `/api/servers` | ✅ | 添加服务器 |
| `PUT` | `/api/servers/:id` | ✅ | 更新服务器 |
| `DELETE` | `/api/servers/:id` | ✅ | 移除服务器 |

### 系统
| 方法 | 路径 | 认证 | 描述 |
|---|---|---|---|
| `GET` | `/api/health` | ❌ | 健康检查（运行时间、时间戳） |

## 📚 文档

| 文档 | 描述 |
|---|---|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | 架构概览：层次、组件、数据流 |
| [docs/adr/](../docs/adr/index.md) | 架构决策记录 |
| [docs/api/openapi.yaml](../docs/api/openapi.yaml) | OpenAPI 3.0 API 规范 |
| [GETTING_STARTED.md](../GETTING_STARTED.md) | 新开发者指南 |

## 🚢 部署

### 生产实例（带认证）

```bash
npm run build
# 部署 dist/client/* 到 Web 服务器（如 Nginx）
# 部署 dist/server/* 到应用服务器
# 重启 systemd/pm2
```

部署于：**[myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru)**

### 演示实例（无认证）

```bash
npm run build
# 部署 dist/client/* 到 Web 服务器
# 部署 dist/server/* 到应用服务器（DEMO_MODE=true）
# 重启 systemd/pm2
```

部署于：**[demo.shtab-ai.ru](https://demo.shtab-ai.ru)**

### Systemd 服务

| 服务 | 实例 | 用途 |
|---|---|---|
| `myrmex-control` | 生产 | 完整认证仪表盘 |
| `myrmex-demo` | 演示 | 开放演示实例 |

管理命令：
```bash
systemctl status myrmex-control
journalctl -u myrmex-control -f
```

## 🎨 设计系统

| 变量 | 值 | 用途 |
|---|---|---|
| `--bg-primary` | `#0a0e1a` | 深海军蓝背景 |
| `--bg-secondary` | `#111827` | 卡片/面板背景 |
| `--accent` | `#f59e0b` | 琥珀色主强调色 |
| `--accent-hover` | `#d97706` | 琥珀色悬停状态 |
| `--text-primary` | `#f1f5f9` | 主要文本 |
| `--text-secondary` | `#94a3b8` | 次要/弱化文本 |

**Logo:** Bug icon 来自 [Lucide Icons](https://lucide.dev/)
**吉祥物:** 🐱 猫（ЗавЛаб 的吉祥物）

## 📜 许可证

本项目基于 **MIT License** 授权 — 详见 [LICENSE](https://github.com/doctormai/LabDoctorM/blob/main/LICENSE) 文件。

## 👤 作者

**ЗавЛаб (Evgeny)** — 医生、开发者、AI 布道者。

[LabDoctorM](https://github.com/doctormai/LabDoctorM) 实验室的一部分。

---

<p align="center">
  <em>由 Doctorm&Ai 团队用 🧠 和 ☕ 构建</em>
</p>
