# 🐜 Myrmex Control

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇬🇧-English-2ea043?style=flat-square" alt="English"></a>
  <a href="README.ru.md"><img src="https://img.shields.io/badge/🇷🇺-Русский-2ea043?style=flat-square" alt="Русский"></a>
  <a href="README.zh.md"><img src="https://img.shields.io/badge/🇨🇳-中文-2ea043?style=flat-square" alt="中文"></a>
</p>

<p align="center">
  <strong>蜂巢控制中心 — AI 智能体管理仪表盘</strong>
</p>

<p align="center">
  <a href="https://myrmexcontrol.shtab-ai.ru"><img src="https://img.shields.io/badge/生产环境-myrmexcontrol.shtab--ai.ru-amber?style=for-the-badge" alt="Production"></a>
  <a href="https://demo.shtab-ai.ru"><img src="https://img.shields.io/badge/在线演示-demo.shtab--ai.ru-amber?style=for-the-badge" alt="Demo"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white" alt="Express 4">
  <img src="https://img.shields.io/badge/许可证-MIT-green?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/版本-0.1.0-amber?style=flat-square" alt="v0.1.0">
</p>

---

<!-- ![Myrmex Control Dashboard](docs/screenshot.png) -->

## 📖 简介

**Myrmex Control** 是一个全栈 AI 智能体管理仪表盘 — "蜂巢控制中心"，为你的整个智能体基础设施提供单一管理界面。采用深海军蓝配色搭配琥珀色主题，React 19 前端 + Express 4 后端 + JSON 文件数据库。

*Myrmex*（μύρμηξ）是希腊语中的"蚂蚁" — 象征着像蚁群一样协同工作的 AI 智能体。

