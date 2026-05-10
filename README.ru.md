# 🐜 Myrmex Control

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/🇬🇧-English-2ea043?style=flat-square" alt="English"></a>
  <a href="README.ru.md"><img src="https://img.shields.io/badge/🇷🇺-Русский-2ea043?style=flat-square" alt="Русский"></a>
  <a href="README.zh.md"><img src="https://img.shields.io/badge/🇨🇳-中文-2ea043?style=flat-square" alt="中文"></a>
</p>

<p align="center">
  <strong>Панель управления колонией AI-агентов</strong>
</p>

<p align="center">
  <a href="https://myrmexcontrol.shtab-ai.ru"><img src="https://img.shields.io/badge/Демо-myrmexcontrol.shtab--ai.ru-amber?style=for-the-badge" alt="Live Demo"></a>
  <a href="https://demo.shtab-ai.ru"><img src="https://img.shields.io/badge/Демо%20(без%20входа)-demo.shtab--ai.ru-amber?style=for-the-badge" alt="Demo"></a>
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

## 📋 Содержание

- [Что это?](#-что-это)
- [Зачем это существует](#-зачем-это-существует)
- [Возможности](#-возможности)
- [Технологический стек](#-технологический-стек)
- [Быстрый старт](#-быстрый-старт)
- [Структура проекта](#-структура-проекта)
- [API](#-api)
- [Документация](#-документация)
- [Развёртывание](#-развёртывание)
- [Дизайн-система](#-дизайн-система)
- [Компромиссы](#-компромиссы)
- [Дорожная карта](#-дорожная-карта)
- [Лицензия](#-лицензия)
- [Автор](#-автор)

## 📖 Что это?

**Myrmex Control** — полнофункциональная панель управления колонией AI-агентов. Единый интерфейс для мониторинга и координации всей инфраструктуры агентов. Выполнена в глубокой тёмно-синей палитре с янтарными акцентами: React 19 фронтенд + Express 4 бэкенд + JSON-файл как база данных.

Название *Myrmex* (μύρμηξ) — греческое слово «муравей». Метафора проекта: управление колонией AI-агентов, работающих вместе как муравейник.

### Развёрнутые инстансы

| Инстанс | URL | Авторизация |
|---|---|---|
| Продакшн | [myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru) | JWT + TOTP 2FA |
| Демо | [demo.shtab-ai.ru](https://demo.shtab-ai.ru) | Не требуется |
| Telegram Web App | [tgminiappmyrmex.shtab-ai.ru](https://tgminiappmyrmex.shtab-ai.ru) | JWT + TOTP 2FA |

## 🤔 Зачем это существует

Управление множеством AI-агентов — у каждого свои задачи, конфиги, состояние — быстро превращается в хаос. Существующие решения либо избыточны (Kubernetes-дашборды), либо слишком просты (таблицы).

Myrmex Control заполняет нишу: дашборд с **базой данных в одном файле**, который достаточно мощный для практического использования, достаточно простой для деплоя одной командой, и достаточно чистый для портфолио.

**Философия:**
- **Ноль внешних зависимостей** — не нужны PostgreSQL, Redis, Docker
- **Единый источник истины** — один `myrmex.json` файл хранит всё
- **Читаемый человеком** — открой БД в любом текстовом редакторе
- **Деплоится где угодно** — Node.js + одна команда `npm start`

## ✨ Возможности

| Возможность | Описание |
|---|---|
| 📊 **Дашборд** | Обзор в реальном времени: health score, статус серверов, лента сигналов |
| 📋 **Kanban-доска** | Управление задачами с drag-and-drop, настраиваемые колонки |
| 📁 **Управление проектами** | Создание, организация и отслеживание проектов |
| 📚 **Библиотека артефактов** | Скиллы, хуки, карточки, конфигурации, база знаний |
| 📂 **Файлообмен** | Входящие/исходящие файлы между агентами и операторами |
| 🕸️ **Граф зависимостей** | Интерактивная визуализация зависимостей (D3.js) |
| 📈 **Аналитика** | Метрики продуктивности агентов, скорость задач, burndown-диаграммы |
| 📋 **Аудит-лог** | Просмотр журнала изменений с фильтрацией и поиском |
| 🔐 **Аутентификация** | JWT access + refresh токены, TOTP 2FA, RBAC (admin/operator/viewer) |
| 🎭 **Демо-режим** | Мгновенный демо-инстанс без авторизации |
| 🌐 **Локализация** | Полная поддержка русского (RU) и английского (EN) |
| 📱 **PWA** | Устанавливаемое приложение с автообновлением |
| ✈️ **Telegram Web App** | Нативная интеграция как Telegram Mini App |
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
| otpauth | 9.3.2 | TOTP двухфакторная аутентификация |

### База данных
**JSON-файловая** — `myrmex.json` является единственным источником истины. Атомарная запись через временный файл + rename. Внешняя БД не требуется.

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm 9+

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/thedoctormes-hue/myrmex-control.git
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
| `CORS_ORIGIN` | `http://localhost:5173` | Разрешённый CORS origin |
| `SETUP_TOKEN` | *(нет)* | Обязателен для первичной регистрации админа |
| `NODE_ENV` | `development` | `production` включает HSTS и secure cookies |

## 📁 Структура проекта

```
myrmex-control/
├── src/
│   ├── __tests__/               # 145 тестов (Vitest)
│   ├── client/                  # React фронтенд (FSD архитектура)
│   │   ├── app/                 # Оболочка: роутинг, провайдеры, вход
│   │   │   ├── App.tsx          # Root-компонент с маршрутизацией
│   │   │   ├── main.tsx         # React-точка входа
│   │   │   ├── index.html       # HTML-точка входа
│   │   │   ├── index.css        # Tailwind + кастомная тема
│   │   │   └── tokens.css       # CSS custom properties
│   │   ├── pages/               # Компоненты страниц
│   │   │   ├── Dashboard.tsx    # Главный дашборд
│   │   │   ├── Board.tsx        # Kanban-доска
│   │   │   ├── Projects.tsx     # Управление проектами
│   │   │   ├── Library.tsx      # Библиотека артефактов
│   │   │   ├── Files.tsx        # Файлообмен
│   │   │   ├── Graph.tsx        # Граф зависимостей
│   │   │   ├── Analytics.tsx    # Аналитика и метрики
│   │   │   ├── AuditLog.tsx     # Просмотр аудит-лога
│   │   │   ├── Login.tsx        # Страница входа
│   │   │   └── Setup.tsx        # Первичная настройка
│   │   ├── features/            # Фичи
│   │   │   └── dashboard/       # HealthScore, BalanceWidget и др.
│   │   └── shared/              # Общие утилиты
│   │       ├── ui/              # Sidebar, BottomBar, ToastContainer
│   │       ├── hooks/           # useMyrmex, useTheme, useToast
│   │       ├── lib/             # api.ts, i18n.ts, twa.ts
│   │       └── types.ts         # Re-export общих типов
│   ├── server/                  # Express бэкенд
│   │   ├── api/                 # Обработчики маршрутов
│   │   │   ├── tasks.ts         # CRUD задач
│   │   │   ├── projects.ts      # CRUD проектов
│   │   │   ├── library.ts       # CRUD библиотеки артефактов
│   │   │   ├── files.ts         # Файлообмен
│   │   │   ├── servers.ts       # Мониторинг серверов
│   │   │   ├── analytics.ts     # Данные аналитики
│   │   │   ├── audit.ts         # Аудит-лог
│   │   │   └── state.ts         # Чтение/запись глобального состояния
│   │   ├── auth.ts              # JWT аутентификация, TOTP, RBAC
│   │   ├── middleware.ts        # Rate limiter + error logger
│   │   ├── myrmex.ts            # JSON БД: чтение/запись + audit log
│   │   ├── watchdog.ts          # Фоновый мониторинг серверов
│   │   └── index.ts             # Точка входа Express
│   └── shared/
│       └── types.ts             # Общие TypeScript-интерфейсы
├── docs/                        # Документация
│   ├── adr/                     # Architecture Decision Records
│   └── api/openapi.yaml         # OpenAPI 3.0 спецификация
├── public/                      # Статические ассеты и PWA иконки
├── dist/                        # Результат сборки
│   ├── client/                  # Собранный фронтенд
│   └── server/                  # Собранный бэкенд
├── myrmex.json                  # Основной файл базы данных
├── myrmex-demo.json             # Снимок демо-БД
├── myrmex-demo-seed.json        # Демо-данные для сброса
├── vite.config.ts               # Конфигурация Vite
├── tailwind.config.js           # Тема Tailwind (navy + amber)
├── tsconfig.json                # Базовая конфигурация TypeScript
├── tsconfig.client.json         # Конфигурация TS для клиента
├── tsconfig.server.json         # Конфигурация TS для сервера
└── package.json
```

## 🔌 API

### Аутентификация
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `POST` | `/api/auth/setup` | ❌ | Первичная регистрация (требует SETUP_TOKEN) |
| `POST` | `/api/auth/login` | ❌ | Вход по логину и паролю |
| `POST` | `/api/auth/refresh` | ❌ | Обновление access-токена |
| `POST` | `/api/auth/logout` | ✅ | Отзыв refresh-токена |
| `GET` | `/api/auth/status` | ❌ | Проверка состояния авторизации |
| `POST` | `/api/auth/totp/setup` | ✅ | Настройка TOTP 2FA |
| `POST` | `/api/auth/totp/verify` | ✅ | Проверка TOTP-кода |

### Состояние
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `GET` | `/api/state` | ✅ | Чтение полного состояния |
| `GET` | `/api/version` | ❌ | Версия сервера (для проверки обновлений) |

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
| `POST` | `/api/files` | ✅ | Загрузить/отправить файл |
| `DELETE` | `/api/files/:id` | ✅ | Удалить файл |

### Серверы
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `GET` | `/api/servers` | ✅ | Список мониторируемых серверов |
| `POST` | `/api/servers` | ✅ | Добавить сервер |
| `PUT` | `/api/servers/:id` | ✅ | Обновить сервер |
| `DELETE` | `/api/servers/:id` | ✅ | Удалить сервер |

### Аналитика и аудит
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `GET` | `/api/analytics` | ✅ | Получить данные аналитики |
| `GET` | `/api/audit` | ✅ | Получить записи аудит-лога |

### Система
| Метод | Путь | Auth | Описание |
|---|---|---|---|
| `GET` | `/api/health` | ❌ | Health check (uptime, timestamp) |

## 📚 Документация

| Документ | Описание |
|---|---|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Архитектурный обзор: слои, компоненты, data flow |
| [docs/adr/](../docs/adr/index.md) | Architecture Decision Records |
| [docs/api/openapi.yaml](../docs/api/openapi.yaml) | OpenAPI 3.0 спецификация API |
| [GETTING_STARTED.md](../GETTING_STARTED.md) | Гайд для новых разработчиков |
| [SECURITY.md](../SECURITY.md) | Политика безопасности |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Руководство по контрибуции |
| [CHANGELOG.md](../CHANGELOG.md) | История версий и бэклог |

## 🚢 Развёртывание

### Продакшн

```bash
npm run build
# Развернуть dist/client/* на веб-сервер (напр. Nginx)
# Развернуть dist/server/* на сервер приложений
# Перезапустить systemd/pm2
```

### Демо

```bash
npm run build
# Развернуть dist/client/* на веб-сервер
# Развернуть dist/server/* на сервер приложений
# Перезапустить systemd/pm2
```

### Systemd сервисы

| Сервис | Инстанс | Назначение |
|---|---|---|
| `myrmex-control` | Продакшн | Полный дашборд с авторизацией |
| `myrmex-demo` | Демо | Открытый демо-инстанс |
| `myrmex-demo-reset` | Демо | Ежечасный сброс демо-данных (timer) |

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

## ⚖️ Компромиссы

Каждое решение имеет цену. Вот что мы отдали и почему:

| Решение | Что теряем | Почему это оправдано |
|---|---|---|
| JSON-файл как БД | SQL-запросы, конкурентная запись, индексы | Zero-config, читаемость, достаточно для single-user |
| Файловые сессии | Горизонтальное масштабирование, переживают рестарт | Простота, без Redis, мгновенный отзыв сессий |
| In-memory rate limiting | Работает за прокси, multi-instance | Ноль зависимостей, быстро, достаточно для личного дашборда |
| Без SSR/SSG | SEO (не нужно для дашборда) | Проще архитектура, без привязки к фреймворку |
| Минимальная валидация | Runtime type safety | Компромисс для v1.0 — Zod можно добавить в v1.1 |

## 🗺️ Дорожная карта

### v1.0 — Фундамент ✅
- [x] Full-stack React + Express архитектура
- [x] JSON-файловая БД с атомарной записью
- [x] JWT аутентификация с ротацией refresh-токенов
- [x] TOTP двухфакторная аутентификация
- [x] RBAC (ролевая модель доступа)
- [x] Kanban-доска, Проекты, Библиотека, Файлы, Серверы
- [x] Страница аналитики, просмотр аудит-лога, граф зависимостей
- [x] Health Score виджет на дашборде
- [x] PWA с поддержкой офлайн и автообновлением
- [x] Telegram Web App интеграция
- [x] Локализация (RU + EN)
- [x] Демо-режим с определением через nginx-заголовок
- [x] Rate limiting, security headers, error logging
- [x] 145 тестов, 94%+ покрытие
- [x] CI/CD pipeline с quality gates
- [x] Архитектурная документация + ADR

### v1.1 — Полировка 🚧
- [ ] Визуальный редизайн (анимации, карточки, графики, пустые состояния)
- [ ] Умное автообновление (visibilitychange, WebSocket, адаптивный интервал)
- [ ] Docker Compose деплой
- [ ] Автоматический деплой демо-инстанса

### v2.0 — Масштабирование 📋
- [ ] PostgreSQL как опция для бэкенда
- [ ] WebSocket real-time обновления
- [ ] Поддержка нескольких колоний
- [ ] Плагин-система для кастомных виджетов
- [ ] Интеграция с OpenRouter (баланс)

## 📜 Лицензия

Этот проект лицензирован под **MIT License** — подробности в файле [LICENSE](LICENSE).

## 👤 Автор

**Евгений (DoctorM)** — медик, разработчик, AI-евангелист.

Часть лаборатории [LabDoctorM](https://github.com/thedoctormes-hue).

---

<p align="center">
  <em>Сделано с 🧠 и ☕ командой DoctorM&Ai</em>
</p>
