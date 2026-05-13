---
description: "Getting Started — Myrmex Control"
type: guide
last_reviewed: 2026-05-12
last_code_change: 2026-05-12
status: active
---
# Getting Started — Myrmex Control

> Гайд для новых разработчиков. От клона до работающего dev-сервера за 5 минут.

## Prerequisites

- **Node.js** 18+ (рекомендуется 20 LTS)
- **npm** 9+
- **Git**

## Quick Start

```bash
# 1. Клонировать
git clone https://github.com/doctormai/myrmex-control.git
cd myrmex-control

# 2. Установить зависимости
npm install

# 3. Запустить dev-сервер (client + server параллельно)
npm run dev
```

Откройте в браузере:
- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000/api/health

## Первый запуск

При первом запуске база данных (`myrmex.json`) создаётся автоматически с дефолтным состоянием.

Для доступа к API нужно установить пароль:
1. Откройте http://localhost:5173
2. Вы увидите страницу **Setup** — введите пароль (мин. 8 символов)
3. После setup — автоматический логин

## Режимы работы

### Development

```bash
# Запуск обоих серверов (client + server)
npm run dev

# Или по отдельности:
npm run dev:client   # Vite dev server → :5173
npm run dev:server   # tsx watch → :3000
```

Vite проксирует `/api` запросы на Express (`:3000`). HMR работает автоматически.

### Production

```bash
# Сборка
npm run build

# Запуск
npm start
```

### Demo Mode (без авторизации)

```bash
# Создать файл-маркер
touch .demo

# Запустить
npm run dev
```

При наличии `.demo` файла auth полностью пропускается.

## Структура проекта

```
src/
├── client/          # React SPA
│   ├── components/  # UI компоненты (dashboard, layout, tasks, ui)
│   ├── hooks/       # useMyrmex, useTheme, useToast
│   ├── lib/         # api.ts (fetch wrappers), i18n.tsx
│   ├── pages/       # Dashboard, Board, Projects, Library, Files, Graph, Login, Setup
│   ├── App.tsx      # Root + routing + auth state machine
│   ├── main.tsx     # Entry point
│   └── index.css    # Tailwind + custom styles
├── server/          # Express API
│   ├── api/         # Route handlers (tasks, projects, library, files, servers, state)
│   ├── auth.ts      # Auth: setup, login, sessions
│   ├── myrmex.ts    # JSON DB: read/write/lock
│   ├── middleware.ts # Rate limit, security headers, error handler
│   ├── watchdog.ts  # Background server monitoring
│   └── index.ts     # Express app bootstrap
└── shared/
    └── types.ts     # Shared TypeScript interfaces
```

## Команды

| Команда | Описание |
|---|---|
| `npm run dev` | Dev-сервер (client + server) |
| `npm run dev:client` | Только Vite dev server |
| `npm run dev:server` | Только Express (tsx watch) |
| `npm run build` | Production сборка (server → client) |
| `npm run build:server` | Только сервер |
| `npm run build:client` | Только клиент |
| `npm start` | Запуск production сервера |
| `npm test` | Запуск тестов (vitest) |
| `npm run test:coverage` | Тесты + coverage отчёт |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Переменные окружения

| Переменная | По умолчанию | Описание |
|---|---|---|
| `PORT` | `3000` | Порт сервера |
| `MYRMEX_PASSWORD` | *(нет)* | Пароль админа (устанавливается через UI) |
| `CORS_ORIGIN` | `http://localhost:5173` | Разрешённый CORS origin |
| `NODE_ENV` | `development` | `production` включает HSTS и secure cookies |

## Тестирование

```bash
# Запуск всех тестов
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

Тесты покрывают:
- **141 тест** в 10 файлах
- Unit-тесты: auth, middleware, myrmex (JSON DB layer)
- API-тесты: tasks, projects, library, files, servers, state
- Coverage: **94%+ statements, 91%+ branches**

## Отладка

### Сервер
```bash
# Логи сервера (консоль)
npm run dev:server

# Логи ошибок
tail -f logs/error.log
```

### Клиент
- React DevTools расширение для браузера
- Network tab для API запросов
- Vite HMR показывает ошибки в браузере (overlay)

### База данных
```bash
# Просмотр текущего состояния
cat myrmex.json | npx jq .

# Сброс состояния
rm myrmex.json inbox/* outbox/*
npm run dev  # создаст заново с дефолтным состоянием
```

## Добавление нового API endpoint

1. Создать/обновить router в `src/server/api/`
2. Зарегистрировать в `src/server/index.ts` с `requireAuth`
3. Добавить функции в `src/client/lib/api.ts`
4. Использовать в компонентах через `useMyrmex()` или прямые вызовы
5. Добавить тесты в `tests/server/api/`

## Troubleshooting

| Проблема | Решение |
|---|---|
| `EACCES: permission denied` на порт | Измените `PORT` или запустите с `sudo` |
| `Cannot find module '@shared/types'` | Проверьте `tsconfig.paths` и `vite.config.ts` aliases |
| CORS ошибки в dev-режиме | Убедитесь что `CORS_ORIGIN` совпадает с URL клиента |
| `myrmex.json` повреждён | Удалите файл — он создастся заново |
| Тесты не проходят | Убедитесь что нет запущенного dev-сервера на том же порту |

## Ресурсы

- [ARCHITECTURE.md](../ARCHITECTURE.md) — архитектурный обзор
- [ADR-001](../adr/ADR-001-myrmex-control-realizovan.md) — Architecture Decision Records
- [API Endpoints](../README.md#api-endpoints) — полный список endpoints
