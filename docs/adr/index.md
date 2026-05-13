---
description: "Architecture Decision Records (ADR)"
type: adr
last_reviewed: 2026-05-12
last_code_change: 2026-05-12
status: active
---
# Architecture Decision Records (ADR)

> Ключевые архитектурные решения Myrmex Control.

---

## ADR-001: JSON File as Database

**Статус:** Принято
**Дата:** 2026-05

### Контекст

Myrmex Control — это дашборд для одного оператора (и небольшого числа AI-агентов). Нужна персистентности данных без сложной инфраструктуры.

### Решение

Использовать один JSON-файл (`myrmex.json`) как единственный источник истины. Атомарная запись через tmp-файл + rename. File locking через `proper-lockfile`.

### Последствия

**Плюсы:**
- Zero-config: не нужно устанавливать PostgreSQL, Redis, SQLite
- Простота бэкапов: копируешь один файл
- Читаемость: можно открыть в текстовом редакторе и увидеть всё состояние
- Локальная разработка без зависимостей

**Минусы:**
- Нет конкурентной записи с нескольких процессов (file locking решает частично)
- Нет запросов/индексов — только полное чтение и запись
- Размер файла растёт со временем (changelog capped at 1000 entries)

### Альтернативы

- **SQLite** — добавляет зависимость, но даёт SQL и индексы
- **PostgreSQL** — избыточно для single-user дашборда
- **In-memory + periodic dump** — риск потери данных при падении

---

## ADR-002: Express + ES Modules (без NestJS/Fastify)

**Статус:** Принято
**Дата:** 2026-05

### Контекст

Нужен HTTP-сервер для REST API. Проект должен быть простым для понимания и модификации.

### Решение

Express 4 с ES Modules (`"type": "module"` в package.json). TypeScript с `tsconfig.server.json` (NodeNext module resolution).

### Последствия

**Плюсы:**
- Минимальный boilerplate
- Огромная экосистема middleware (helmet, cookie-parser, cors)
- Простота понимания — стандарт индустрии
- ESM обеспечивает совместимость с современным экосистемой

**Минусы:**
- Нет dependency injection (как в NestJS)
- Нет built-in validation pipes
- Callback-based middleware (хотя async/await работает)

### Альтернативы

- **NestJS** — полноценный фреймворк с DI, но overkill для ~8 endpoints
- **Fastify** — быстрее, но меньше middleware, другой паттерн
- **Hono** — лёгкий, но менее распространён в экосистеме Node.js

---

## ADR-003: Cookie-based Sessions (без JWT)

**Статус:** Принято
**Дата:** 2026-05

### Контекст

Нужна аутентификация для дашборда. Single-user сценарий, низкий трафик.

### Решение

Cookie-based sessions с bcrypt-хешем пароля. Сессии хранятся в памяти сервера (`Map<token, {user, expires}>`). TTL 24 часа. Каждые 30 минут — cleanup просроченных сессий.

### Последствия

**Плюсы:**
- httpOnly cookies защищены от XSS
- Простота: не нужна библиотека JWT
- Мгновенный invalidate: удалил запись из Map — сессия закончилась
- SameSite=strict защищает от CSRF

**Минусы:**
- In-memory: сессии теряются при рестарте
- Не масштабируется горизонтально (нет shared session store)
- Нет refresh token механизма

### Альтернативы

- **JWT access + refresh tokens** — стандарт для распределённых систем, но сложнее
- **Redis session store** — решает проблему персистентности, но добавляет зависимость
- **OAuth 2.0 / OpenID Connect** — избыточно для single-user

---

## ADR-004: Vite + React (без Next.js)

**Статус:** Принято
**Дата:** 2026-05

### Контекст

Нужен client-side SPA. Server реализован на Express, не на Node.js фреймворке.

### Решение

Vite 5 + React 19 (@vitejs/plugin-react). SPA режим с BrowserRouter. Сервер отдаёт статику из `dist/client/` через fallback route.

