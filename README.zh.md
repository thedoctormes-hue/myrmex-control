# 🐜 Myrmex Control

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇬🇧-English-2ea043?style=flat-square" alt="English"></a>
  <a href="README.ru.md"><img src="https://img.shields.io/badge/🇷🇺-Русский-2ea043?style=flat-square" alt="Русский"></a>
  <a href="README.zh.md"><img src="https://img.shields.io/badge/🇨🇳-中文-2ea043?style=flat-square" alt="中文"></a>
</p>

<p align="center">
  <strong>AI 智能体集群管理仪表盘</strong>
</p>

<p align="center">
  <a href="https://myrmexcontrol.shtab-ai.ru"><img src="https://img.shields.io/badge/在线演示-myrmexcontrol.shtab--ai.ru-amber?style=for-the-badge" alt="Live Demo"></a>
  <a href="https://demo.shtab-ai.ru"><img src="https://img.shields.io/badge/演示实例-demo.shtab--ai.ru-amber?style=for-the-badge" alt="Demo"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white" alt="Express 4">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/Version-1.1.0-amber?style=flat-square" alt="v1.1.0">
  <img src="https://img.shields.io/github/actions/workflow/status/thedoctormes-hue/myrmex-control/ci.yml?branch=master&label=CI&style=flat-square" alt="CI">
  <img src="https://img.shields.io/badge/coverage-94%25-brightgreen?style=flat-square" alt="Coverage">
  <img src="https://img.shields.io/badge/tests-145%20passing-brightgreen?style=flat-square" alt="Tests">
</p>

---

<p align="center">
  <a href="https://tgminiappmyrmex.shtab-ai.ru"><img src="https://img.shields.io/badge/✈️%20Telegram%20Web%20App-tgminiappmyrmex.shtab--ai.ru-blue?style=for-the-badge&logo=telegram" alt="TWA"></a>
</p>

## 📋 目录

