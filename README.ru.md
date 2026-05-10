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
  <a href="https://myrmexcontrol.shtab-ai.ru"><img src="https://img.shields.io/badge/Продакшн-myrmexcontrol.shtab--ai.ru-amber?style=for-the-badge" alt="Продакшн"></a>
  <a href="https://demo.shtab-ai.ru"><img src="https://img.shields.io/badge/Демо-demo.shtab--ai.ru-amber?style=for-the-badge" alt="Демо"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white" alt="Express 4">
  <img src="https://img.shields.io/badge/Лицензия-MIT-green?style=flat-square" alt="MIT">
  <img src="https://img.shields.io/badge/Версия-0.1.0-amber?style=flat-square" alt="v0.1.0">
</p>

---

<!-- ![Myrmex Control Dashboard](docs/screenshot.png) -->

## 📖 Описание

**Myrmex Control** — полнофункциональный дашборд для управления AI-агентами, «пульт управления муравейником». Глубокая тёмно-синяя палитра с янтарными акцентами, React 19 фронтенд + Express 4 бэкенд + JSON как база данных.

*Myrmex* (μύρμηξ) — греческое «муравей», отсылка к муравейнику AI-агентов.

Два развёрнутых экземпляра:
- **[myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru)** — продакшн с авторизацией
- **[demo.shtab-ai.ru](https://demo.shtab-ai.ru)** — демо-режим без логина

## ✨ Возможности

| Функция | Описание |
|---|---|
| 📊 **Дашборд** | Виджеты: серверы, баланс, лента сигналов |
| 📋 **Канбан** | Drag-and-drop задач по колонкам |
| 📁 **Проекты** | CRUD проектов с описанием и статусом |
| 📚 **Библиотека** | Скиллы, хуки, конфигурации агентов |
| 📂 **Файлообменник** | Входящие/исходящие файлы |
| 🕸️ **Граф** | Текстовое представление связей (D3.js в v0.2) |
| 🔐 **Авторизация** | Cookie-сессии 24ч, первичная настройка пароля |
| 🎭 **Демо-режим** | Без авторизации, данные сбрасываются каждый час |
| 🌐 **i18n** | Русский и английский языки |
| 🔔 **Тосты** | Уведомления о действиях пользователя |
| 🛡️ **Rate limiting** | 100 запросов/минуту на IP |
| 🔒 **Безопасность** | HSTS, CSP, Permissions-Policy |
| 💾 **Бэкапы** | Автоматические каждый час |

## 🛠 Стек технологий

### Фронтенд
| Технология | Версия | Назначение |
|---|---|---|
| React | 19 | UI-фреймворк |
| TypeScript | 5.6 | Типизация |
| Vite | 6 | Сборка и dev-сервер |
| Tailwind CSS | 3.4 | Утилитарные стили |
| React Router DOM | 7 | Клиентский роутинг |
| Lucide React | 1.14 | Библиотека иконок |

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
**На JSON-файлах** — `myrmex.json` является единственным источником истины. Блокировка файлов через `proper-lockfile` обеспечивает безопасный конкурентный доступ. Внешняя СУБД не требуется.

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

# Запустить в режиме разработки (клиент + сервер)
npm run dev
```

Dev-сервер запускает два процесса параллельно:
- **Vite dev-сервер** — `http://localhost:5173` (frontend с HMR)
- **Express API-сервер** — `http://localhost:3000` (backend с watch mode)

### Продакшн-сборка

```bash
# Собрать клиент и сервер
npm run build

# Запустить продакшн-сервер
npm start
```

### Переменные окружения

| Переменная | По умолчанию | Описание |
|---|---|---|
| `PORT` | `3000` | Порт сервера |
| `MYRMEX_PASSWORD` | *(нет)* | Пароль администратора (задаётся через UI или `.env`) |
| `CORS_ORIGIN` | `http://localhost:5173` | Разрешённый origin для CORS |
| `NODE_ENV` | `development` | Установите `production` для HSTS и secure cookies |

## 📁 Структура проекта

```
myrmex-control/
├── src/
│   ├── client/                  # React фронтенд
│   │   ├── components/
│   │   │   ├── dashboard/       # BalanceWidget, ServerWidget, SignalsFeed
│   │   │   ├── layout/          # Sidebar, BottomBar
│   │   │   └── ui/              # CatMascot, ErrorBanner, ToastContainer
│   │   ├── hooks/               # useMyrmex, useTheme, useToast
│   │   ├── lib/                 # api.ts, i18n.tsx
│   │   ├── pages/               # Dashboard, Board, Projects, Library,
│   │   │                        # Files, Graph, Login, Setup
│   │   ├── public/              # favicon.svg
│   │   ├── App.tsx              # Корневой компонент с роутингом
│   │   ├── index.html           # HTML-точка входа
│   │   ├── main.tsx             # Точка входа React
│   │   └── index.css            # Tailwind импорты + кастомная тема
│   ├── server/                  # Express бэкенд
│   │   ├── api/                 # Обработчики маршрутов
│   │   │   ├── tasks.ts         # CRUD задач
│   │   │   ├── projects.ts      # CRUD проектов
│   │   │   ├── library.ts       # Библиотека скиллов/хуков/агентов
│   │   │   ├── files.ts         # Файлообменник (входящие/исходящие)
│   │   │   ├── servers.ts       # Мониторинг серверов
│   │   │   └── state.ts         # Чтение/запись глобального состояния
│   │   ├── auth.ts              # Настройка пароля, вход, сессии
│   │   ├── backup.ts            # Планировщик автобэкапов
│   │   ├── demo-sim.ts          # Симулятор данных для демо-режима
│   │   ├── middleware.ts        # Rate limiter + логирование ошибок
│   │   ├── myrmex.ts            # Чтение/запись JSON БД + аудит
│   │   ├── watchdog.ts          # Фоновый мониторинг серверов
│   │   └── index.ts             # Точка входа Express-приложения
│   └── shared/
│       └── types.ts             # Общие TypeScript-интерфейсы
├── backups/                     # Автоматические бэкапы
├── logs/                        # Логи ошибок
├── myrmex.json                  # Основной файл базы данных
├── vite.config.ts               # Конфигурация Vite
├── tailwind.config.js           # Тема Tailwind (тёмно-синий + янтарный)
├── postcss.config.js            # Конфигурация PostCSS
├── tsconfig.json                # Базовая конфигурация TypeScript
├── tsconfig.client.json         # Конфигурация TS для клиента
├── tsconfig.server.json         # Конфигурация TS для сервера
└── package.json
```

## 🔌 API-эндпоинты

### Аутентификация
| Метод | Путь | Авторизация | Описание |
|---|---|---|---|
| `POST` | `/api/auth/setup` | ❌ | Первичная установка пароля |
| `POST` | `/api/auth/login` | ❌ | Вход по паролю |
| `POST` | `/api/auth/logout` | ❌ | Очистка cookie сессии |
| `GET` | `/api/auth/status` | ❌ | Проверка состояния авторизации |

### Состояние
| Метод | Путь | Авторизация | Описание |
|---|---|---|---|
| `GET` | `/api/state` | ✅ | Чтение полного состояния приложения |
| `PUT` | `/api/state` | ✅ | Запись состояния приложения |

### Задачи (Канбан)
| Метод | Путь | Авторизация | Описание |
|---|---|---|---|
| `GET` | `/api/tasks` | ✅ | Список всех задач |
| `POST` | `/api/tasks` | ✅ | Создать задачу |
| `PUT` | `/api/tasks/:id` | ✅ | Обновить задачу |
| `DELETE` | `/api/tasks/:id` | ✅ | Удалить задачу |

### Проекты
| Метод | Путь | Авторизация | Описание |
|---|---|---|---|
| `GET` | `/api/projects` | ✅ | Список всех проектов |
| `POST` | `/api/projects` | ✅ | Создать проект |
| `PUT` | `/api/projects/:id` | ✅ | Обновить проект |
| `DELETE` | `/api/projects/:id` | ✅ | Удалить проект |

### Библиотека
| Метод | Путь | Авторизация | Описание |
|---|---|---|---|
| `GET` | `/api/library` | ✅ | Список элементов библиотеки |
| `POST` | `/api/library` | ✅ | Добавить элемент |
| `PUT` | `/api/library/:id` | ✅ | Обновить элемент |
| `DELETE` | `/api/library/:id` | ✅ | Удалить элемент |

### Файлообменник
| Метод | Путь | Авторизация | Описание |
|---|---|---|---|
| `GET` | `/api/files` | ✅ | Список файлов (входящие/исходящие) |
| `POST` | `/api/files` | ✅ | Загрузить/отправить файл |
| `DELETE` | `/api/files/:id` | ✅ | Удалить файл |

### Серверы
| Метод | Путь | Авторизация | Описание |
|---|---|---|---|
| `GET` | `/api/servers` | ✅ | Список отслеживаемых серверов |
| `POST` | `/api/servers` | ✅ | Добавить сервер |
| `PUT` | `/api/servers/:id` | ✅ | Обновить запись сервера |
| `DELETE` | `/api/servers/:id` | ✅ | Удалить сервер |

### Системные
| Метод | Путь | Авторизация | Описание |
|---|---|---|---|
| `GET` | `/api/health` | ❌ | Проверка работоспособности (uptime, timestamp) |

## 🚢 Деплой

### Продакшн-инстанс (с авторизацией)

```bash
npm run build
# Разместите dist/client/* на веб-сервере (например, Nginx)
# Разместите dist/server/* на сервере приложений
# Перезапустите менеджер сервисов (systemd, pm2 и т.д.)
```

Развёрнут на: **[myrmexcontrol.shtab-ai.ru](https://myrmexcontrol.shtab-ai.ru)**

### Демо-инстанс (без авторизации)

```bash
npm run build
# Разместите dist/client/* на веб-сервере
# Разместите dist/server/* на сервере приложений с DEMO_MODE=true
# Перезапустите менеджер сервисов
```

Развёрнут на: **[demo.shtab-ai.ru](https://demo.shtab-ai.ru)**

### Systemd-сервисы (пример)

| Сервис | Инстанс | Назначение |
|---|---|---|
| `myrmex-control` | Продакшн | Полноценный дашборд с авторизацией |
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
| `--accent` | `#f59e0b` | Основной янтарный акцент |
| `--accent-hover` | `#d97706` | Янтарный при наведении |
| `--text-primary` | `#f1f5f9` | Основной текст |
| `--text-secondary` | `#94a3b8` | Второстепенный/приглушённый текст |

**Логотип:** Иконка жука из [Lucide Icons](https://lucide.dev/)
**Талисман:** 🐱 Кот (талисман ЗавЛаб)

## 📜 Лицензия

Этот проект лицензирован под **MIT License** — подробности в файле [LICENSE](https://github.com/doctormai/LabDoctorM/blob/main/LICENSE).

## 👤 Автор

**ЗавЛаб (Евгений)** — медик, разработчик, AI-евангелист.

Проект лаборатории [LabDoctorM](https://github.com/doctormai/LabDoctorM).

---

<p align="center">
  <em>Сделано с 🧠 и ☕ командой Doctorm&Ai</em>
</p>