两个部署实例：
- **[myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru)** — 生产环境，完整认证
- **[demo.shtab-ai.ru](https://demo.shtab-ai.ru)** — 演示模式，无需登录

## ✨ 功能特性

| 功能 | 说明 |
|---|---|
| 📊 **仪表盘** | 实时概览：余额、服务器状态、信号流 |
| 📋 **看板** | 拖拽式任务管理，自定义列 |
| 📁 **项目管理** | 创建、组织、跟踪项目状态 |
| 📚 **知识库** | 管理技能、钩子和智能体配置 |
| 📂 **文件交换** | 智能体与操作者之间的收/发文件 |
| 🕸️ **关系图谱** | 文本模式依赖图（v0.2 将加入 D3.js） |
| 🔐 **身份验证** | Cookie 会话，首次设置密码 |
| 🎭 **演示模式** | 无需认证即可体验 |
| 🌐 **国际化** | 支持俄语和英语 |
| 🔔 **通知系统** | 操作实时反馈 |
| 🛡️ **速率限制** | 每 IP 100 请求/分钟 |
| 🔒 **安全头** | HSTS、CSP 等安全加固 |
| 💾 **自动备份** | 每小时备份，保留最近 10 份 |

## 🛠 技术栈

### 前端
| 技术 | 版本 | 用途 |
|---|---|---|
| React | 19 | UI 框架 |
| TypeScript | 5.6 | 类型安全 |
| Vite | 6 | 构建工具 & 开发服务器 |
| Tailwind CSS | 3.4 | 实用优先的样式方案 |
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
**基于 JSON 文件** — `myrmex.json` 作为单一数据源。通过 `proper-lockfile` 实现文件锁定，确保并发访问安全。无需外部数据库。

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 9+

### 安装

```bash
# 克隆仓库
git clone https://github.com/doctormai/myrmex-control.git
cd myrmex-control

# 安装依赖
npm install

# 启动开发模式（前端 + 后端）
npm run dev
```

开发服务器同时启动两个进程：
- **Vite 开发服务器** — `http://localhost:5173`（前端热更新）
- **Express API 服务器** — `http://localhost:3000`（后端监听模式）

### 生产构建

```bash
# 构建前端和后端
npm run build

# 启动生产服务器
npm start
```

### 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3000` | 服务器端口 |
| `MYRMEX_PASSWORD` | *(无)* | 管理员密码（通过设置界面或 `.env` 设置） |
| `CORS_ORIGIN` | `http://localhost:5173` | 允许的 CORS 来源 |
| `NODE_ENV` | `development` | 生产环境设为 `production` 以启用 HSTS 和安全 cookies |

## 📁 项目结构

```
myrmex-control/
├── src/
│   ├── client/                  # React 前端
│   │   ├── components/
│   │   │   ├── dashboard/       # BalanceWidget, ServerWidget, SignalsFeed
│   │   │   ├── layout/          # Sidebar, BottomBar
│   │   │   └── ui/              # CatMascot, ErrorBanner, ToastContainer
│   │   ├── hooks/               # useMyrmex, useTheme, useToast
│   │   ├── lib/                 # api.ts, i18n.tsx
│   │   ├── pages/               # Dashboard, Board, Projects, Library,
│   │   │                        # Files, Graph, Login, Setup
│   │   ├── public/              # favicon.svg
│   │   ├── App.tsx              # 根组件与路由
│   │   ├── index.html           # HTML 入口文件
│   │   ├── main.tsx             # React 入口文件
│   │   └── index.css            # Tailwind 导入 + 自定义主题
│   ├── server/                  # Express 后端
│   │   ├── api/                 # 路由处理器
│   │   │   ├── tasks.ts         # 任务 CRUD
│   │   │   ├── projects.ts      # 项目 CRUD
│   │   │   ├── library.ts       # 技能/钩子/智能体库
│   │   │   ├── files.ts         # 文件交换（收件箱/发件箱）
│   │   │   ├── servers.ts       # 服务器监控
│   │   │   └── state.ts         # 全局状态读写
│   │   ├── auth.ts              # 密码设置、登录、会话管理
│   │   ├── backup.ts            # 自动备份调度器
│   │   ├── demo-sim.ts          # 演示模式数据模拟器
│   │   ├── middleware.ts        # 速率限制器 + 错误日志
│   │   ├── myrmex.ts            # JSON 数据库读写 + 审计日志
│   │   ├── watchdog.ts          # 后台服务器监控
│   │   └── index.ts             # Express 应用入口
│   └── shared/
│       └── types.ts             # 共享 TypeScript 接口
├── backups/                     # 自动生成的备份文件
├── logs/                        # 错误日志
├── myrmex.json                  # 主数据库文件
├── vite.config.ts               # Vite 配置
├── tailwind.config.js           # Tailwind 主题（深蓝 + 琥珀）
├── postcss.config.js            # PostCSS 配置
├── tsconfig.json                # TypeScript 基础配置
├── tsconfig.client.json         # 客户端 TS 配置
├── tsconfig.server.json         # 服务端 TS 配置
└── package.json
```

## 🔌 API 接口

### 认证
| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| `POST` | `/api/auth/setup` | ❌ | 首次设置密码 |
| `POST` | `/api/auth/login` | ❌ | 密码登录 |
| `POST` | `/api/auth/logout` | ❌ | 清除会话 Cookie |
| `GET` | `/api/auth/status` | ❌ | 检查认证状态 |

### 状态
| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| `GET` | `/api/state` | ✅ | 读取完整应用状态 |
| `PUT` | `/api/state` | ✅ | 写入应用状态 |

### 任务（看板）
| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| `GET` | `/api/tasks` | ✅ | 获取所有任务 |
| `POST` | `/api/tasks` | ✅ | 创建任务 |
| `PUT` | `/api/tasks/:id` | ✅ | 更新任务 |
| `DELETE` | `/api/tasks/:id` | ✅ | 删除任务 |

### 项目
| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| `GET` | `/api/projects` | ✅ | 获取所有项目 |
| `POST` | `/api/projects` | ✅ | 创建项目 |
| `PUT` | `/api/projects/:id` | ✅ | 更新项目 |
| `DELETE` | `/api/projects/:id` | ✅ | 删除项目 |

### 知识库
| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| `GET` | `/api/library` | ✅ | 获取知识库列表 |
| `POST` | `/api/library` | ✅ | 添加条目 |
| `PUT` | `/api/library/:id` | ✅ | 更新条目 |
| `DELETE` | `/api/library/:id` | ✅ | 删除条目 |

### 文件交换
| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| `GET` | `/api/files` | ✅ | 获取文件列表（收件箱/发件箱） |
| `POST` | `/api/files` | ✅ | 上传/发送文件 |
| `DELETE` | `/api/files/:id` | ✅ | 删除文件 |

### 服务器
| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| `GET` | `/api/servers` | ✅ | 获取监控服务器列表 |
| `POST` | `/api/servers` | ✅ | 添加服务器 |
| `PUT` | `/api/servers/:id` | ✅ | 更新服务器信息 |
| `DELETE` | `/api/servers/:id` | ✅ | 移除服务器 |

### 系统
| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| `GET` | `/api/health` | ❌ | 健康检查（运行时间、时间戳） |

## 🚢 部署

### 生产环境（带认证）

```bash
npm run build
# 将 dist/client/* 部署到 Web 服务器（如 Nginx）
# 将 dist/server/* 部署到应用服务器
# 重启服务管理器（systemd、pm2 等）
```

部署于：**[myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru)**

### 演示环境（无需认证）

```bash
npm run build
# 将 dist/client/* 部署到 Web 服务器
# 将 dist/server/* 部署到应用服务器，启用 DEMO_MODE=true
# 重启服务管理器
```

部署于：**[demo.shtab-ai.ru](https://demo.shtab-ai.ru)**

### Systemd 服务（示例）

| 服务 | 实例 | 用途 |
|---|---|---|
| `myrmex-control` | 生产环境 | 完整认证的仪表盘 |
| `myrmex-demo` | 演示环境 | 开放演示实例 |

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
| `--accent` | `#f59e0b` | 琥珀色主色调 |
| `--accent-hover` | `#d97706` | 琥珀色悬停状态 |
| `--text-primary` | `#f1f5f9` | 主要文本 |
| `--text-secondary` | `#94a3b8` | 次要/淡化文本 |

**Logo：** Bug 图标来自 [Lucide Icons](https://lucide.dev/)
**吉祥物：** 🐱 猫（ЗавЛаб 的吉祥物）

## 📜 许可证

本项目基于 **MIT License** 授权 — 详见 [LICENSE](https://github.com/doctormai/LabDoctorM/blob/main/LICENSE) 文件。

## 👤 作者

**ЗавЛаб (Evgeny)** — 医生、开发者、AI 布道者。

[LabDoctorM](https://github.com/doctormai/LabDoctorM) 实验室项目。

---

<p align="center">
  <em>由 Doctorm&Ai 团队用 🧠 和 ☕ 打造</em>
</p>