- [项目简介](#-项目简介)
- [为什么创建这个项目](#-为什么创建这个项目)
- [功能特性](#-功能特性)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [API 接口](#-api-接口)
- [文档](#-文档)
- [部署](#-部署)
- [设计系统](#-设计系统)
- [设计权衡](#-设计权衡)
- [路线图](#-路线图)
- [许可证](#-许可证)
- [作者](#-作者)

## 📖 项目简介

**Myrmex Control** 是一个全栈 AI 智能体集群管理仪表盘——为整个智能体基础设施提供统一视图。采用深海军蓝配色和琥珀色点缀，React 19 前端 + Express 4 后端，使用 JSON 文件作为轻量级数据库。

*Myrmex*（μύρμηξ）在希腊语中意为"蚂蚁"——寓意项目目标：像管理蚁群一样协调多个 AI 智能体协同工作。

### 在线实例

| 实例 | 链接 | 认证 |
|---|---|---|
| 生产环境 | [myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru) | JWT + TOTP 2FA |
| 演示 | [demo.shtab-ai.ru](https://demo.shtab-ai.ru) | 无需认证 |
| Telegram Web App | [tgminiappmyrmex.shtab-ai.ru](https://tgminiappmyrmex.shtab-ai.ru) | JWT + TOTP 2FA |

## 🤔 为什么创建这个项目

管理多个 AI 智能体——每个都有自己的任务、配置和状态——很快就会变得混乱。现有解决方案要么过于复杂（Kubernetes 仪表盘），要么过于简单（电子表格）。

Myrmex Control 填补了这一空白：一个**单文件数据库**仪表盘，功能强大到足以实用，简单到一条命令即可部署，代码整洁到可以作为作品集展示。

**设计理念：**
- **零外部依赖** — 不需要 PostgreSQL、Redis、Docker
- **单一数据源** — 一个 `myrmex.json` 文件存储一切
- **人类可读** — 用任何文本编辑器打开即可查看
- **随处可部署** — Node.js + 一条 `npm start`

## ✨ 功能特性

| 功能 | 描述 |
|---|---|
| 📊 **仪表盘** | 实时概览：健康评分、服务器状态、信号流 |
| 📋 **看板** | 拖拽式任务管理，可自定义列 |
| 📁 **项目管理** | 创建、组织和跟踪项目 |
| 📚 **制品库** | 管理技能、钩子、卡片、配置和知识库条目 |
| 📂 **文件交换** | 智能体与操作员之间的收/发件箱 |
| 🕸️ **依赖图** | D3.js 交互式依赖关系可视化 |
| 📈 **数据分析** | 智能体效率指标、任务速度、燃尽图 |
| 📋 **审计日志** | 带过滤和搜索功能的完整变更日志浏览器 |
| 🔐 **认证** | JWT access + refresh 令牌、TOTP 双因素认证、RBAC（管理员/操作员/查看者） |
| 🎭 **演示模式** | 无需认证的即时演示实例 |
| 🌐 **国际化** | 完整英语 (EN) 和俄语 (RU) 本地化 |
| 📱 **PWA** | 可安装、支持离线、自动更新 |
| ✈️ **Telegram Web App** | 原生 Telegram Mini App 集成 |
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
| otpauth | 9.3.2 | TOTP 双因素认证 |

### 数据库
**JSON 文件型** — `myrmex.json` 作为单一数据源。通过临时文件 + rename 实现原子写入。无需外部数据库。

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 9+

### 安装

```bash
git clone https://github.com/thedoctormes-hue/myrmex-control.git
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
| `CORS_ORIGIN` | `http://localhost:5173` | 允许的 CORS 来源 |
| `SETUP_TOKEN` | *(无)* | 初始管理员注册所需 |
| `NODE_ENV` | `development` | `production` 启用 HSTS 和安全 cookies |

## 📁 项目结构

```
myrmex-control/
├── src/
│   ├── __tests__/               # 145 个测试 (Vitest)
│   ├── client/                  # React 前端 (FSD 架构)
│   │   ├── app/                 # 应用外壳：路由、提供者、入口
│   │   │   ├── App.tsx          # 根组件 + 路由
│   │   │   ├── main.tsx         # React 入口
│   │   │   ├── index.html       # HTML 入口
│   │   │   ├── index.css        # Tailwind + 自定义主题
│   │   │   └── tokens.css       # CSS 自定义属性
│   │   ├── pages/               # 页面级组件
│   │   │   ├── Dashboard.tsx    # 主仪表盘
│   │   │   ├── Board.tsx        # 看板
│   │   │   ├── Projects.tsx     # 项目管理
│   │   │   ├── Library.tsx      # 制品库
│   │   │   ├── Files.tsx        # 文件交换
│   │   │   ├── Graph.tsx        # 依赖图
│   │   │   ├── Analytics.tsx    # 数据分析
│   │   │   ├── AuditLog.tsx     # 审计日志
│   │   │   ├── Login.tsx        # 登录页
│   │   │   └── Setup.tsx        # 初始设置
│   │   ├── features/            # 功能模块
│   │   │   └── dashboard/       # HealthScore, BalanceWidget 等
│   │   └── shared/              # 共享工具
│   │       ├── ui/              # Sidebar, BottomBar, ToastContainer
│   │       ├── hooks/           # useMyrmex, useTheme, useToast
│   │       ├── lib/             # api.ts, i18n.ts, twa.ts
│   │       └── types.ts         # 重新导出的共享类型
│   ├── server/                  # Express 后端
│   │   ├── api/                 # 路由处理器
│   │   │   ├── tasks.ts         # 任务 CRUD
│   │   │   ├── projects.ts      # 项目 CRUD
│   │   │   ├── library.ts       # 制品库 CRUD
│   │   │   ├── files.ts         # 文件交换
│   │   │   ├── servers.ts       # 服务器监控
│   │   │   ├── analytics.ts     # 分析数据
│   │   │   ├── audit.ts         # 审计日志
│   │   │   └── state.ts         # 全局状态读写
│   │   ├── auth.ts              # JWT 认证、TOTP、RBAC
│   │   ├── middleware.ts        # 限流 + 错误日志
│   │   ├── myrmex.ts            # JSON 数据库读写 + 审计日志
│   │   ├── watchdog.ts          # 后台服务器监控
│   │   └── index.ts             # Express 应用入口
│   └── shared/
│       └── types.ts             # 共享 TypeScript 接口
├── docs/                        # 文档
│   ├── adr/                     # 架构决策记录
│   └── api/openapi.yaml         # OpenAPI 3.0 API 规范
├── public/                      # 静态资源和 PWA 图标
├── dist/                        # 构建输出
│   ├── client/                  # 构建后的前端
│   └── server/                  # 构建后的后端
├── myrmex.json                  # 主数据库文件
├── myrmex-demo.json             # 演示数据库快照
├── myrmex-demo-seed.json        # 演示重置种子数据
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
| `POST` | `/api/auth/setup` | ❌ | 初始管理员注册（需要 SETUP_TOKEN） |
| `POST` | `/api/auth/login` | ❌ | 账号密码登录 |
| `POST` | `/api/auth/refresh` | ❌ | 刷新访问令牌 |
| `POST` | `/api/auth/logout` | ✅ | 撤销刷新令牌 |
| `GET` | `/api/auth/status` | ❌ | 检查认证状态 |
| `POST` | `/api/auth/totp/setup` | ✅ | 配置 TOTP 2FA |
| `POST` | `/api/auth/totp/verify` | ✅ | 验证 TOTP 代码 |

### 状态
| 方法 | 路径 | 认证 | 描述 |
|---|---|---|---|
| `GET` | `/api/state` | ✅ | 读取完整应用状态 |
| `GET` | `/api/version` | ❌ | 服务器版本（用于客户端更新检查） |

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

### 制品库
| 方法 | 路径 | 认证 | 描述 |
|---|---|---|---|
| `GET` | `/api/library` | ✅ | 获取制品库条目 |
| `POST` | `/api/library` | ✅ | 添加条目 |
| `PUT` | `/api/library/:id` | ✅ | 更新条目 |
| `DELETE` | `/api/library/:id` | ✅ | 删除条目 |

### 文件交换
| 方法 | 路径 | 认证 | 描述 |
|---|---|---|---|
| `GET` | `/api/files` | ✅ | 列出文件（收件箱/发件箱） |
| `POST` | `/api/files` | ✅ | 上传/发送文件 |
| `DELETE` | `/api/files/:id` | ✅ | 删除文件 |

### 服务器
| 方法 | 路径 | 认证 | 描述 |
|---|---|---|---|
| `GET` | `/api/servers` | ✅ | 列出监控的服务器 |
| `POST` | `/api/servers` | ✅ | 添加服务器 |
| `PUT` | `/api/servers/:id` | ✅ | 更新服务器 |
| `DELETE` | `/api/servers/:id` | ✅ | 移除服务器 |

### 分析与审计
| 方法 | 路径 | 认证 | 描述 |
|---|---|---|---|
| `GET` | `/api/analytics` | ✅ | 获取分析数据 |
| `GET` | `/api/audit` | ✅ | 获取审计日志条目 |

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
| [SECURITY.md](../SECURITY.md) | 安全策略 |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | 贡献指南 |
| [CHANGELOG.md](../CHANGELOG.md) | 版本历史和待办事项 |

## 🚢 部署

### 生产实例

```bash
npm run build
# 部署 dist/client/* 到 Web 服务器（如 Nginx）
# 部署 dist/server/* 到应用服务器
# 重启 systemd/pm2
```

### 演示实例

```bash
npm run build
# 部署 dist/client/* 到 Web 服务器
# 部署 dist/server/* 到应用服务器
# 重启 systemd/pm2
```

### Systemd 服务

| 服务 | 实例 | 用途 |
|---|---|---|
| `myrmex-control` | 生产 | 完整认证仪表盘 |
| `myrmex-demo` | 演示 | 开放演示实例 |
| `myrmex-demo-reset` | 演示 | 每小时演示数据重置（定时器） |

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

## ⚖️ 设计权衡

| 决策 | 失去什么 | 为什么值得 |
|---|---|---|
| JSON 文件作为数据库 | SQL 查询、并发写入、索引 | 零配置、人类可读、单用户足够 |
| 文件会话 | 水平扩展、重启保持 | 简单、无需 Redis、即时失效 |
| 内存限流 | 代理后可用、多实例 | 零依赖、快速、个人仪表盘够用 |
| 无 SSR/SSG | SEO（仪表盘不需要） | 架构更简单、无框架锁定 |
| 最小化输入验证 | 运行时类型安全 | v1.0 权衡——v1.1 可加入 Zod |

## 🗺️ 路线图

### v1.0 — 基础 ✅
- [x] 全栈 React + Express 架构
- [x] JSON 文件数据库，原子写入
- [x] JWT 认证与刷新令牌轮换
- [x] TOTP 双因素认证
- [x] RBAC（基于角色的访问控制）
- [x] 看板、项目、制品库、文件、服务器
- [x] 分析页面、审计日志查看器、依赖图
- [x] 健康评分仪表盘组件
- [x] PWA 离线支持和自动更新
- [x] Telegram Web App 集成
- [x] 国际化（EN + RU）
- [x] 演示模式（通过 nginx 请求头检测）
- [x] 限流、安全头、错误日志
- [x] 145 个测试，94%+ 覆盖率
- [x] CI/CD + 质量门禁
- [x] 架构文档 + ADR

### v1.1 — 打磨 🚧
- [ ] 视觉设计改版（动画、卡片、图表、空状态）
- [ ] 智能自动刷新（visibilitychange、WebSocket、自适应间隔）
- [ ] Docker Compose 部署
- [ ] 演示实例自动部署

### v2.0 — 扩展 📋
- [ ] PostgreSQL 后端选项
- [ ] WebSocket 实时更新
- [ ] 多集群支持
- [ ] 自定义组件插件系统
- [ ] OpenRouter 余额集成

## 📜 许可证

本项目基于 **MIT License** 授权 — 详见 [LICENSE](LICENSE) 文件。

## 👤 作者

**Evgeny (DoctorM)** — 医生、开发者、AI 布道者。

[LabDoctorM](https://github.com/thedoctormes-hue) 实验室的一部分。

---

<p align="center">
  <em>由 DoctorM&Ai 团队用 🧠 和 ☕ 构建</em>
</p>