### Последствия

**Плюсы:**
- Vite: мгновенный HMR, быстрая сборка
- Явное разделение client/server — архитектура прозрачна
- React 19 с последними фичами (Server Components не используются, но доступны в будущем)

**Минусы:**
- Нет SSR/SSG — SEO не важен для дашборда
- Нет file-based routing (как в Next.js/Remix)
- Двойная конфигурация сборки (Vite + tsc)

### Альтернативы

- **Next.js** — SSR + файловый роутинг, но привязка к Next.js API routes
- **Remix** — full-stack, но меньше сообщество
- **Astro** — для статического контента, не подходит для интерактивного дашборда

---

## ADR-005: In-Memory Rate Limiting (без Redis)

**Статус:** Принято
**Дата:** 2026-05

### Контекст

Нужна защита от brute-force и DDoS на уровне API.

### Решение

In-memory `Map<ip, {count, resetTime}>`. 100 запросов в 60 секунд. Cleanup каждые 5 минут.

### Последствия

**Плюсы:**
- Zero зависимостей
- Мгновенный ответ (нет network round-trip до Redis)
- Достаточно для single-instance deployment

**Минусы:**
- Не работает за reverse proxy (Express `trust proxy` не настроен)
- Не масштабируется: каждый инстанс имеет свой счётчик
- Сбрасывается при рестарте

### Альтернативы

- **Redis + sliding window** — стандарт для продакшена
- **express-rate-limit + rate-limit-redis** — готовая библиотека
- **Cloudflare / Nginx rate limiting** — на уровне инфраструктуры

---

## ADR-006: Tailwind CSS с CSS-переменными (shadcn/ui pattern)

**Статус:** Принято
**Дата:** 2026-05

### Контекст

Нужна гибкая система стилизации с поддержкой тёмной темы и возможностью кастомизации.

### Решение

Tailwind CSS 3.4 + CSS custom properties (shadcn/ui pattern). Все цвета определены как `hsl(var(--variable-name))`. `tokens.css` определяет дизайн-токены, `.dark` class на `<html>` переключает тему.

### Последствия

**Плюсы:**
- Runtime theme switching без пересборки
- Консистентная дизайн-система (ограниченная палитра)
- shadcn/ui-совместимый паттерн
- Tailwind: utility-first = быстрая разработка, нет конфликтов имён

**Минусы:**
- CSS-файлы больше (Tailwind генерирует много утилит)
- Без Tailwind IDE plugin — навигация по стилям сложнее
- CSP разрешает `'unsafe-inline'` для стилей (компромисс)

### Альтернативы

- **CSS Modules** — изоляция стилей, но сложнее темизация
- **Styled Components / Emotion** — CSS-in-JS, но runtime overhead
- **Vanilla CSS** — максимальный контроль, но медленная разработка

---

## ADR-007: Shared Types между Server и Client

**Статус:** Принято
**Дата:** 2026-05

### Контекст

Server и Client написаны на TypeScript. Нужна консистентность типов.

### Решение

Общая папка `src/shared/types.ts` с path alias `@shared/types`. Оба TS config (client и server) включают `src/shared/**/*`. Нет кодогенерации, нет OpenAPI-first подхода.

### Последствия

**Плюсы:**
- Single source of truth для всех интерфейсов
- Мгновенная синхронизация: изменил тип — ошибка компиляции сразу на обоих слоях
- Нет overhead на кодогенерацию

**Минусы:**
- Нет runtime validation (Zod, io-ts) — типы проверяются только на этапе компиляции
- Нет автогенерации API клиента из OpenAPI
- При разделении на отдельные репозитории — нужна синхронизация

### Альтернативы

- **OpenAPI-first** — генерировать типы и клиенты из спецификации
- **tRPC** — end-to-end type safety, но привязка к фреймворку
- **Zod schemas** — runtime + compile-time validation
