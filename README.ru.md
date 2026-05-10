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
  <img src="https://img.shields.io/badge/Version-1.0.0-amber?style=flat-square" alt="v1.0.0">
  <img src="https://img.shields.io/github/actions/workflow/status/doctormai/myrmex-control/ci.yml?branch=main&label=CI&style=flat-square" alt="CI">
  <img src="https://img.shields.io/badge/coverage-94%25-brightgreen?style=flat-square" alt="Coverage">
  <img src="https://img.shields.io/badge/tests-141%20passing-brightgreen?style=flat-square" alt="Tests">
</p>

---

<!-- ![Myrmex Control Dashboard](docs/screenshot.png) -->

## 📋 Содержание

- [Описание](#-описание)
- [Зачем это существует](#-зачем-это-существует)
- [Возможности](#-возможности)
- [Компромиссы](#-компромиссы)
- [Дорожная карта](#-дорожная-карта)
- [Технологический стек](#-технологический-стек)
- [Быстрый старт](#-быстрый-старт)
- [Структура проекта](#-структура-проекта)
- [API Endpoints](#-api-endpoints)
- [Документация](#-документация)
- [Развёртывание](#-развёртывание)
- [Дизайн-система](#-дизайн-система)
- [Лицензия](#-лицензия)
- [Автор](#-автор)

## 📖 Описание

**Myrmex Control** — это full-stack дашборд для управления AI-агентами, «пульт управления муравейником», который даёт единый обзор всей инфраструктуры агентов. Выполнен в глубокой тёмно-синей палитре с янтарными акцентами. Сочетает React 19 фронтенд с Express 4 бэкендом, используя JSON-файлы как лёгкую базу данных.

Название *Myrmex* (μύρμηξ) — греческое слово «муравей» — отсылка к назначению проекта: управление колонией AI-агентов, работающих вместе как муравейник.

Развёрнуты два инстанса:
- **[myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru)** — продакшн с полной авторизацией
- **[demo.shtab-ai.ru](https://demo.shtab-ai.ru)** — демо-режим, без входа

## 🤔 Зачем это существует

Управление множеством AI-агентов — у каждого свои задачи, конфиги, состояние — быстро превращается в хаос. Существующие решения либо избыточны (Kubernetes-дашборды), либо слишком просты (таблицы).

Myrmex Control заполняет нишу: дашборд с **базой данных в одном файле**, который достаточно мощный для практического использования, достаточно простой для деплоя одной командой, и достаточно чистый для портфолио.

**Философия:**
- **Ноль внешних зависимостей** — не нужны PostgreSQL, Redis, Docker
- **Единый источник истины** — один `myrmex.json` файл хранит всё
- **Читаемый человеком** — открой БД в любом текстовом редакторе
- **Деплоится где угодно** — Node.js + одна команда `npm start`

## ⚖️ Компромиссы

Каждое решение имеет цену. Вот что мы отдали и почему:

| Решение | Что теряем | Почему это оправдано |
|---|---|---|
| JSON-файл как БД | SQL-запросы, конкурентная запись, индексы | Zero-config, читаемость, достаточно для single-user |
| Cookie-сессии | Горизонтальное масштабирование, переживают рестарт | Простота, без JWT-библиотеки, мгновенный invalidate |
| In-memory rate limiting | Работает за прокси, multi-instance | Ноль зависимостей, быстро, достаточно для личного дашборда |
| Без SSR/SSG | SEO (не нужно для дашборда) | Проще архитектура, без привязки к фреймворку |
| Минимальная валидация | Runtime type safety | Компромисс для v0.1 — Zod можно добавить в v0.2 |
| CSS `'unsafe-inline'` в CSP | Защита от XSS | Необходимо для Tailwind — приемлемо для авторизованного дашборда |

## 🗺️ Дорожная карта

### v0.1 — Фундамент ✅
- [x] Full-stack React + Express архитектура
- [x] JSON-файловая БД с атомарной записью
- [x] Cookie-авторизация + демо-режим
- [x] Kanban-доска, Проекты, Библиотека, Файлы, Серверы
- [x] Rate limiting, security headers, error logging
- [x] 141 тест, 94%+ покрытие
- [x] CI/CD pipeline с quality gates
- [x] Архитектурная документация + ADR

### v0.2 — Интеллект 🚧
- [ ] WebSocket real-time обновления (вместо polling)
- [ ] Health Score виджет на дашборде
- [ ] Страница аналитики (продуктивность агентов, скорость задач)
- [ ] Просмотр Audit Log (changelog browser)
- [ ] D3.js интерактивный граф зависимостей
- [ ] Интеграция с OpenRouter (баланс)

### v1.0 — Продакшн 📋
- [ ] JWT refresh token rotation
- [ ] TOTP двухфакторная аутентификация
- [ ] RBAC (ролевая модель доступа)
- [ ] PWA с поддержкой офлайн
- [ ] Telegram Web App интеграция
- [ ] Docker Compose деплой
- [ ] Автоматический деплой демо-инстанса

## ✨ Возможности

| Возможность | Описание |
|---|---|
| 📊 **Дашборд** | Обзор в реальном времени: баланс, статус серверов, лента сигналов |
| 📋 **Kanban-доска** | Управление задачами с drag-and-drop, настраиваемые колонки |
| 📁 **Управление проектами** | Создание, организация и отслеживание проектов |
| 📚 **Библиотека** | Навыки (skills), маски (маски), хуки (hooks), конфигурации агентов |
| 📂 **Файлообмен** | Входящие/исходящие файлы между агентами и операторами |
| 🕸️ **Граф зависимостей** | Текстовый граф (D3.js интерактивный — в v0.2) |
| 🔐 **Аутентификация** | Cookie-сессии с TTL 24ч, первичная настройка пароля |
| 🎭 **Демо-режим** | Мгновенный демо-инстанс без авторизации |
| 🌐 **i18n** | Полная локализация: русский (RU) и английский (EN) |
| 🔔 **Уведомления** | Toast-уведомления в реальном времени |
| 🛡️ **Rate Limiting** | 100 запросов/минуту на IP |
| 🔒 **Security Headers** | HSTS, CSP и другие заголовки безопасности |
| 🐕 **Watchdog** | Фоновый мониторинг серверов (проверка каждые 5 мин) |

## 🛠 Технологический стек

### Фронтенд
| Технология | Версия | Назначение |
|---|---|---|
| React | 19 | UI-фреймворк |
| TypeScript | 5.6 | Типизация |
| Vite | 6 | Сборка и dev-сервер |
| Tailwind CSS | 3.4 | Стилизация |
| React Router DOM | 7 | Маршрутизация |
| Lucide React | 1.14 | Иконки |

### Бэкенд
| Технология | Версия | Назначение |
|---|---|---|
| Express | 4 | HTTP-сервер |
| TypeScript | 5.6 | Типизация |
| tsx | 4.19 | Выполнение TS в runtime |
| cookie-parser | 1.4.7 | Управление сессиями |
| cors | 2.8.5 | Поддержка CORS |
| proper-lockfile | 4.1.2 | Блокировка файлов для JSON БД |

### База данных
**JSON-файловая** — `myrmex.json` является единственным источником истины. Блокировка файлов через `proper-lockfile` обеспечивает безопасный конкурентный доступ. Внешняя БД не требуется.

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm 9+

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/doctormai/myrmex-control.git
cd myrmex-control

# Установить зависимости
npm install

# Запустить в dev-режиме (клиент + сервер)
npm run dev
```

Dev-сервер запускает два процесса параллельно:
- **Vite dev-сервер** — `http://localhost:5173` (фронтенд с HMR)
- **Express API-сервер** — `http://localhost:3000` (бэкенд с watch-режимом)

### Production-сборка

```bash
# Собрать клиент и сервер
npm run build

# Запустить production-сервер
npm start
```

### Переменные окружения

| Переменная | По умолчанию | Описание |
|---|---|---|
| `PORT` | `3000` | Порт сервера |
| `MYRMEX_PASSWORD` | *(нет)* | Пароль администратора (устанавливается через UI) |
| `CORS_ORIGIN` | `http://localhost:5173` | Разрешённый CORS origin |
| `NODE_ENV` | `development` | `production` включает HSTS и secure cookies |

## 📁 Структура проекта

```
myrmex-control/
├── src/
│   ├── client/                  # React фронтенд
│   │   ├── components/
│   │   │   ├── dashboard/       # BalanceWidget, ServerWidget, SignalsFeed
│   │   │   ├── layout/          # Sidebar, BottomBar
│   │   │   ├── tasks/           # (пусто — зарезервировано)
│   │   │   ├── shared/          # (пусто — зарезервировано)
│   │   │   └── ui/              # CatMascot, ErrorBanner, ToastContainer
│   │   ├── hooks/               # useMyrmex, useTheme, useToast
│   │   ├── lib/                 # api.ts, i18n.tsx
│   │   ├── pages/               # Dashboard, Board, Projects, Library,
│   │   │                        # Files, Graph, Login, Setup
│   │   ├── public/              # favicon.svg
│   │   ├── App.tsx              # Root-компонент с маршрутизацией
│   │   ├── index.html           # HTML-точка входа
│   │   ├── main.tsx             # React-точка входа
│   │   └── index.css            # Tailwind + кастомные стили
│   ├── server/                  # Express бэкенд
│   │   ├── api/                 # Обработчики маршрутов
│   │   │   ├── tasks.ts         # CRUD задач
│   │   │   ├── projects.ts      # CRUD проектов
│   │   │   ├── library.ts       # Библиотека skills/hooks/agents
│   │   │   ├── files.ts         # Файлообмен (inbox/outbox)
│   │   │   ├── servers.ts       # Мониторинг серверов
│   │   │   └── state.ts         # Чтение/запись глобального состояния
│   │   ├── auth.ts              # Настройка пароля, вход, сессии
│   │   ├── middleware.ts        # Rate limiter + error logger
│   │   ├── myrmex.ts            # JSON БД: чтение/запись + audit log
│   │   ├── watchdog.ts          # Фоновый мониторинг серверов
│   │   └── index.ts             # Точка входа Express
│   └── shared/
│       └── types.ts             # Общие TypeScript-интерфейсы
├── logs/                        # Логи ошибок
├── myrmex.json                  # Основной файл базы данных
├── vite.config.ts               # Конфигурация Vite
├── tailwind.config.js           # Тема Tailwind (navy + amber)
├── postcss.config.js            # Конфигурация PostCSS
├── tsconfig.json                # Базовая конфигурация TypeScript
├── tsconfig.client.json         # Конфигурация TS для клиента
├── tsconfig.server.json         # Конфигурация TS для сервера
└── package.json
```

## 🔌 API Endpoints

### Аутентификация
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `POST` | `/api/auth/setup` | ❌ | Первичная установка пароля |
| `POST` | `/api/auth/login` | ❌ | Вход по паролю |
| `POST` | `/api/auth/logout` | ❌ | Очистка session cookie |
| `GET` | `/api/auth/status` | ❌ | Проверка состояния авторизации |

### Состояние
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `GET` | `/api/state` | ✅ | Чтение полного состояния |
| `PUT` | `/api/state` | ✅ | Запись состояния |

### Задачи (Kanban)
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `GET` | `/api/tasks` | ✅ | Список всех задач |
| `POST` | `/api/tasks` | ✅ | Создать задачу |
| `PUT` | `/api/tasks/:id` | ✅ | Обновить задачу |
| `DELETE` | `/api/tasks/:id` | ✅ | Удалить задачу |

### Проекты
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `GET` | `/api/projects` | ✅ | Список всех проектов |
| `POST` | `/api/projects` | ✅ | Создать проект |
| `PUT` | `/api/projects/:id` | ✅ | Обновить проект |
| `DELETE` | `/api/projects/:id` | ✅ | Удалить проект |

### Библиотека
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `GET` | `/api/library` | ✅ | Список элементов библиотеки |
| `POST` | `/api/library` | ✅ | Добавить элемент |
| `PUT` | `/api/library/:id` | ✅ | Обновить элемент |
| `DELETE` | `/api/library/:id` | ✅ | Удалить элемент |

### Файлообмен
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `GET` | `/api/files` | ✅ | Список файлов (inbox/outbox) |

### Серверы
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `GET` | `/api/servers` | ✅ | Список мониторируемых серверов |
| `POST` | `/api/servers` | ✅ | Добавить сервер |
| `PUT` | `/api/servers/:id` | ✅ | Обновить сервер |
| `DELETE` | `/api/servers/:id` | ✅ | Удалить сервер |

### Система
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `GET` | `/api/health` | ❌ | Health check (uptime, timestamp) |

## 📚 Документация

| Документ | Описание |
|---|---|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Архитектурный обзор: слои, компоненты, data flow |
| [docs/adr/](../docs/adr/index.md) | Architecture Decision Records — ключевые решения |
| [docs/api/openapi.yaml](../docs/api/openapi.yaml) | OpenAPI 3.0 спецификация API |
| [GETTING_STARTED.md](../GETTING_STARTED.md) | Гайд для новых разработчиков |

## 🚢 Развёртывание

### Продакшн (с авторизацией)

```bash
npm run build
# Развернуть dist/client/* на веб-сервер (напр. Nginx)
# Развернуть dist/server/* на сервер приложений
# Перезапустить systemd/pm2
```

Развёрнуто на: **[myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru)**

### Демо (без авторизации)

```bash
npm run build
# Развернуть dist/client/* на веб-сервер
# Развернуть dist/server/* на сервер приложений с DEMO_MODE=true
# Перезапустить systemd/pm2
```

Развёрнуто на: **[demo.shtab-ai.ru](https://demo.shtab-ai.ru)**

### Systemd сервисы

| Сервис | Инстанс | Назначение |
|---|---|---|
| `myrmex-control` | Продакшн | Полный дашборд с авторизацией |
| `myrmex-demo` | Демо | Открытый демо-инстанс |

Управление:
```bash
systemctl status myrmex-control
journalctl -u myrmex-control -f
```

## 🎨 Дизайн-система

| Токен | Значение | Использование |
|---|---|---|
| `--bg-primary` | `#0a0e1a` | Глубокий тёмно-синий фон |
| `--bg-secondary` | `#111827` | Фон карточек/панелей |
| `--accent` | `#f59e0b` | Янтарный основной акцент |
| `--accent-hover` | `#d97706` | Янтарный при наведении |
| `--text-primary` | `#f1f5f9` | Основной текст |
| `--text-secondary` | `#94a3b8` | Вторичный/приглушённый текст |

**Логотип:** Bug icon из [Lucide Icons](https://lucide.dev/)
**Маскот:** 🐱 Кот (маскот ЗавЛаб)

## 📜 Лицензия

Этот проект лицензирован под **MIT License** — подробности в файле [LICENSE](https://github.com/doctormai/LabDoctorM/blob/main/LICENSE).

## 👤 Автор

**ЗавЛаб (Евгений)** — медик, разработчик, AI-евангелист.

Часть лаборатории [LabDoctorM](https://github.com/doctormai/LabDoctorM).

---

<p align="center">
  <em>Сделано с 🧠 и ☕ командой Doctorm&Ai</em>
</p>
