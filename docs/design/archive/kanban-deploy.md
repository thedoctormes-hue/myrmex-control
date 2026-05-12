# Стратегия деплоя канбан-системы Myrmex Control

> **Версия:** 1.0 | **Дата:** 2026-05-11 | **Автор:** OWL (DevOps Engineer)
>
> Этот документ описывает стратегию развёртывания CI/CD pipeline, миграции данных, rollback, smoke-тестов и мониторинга для канбан-системы Myrmex Control. Здесь нет кода — только архитектурные решения и процедуры.

---

## Содержание

1. [Обзор архитектуры деплоя](#1-обзор-архитектуры-деплоя)
2. [CI/CD Pipeline](#2-cicd-pipeline)
3. [Стратегия миграции данных](#3-стратегия-миграции-данных)
4. [Rollback](#4-rollback)
5. [Smoke-тесты](#5-smoke-тесты)
6. [Мониторинг](#6-мониторинг)
7. [Матрица окружений](#7-матрица-окружений)
8. [Чеклист готовности к деплою (Go/No-Go)](#8-чеклист-готовности-к-деплою-go-no-go)

---

## 1. Обзор архитектуры деплоя

### 1.1. Топология

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Developer  │────▶│  GitHub      │────▶│  Production Server  │
│  git push   │     │  Actions CI  │     │  185.138.90.150     │
└─────────────┘     └──────┬───────┘     │                     │
                           │             │  ┌───────────────┐   │
                           │             │  │ Nginx (443)   │   │
                           │             │  │  ├─ /          │   │
                           │             │  │  │  → Node.js  │   │
                           │             │  │  │  :3000      │   │
                           │             │  │  └─ /api/*    │   │
                           │             │  │     → :3000   │   │
                           │             │  └───────────────┘   │
                           │             │                     │
                           │             │  ┌───────────────┐   │
                           │             │  │ systemd       │   │
                           │             │  │ myrmex-control│   │
                           │             │  │ myrmex-demo   │   │
                           │             │  └───────────────┘   │
                           │             │                     │
                           │             │  ┌───────────────┐   │
                           │             │  │ /var/www/     │   │
                           │             │  │  myrmexcontrol│   │
                           │             │  │  demo/        │   │
                           │             │  │  dashboard/   │   │
                           │             │  └───────────────┘   │
                           │             └─────────────────────┘
                           │
                    ┌──────┴───────┐
                    │  CI Jobs:    │
                    │  1. quality  │
                    │  2. security │
                    │  3. deploy   │
                    └──────────────┘
```

### 1.2. Компоненты

| Компонент | Технология | Назначение |
|-----------|-----------|------------|
| **Frontend** | React 19 + Vite 6 + Tailwind 3.4 | SPA, PWA, канбан-доски |
| **Backend** | Express 4 + Node.js 20 | REST API, auth, JSON DB |
| **База данных** | myrmex.json (файл) | Атомарные записи, file locking |
| **Веб-сервер** | Nginx | Reverse proxy, SSL, статика |
| **Process manager** | systemd | Автостарт, рестарт, логи |
| **CI/CD** | GitHub Actions | Линтинг, тесты, деплой |
| **SSL** | Let's Encrypt | HTTPS |

### 1.3. Три доски — один инстанс

Все три канбан-доски (ЗАВЛАБ, МУРАВЕЙ, КОТ) работают в рамках одного инстанса приложения. Разделение на доски — на уровне данных (поле `board` в задачах и проектах), а не на уровне инфраструктуры. Это означает:

- **Один билд** обслуживает все три доски
- **Один myrmex.json** хранит данные всех досок
- **Один systemd-сервис** управляет процессом
- **Один Nginx server block** обрабатывает запросы

---

## 2. CI/CD Pipeline

### 2.1. Обзор пайплайна

Пайплайн состоит из трёх последовательных этапов:

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ 1.QUALITY│───▶│2.SECURITY│───▶│ 3.DEPLOY │
│          │    │          │    │          │
│ • lint   │    │ • audit  │    │ • build  │
│ • type   │    │ • secrets│    │ • copy   │
│ • test   │    │          │    │ • restart│
│ • build  │    │          │    │ • smoke  │
└──────────┘    └──────────┘    └──────────┘
```

### 2.2. Триггеры

| Событие | Действие |
|---------|----------|
| `push` в `main` | Полный пайплайн: quality -> security -> deploy |
| `pull_request` в `main` | Quality + security (без деплоя) |
| `push` в `develop` | Quality + security (без деплоя) |
| `workflow_dispatch` | Ручной запуск деплоя (с выбором окружения) |

### 2.3. Этап 1: Quality Gate

**Цель:** убедиться, что код соответствует стандартам качества до деплоя.

**Шаги (в порядке выполнения):**

1. **Checkout** — `actions/checkout@v4`
2. **Setup Node.js 20** — `actions/setup-node@v4` с кэшированием npm
3. **Install** — `npm ci` (чистая установка, детерминированная)
4. **Lint** — `npm run lint` (ESLint, zero warnings policy)
5. **Type check** — `npx tsc --noEmit` (TypeScript без ошибок)
6. **Test** — `npm run test:coverage` (Vitest, покрытие >= 80%)
7. **Coverage gate** — парсинг JSON-отчёта, проверка `statements.pct >= 80`
8. **Build** — `npm run build` (сервер + клиент)
9. **Upload artifacts** — `actions/upload-artifact@v4` (папка `dist/`)

**Критерии прохождения:**
- ESLint: 0 ошибок, 0 предупреждений
- TypeScript: 0 ошибок типизации
- Тесты: 100% pass rate
- Покрытие: >= 80% statements
- Билд: успешный, артефакт загружен

**Поведение при провале:** пайплайн останавливается, deploy не запускается. Уведомление в Telegram.

### 2.4. Этап 2: Security Gate

**Цель:** проверить зависимости и код на уязвимости.

**Шаги:**

1. **npm audit** — `npm audit --audit-level=high` (fail при high/critical)
2. **Secret scanning** — проверка наличия секретов в коде (GitHub secret scanning)
3. **Dependency review** — проверка новых зависимостей в PR

**Критерии прохождения:**
- 0 уязвимостей уровня high и critical
- 0 утечек секретов в коде

**Поведение при провале:** пайплайн останавливается. Создаётся issue с описанием уязвимости.

### 2.5. Этап 3: Deploy

**Цель:** доставить собранный артефакт на сервер и перезапустить сервис.

**Предусловия:** quality и security gates пройдены.

**Шаги:**

1. **Download artifacts** — загрузка `dist/` из этапа quality
2. **SSH на сервер** — `appleboy/ssh-action` с использованием GitHub Secrets
3. **Backup текущей версии** — создание бэкапа `dist/` и `myrmex.json`
4. **Deploy** — копирование новых файлов, перезапуск systemd
5. **Smoke test** — проверка работоспособности после деплоя
6. **Rollback on failure** — автоматический откат при провале smoke-теста

**Детали шага деплоя (выполняется по SSH):**

```
# 1. Бэкап текущей версии
TIMESTAMP=$(date +%Y%m%d%H%M%S)
cp -r dist/ dist.bak.${TIMESTAMP}/
cp myrmex.json myrmex.json.bak.${TIMESTAMP}

# 2. Копирование нового билда
rsync -av --delete dist/client/ /var/www/myrmexcontrol/
rsync -av dist/server/ server-dist/
cp myrmex.json server-dist/
cp .env server-dist/

# 3. Перезапуск сервиса
systemctl restart myrmex-control

# 4. Ожидание готовности
sleep 5

# 5. Smoke test
curl -sf http://localhost:3000/api/health || exit 1
```

### 2.6. Уведомления

| Событие | Канал | Содержание |
|---------|-------|-----------|
| Провал quality gate | Telegram | Build failed: [этап], [ссылка] |
| Успешный деплой | Telegram | Deployed: [commit], [время] |
| Провал smoke-теста | Telegram | Smoke test failed! Rollback initiated |
| Успешный rollback | Telegram | Rollback complete: [версия] |

---

## 3. Стратегия миграции данных

### 3.1. Контекст

Данные канбан-системы хранятся в `myrmex.json` — одном JSON-файле. Это не реляционная БД, поэтому классические миграции (вроде Alembic/Prisma Migrate) не применимы. Вместо этого используется **schema evolution** — постепенное расширение схемы с обратной совместимостью.

### 3.2. Источники данных

| Источник | Что содержит | Куда мигрирует |
|----------|-------------|----------------|
| `projects.json` | Список проектов лаборатории | `myrmex.json` -> `projects[]` |
| `INCIDENTS.md` | Инциденты в markdown | `myrmex.json` -> `incidents[]` |
| `myrmex.json` (старый) | Changelog, демо-данные | `myrmex.json` -> `changelog[]` |
| Вручную | Агенты, скиллы, хуки | `myrmex.json` -> `agents[]`, `skills[]`, `hooks[]` |

### 3.3. Скрипт миграции

Существующий скрипт `scripts/migrate-lab-data.py` выполняет первоначальную миграцию. Стратегия его использования:

**Фаза 1: Первоначальная миграция (одноразовая)**

1. Запуск в dry-run режиме: `python3 scripts/migrate-lab-data.py --dry-run --verbose`
2. Проверка выходного файла `myrmex-migrated-draft.json`
3. Ручное заполнение агентов, скиллов, хуков (нет источников на диске)
4. Копирование: `cp myrmex-migrated-draft.json myrmex.json`
5. Билд и деплой

**Фаза 2: Инкрементальные изменения (по мере необходимости)**

Для каждого изменения схемы:

1. Создаётся скрипт `scripts/migrate-vX.Y.Z.py` с конкретной трансформацией
2. Скрипт читает текущий `myrmex.json`, модифицирует, записывает обратно
3. Перед запуском — бэкап: `cp myrmex.json myrmex.json.bak.vX.Y.Z`
4. Скрипт идемпотентен: повторный запуск не ломает данные
5. Версионирование: `_meta.schemaVersion` увеличивается

### 3.4. Версионирование схемы

```
myrmex.json
├── _meta
│   ├── version: "2026.05.11"        # Версия данных (дата)
│   ├── schemaVersion: "1.0.0"       # Семвер схемы
│   ├── lastUpdated: "2026-05-11T..."
│   └── changeCount: 42              # Количество изменений
```

**Правила версионирования:**

| Изменение | Уровень семвера | Пример |
|-----------|----------------|--------|
| Новое опциональное поле | minor (1.0.0 -> 1.1.0) | Добавление `epicId` в Task |
| Удаление/переименование поля | major (1.x -> 2.0.0) | Удаление `parentId` |
| Изменение типа поля | major (1.x -> 2.0.0) | `priority: int` -> `priority: string` |
| Добавление новой сущности | minor (1.0.0 -> 1.1.0) | Добавление `Epic`, `Goal` |
| Добавление индекса/оптимизации | patch (1.0.0 -> 1.0.1) | Без изменения структуры |

### 3.5. Бэкап данных

**Правило: бэкап перед каждым изменением myrmex.json.**

Стратегия бэкапов:

| Тип | Частота | Хранение | Формат |
|-----|---------|----------|--------|
| Автоматический бэкап | Перед каждым деплоем | Последние 10 версий | `myrmex.json.bak.YYYYMMDDHHMMSS` |
| Ручной бэкап | Перед миграцией схемы | 30 дней | `myrmex.json.bak.vX.Y.Z` |
| Ежедневный бэкап | Каждый день в 03:00 UTC | 7 дней | Через cron + rsync |

**Ротация:** хранить последние 10 бэкапов деплоя + 7 ежедневных. Старые — удалять.

### 3.6. Обработка конфликтов данных

Поскольку myrmex.json — файл, а не БД, возможны конфликты при одновременной записи:

**Текущее решение:** `proper-lockfile` — file locking с 3 попытками и 5s stale timeout.

**Рекомендация для канбан-системы:** при масштабировании до множества агентов, пишущих одновременно, рассмотреть переход на SQLite (через `better-sqlite3`). Это даст:
- WAL mode для параллельного чтения/записи
- ACID-транзакции
- Стандартные миграции через SQL
- Совместимость с текущим API (замена `myrmex.ts` на `database.ts`)

**Порог перехода:** при > 5 одновременных писателях или > 1000 задач.

---

## 4. Rollback

### 4.1. Стратегия: Blue-Green на уровне файлов

Классический blue-green с двумя серверами избыточен для single-instance приложения. Вместо этого используется **file-level rollback** — хранение предыдущей версии файлов рядом с текущей.

### 4.2. Что откатывать

| Компонент | Что бэкапить | Где хранить |
|-----------|-------------|-------------|
| Frontend | `dist/client/` | `dist.bak.YYYYMMDDHHMMSS/client/` |
| Backend | `dist/server/` | `dist.bak.YYYYMMDDHHMMSS/server/` |
| Данные | `myrmex.json` | `myrmex.json.bak.YYYYMMDDHHMMSS` |
| Конфиг | `.env` | `.env.bak.YYYYMMDDHHMMSS` |
| Nginx | `/etc/nginx/sites-enabled/` | `/etc/nginx/sites-enabled/*.bak` |

### 4.3. Процедура rollback

**Автоматический rollback (при провале smoke-теста):**

```
# 1. Остановить сервис
systemctl stop myrmex-control

# 2. Восстановить предыдущую версию
LATEST_BAK=$(ls -td dist.bak.*/ | head -1)
TIMESTAMP=${LATEST_BAK#dist.bak.}
TIMESTAMP=${TIMESTAMP%/}

cp -r ${LATEST_BAK}client/ /var/www/myrmexcontrol/
cp -r ${LATEST_BAK}server/ server-dist/
cp myrmex.json.bak.${TIMESTAMP} server-dist/myrmex.json
cp .env.bak.${TIMESTAMP} server-dist/.env

# 3. Запустить сервис
systemctl start myrmex-control

# 4. Проверка
sleep 5
curl -sf http://localhost:3000/api/health || echo "ROLLBACK FAILED!"

# 5. Уведомление
echo "Rollback to ${LATEST_BAK} complete"
```

**Ручной rollback (по решению оператора):**

1. Определить целевую версию: `ls -la dist.bak.*/`
2. Выполнить шаги 1-5 из автоматического rollback
3. Проверить данные: открыть UI, убедиться что задачи на месте
4. Уведомить команду

### 4.4. Окно rollback

- **Данные (myrmex.json):** можно откатить на любой из последних 10 бэкапов
- **Код (dist/):** можно откатить на последнюю версию (1 бэкап)
- **Максимальное окно:** 10 деплоев для данных, 1 деплой для кода

### 4.5. Rollback миграции данных

Если миграция схемы прошла с ошибкой:

```
# 1. Остановить сервис
systemctl stop myrmex-control

# 2. Восстановить myrmex.json из бэкапа миграции
cp myrmex.json.bak.vX.Y.Z myrmex.json

# 3. Запустить сервис
systemctl start myrmex-control

# 4. Проверка
curl -sf http://localhost:3000/api/health
```

**Важно:** каждый скрипт миграции должен создавать бэкап ДО изменения. Это не опционально.

---

## 5. Smoke-тесты

### 5.1. Философия

Smoke-тесты — это минимальный набор проверок, подтверждающих что система жива после деплоя. Они не заменяют полное тестирование (которое происходит в CI), а проверяют что деплой прошёл корректно.

### 5.2. Уровни smoke-тестов

**Уровень 1: Процесс (выполняется сразу после деплоя)**

| Проверка | Команда | Ожидаемый результат |
|----------|---------|-------------------|
| Сервис запущен | `systemctl is-active myrmex-control` | `active` |
| Порт слушает | `ss -tlnp \| grep 3000` | `LISTEN` |
| Health endpoint | `curl -sf http://localhost:3000/api/health` | HTTP 200, JSON |
| Нет ошибок в логах | `journalctl -u myrmex-control --since "1 min ago" -p err` | 0 строк |

**Уровень 2: API (выполняется через 30 секунд)**

| Проверка | Метод | Endpoint | Ожидаемый результат |
|----------|-------|----------|-------------------|
| Auth status | GET | `/api/auth/status` | HTTP 200, JSON с `demo: true` |
| State | GET | `/api/state` | HTTP 200, JSON с `projects`, `tasks`, `agents` |
| Projects list | GET | `/api/projects` | HTTP 200, массив |
| Tasks list | GET | `/api/tasks` | HTTP 200, массив |
| Version | GET | `/api/version` | HTTP 200, `{ version: "1.0.0" }` |

**Уровень 3: Данные (выполняется через 60 секунд)**

| Проверка | Метод | Ожидаемый результат |
|----------|-------|-------------------|
| Проекты загружены | GET `/api/projects` | `length > 0` |
| Задачи загружены | GET `/api/tasks` | `length > 0` |
| Агенты загружены | GET `/api/state` -> `agents` | `length > 0` |
| Changelog работает | POST `/api/tasks` + GET `/api/state` -> `changelog` | Новая запись в changelog |
| Запись в myrmex.json | POST `/api/tasks` + проверка файла | Файл обновлён |

**Уровень 4: UI (выполняется через 90 секунд)**

| Проверка | Метод | Ожидаемый результат |
|----------|-------|-------------------|
| Главная страница | `curl -sf https://myrmexcontrol.shtab-ai.ru/` | HTTP 200, HTML с `<div id="root">` |
| SPA загружается | Проверка наличия `index.html` | Содержит `<script>` теги |
| PWA manifest | `curl -sf https://myrmexcontrol.shtab-ai.ru/manifest.webmanifest` | HTTP 200, JSON |
| Nginx proxy | `curl -sf -o /dev/null -w "%{http_code}" https://myrmexcontrol.shtab-ai.ru/api/health` | 200 |

### 5.3. Критерии прохождения smoke-теста

- **Уровень 1:** все 4 проверки — обязательно
- **Уровень 2:** все 5 проверок — обязательно
- **Уровень 3:** минимум 4 из 5 — допустимо
- **Уровень 4:** минимум 3 из 4 — допустимо

**При провале уровня 1 или 2:** автоматический rollback + уведомление.

**При провале уровня 3 или 4:** уведомление, rollback по решению оператора.

### 5.4. Тайминг

```
Деплой завершён
      │
      ├── 0с  → systemctl restart
      ├── 5с  → Уровень 1 (процесс)
      ├── 35с → Уровень 2 (API)
      ├── 65с → Уровень 3 (данные)
      ├── 95с → Уровень 4 (UI)
      └── 100с → Итог: PASS / FAIL
```

**Общее время smoke-теста:** ~100 секунд.

---

## 6. Мониторинг

### 6.1. Уровни мониторинга

```
┌─────────────────────────────────────────────────┐
│ Уровень 4: Бизнес-метрики (канбан)             │
│  • Количество задач по статусам                │
│  • Cycle time, throughput                      │
│  • Заблокированные задачи                      │
├─────────────────────────────────────────────────┤
│ Уровень 3: Приложение                          │
│  • API latency (p50, p95, p99)                 │
│  • Error rate                                  │
│  • Auth failures                               │
├─────────────────────────────────────────────────┤
│ Уровень 2: Инфраструктура                      │
│  • CPU, RAM, диск                              │
│  • Node.js process uptime                      │
│  • myrmex.json file size                       │
├─────────────────────────────────────────────────┤
│ Уровень 1: Сеть                                │
│  • Nginx uptime                                │
│  • SSL expiry                                  │
│  • Port availability                           │
└─────────────────────────────────────────────────┘
```

### 6.2. Уровень 1: Сеть

| Метрика | Как проверять | Частота | Алерт |
|---------|--------------|---------|-------|
| Nginx запущен | `systemctl is-active nginx` | каждые 60с | CRITICAL |
| Порт 443 слушает | `ss -tlnp \| grep 443` | каждые 60с | CRITICAL |
| SSL не истёк | `openssl s_client -connect` | каждые 24ч | WARNING за 14 дней |
| DNS резолвится | `dig +short myrmexcontrol.shtab-ai.ru` | каждые 5мин | CRITICAL |

### 6.3. Уровень 2: Инфраструктура

| Метрика | Порог | Алерт |
|---------|-------|-------|
| CPU > 80% | 5 минут | WARNING |
| CPU > 95% | 2 минуты | CRITICAL |
| RAM > 85% | 5 минут | WARNING |
| Диск > 90% | постоянно | CRITICAL |
| Node.js uptime < 5мин | после рестарта | WARNING |
| myrmex.json > 10MB | постоянно | WARNING |
| myrmex.json > 50MB | постоянно | CRITICAL |

### 6.4. Уровень 3: Приложение

| Метрика | Порог | Алерт |
|---------|-------|-------|
| API response time p95 > 500ms | 5 минут | WARNING |
| API response time p95 > 2000ms | 2 минуты | CRITICAL |
| Error rate > 1% | 5 минут | WARNING |
| Error rate > 5% | 2 минуты | CRITICAL |
| Auth failures > 10/мин | 5 минут | WARNING |
| Watchdog: server offline | мгновенно | CRITICAL |

### 6.5. Уровень 4: Бизнес-метрики (канбан)

Эти метрики доступны через API и отображаются на дашборде:

| Метрика | Где смотреть | Порог |
|---------|-------------|-------|
| Задачи в работе (WIP) | Дашборд -> CFD | WIP > агенты x 2 |
| Заблокированные задачи | Дашборд -> Blocked | > 3 в течение 24ч |
| Просроченные задачи | Дашборд -> Overdue | > 0 |
| Cycle time trend | Дашборд -> Analytics | Рост > 20% за неделю |
| Throughput | Дашборд -> Analytics | Падение > 30% за неделю |

### 6.6. Инструменты мониторинга

**Текущий стартовый набор (минимум):**

| Инструмент | Назначение | Приоритет |
|-----------|-----------|-----------|
| `journalctl` | Логи systemd-сервиса | P0 |
| `systemctl` | Статус сервиса | P0 |
| `curl` | Health endpoint | P0 |
| `ss` / `netstat` | Порты | P0 |
| `df` / `free` | Диск / RAM | P1 |
| `openssl` | SSL expiry | P1 |

**Рекомендуемый набор (при росте):**

| Инструмент | Наз
