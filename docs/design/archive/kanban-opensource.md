# Стратегия Open Source для Myrmex Control — Канбан-система

> **Версия:** 1.0 | **Дата:** 2026-05-11 | **Автор:** OWL (Open Source Strategist)
>
> Конкретная стратегия превращения Myrmex Control в успешный open source проект с фокусом на канбан-систему с автоматическим распределением задач через веса.

---

## Содержание

1. [Позиционирование и ниша](#1-позиционирование-и-ниша)
2. [Структура README](#2-структура-readme)
3. [CONTRIBUTING.md — гайд для контрибьюторов](#3-contributingmd--гайд-для-контрибьюторов)
4. [Issue Templates](#4-issue-templates)
5. [PR Labels и классификация](#5-pr-labels-и-классификация)
6. [GitHub Pages для демо](#6-github-pages-для-демо)
7. [Community Guidelines](#7-community-guidelines)
8. [Roadmap публичного развития](#8-roadmap-публичного-развития)
9. [Метрики успеха](#9-метрики-успеха)
10. [Пошаговый план запуска](#10-пошаговый-план-запуска)

---

## 1. Позиционирование и ниша

### Уникальное торговое предложение (USP)

**Myrmex Control — единственная канбан-система с автоматическим распределением задач через весовую модель и нативной поддержкой AI-агентов как участников workflow.**

### Конкурентный ландшафт

| Проект | Сильные стороны | Чего не хватает |
|--------|-----------------|-----------------|
| **Taist** | Зрелая, модульная | Нет AI-агентов, нет весов |
| **Kanboard** | PHP, простая | Нет автоматизации, нет API-first |
| **Planka** | React, красивая | Нет весов, нет AI-интеграции |
| **Wekan** | Meteor, масштабируемая | Устаревший стек, нет весов |
| **Myrmex Control** | Весы, AI-агенты, JSON-first | Молодой проект |

### Целевая аудитория

1. **Разработчики AI-агентов** — нуждаются в визуальном управлении задачами агентов
2. **Индивидуальные разработчики** — хотят простую канбан-систему без инфраструктурной сложности
3. **DevOps/SRE небольших команд** — ищут лёгкую систему трекинга без Jira-сложности
4. **Исследователи** — изучают автоматическое планирование и весовые модели

### Ключевые сообщения для продвижения

- «Канбан с мозгами — задачи распределяются сами»
- «Zero-dependency kanban: один файл, один бинарь, работает везде»
- «Управляй AI-агентами как командой — на одной доске»

---

## 2. Структура README

### Рекомендуемая структура README.md

Текущий README (424 строки) уже хорошо структурирован. Рекомендуется усилить следующие секции:

```markdown
# 🐜 Myrmex Control

## Бейджи (уже есть — оставить)
- Добавить: ![Open Source](https://img.shields.io/badge/Open%20Source-MIT-green)
- Добавить: ![Stars](https://img.shields.io/github/stars/thedoctormes-hue/myrmex-control)
- Добавить: ![Contributors](https://img.shields.io/github/contributors/thedoctormes-hue/myrmex-control)

## Hero-секция (до TOC)
- Одно предложение: что это и почему стоит попробовать
- GIF-анимация: drag-and-drop на доске + автоматическое распределение
- Кнопки: [Live Demo] [Quick Start] [Docs]

## Что делает проект уникальным (NEW — после Hero)
- 🎯 Весовая модель: задачи сортируются автоматически
- 🤖 AI-агенты: нативная поддержка агентов как участников
- 📦 Zero-dependency: JSON вместо PostgreSQL
- 🎨 Три доски: стратегическая, тактическая, личная

## Быстрый старт (усилить)
- Добавить: одна команда для Docker-запуска
- Добавить: скриншот результата после запуска

## Скриншоты / Gallery (NEW)
- Dashboard — общий вид
- Kanban Board — drag-and-drop
- Weight Distribution — визуализация весов
- Mobile view — адаптивность

## Архитектура (сократить до summary, ссылка на ARCHITECTURE.md)

## Возможности (уже есть — оставить)

## Дорожная карта (NEW — публичный roadmap)

## Как участвовать (NEW — кратко, ссылка на CONTRIBUTING.md)

## Лицензия (уже есть — оставить)
```

### Мультиязычность

Проект уже имеет README на 3 языках (EN, RU, ZH). Рекомендуется:
- Оставить EN как primary
- RU и ZH — в отдельных файлах
- Добавить ссылки в шапке (уже есть)

### Визуальные элементы

1. **Hero GIF** — 15-секундная анимация: создание задачи -> автоматическое распределение -> перетаскивание -> завершение
2. **Скриншоты** — 4 ключевых экрана в `/docs/screenshots/`
3. **Архитектурная диаграмма** — Mermaid-диаграмма в README

---

## 3. CONTRIBUTING.md — гайд для контрибьюторов

### Текущее состояние

Файл `CONTRIBUTING.md` существует, но минимален (56 строк). Требует существенного расширения.

### Рекомендуемая структура

```markdown
# Contributing to Myrmex Control

## Содержание
1. Кодекс поведения
2. Как начать
3. Настройка окружения
4. Архитектурные принципы
5. Процесс разработки
6. Стиль кода
7. Тестирование
8. Документация
9. Процесс PR
10. Система заслуг (Contributor Levels)
11. Контакты
```

### Детали по разделам

#### Как начать
- Идеально для первого PR: ищите лейблы `good first issue` / `help wanted`
- Первый контакт: откройте Discussion перед крупными изменениями
- Форк -> Бранч -> Тесты -> PR

#### Настройка окружения
- Node.js 20+
- npm install
- npm run dev (frontend + backend параллельно)
- npm test (145 тестов должны проходить)
- Опционально: Docker

#### Архитектурные принципы
- JSON-first: никаких внешних БД
- Atomic writes: tmp-файл + rename
- File locking: proper-lockfile
- Frontend: React 19 + TypeScript strict
- Backend: Express 4, 6 API routers
- Тесты: Vitest + Supertest

#### Стиль кода
- TypeScript strict mode
- ESLint (eslint.config.js)
- Коммиты: Conventional Commits (feat:, fix:, docs:, refactor:, test:)
- Именование: camelCase для переменных, PascalCase для компонентов

#### Тестирование
- Минимум: тесты для новой функциональности
- Покрытие: не ниже текущего (проверить через npm run coverage)
- E2E: Playwright (если затронут фронтенд)

#### Процесс PR
1. Обновить CHANGELOG.md
2. Привязать issue (Fixes #N)
3. Убедиться, что CI зелёный
4. Запросить ревью
5. Ответить на комментарии

#### Contributor Levels
- 🌱 **Seed** — 1-3 PR: доступ к ревью
- 🌿 **Sprout** — 4-10 PR: право на лейблы
- 🌳 **Tree** — 11+ PR: право на ревью
- 🏔️ **Mountain** — 50+ PR: право на merge

---

## 4. Issue Templates

### Текущее состояние

Существуют 2 шаблона: `bug_report.md` и `feature_request.md`. Требуется расширение.

### Рекомендуемый набор шаблонов

#### 4.1. `bug_report.md` (существует — усилить)

Добавить секции:
```markdown
## Board Context
- [ ] ЗавЛаб
- [ ] МУРАВЕЙ
- [ ] КОТ
- [ ] Не связано с доской

## Weight System Impact
- [ ] Затрагивает весовую модель
- [ ] Затрагивает автоматическое распределение
- [ ] Не затрагивает весы
```

#### 4.2. `feature_request.md` (существует — усилить)

Добавить секции:
```markdown
## Board Context
На какую доску влияет?
- [ ] ЗавЛаб (стратегическая)
- [ ] МУРАВЕЙ (тактическая)
- [ ] КОТ (личная)
- [ ] Все доски
- [ ] Инфраструктура

## Weight System Impact
- [ ] Новая весовая метрика
- [ ] Изменение формулы весов
- [ ] Не затрагивает весы
```

#### 4.3. `docs_request.md` (NEW)

```markdown
---
name: Documentation
about: Предложить улучшение документации
title: '[Docs]: '
labels: documentation
---

## Что не хватает?
Какой раздел документации отсутствует или требует улучшения?

## Текущее состояние
Что вы нашли (или не нашли) в текущей документации?

## Предложение
Как бы вы улучшили документацию?

## Контекст
- [ ] README
- [ ] ARCHITECTURE.md
- [ ] API Reference
- [ ] CONTRIBUTING.md
- [ ] Дизайн-документация
```

#### 4.4. `weight_idea.md` (NEW — специфичный для проекта)

```markdown
---
name: Weight Model Idea
about: Предложить изменение в весовой модели
title: '[Weight]: '
labels: weights, enhancement
---

## Текущее поведение
Как работает весовая модель сейчас?

## Предлагаемое изменение
Какое изменение вы предлагаете?

## Обоснование
Почему это улучшит систему?

## Пример
Пример задачи, где текущая модель работает плохо:

## Формула (опционально)
Если предлагается новая формула — запишите ее:
W_total = W_priority + W_age + ... + W_new_metric
```

#### 4.5. `board_concept.md` (NEW — для новых досок)

```markdown
---
name: New Board Concept
about: Предложить новую доску или изменение существующей
title: '[Board]: '
labels: boards, enhancement
---

## Доска
Какую доску затрагивает изменение?

## Текущее состояние
Что есть сейчас?

## Предложение
Что вы предлагаете изменить?

## Use Case
Опишите сценарий использования
```

### Файловая структура

```
.github/
├── ISSUE_TEMPLATE/
│   ├── bug_report.md          # Существует — обновить
│   ├── feature_request.md     # Существует — обновить
│   ├── docs_request.md        # NEW
│   ├── weight_idea.md         # NEW
│   └── board_concept.md       # NEW
├── PULL_REQUEST_TEMPLATE.md   # Существует — обновить
├── CODEOWNERS                 # Существует — обновить
├── dependabot.yml             # Существует — обновить
└── workflows/
    └── ci.yml                 # Существует — обновить
```

---

## 5. PR Labels и классификация

### Текущее состояние

Лейблы не определены явно. В issue templates используются `bug`, `enhancement`, `documentation`.

### Рекомендуемая система лейблов

#### 5.1. По типу изменения

| Лейбл | Цвет | Описание |
|-------|------|----------|
| `bug` | #d73a4a | Баг, ошибка |
| `feature` | #a2eeef | Новая функциональность |
| `enhancement` | #a2eeef | Улучшение существующего |
| `docs` | #0075ca | Документация |
| `refactor` | #f29a46 | Рефакторинг без изменения поведения |
| `test` | #b5e856 | Тесты |
| `security` | #e4e669 | Безопасность |
| `performance` | #5319e7 | Производительность |
| `i18n` | #c5def5 | Локализация |

#### 5.2. По компоненту

| Лейбл | Цвет | Описание |
|-------|------|----------|
| `board-zavlab` | #0e8a16 | Доска ЗАВЛАБ |
| `board-muravey` | #0e8a16 | Доска МУРАВЕЙ |
| `board-kot` | #0e8a16 | Доска КОТ |
| `weights` | #fbca04 | Весовая модель |
| `automation` | #fbca04 | Автоматизация |
| `frontend` | #c5def5 | React/UI |
| `backend` | #c5def5 | Express/API |
| `auth` | #d4c5f9 | Аутентификация |
| `mobile` | #d4c5f9 | Мобильная адаптация |

#### 5.3. По приоритету

| Лейбл | Цвет | Описание |
|-------|------|----------|
| `P0-critical` | #b60205 | Критический — прод лежит |
| `P1-high` | #d93f0b | Высокий — блокер |
| `P2-medium` | #fbca04 | Средний — стандартная работа |
| `P3-low` | #0e8a16 | Низкий — улучшения |

#### 5.4. По статусу

| Лейбл | Цвет | Описание |
|-------|------|----------|
| `good first issue` | #7057ff | Хорошо для первого PR |
| `help wanted` | #008672 | Нужна помощь |
| `wontfix` | #ffffff | Не будет исправлено |
| `duplicate` | #cfd3d7 | Дубликат |
| `blocked` | #e4e669 | Заблокировано |

#### 5.5. Специфичные для проекта

| Лейбл | Цвет | Описание |
|-------|------|----------|
| `ai-agent` | #5319e7 | Затрагивает AI-агентов |
| `board-routing` | #fbca04 | Маршрутизация между досками |
| `weight-formula` | #fbca04 | Изменение формулы весов |
| `demo-data` | #c5def5 | Демо-данные |
| `design-system` | #d4c5f9 | Визуальный дизайн |

### Автоматизация лейблов

Рекомендуется настроить GitHub Actions для автоматической расстановки лейблов:

```yaml
# .github/workflows/labeler.yml
name: "PR Labeler"
on:
  pull_request:
    types: [opened, edited]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v5
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
```

С конфигурацией `.github/labeler.yml`:
```yaml
frontend:
  - changed-files:
      - any-glob-to-any-file: ['src/client/**', '*.css', '*.html']

backend:
  - changed-files:
      - any-glob-to-any-file: ['src/server/**']

weights:
  - changed-files:
      - any-glob-to-any-file: ['src/**/weight*', 'src/**/router*']

docs:
  - changed-files:
      - any-glob-to-any-file: ['*.md', 'docs/**']

test:
  - changed-files:
      - any-glob-to-any-file: ['tests/**', '**/*.test.*', '**/*.spec.*']
```

---

## 6. GitHub Pages для демо

### Текущее состояние

Live Demo размещена на `myrmexcontrol.shtab-ai.ru` и `demo.shtab-ai.ru`. GitHub Pages не используется.

### Рекомендуемая стратегия

#### 6.1. Основная демо — GitHub Pages

**URL:** `https://thedoctormes-hue.github.io/myrmex-control/`

**Структура:**
```
gh-pages branch (или /docs на main)
├── index.html          # Landing page с описанием
├── demo/               # Статическая сборка фронтенда
│   ├── index.html
│   ├── assets/
│   └── ...
├── screenshots/        # Скриншоты для README
│   ├── dashboard.png
│   ├── kanban-board.png
│   ├── weight-viz.png
│   └── mobile.png
└── docs/               # Дизайн-документация
    ├── architecture.html
    ├── weight-model.html
    └── visual-concept.html
```

#### 6.2. Landing Page

Landing page на GitHub Pages должна содержать:
- Hero: название, описание, кнопка "Try Demo"
- Скриншоты: 4 ключевых экрана
- Features: весы, AI-агенты, zero-dependency, три доски
- Quick Start: одна команда
- Links: GitHub, Docs, Live Demo

#### 6.3. Автоматический деплой

```yaml
# .github/workflows/pages.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/client
      - uses: actions/deploy-pages@v4
```

#### 6.4. Стратегия контента

| Страница | Назначение | Источник |
|----------|-----------|----------|
| `/` | Landing + ссылка на демо | Ручная вёрстка |
| `/demo/` | Интерактивная демо-сборка | `npm run build` |
| `/docs/architecture` | Архитектурная документация | `ARCHITECTURE.md` -> HTML |
| `/docs/weights` | Описание весовой модели | `kanban-automation.md` -> HTML |
| `/docs/visual` | Визуальная концепция | `kanban-visual.md` -> HTML |

#### 6.5. Ограничения GitHub Pages

GitHub Pages — статический хостинг. Backend (Express API) не будет работать. Решения:

1. **Статическая демо** — фронтенд с предзаполненными демо-данными (уже есть `.demo` режим)
2. **Mock API** — встроенный в фронтенд mock-сервер для демо
3. **Внешний API** — демо обращается к `demo.shtab-ai.ru` как к backend

Рекомендуется вариант 1 (уже реализован через `.demo` файл).

---

## 7. Community Guidelines

### 7.1. Каналы коммуникации

| Канал | Назначение | Где |
|-------|-----------|-----|
| **GitHub Issues** | Баги, фичи, задачи | Основной канал |
| **GitHub Discussions** | Вопросы, идеи, обсуждения | Для дискуссий |
| **Telegram** | Оперативное общение | Ссылка в README |
| **CHANGELOG** | История изменений | В репозитории |

### 7.2. Правила сообщества

```markdown
# Community Guidelines

## Наши ценности

1. **Уважение** — все участники равны, независимо от уровня опыта
2. **Конструктивность** — критика должна быть обоснованной и предложительной
3. **Прозрачность** — решения приняты публично, в issue/PR
4. **Инклюзивность** — приветствуются участники любого уровня

## Ожидаемое поведение

- Используйте дружелюбный тон
- Признавайте чужой вклад
- Помогайте новичкам
- Ссылайтесь на документацию перед вопросами
- Тестируйте перед отчётом о багах

## Неприемлемое поведение

- Троллинг, оскорбления
- Спам, самореклама без контекста
- Публикация чужих данных
- Неконструктивная критика

## Модерация

- Первое нарушение: предупреждение
- Второе: временный бан
- Третий: постоянный бан

## Признание вклада

- Все контрибьюторы упоминаются в CONTRIBUTORS.md
- Значительный вклад — в README
- Лучшие контрибьюторы месяца — в Release Notes
```

### 7.3. Категории для Discussions

Рекомендуется создать категории в GitHub Discussions:

| Категория | Описание |
|-----------|----------|
| **Announcements** | Релизы, важные изменения (только мейнтейнер) |
| **Q&A** | Вопросы и ответы |
| **Ideas** | Идеи для обсуждения до создания issue |
| **Show and Tell** | Как вы используете Myrmex Control |
| **General** | Общее обсуждение |

### 7.4. Шаблон для Q&A Discussions

Создать файл `.github/DISCUSSION_TEMPLATE/q-a.yml`:

```yaml
body:
  - type: dropdown
    attributes:
      label: Категория
      options:
        - Установка / Запуск
        - Конфигурация
        - Весовая модель
        - Доски
        - AI-агенты
        - Другое
  - type: textarea
    attributes:
      label: Вопрос
      description: Опишите ваш вопрос подробно
  - type: textarea
    attributes:
      label: Что вы уже попробовали
      description: Опишите ваши попытки решить вопрос
```

---

## 8. Roadmap публичного развития

### 8.1. Фазы развития

#### Фаза 1: Foundation (текущая — v1.1.0)

- [x] Базовая канбан-система
- [x] Три доски (ЗАВЛАБ, МУРАВЕЙ, КОТ)
- [x] Весовая модель (P0-P4 + age + deps)
- [x] Drag-and-drop
- [x] Auth (JWT + TOTP)
- [x] Mobile-адаптация
- [ ] Публичный README с roadmap
- [ ] CONTRIBUTING.md v2
- [ ] Issue templates v2
- [ ] GitHub Pages demo

#### Фаза 2: Community (v1.2.0)

- [ ] GitHub Discussions
- [ ] Community Guidelines
- [ ] Contributor Levels
- [ ] Автоматические лейблы
- [ ] Бейджи для контрибьюторов
- [ ] Мультиязычная документация (EN + RU + ZH)
- [ ] API Reference (auto-generated)

#### Фаза 3: Ecosystem (v2.0.0)

- [ ] Plugin system для весовых метрик
- [ ] Webhook-интеграции
- [ ] REST API v2 (OpenAPI spec)
- [ ] CLI-утилита
- [ ] Docker-образ
- [ ] Helm chart для Kubernetes

#### Фаза 4: Scale (v3.0.0)

- [ ] Мультитенантность
- [ ] Коллаборативное редактирование
- [ ] Real-time sync (WebSocket)
- [ ] Расширенная аналитика
- [ ] Интеграция с GitHub Issues
- [ ] Интеграция с Telegram

### 8.2. Публикация Roadmap

Рекомендуется создать файл `ROADMAP.md` в корне репозитория и добавить ссылку из README.

---

## 9. Метрики успеха

### 9.1. Количественные метрики

| Метрика | Цель (3 мес) | Цель (6 мес) | Цель (12 мес) |
|---------|-------------|-------------|---------------|
| GitHub Stars | 100 | 500 | 2000 |
| Forks | 20 | 100 | 500 |
| Contributors | 5 | 15 | 50 |
| Issues (open) | < 20 | < 30 | < 50 |
| PR merge time | < 7 дней | < 3 дней | < 2 дня |
| Test coverage | > 80% | > 85% | > 90% |

### 9.2. Качественные метрики

- **Developer Experience** — время от форка до первого PR < 30 минут
- **Документация** — все публичные API задокументированы
- **Доступность** — проект понятен без устных объяснений
- **Вовлечённость** — активные Discussions, не только Issues

### 9.3. Инструменты отслеживания

- **GitHub Insights** — встроенная аналитика репозитория
- **Star History** — star-history.com для визуализации роста
- **Codecov** — покрытие тестами

---

## 10. Пошаговый план запуска

### Неделя 1: Подготовка

| День | Задача | Файл |
|------|--------|------|
| 1 | Обновить README: добавить roadmap, скриншоты, GIF | `README.md` |
| 2 | Создать CONTRIBUTING.md v2 | `CONTRIBUTING.md` |
| 3 | Создать новые issue templates (docs, weight, board) | `.github/ISSUE_TEMPLATE/*.md` |
| 4 | Обновить существующие bug/feature templates | `.github/ISSUE_TEMPLATE/bug_report.md` |
| 5 | Создать Community Guidelines | `COMMUNITY.md` |

### Неделя 2: Инфраструктура

| День | Задача | Файл |
|------|--------|------|
| 1 | Настроить GitHub Pages | `.github/workflows/pages.yml` |
| 2 | Создать landing page | `docs/index.html` |
| 3 | Настроить авто-лейблы | `.github/workflows/labeler.yml` |
| 4 | Создать ROADMAP.md | `ROADMAP.md` |
| 5 | Создать CONTRIBUTORS.md | `CONTRIBUTORS.md` |

### Неделя 3: Контент и анонсы

| День | Задача | Где |
|------|--------|-----|
| 1 | Написать пост на Reddit r/opensource | Reddit |
| 2 | Создать пост на Habr (RU) | Habr |
| 3 | Анонс в Telegram-канале | Telegram |
|
