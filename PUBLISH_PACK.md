# Myrmex Control — Пак для публикации

> **Дата:** 2026-05-11
> **Автор:** ЗавЛаб (DoctorM)
> **Проект:** https://github.com/thedoctormes-hue/myrmex-control
> **Демо:** https://demo.shtab-ai.ru
> **Продакшн:** https://myrmexcontrol.shtab-ai.ru

---

## СОДЕРЖАНИЕ

1. [EN — Reddit](#en--reddit)
2. [EN — Hacker News](#en--hacker-news)
3. [EN — Dev.to](#en--devto)
4. [EN — GitHub Discussions](#en--github-discussions)
5. [EN — Discord серверы](#en--discord-серверы)
6. [RU — Хабр](#ru--хабр)
7. [RU — VC.ru](#ru--vcru)
8. [RU — Telegram каналы](#ru--telegram-каналы)
9. [ZH — V2EX](#zh--v2ex)
10. [ZH — 掘金 Juejin](#zh--掘金-juejin)
11. [ZH — 知乎 Zhihu](#zh--知乎-zhihu)
12. [Дополнительные площадки](#дополнительные-площадки)

---

## EN — REDDIT

### 1. r/SideProject

- **Ссылка:** https://www.reddit.com/r/SideProject/submit
- **Подписчики:** 2.5M
- **Язык:** EN
- **Правила:** Можно постить свои проекты. Нужно показать работу, спросить фидбек. Не просто дропать ссылку.
- **Заметки:** Используй флейр "Showcase" если есть. Отвечай на все комментарии.

**Заголовок:**
```
I built a dashboard to manage my AI agents — because they were managing me
```

**Текст:**
```
I run a small AI lab. A few months ago it was one agent, one task, one terminal window. Clean.

Then it became 8 agents, 20 tasks, 5 projects, configs scattered across JSON files, and me SSH-ing into servers at 3am because something silently failed.

**The problem:** managing AI agents is nothing like managing code. Agents have state. They produce artifacts — skills, hooks, knowledge entries. They have dependencies on each other. They fail silently. And none of the existing tools fit:

- Kubernetes dashboards? Overkill for a single server.
- Spreadsheets? Can't track agent state or dependencies.
- Project management tools? They don't understand AI artifacts.

So I built **Myrmex Control** — an open-source management dashboard for AI agent colonies.

**What it does:**
- Dashboard — real-time health score, server status, signals feed
- Kanban board — drag-and-drop task management across agents
- Artifact Library — manage skills, hooks, cards, configs, and knowledge entries (5 types)
- Dependency Graph — D3.js visualization of how agents depend on each other
- Analytics — agent productivity, task velocity, burndown
- Audit Log — full changelog with filtering
- Auth — JWT + TOTP 2FA + RBAC (admin/operator/viewer)
- PWA — installable, offline-capable, auto-updating
- Telegram Web App — manage your colony from your phone
- Demo mode — one server, two modes via nginx header

**Tech stack:** React 19 + TypeScript + Vite + Tailwind CSS + Express 4. JSON file as database (zero external dependencies). 145 tests. MIT licensed.

**The name:** Myrmex (μύρμηξ) is Greek for "ant." Because the whole point is managing a colony — many small workers coordinated toward a common goal.

**Try it:**
- Demo: https://demo.shtab-ai.ru (no login required)
- Production: https://myrmexcontrol.shtab-ai.ru
- Source: https://github.com/thedoctormes-hue/myrmex-control

I built this because I needed it. Sharing in case you need it too. Feedback, issues, and PRs welcome.

P.S. — This dashboard was built with Qwen Code AI agents. The colony designed the tool for itself.
```

---

### 2. r/LocalLLaMA

- **Ссылка:** https://www.reddit.com/r/LocalLLaMA/submit
- **Подписчики:** 105K
- **Язык:** EN
- **Правила:** Контент должен быть связан с LLM/AI. Можно делиться инструментами.
- **Заметки:** Аудитория технически грамотная — можно добавить больше деталей про архитектуру.

**Заголовок:**
```
[Tool] Myrmex Control — open-source dashboard for managing AI agent colonies (React + Express + JSON DB)
```

**Текст:** (тот же что для r/SideProject, но добавь в начую)

```
**TL;DR:** Open-source dashboard for managing AI agent colonies. React 19 + Express 4 + JSON file as DB. 145 tests. MIT licensed. Built with Qwen Code AI agents.

```

---

### 3. r/artificial

- **Ссылка:** https://www.reddit.com/r/artificial/submit
- **Подписчики:** 1.9M
- **Язык:** EN
- **Правила:** 🚫 **САМОРЕКЛАМА ЗАПРЕЩЕНА** (правило #4). Нельзя напрямую продвигать продукты.
- **Заметки:** ⚠️ Эта площадка НЕ подходит для прямого постинга проекта. Лучше написать развёрнутый технический пост на Dev.to и поделиться ссылкой на него.

**Альтернатива:** Напиши статью на Dev.to, потом пости ссылку на неё с комментарием:
```
Interesting technical write-up about building a management dashboard for AI agent colonies — covers JWT auth, TOTP 2FA, RBAC, PWA, and using JSON as a database. Thoughts?
```

---

### 4. r/opensource

- **Ссылка:** https://www.reddit.com/r/opensource/submit
- **Подписчики:** ~200K
- **Язык:** EN
- **Правила:** ✅ Можно постить OSS проекты. Должен быть реально open source с лицензией.
- **Заметки:** Используй тег [OSS] в заголовке.

**Заголовок:**
```
[OSS] Myrmex Control — open-source dashboard for AI agent colony management
```

**Текст:** (тот же что для r/SideProject)

---

### 5. r/selfhosted

- **Ссылка:** https://www.reddit.com/r/selfhosted/submit
- **Подписчики:** ~300K
- **Язык:** EN
- **Правила:** ✅ Можно если проект можно self-host. Покажи инструкции по установке.
- **Заметки:** Добавь раздел про деплой.

**Заголовок:**
```
Myrmex Control — self-hosted dashboard for managing AI agent colonies
```

**Текст:** (базовый + добавь в конец)

```
**Self-hosting:**
- Single binary: `node dist/server/index.js`
- No external database — just a JSON file
- Docker-ready (Dockerfile included)
- Demo mode via nginx header — one deploy, two domains
- Systemd unit included

**Deploy:**
git clone + npm install + npm run build + node dist/server/index.js
That's it. No PostgreSQL, no Redis, no Docker Compose needed.
```

---

### 6. r/reactjs

- **Ссылка:** https://www.reddit.com/r/reactjs/submit
- **Подписчики:** ~300K
- **Язык:** EN
- **Правила:** Можно делиться проектами. Должен быть связан с React.
- **Заметки:** Аудитория оценит технические детали про React 19, FSD архитектуру.

**Заголовок:**
```
I built an AI agent management dashboard with React 19 + TypeScript — FSD architecture, 145 tests
```

---

### 7. r/typescript

- **Ссылка:** https://www.reddit.com/r/typescript/submit
- **Подписчики:** ~200K
- **Язык:** EN
- **Правила:** Можно делиться проектами на TypeScript.
- **Заметки:** Акцент на типизацию, ESM модули, архитектуру.

**Заголовок:**
```
Myrmex Control — full-stack TypeScript dashboard (React 19 + Express 4, ESM, 145 tests)
```

---

### 8. r/webdev

- **Ссылка:** https://www.reddit.com/r/webdev/submit
- **Подписчики:** ~1.5M
- **Язык:** EN
- **Правила:** Можно делиться проектами. Должен быть связан с веб-разработкой.

**Заголовок:**
```
I built a full-stack dashboard for managing AI agents — React 19 + Express + Tailwind CSS
```

---

### 9. r/SaaS

- **Ссылка:** https://www.reddit.com/r/SaaS/submit
- **Подписчики:** ~150K
- **Язык:** EN
- **Правила:** Можно делиться продуктами. Должен быть SaaS или потенциально монетизируемый.
- **Заметки:** Акцент на то как это решает реальную проблему.

**Заголовок:**
```
Myrmex Control — dashboard to manage AI agent colonies (open-source, self-hosted)
```

---

### 10. r/devops

- **Ссылка:** https://www.reddit.com/r/devops/submit
- **Подписчики:** ~500K
- **Язык:** EN
- **Правила:** Можно делиться инструментами. Должен быть связан с DevOps.
- **Заметки:** Акцент на systemd, nginx, demo mode, zero-dependency deploy.

**Заголовок:**
```
Myrmex Control — zero-dependency deploy (JSON DB, systemd, nginx header-based demo mode)
```

---

## EN — HACKER NEWS

### Hacker News (Show HN)

- **Ссылка:** https://news.ycombinator.com/submit
- **Аудитория:** ~5M уникальных посетителей/мес
- **Язык:** EN
- **Правила:** "Show HN" формат для проектов. Нельзя просто рекламировать. Будь готов отвечать на вопросы.
- **Заметки:** Лучшее время для постинга: 8-10am EST (15:00-17:00 MSK). Первый час критичен — нужно набрать голоса.

**Заголовок:**
```
Show HN: Myrmex Control — open-source dashboard for AI agent colonies
```

**URL:**
```
https://myrmexcontrol.shtab-ai.ru
```

**Комментарий (первый комментарий от автора):**
```
I run a small AI lab and got tired of managing agents across terminals and JSON files. So I built this.

Key decisions:
- JSON file as database (zero external dependencies, backup is `cp`, restore is `cp`)
- Demo mode via nginx header — one build, two domains, difference is one `.demo` file
- JWT + TOTP 2FA + RBAC for auth
- PWA for mobile, Telegram Web App for phone access
- 145 tests, MIT licensed

Built with Qwen Code AI agents — the colony designed the tool for itself.

Demo: https://demo.shtab-ai.ru (no login required)
Source: https://github.com/thedoctormes-hue/myrmex-control

Happy to answer questions about the architecture or the agent management workflow.
```

---

## EN — DEV.TO

### Dev.to

- **Ссылка:** https://dev.to/new
- **Аудитория:** ~1M разработчиков
- **Язык:** EN
- **Правила:** Можно делиться проектами. Лучше писать развёрнутую статью с техническими деталями.
- **Заметки:** Добавь скриншоты, код, архитектурную диаграмму. Теги: #ai #react #typescript #opensource #dashboard

**Заголовок:**
```
I built an open-source dashboard to manage my AI agent colony — here's what I learned
```

**Текст:**
```markdown
# I built an open-source dashboard to manage my AI agent colony

A few months ago my AI lab was simple: one agent, one task, one terminal. Clean.

Then it became 8 agents, 20 tasks, 5 projects, configs scattered across JSON files, and me SSH-ing into servers at 3am because something silently failed.

## The Problem

Managing AI agents is nothing like managing code. Agents have state. They produce artifacts — skills, hooks, knowledge entries. They have dependencies on each other. They fail silently.

None of the existing tools fit:
- Kubernetes dashboards? Overkill for a single server.
- Spreadsheets? Can't track agent state or dependencies.
- Project management tools? They don't understand AI artifacts.

## The Solution: Myrmex Control

I built an open-source management dashboard for AI agent colonies.

### Features
- **Dashboard** — real-time health score, server status, signals feed
- **Kanban board** — drag-and-drop task management across agents
- **Artifact Library** — manage skills, hooks, cards, configs, and knowledge entries (5 types)
- **Dependency Graph** — D3.js visualization of agent dependencies
- **Analytics** — agent productivity, task velocity, burndown
- **Audit Log** — full changelog with filtering
- **Auth** — JWT + TOTP 2FA + RBAC (admin/operator/viewer)
- **PWA** — installable, offline-capable, auto-updating
- **Telegram Web App** — manage your colony from your phone
- **Demo mode** — one server, two modes via nginx header

### Tech Stack
React 19 + TypeScript + Vite + Tailwind CSS + Express 4

### Key Design Decisions

**JSON as database:** Zero external dependencies. Backup is `cp`, restore is `cp` back. The file opens in any editor.

**Demo mode:** Works via a single `.demo` file in the server directory. One build, two domains, difference is one file.

**Auth:** JWT access tokens (15min) + refresh tokens (7d) + TOTP 2FA. RBAC with admin/operator/viewer roles.

### Try It
- Demo: https://demo.shtab-ai.ru (no login required)
- Source: https://github.com/thedoctormes-hue/myrmex-control

MIT licensed. Feedback, issues, and PRs welcome.

P.S. — This dashboard was built with Qwen Code AI agents. The colony designed the tool for itself.

---

#ai #react #typescript #opensource #dashboard
```

---

## EN — GITHUB DISCUSSIONS

### QwenLM/Qwen-Code

- **Ссылка:** https://github.com/QwenLM/Qwen-Code/discussions
- **Язык:** EN / ZH
- **Правила:** Категории: Announcements, General, Q&A. Для проектов используй **General**.
- **Заметки:** ⚠️ Discussions могут быть закрыты для внешних пользователей. Если не получается постить — зайди на Discord: https://discord.gg/RN7tqZCeDK

**Категория:** General

**Заголовок:**
```
Myrmex Control: an open-source dashboard for managing AI agent colonies
```

**Текст:**
```
I built an open-source management dashboard for AI agent colonies — and it was built with Qwen Code AI agents.

**The problem:** managing AI agents is nothing like managing code. Agents have state, produce artifacts, have dependencies, fail silently. No existing tool fit.

**The solution:** Myrmex Control — a full-stack dashboard (React 19 + Express 4 + JSON DB).

**Features:**
- Dashboard with health score, server status, signals feed
- Kanban board for task management across agents
- Artifact Library (skills, hooks, cards, configs, knowledge — 5 types)
- Dependency Graph (D3.js)
- Analytics and Audit Log
- JWT + TOTP 2FA + RBAC
- PWA + Telegram Web App
- Demo mode via nginx header

**Key decisions:**
- JSON file as database (zero external dependencies)
- Demo mode via single `.demo` file (one build, two domains)
- 145 tests, MIT licensed

**Try it:**
- Demo: https://demo.shtab-ai.ru
- Source: https://github.com/thedoctormes-hue/myrmex-control

Feedback and PRs welcome!
```

---

### continuedev/continue

- **Ссылка:** https://github.com/continuedev/continue/discussions
- **Язык:** EN
- **Правила:** Категории: Docs, Feature Requests, Feedback, Help. Используй **Feedback**.
- **Заметки:** ⚠️ Может быть закрыто для внешних.

**Категория:** Feedback

**Заголовок:**
```
Show & Tell: Myrmex Control — dashboard for AI agent colonies
```

**Текст:** (тот же что для QwenLM/Qwen-Code)

---

### cline/cline

- **Ссылка:** https://github.com/cline/cline/discussions
- **Язык:** EN
- **Правила:** Категории: Announcements, Feature Requests. Используй **Feature Requests** или пости в Discord.
- **Заметки:** ⚠️ Может быть закрыто для внешних. Альтернатива — Discord: https://cline.bot/discord

---

## EN — DISCORD СЕРВЕРЫ

### 1. Qwen Code Discord

- **Ссылка:** https://discord.gg/RN7tqZCeDK
- **Язык:** EN / ZH
- **Правила:** Ищи каналы #general, #show-and-tell, #projects. Сначала участвуй, потом делись.
- **Заметки:** Идеальная площадка — проект был создан с помощью Qwen Code!

**Текст для канала #show-and-tell или #general:**
```
Hey everyone! I built Myrmex Control — an open-source dashboard for managing AI agent colonies.

The backstory: my AI lab grew from 1 agent to 8 agents, 20 tasks, 5 projects — and I was managing it all through terminals and JSON files at 3am. So I built a proper dashboard.

Features: Kanban board, artifact library (5 types), dependency graph (D3.js), analytics, audit log, JWT+TOTP 2FA, PWA, Telegram Web App.

Key decision: JSON file as database. Zero external dependencies. Backup is `cp`.

And the best part — it was built with Qwen Code AI agents. The colony designed the tool for itself.

Demo: https://demo.shtab-ai.ru (no login)
Source: https://github.com/thedoctormes-hue/myrmex-control

Feedback welcome!
```

---

### 2. Aider Discord

- **Ссылка:** https://aider.chat (ищи Discord ссылку на сайте)
- **Язык:** EN
- **Правила:** Ищи каналы #showcase, #general. Сначала участвуй.
- **Заметки:** Aider — популярный AI pair programming tool. Аудитория оценит технические детали.

**Текст:** (тот же что для Qwen Discord, но убери упоминание Qwen Code)

---

### 3. Cline Discord

- **Ссылка:** https://cline.bot/discord
- **Язык:** EN
- **Правила:** Ищи каналы #showcase, #general. Читай #rules первым.
- **Заметки:** Cline — autonomous coding agent. Аудитория заинтересована в инструментах для агентов.

---

### 4. Continue Discord

- **Ссылка:** https://continue.dev (ищи Discord ссылку на сайте)
- **Язык:** EN
- **Правила:** Ищи каналы #show-and-tell, #general.
- **Заметки:** Continue — open-source AI code assistant. Хорошая аудитория для dev tools.

---

### 5. OpenHands Slack

- **Ссылка:** https://slack.openhands.dev
- **Язык:** EN
- **Правила:** Ищи каналы #general, #showcase.
- **Заметки:** OpenHands (OpenDevin) — open-source AI software engineer. Очень релевантная аудитория.

---

### 6. Claude Developers Discord

- **Ссылка:** https://claude.com/discord
- **Язык:** EN
- **Правила:** Ищи каналы #showcase, #projects. Нельзя просто рекламировать.
- **Заметки:** Крупное сообщество. Будь активным участником перед постингом.

---

### 7. Cursor Discord/Forum

- **Ссылка:** https://cursor.com/discord или https://forum.cursor.com
- **Язык:** EN
- **Правила:** Ищи каналы #showcase, #projects.
- **Заметки:** Cursor — AI-first code editor. Аудитория заинтересована в AI инструментах.

---

## RU — ХАБР

### Habr (Хабр)

- **Ссылка:** https://habr.com/ru/articles/new/
- **Аудитория:** ~10M читателей/мес
- **Язык:** RU
- **Правила:** Публикация собственных проектов допустима в формате кейса/туториала. Чистый самопромо без экспертной ценности может быть отмодерирован. Новые авторы → "Песочница".
- **Заметки:** Лучший формат — "Из песочницы" или полноценная статья с техническими деталями. Добавь скриншоты.

**Раздел:** Из песочницы (для первой публикации) или Программирование

**Заголовок:**
```
Myrmex Control: открытая панель управления колонией AI-агентов
```

**Текст:**
```
У меня есть небольшая AI-лаборатория. Пару месяцев назад это был один агент, одна задача, один терминал. Чисто и понятно.

Потом стало 8 агентов, 20 задач, 5 проектов, конфиги разбросаны по JSON-файлам, а я подключаюсь к серверам в 3 часа ночи, потому что что-то тихо сломалось.

## Проблема

Управлять AI-агентами — это не то же самое, что управлять кодом. У агентов есть состояние. Они производят артефакты — скиллы, хуки, карточки, конфигурации, базы знаний. У них есть зависимости друг от друга. Они падают без звука. И ни один из существующих инструментов не подходит:

- Kubernetes-дашборды? Избыточно для одного сервера.
- Таблицы? Не отслеживают состояние агентов и зависимости.
- Таск-трекеры? Они не понимают AI-артефакты.

## Решение: Myrmex Control

Я сделал открытую панель управления колонией AI-агентов.

### Что умеет

- **Дашборд** — health score в реальном времени, статус серверов, лента сигналов
- **Kanban-доска** — drag-and-drop управление задачами между агентами
- **Библиотека артефактов** — скиллы, хуки, карточки, конфигурации, база знаний (5 типов)
- **Граф зависимостей** — D3.js визуализация связей между агентами
- **Аналитика** — продуктивность агентов, скорость задач, burndown-диаграммы
- **Аудит-лог** — полный журнал изменений с фильтрацией
- **Аутентификация** — JWT + TOTP 2FA + RBAC (admin/operator/viewer)
- **PWA** — устанавливаемое приложение с автообновлением
- **Telegram Web App** — управление колонией с телефона
- **Демо-режим** — один сервер, два режима через nginx-заголовок

### Стек

React 19 + TypeScript + Vite + Tailwind CSS + Express 4

### Ключевые решения

**JSON вместо БД** — намеренное решение. Файл открывается в любом редакторе, бэкап это `cp`, восстановление это `cp` обратно. Ноль внешних зависимостей.

**Демо-режим** — работает через единственный файл `.demo` в папке сервера. Один билд, два домена, разница в одном файле.

**Аутентификация** — JWT access tokens (15 мин) + refresh tokens (7 дней) + TOTP 2FA. RBAC с ролями admin/operator/viewer.

145 тестов, MIT лицензия.

### Название

*Myrmex* (μύρμηξ) — греческое слово «муравей». Потому что суть в управлении колонией — много маленьких работников, координированных к общей цели.

### Попробовать

- Демо: https://demo.shtab-ai.ru (без входа)
- Продакшн: https://myrmexcontrol.shtab-ai.ru
- Исходники: https://github.com/thedoctormes-hue/myrmex-control

Сделал, потому что сам это нужно было. Делюсь — вдруг кому-то тоже пригодится. Фидбек, issues и PRs приветствуются.
```

---

## RU — VC.RU

### VC.ru

- **Ссылка:** https://vc.ru/new
- **Аудитория:** ~5M читателей/мес
- **Язык:** RU
- **Правила:** Можно делиться проектами если обёрнуто в полезный контент. Прямой спам осуждается.
- **Заметки:** Формат кейса/истории работает лучше всего.

**Заголовок:**
```
Я построил дашборд для управления AI-агентами — потому что они управляли мной
```

**Текст:**
```
У меня есть небольшая AI-лаборатория. Пару месяцев назад это был один агент, одна задача, один терминал.

Потом стало 8 агентов, 20 задач, 5 проектов, конфиги разбросаны по JSON-файлам, а я подключаюсь к серверам в 3 часа ночи, потому что что-то тихо сломалось.

Управлять AI-агентами — это не то же самое, что управлять кодом. У агентов есть состояние, они производят артефакты, у них есть зависимости друг от друга, они падают без звука. Ни Kubernetes, ни таблицы, ни таск-трекеры не подходят.

Поэтому я сделал Myrmex Control — открытую панель управления колонией AI-агентов.

Что внутри: Kanban-доска, библиотека артефактов (5 типов), граф зависимостей (D3.js), аналитика, аудит-лог, JWT+TOTP 2FA, PWA, Telegram Web App, демо-режим.

Стек: React 19 + TypeScript + Vite + Tailwind CSS + Express 4. JSON вместо БД — намеренное решение. Бэкап это cp.

Демо: https://demo.shtab-ai.ru
Исходники: https://github.com/thedoctormes-hue/myrmex-control
```

---

## RU — TELEGRAM КАНАЛЫ

### 1. Код Дурова (@ctoduma)

- **Ссылка:** https://t.me/ctoduma
- **Подписчики:** ~200K
- **Язык:** RU
- **Правила:** Нужно писать админу для размещения. Пост должен быть полезным.
- **Заметки:** Напиши админу в личку с описанием проекта и ссылкой.

**Текст для админа:**
```
Привет! Хочу предложить пост про Myrmex Control — открытую панель управления колонией AI-агентов.

Суть: когда AI-агентов становится много, управлять ими через терминал и JSON-файлы — боль. Сделал дашборд с Kanban-доской, библиотекой артефактов, графом зависимостей, аналитикой.

Стек: React 19 + TypeScript + Express 4. JSON вместо БД. 145 тестов. MIT.

Демо: https://demo.shtab-ai.ru
GitHub: https://github.com/thedoctormes-hue/myrmex-control

Думаю аудитории канала будет интересно — тема AI-агентов сейчас горячая.
```

---

### 2. AI/ML Russia (@ai_ml_ru)

- **Ссылка:** https://t.me/ai_ml_ru
- **Подписчики:** ~50K
- **Язык:** RU
- **Правила:** Проверь правила канала. Обычно можно постить инструменты.

**Текст:**
```
Myrmex Control — открытая панель управления колонией AI-агентов

Проблема: управлять AI-агентами через терминал и JSON-файлы — боль. Сделал дашборд с Kanban-доской, библиотекой артефактов, графом зависимостей, аналитикой, JWT+TOTP 2FA.

Стек: React 19 + TypeScript + Express 4. JSON вместо БД. 145 тестов. MIT.

Демо: https://demo.shtab-ai.ru
GitHub: https://github.com/thedoctormes-hue/myrmex-control
```

---

### 3. Tproger (@tproger_news)

- **Ссылка:** https://t.me/tproger_news
- **Подписчики:** ~100K
- **Язык:** RU
- **Правила:** Нужно писать в редакцию: editorial@tproger.ru
- **Заметки:** Лучше предложить статью, а не просто пост.

**Текст для редакции:**
```
Привет! Хочу предложить статью для Tproger про Myrmex Control — открытую панель управления колонией AI-агентов.

Тема: как управлять множеством AI-агентов — от хаоса терминалов к нормальному дашборду.

Стек: React 19 + TypeScript + Express 4. JSON вместо БД. 145 тестов. MIT.

Демо: https://demo.shtab-ai.ru
GitHub: https://github.com/thedoctormes-hue/myrmex-control

Думаю аудитории будет интересно — тема AI-агентов и инструментов для разработчиков сейчас актуальна.
```

---

### 4. Хабр (@habr_news)

- **Ссылка:** https://t.me/habr_news
- **Подписчики:** ~150K
- **Язык:** RU
- **Правила:** Можно постить ссылки на статьи с Хабра.
- **Заметки:** Сначала опубликуй статью на Хабре, потом пости ссылку сюда.

---

### 5. DTF (@dtf_news)

- **Ссылка:** https://t.me/dtf_news
- **Подписчики:** ~200K
- **Язык:** RU
- **Правила:** Можно постить проекты. Проверь правила.
- **Заметки:** Аудитория моложе, но технически грамотная.

---

## ZH — V2EX

### V2EX

- **Ссылка:** https://www.v2ex.com/new/create
- **Аудитория:** ~810K 注册用户
- **Язык:** ZH
- **Прав规则:** 可以分享开源项目。发到"分享创造"节点。
- **Заметки:** V2EX 社区氛围友好，喜欢技术分享。

**节点:** 分享创造

**标题:**
```
Myrmex Control — 开源 AI 智能体集群管理面板
```

**正文:**
```
我运营一个小型 AI 实验室。几个月前，它是一个智能体、一个任务、一个终端窗口。干净明了。

后来变成了 8 个智能体、20 个任务、5 个项目、配置散落在 JSON 文件里，而我凌晨 3 点 SSH 进服务器，因为有什么东西悄悄挂了。

**问题在于：** 管理 AI 智能体和管理代码完全不同。智能体有状态。它们产出制品 — skills、hooks、cards、configs、knowledge。它们彼此有依赖关系。它们静默失败。而现有工具都不合适：

- Kubernetes 仪表盘？对单服务器来说太重了。
- 电子表格？无法追踪智能体状态和依赖关系。
- 项目管理工具？它们不理解 AI 制品。

所以我做了 **Myrmex Control** — 一个开源的 AI 智能体集群管理仪表盘。

**功能：**
- 仪表盘 — 实时健康评分、服务器状态、信号流
- 看板 — 智能体间的拖拽式任务管理
- 制品库 — 管理 skills、hooks、cards、configs、knowledge（5 种类型）
- 依赖图 — D3.js 智能体依赖关系可视化
- 数据分析 — 智能体效率、任务速度、燃尽图
- 审计日志 — 带过滤的完整变更历史
- 认证 — JWT + TOTP 双因素认证 + RBAC（管理员/操作员/查看者）
- PWA — 可安装、离线可用、自动更新
- Telegram Web App — 手机上管理集群
- 演示模式 — 一台服务器，通过 nginx header 切换两种模式

**技术栈：** React 19 + TypeScript + Vite + Tailwind CSS + Express 4。JSON 文件作为数据库（零外部依赖）。145 个测试。MIT 协议。

**关键设计决策：**
- JSON 作为数据库 — 零外部依赖，备份就是 cp
- 演示模式 — 通过 .demo 文件切换，一份构建，两个域名

**体验：**
- 演示：https://demo.shtab-ai.ru（无需登录）
- 源码：https://github.com/thedoctormes-hue/myrmex-control

因为自己需要所以做了。分享出来，说不定你也需要。欢迎反馈、issues 和 PR。
```

---

## ZH — 掘金 JUEJIN

### 掘金 (Juejin)

- **Ссылка:** https://juejin.cn/editor/draft/new
- **Аудитория:** ~5M 开发者
- **Язык:** ZH
- **Правила:** 可以分享开源项目。技术文章格式最佳。
- **Заметки:** 添加代码片段、架构图、截图。标签：#AI #开源 #React #TypeScript

**标题:**
```
我给 AI 智能体做了一个管理面板 — Myrmex Control 开源了
```

**正文:**
```markdown
# 我给 AI 智能体做了一个管理面板 — Myrmex Control 开源了

## 背景

我运营一个小型 AI 实验室。几个月前，它是一个智能体、一个任务、一个终端窗口。干净明了。

后来变成了 8 个智能体、20 个任务、5 个项目、配置散落在 JSON 文件里，而我凌晨 3 点 SSH 进服务器，因为有什么东西悄悄挂了。

## 问题

管理 AI 智能体和管理代码完全不同：

- 智能体有状态
- 它们产出制品（skills、hooks、cards、configs、knowledge）
- 它们彼此有依赖关系
- 它们静默失败

现有工具都不合适：Kubernetes 太重、表格不能追踪状态、项目管理工具不理解 AI 制品。

## 解决方案：Myrmex Control

一个开源的 AI 智能体集群管理仪表盘。

### 核心功能

- **仪表盘** — 实时健康评分、服务器状态、信号流
- **看板** — 智能体间的拖拽式任务管理
- **制品库** — 5 种类型：skills、hooks、cards、configs、knowledge
- **依赖图** — D3.js 可视化
- **数据分析** — 智能体效率、任务速度、燃尽图
- **审计日志** — 完整变更历史
- **认证** — JWT + TOTP 2FA + RBAC
- **PWA** — 可安装、离线可用
- **Telegram Web App** — 手机端管理
- **演示模式** — 一份构建，两个域名

### 技术栈

React 19 + TypeScript + Vite + Tailwind CSS + Express 4

### 关键设计决策

**JSON 作为数据库：** 零外部依赖。备份就是 `cp`，恢复就是 `cp` 回去。文件可以用任何编辑器打开。

**演示模式：** 通过 `.demo` 文件切换。一份构建，两个域名，差异就是一个文件。

**认证：** JWT access token（15 分钟）+ refresh token（7 天）+ TOTP 双因素认证。RBAC 支持 admin/operator/viewer 角色。

145 个测试，MIT 协议。

## 体验

- 演示：https://demo.shtab-ai.ru（无需登录）
- 生产：https://myrmexcontrol.shtab-ai.ru
- 源码：https://github.com/thedoctormes-hue/myrmex-control

因为自己需要所以做了。分享出来，说不定你也需要。欢迎反馈、issues 和 PR。

---

#AI #开源 #React #TypeScript #Dashboard
```

---

## ZH — 知乎 ZHIHU

### 知乎 (Zhihu)

- **Ссылка:** https://www.zhihu.com
- **Аудитория:** ~300M MAU
- **Язык:** ZH
- **Правила:** ⚠️ 需要专家级内容。不能直接广告。最好写深度技术文章。
- **Заметки:** 知乎适合写深度技术文章，不适合直接推广。建议写一篇关于"如何管理 AI 智能体集群"的技术文章，在文章中自然地提到 Myrmex Control。

**文章标题:**
```
如何管理 AI 智能体集群？我开源了一个管理面板
```

**正文框架:**
```
## 背景
（描述问题：AI 智能体管理的痛点）

## 现有方案的不足
（分析为什么 Kubernetes、表格、项目管理工具都不合适）

## 我的解决方案
（介绍 Myrmex Control 的设计理念和功能）

## 技术实现
（深入讲解架构、关键设计决策、代码示例）

## 开源与未来
（链接到 GitHub，邀请贡献）

链接：https://github.com/thedoctormes-hue/myrmex-control
演示：https://demo.shtab-ai.ru
```

---

## ДОПОЛНИТЕЛЬНЫЕ ПЛОЩАДКИ

### Product Hunt

- **Ссылка:** https://www.producthunt.com/products/new
- **Аудитория:** ~5M/мес
- **Язык:** EN
- **Правила:** Можно запускать продукты. Нужно подготовить описание, скриншоты, логотип.
- **Заметки:** Лучшее время — вторник-четверг, 00:01 PST.

**Название:** Myrmex Control

**Tagline:** Open-source dashboard for managing AI agent colonies

**Description:**
```
Myrmex Control is an open-source management dashboard for AI agent colonies.

When your AI lab grows beyond one agent and one terminal, you need a proper control panel. Myrmex Control gives you:

- Real-time dashboard with health score
- Kanban board for task management across agents
- Artifact library (skills, hooks, cards, configs, knowledge)
- Dependency graph (D3.js)
- Analytics and audit log
- JWT + TOTP 2FA + RBAC
- PWA + Telegram Web App
- Demo mode via nginx header

Tech stack: React 19 + TypeScript + Express 4. JSON file as database (zero external dependencies). 145 tests. MIT licensed.

Demo: https://demo.shtab-ai.ru
Source: https://github.com/thedoctormes-hue/myrmex-control
```

---

### Lobste.rs

- **Ссылка:** https://lobste.rs
- **Аудитория:** ~50K 技术爱好者
- **Язык:** EN
- **Правила:** 可以分享项目。需要技术深度。
- **Заметки:** 在 submit 页面提交链接和描述。

**标题:** Myrmex Control: open-source dashboard for AI agent colonies

**URL:** https://myrmexcontrol.shtab-ai.ru

**描述:** (使用 EN 帖子内容)

---

### GitHub — 在自己的仓库创建 Discussion

- **Ссылка:** https://github.com/thedoctormes-hue/myrmex-control/discussions
- **Язык:** EN
- **Правила:** 在自己的仓库可以自由发帖。
- **Заметки:** 创建一个 "Show & Tell" 或 "Announcements" 分类，发布项目更新。

**标题:** 🎉 Myrmex Control v1.1.0 — AI Agent Colony Management Dashboard

**正文:** (使用 EN 帖子内容)

---

## ГРАФИК ПУБЛИКАЦИИ (рекомендация)

| День | Площадка | Язык |
|------|----------|------|
| День 1 | Hacker News (Show HN) | EN |
| День 1 | Reddit r/SideProject | EN |
| День 1 | Reddit r/opensource | EN |
| День 2 | Reddit r/selfhosted | EN |
| День 2 | Dev.to (статья) | EN |
| День 3 | Product Hunt | EN |
| День 3 | Discord серверы (Qwen, Aider, Cline) | EN |
| День 4 | Хабр | RU |
| День 4 | VC.ru | RU |
| День 5 | V2EX | ZH |
| День 5 | 掘金 Juejin | ZH |
| День 6 | Telegram каналы | RU |
| День 7 | 知乎 Zhihu | ZH |

---

## ВАЖНЫЕ ЗАМЕТКИ

1. **Не пости везде сразу.** Растяни на 1-2 недели.
2. **Отвечай на каждый комментарий.** Сообщества ценят участие.
3. **Не используй одинаковый текст.** Адаптируй под каждую площадку.
4. **Отслеживай отклики.** Если получил фидбек — обнови проект и сообщи об этом.
5. **GitHub Discussions** для Qwen/Aider/Cline/Continue/OpenHands **закрыты для внешних**. Альтернатива — Discord.
6. **Reddit** требует аккаунт с историей. Новый аккаунт = пост может быть удалён.
7. **Hacker News** — лучший эффект если пост наберёт голоса в первый час. Проси друзей проголосовать.
8. **Хабр** — новые авторы попадают в "Песочницу". Набери рейтинг чтобы выйти в основную ленту.

---

> **Файл создан:** 2026-05-11
> **Автор пака:** OWL (Qwen Code) для ЗавЛаб
> **Проект:** Myrmex Control v1.1.0
