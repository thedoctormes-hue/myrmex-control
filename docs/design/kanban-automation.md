# Концепция автоматизации Kanban-досок Myrmex Control

> **Версия:** 1.0 | **Дата:** 2026-05-11 | **Автор:** OWL (Workflow Engineer)
>
> Этот документ описывает систему автоматизации для трёх канбан-досок Myrmex Control:
> **ЗавЛаб** (лаборатория), **МУРАВЕЙ** (AI-агенты), **КОТ** (личные задачи).
>
> Документ НЕ содержит кода — только концепцию, правила и примеры.

---

## Содержание

1. [Архитектура автоматизации](#1-архитектура-автоматизации)
2. [Автоматические действия (Triggers & Actions)](#2-автоматические-действия-triggers--actions)
3. [Правила перемещения карточек](#3-правила-перемещения-карточек)
4. [Система уведомлений](#4-система-уведомлений)
5. [Повторяющиеся задачи и шаблоны](#5-повторяющиеся-задачи-и-шаблоны)
6. [Интеграция между досками](#6-интеграция-между-досками)
7. [Definition of Ready / Done](#7-definition-of-ready--done)
8. [Модель данных для автоматизации](#8-модель-данных-для-автоматизации)
9. [Приоритеты реализации](#9-приоритеты-реализации)

---

## 1. Архитектура автоматизации

### 1.1. Принцип работы

Автоматизация работает как **event-driven pipeline**. Каждое действие в системе (создание задачи, смена статуса, назначение агента) генерирует событие. Система правил проверяет событие и выполняет соответствующие действия.

```
[Событие] → [Match Rules] → [Execute Actions] → [Log in Changelog]
```

### 1.2. Источники событий

| Источник | Примеры событий |
|----------|-----------------|
| **API** | `task.created`, `task.status_changed`, `task.assigned`, `task.deleted` |
| **Агент** | `agent.task_completed`, `agent.task_started`, `agent.error` |
| **Система** | `system.daily_scan`, `system.weekly_scan`, `system.server_down` |
| **Пользователь** | `user.task_moved`, `user.project_archived` |

### 1.3. Где выполняется

В текущей архитектуре (JSON-first, Express, single-user) автоматизация реализуется как **server-side модуль** `src/server/automation/engine.ts`:

- Вызывается при каждом изменении состояния (из `writeState`)
- Работает синхронно в том же процессе
- Хранит правила в `myrmex.json` → `settings.automation_rules`
- Логирует срабатывания в `auditLog`

> **Trade-off:** Для single-user dashboard этого достаточно. При масштабировании до multi-user потребуется выносить в отдельный worker (Bull/BullMQ + Redis).

---

## 2. Автоматические действия (Triggers & Actions)

### 2.1. Задача долго не двигается (Stale Task)

**Trigger:** Системный сканер проверяет задачи каждые 24 часа. Если задача не меняла `updated_at` дольше порога:

| Приоритет | Порог | Действие |
|-----------|-------|----------|
| `critical` | 2 дня | Уведомление админу + тег `stale-critical` |
| `high` | 3 дня | Уведомление админу + тег `stale-high` |
| `medium` | 5 дней | Уведомление исполнителю + тег `stale` |
| `low` | 7 дней | Только тег `stale` |

**Пример правила:**
```
ЕСЛИ task.status IN (todo, in_progress, review)
  И task.updated_at < NOW() - 3 дня
  И task.priority = high
ТО:
  - Добавить тег "stale-high"
  - Уведомить assignee_id: "Задача '{title}' стоит без движения 3 дня"
  - Записать в auditLog: "automation:stale_detected"
```

**Исключения:** Задачи в `backlog` и `blocked` не проверяются — там ожидание нормально.

### 2.2. Задача заблокирована (Blocked Task)

**Trigger:** Статус задачи изменён на `blocked` (новое значение, см. п. 3.1).

**Действия:**
1. Уведомить админа: "Задача '{title}' заблокирована"
2. Если у задачи есть `dependencies` — проверить статус зависимостей и добавить информацию в описание блокировки
3. Запустить таймер: если через 48 часов статус не изменился — эскалация

**Пример:**
```
ЕСЛИ task.status_changed TO blocked
ТО:
  - Уведомить admin: "Задача '{title}' заблокирована"
  - Для каждой dependency в task.dependencies:
      ЕСЛИ dependency.status != done
         → Добавить в task.description: "Зависит от: {dependency.title} ({dependency.status})"
  - Запланировать проверку через 48ч
```

### 2.3. Все задачи в колонке выполнены (Column Complete)

**Trigger:** После перемещения задачи в `done` — проверка: все ли задачи проекта в статусе `done` или `cancelled`.

**Действия:**
1. Уведомить владельца проекта: "Все задачи проекта '{project}' выполнены!"
2. Предложить архивировать проект (action button в UI)
3. Если проект связан с другими досками — обновить статус связанных задач

**Пример:**
```
ЕСЛИ task.status_changed TO done
  И ALL tasks IN project WHERE status IN (done, cancelled)
ТО:
  - Уведомить project.owner: "Проект '{project.name}' завершён!"
  - Создать action_prompt: "Архивировать проект?"
  - ЕСЛИ project.linked_tasks EXISTS:
      → Для каждой linked_task: добавить тег "parent-complete"
```

### 2.4. Агент завершил задачу (Agent Completed)

**Trigger:** Агент переместил задачу в `done`.

**Действия:**
1. Обновить `agent.current_task_id` → `null`, `agent.status` → `idle`
2. Проверить очередь задач агента — есть ли следующая задача в `todo`?
3. Если есть — предложить агенту начать следующую
4. Записать метрику: время выполнения (`completed_at - created_at`)

**Пример:**
```
ЕСЛИ task.status_changed TO done
  И task.assignee_id IS NOT NULL
ТО:
  - Обновить agent.current_task_id = null
  - Обновить agent.status = idle
  - Найти next_task: task.assignee_id = agent.id AND status = todo
    ORDER BY priority DESC, created_at ASC LIMIT 1
  - ЕСЛИ next_task EXISTS:
      → Уведомить agent: "Следующая задача: {next_task.title}"
  - Записать в metrics: {task_id, duration_hours, completed_by}
```

### 2.5. Задача без исполнителя (Unassigned Task)

**Trigger:** Задача создана или перемещена в `todo` / `in_progress` без `assignee_id`.

**Действия:**
1. Если в проекте есть агент со статусом `idle` — предложить назначить
2. Если задача остаётся без исполнителя 24 часа — уведомить админа

**Пример:**
```
ЕСЛИ task.status_changed TO (todo, in_progress)
  И task.assignee_id IS NULL
ТО:
  - Найти idle_agents: agent.status = idle AND agent.project_id = task.project_id
  - ЕСЛИ idle_agents.count > 0:
      → Уведомить admin: "Задача '{title}' без исполнителя. Доступно агентов: {idle_agents.count}"
  - Запланировать проверку через 24ч
```

### 2.6. Дедлайн приближается (Due Date Approaching)

**Trigger:** Системный сканер проверяет `dueDate` задач.

| Когда | Действие |
|-------|----------|
| За 3 дня до дедлайна | Тег `due-soon` + уведомление исполнителю |
| За 1 день до дедлайна | Тег `due-tomorrow` + уведомление админу |
| Дедлайн прошёл | Тег `overdue` + уведомление админу + повышение приоритета до `high` |

**Пример:**
```
ЕСЛИ task.dueDate IS NOT NULL
  И task.status NOT IN (done, cancelled)
  И task.dueDate < NOW() + 1 день
ТО:
  - Обновить task.priority = high (если было medium или low)
  - Добавить тег "overdue"
  - Уведомить admin: "Дедлайн задачи '{title}' просрочен!"
```

---

## 3. Правила перемещения карточек

### 3.1. Статусы и переходы

Вводим статус `blocked` (отсутствует в текущей схеме):

```
backlog → todo → in_progress → review → done
   ↑          ↑         ↑          ↑
   └──────────┴─────────┴──────────┴── blocked (из любого статуса)
```

**Разрешённые переходы:**

| Из статуса | В статус | Кто может | Условие |
|------------|----------|-----------|---------|
| `backlog` | `todo` | Админ, Агент | DoR выполнен (см. п. 7) |
| `todo` | `in_progress` | Агент (свой), Админ | Назначен исполнитель |
| `in_progress` | `review` | Агент (свой), Админ | DoD выполнен (см. п. 7) |
| `review` | `done` | Админ, Reviewer | Одобрено |
| `review` | `in_progress` | Админ, Reviewer | Отклонено (с комментарием) |
| *любой* | `blocked` | Агент, Админ | Указана причина блокировки |
| `blocked` | `todo` | Админ, Агент | Блокировка снята |
| *любой* | `backlog` | Админ | Отправлено в бэклог |

### 3.2. Кто может двигать

| Роль | Права на перемещение |
|------|---------------------|
| **Админ** | Любые переходы, любые задачи |
| **Агент** | Свои задачи: todo → in_progress → review, любой → blocked |
| **Reviewer** | review → done / in_progress |
| **Viewer** | Только просмотр |

### 3.3. Автоматические переходы

| Условие | Автопереход |
|---------|-------------|
| Все зависимости выполнены | `blocked` → `todo` (с уведомлением) |
| Агент начал работу (выбрал задачу) | `todo` → `in_progress` |
| Проект архивирован | Все задачи проекта → `cancelled` |
| Дедлайн прошёл + задача в `in_progress` | Тег `overdue` + уведомление (без смены статуса) |

### 3.4. Защита от некорректных переходов

```
# Запрещено:
- done → * (кроме cancelled для админа)
- review → todo (только через in_progress)
- backlog → in_progress (только через todo)
- blocked → done (только через todo → in_progress → review)

# При попытке некорректного перехода:
- Вернуть 409 Conflict с описанием допустимых переходов
- В UI: показать tooltip "Для перехода в {status} необходимо: {conditions}"
```

---

## 4. Система уведомлений

### 4.1. Модель уведомлений

Уведомления хранятся в `myrmex.json` → `notifications: Notification[]`:

```
Notification {
  id: string
  type: 'task_stale' | 'task_blocked' | 'task_review' | 'task_done'
        | 'project_complete' | 'agent_idle' | 'due_approaching' | 'due_overdue'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  task_id?: string
  project_id?: string
  agent_id?: string
  created_at: string
  read: boolean
  read_at?: string
}
```

### 4.2. Матрица уведомлений

| Событие | Кому | Канал | Приоритет |
|---------|------|-------|-----------|
| Задача застряла 3+ дня | Админ, Исполнитель | In-app, Bell | `warning` |
| Задача застряла 7+ дней | Админ | In-app, Bell | `critical` |
| Задача заблокирована | Админ | In-app, Bell | `warning` |
| Задача перешла в review | Админ, Reviewer | In-app, Bell | `info` |
| Задача выполнена | Админ | In-app | `info` |
| Все задачи проекта выполнены | Админ | In-app, Bell | `info` |
| Дедлайн через 3 дня | Исполнитель | In-app | `info` |
| Дедлайн через 1 день | Админ, Исполнитель | In-app, Bell | `warning` |
| Дедлайн просрочен | Админ | In-app, Bell | `critical` |
| Агент освободился | Система (для автопланирования) | Internal | `info` |
| Сервер упал | Админ | In-app, Bell | `critical` |

### 4.3. Правила отправки

**Дедупликация:** Не слать повторное уведомление по одной и той же задаче в течение 24 часов (кроме `critical`).

**Группировка:** Если за час накопилось 5+ уведомлений одного типа — группировать:
```
"5 задач в проекте 'ЗавЛаб' стоят без движения более 3 дней"
```

**Тишина (Quiet Hours):** Настраиваемый период (по умолчанию 23:00–08:00), когда уведомления не слатся (кроме `critical`).

### 4.4. Каналы доставки

| Канал | Когда используется | Приоритет |
|-------|-------------------|-----------|
| **In-app (Bell)** | Всегда | Все |
| **Toast** | При действии пользователя | `info`, `warning` |
| **Email** | Планируется в v0.2 | `critical` |
| **Telegram** | Планируется в v0.2 | `critical`, `warning` |

---

## 5. Повторяющиеся задачи и шаблоны

### 5.1. Повторяющиеся задачи (Recurring Tasks)

**Модель данных:**
```
RecurringRule {
  id: string
  template_task: TaskTemplate    // шаблон задачи
  schedule: 'daily' | 'weekly' | 'monthly' | 'cron'
  cron_expression?: string        // для сложных расписаний
  project_id: string
  assignee_id?: string
  last_created_at: string         // когда последний раз создали
  next_due: string                // когда следующее создание
  enabled: boolean
}
```

**Примеры расписаний:**

| Задача | Расписание | Шаблон |
|--------|-----------|--------|
| Ежедневный стендап | `daily` | title: "Стендап {date}", tags: [standup] |
| Еженедельный ретроспектив | `weekly` (пн) | title: "Ретро {week}", tags: [retro] |
| Ежемесячный аудит | `monthly` (1-е число) | title: "Аудит безопасности {month}", tags: [audit] |
| Проверка серверов | `cron: "0 */6 * * *"` | title: "Проверка серверов", tags: [ops] |

**Логика создания:**
```
При system.daily_scan:
  Для каждого recurring_rule WHERE enabled = true AND next_due <= NOW():
    - Создать новую задачу из шаблона
    - Установить task.dueDate = next_due + offset (из шаблона)
    - Обновить recurring_rule.last_created_at = NOW()
    - Обновить recurring_rule.next_due = calculate_next(schedule)
    - Уведомить assignee_id: "Создана повторяющаяся задача: {title}"
```

### 5.2. Шаблоны задач (Task Templates)

**Модель данных:**
```
TaskTemplate {
  id: string
  name: string
  description: string
  default_title: string
  default_description: string
  default_priority: TaskPriority
  default_tags: string[]
  default_assignee_role?: string    // например, "reviewer"
  checklist?: string[]              // чек-лист для DoD
  project_id?: string               // привязка к проекту
}
```

**Примеры шаблонов:**

| Шаблон | Заголовок | Теги | Приоритет | Чек-лист |
|--------|-----------|------|-----------|----------|
| Bug Report | "BUG: {описание}" | [bug] | high | [ ] Шаги воспроизведения, [ ] Ожидаемый результат, [ ] Фактический результат |
| Feature Request | "FEAT: {описание}" | [feature] | medium | [ ] Описание, [ ] Критерии приёмки, [ ] Оценка сложности |
| Deploy | "Деплой {проект}" | [deploy] | high | [ ] Тесты пройдены, [ ] Миграции готовы, [ ] Rollback план |
| Review | "Ревью {что}" | [review] | medium | [ ] Код проверен, [ ] Тесты написаны, [ ] Документация обновлена |

**Использование в UI:**
```
При создании задачи: кнопка "Из шаблона" -> выбор шаблона -> автозаполнение полей
```

---

## 6. Интеграция между досками

### 6.1. Связь досок и проектов

Каждая доска — это проект с типом:

```
Project {
  ...
  board_type: 'zavlab' | 'muravey' | 'kot' | 'custom'
  linked_projects: string[]    // ID связанных проектов
}
```

### 6.2. Правила кросс-досочной синхронизации

**ЗавЛаб -> МУРАВЕЙ:**
```
ЕСЛИ task.created IN project WHERE board_type = 'zavlab'
  И task.tags содержит 'agent-task'
ТО:
  - Создать linked_task в проекте МУРАВЕЙ
  - linked_task.title = "[ЗавЛаб] {task.title}"
  - linked_task.parent_id = task.id (связь)
  - Уведомить агента-исполнителя
```

**МУРАВЕЙ -> ЗавЛаб (обратная связь):**
```
ЕСЛИ task.status_changed IN project WHERE board_type = 'muravey'
  И task.parent_id IS NOT NULL
ТО:
  - Найти parent_task в ЗавЛаб по task.parent_id
  - Добавить в parent_task.description: "Статус в МУРАВЕЙ: {task.status} ({timestamp})"
  - ЕСЛИ task.status = done:
      -> Уведомить админа ЗавЛаб: "Агент завершил задачу '{task.title}'"
```

**КОТ -> ЗавЛаб (эскалация):**
```
ЕСЛИ task.created IN project WHERE board_type = 'kot'
  И task.tags содержит 'escalate'
ТО:
  - Создать escalated_task в проекте ЗавЛаб
  - escalated_task.title = "[Из КОТ] {task.title}"
  - escalated_task.priority = high (повышение при эскалации)
  - Уведомить админа: "Задача эскалирована из КОТ: {task.title}"
```

### 6.3. Синхронизация статусов

**Принцип:** Односторонняя синхронизация от родительской задачи к дочерней. Обратная — через комментарии/уведомления.

```
Родитель (ЗавЛаб) -> Дочерняя (МУРАВЕЙ):
  - Родитель blocked -> Дочерняя получает тег "parent-blocked"
  - Родитель done -> Дочерняя получает тег "parent-complete"
  - Родитель cancelled -> Дочерняя -> cancelled

Дочерняя (МУРАВЕЙ) -> Родитель (ЗавЛаб):
  - Дочерняя done -> Комментарий в родителе: "Агент выполнил подзадачу"
  - Дочерняя blocked -> Уведомление админу: "Агент заблокирован на подзадаче"
```

### 6.4. Визуализация связей

В карточке задачи отображать:
```
Связанные задачи:
  -> [МУРАВЕЙ] Реализовать API (in_progress) — Агент: OWL
  -> [КОТ] Подготовить ТЗ (done)
```

---

## 7. Definition of Ready / Done

### 7.1. Definition of Ready (DoR) — готовность к работе

**Условия для перехода backlog -> todo:**

```
[ ] Задача имеет понятный заголовок (что именно нужно сделать)
[ ] Описание содержит контекст (зачем это нужно)
[ ] Указан приоритет
[ ] Определены критерии приёмки (acceptance criteria)
[ ] Зависимости указаны (если есть)
[ ] Оценка сложности указана (опционально)
```

**UI-реализация:** Чек-лист в карточке задачи. Кнопка "В работу" активна только когда все галочки проставлены.

### 7.2. Definition of Done (DoD) — критерии завершения

**Условия для перехода in_progress -> review:**

```
[ ] Код/результат соответствует критериям приёмки
[ ] Тесты написаны и пройдены (если применимо)
[ ] Документация обновлена (если применимо)
[ ] Нет известных багов критического уровня
[ ] Результат зафиксирован (ссылка на PR, файл, коммит)
```

**Условия для перехода review -> done:**

```
[ ] Код проверен (для задач с кодом)
[ ] Критерии приёмки выполнены
[ ] Нет замечаний от reviewer
[ ] Задача не создала регрессий
```

### 7.3. DoD по типам задач

| Тип задачи | Дополнительные критерии |
|------------|------------------------|
| **Bug** | Баг воспроизводится на старте -> не воспроизводится после фикса |
| **Feature** | Feature flag создан (если нужен), документация обновлена |
| **Deploy** | Smoke-test пройден, rollback план готов |
| **Research** | Отчёт написан, выводы зафиксированы |
| **Ops** | Мониторинг настроен, алерты проверены |

### 7.4. Реализация в модели данных

Добавляем в `Task`:
```
Task {
  ...
  checklist: ChecklistItem[]
  acceptance_criteria: string[]
}

ChecklistItem {
  id: string
  text: string
  checked: boolean
  required: boolean    // обязательный для перехода
}
```

---

## 8. Модель данных для автоматизации

### 8.1. Расширение myrmex.json

```json
{
  "settings": {
    "automation_enabled": true,
    "automation_rules": [
      {
        "id": "rule-stale-high",
        "name": "Stale High Priority",
        "enabled": true,
        "trigger": {
          "type": "schedule",
          "cron": "0 9 * * *"
        },
        "conditions": [
          { "field": "status", "op": "in", "value": ["todo", "in_progress", "review"] },
          { "field": "priority", "op": "eq", "value": "high" },
          { "field": "updated_at", "op": "older_than_days", "value": 3 }
        ],
        "actions": [
          { "type": "add_tag", "value": "stale-high" },
          { "type": "notify", "to": "admin", "message": "Задача '{title}' стоит без движения 3 дня" }
        ]
      }
    ],
    "recurring_rules": [
      {
        "id": "recur-daily-standup",
        "name": "Ежедневный стендап",
        "enabled": true,
        "schedule": "daily",
        "cron_expression": "0 10 * * 1-5",
        "project_id": "proj-zavlab",
        "template": {
          "title": "Стендап {date}",
          "tags": ["standup"],
          "priority": "medium",
          "checklist": ["Вчера сделал", "Сегодня делаю", "Блокировки"]
        },
        "next_due": "2026-05-12T10:00:00Z"
      }
    ],
    "notifications": [],
    "task_templates": [
      {
        "id": "tmpl-bug",
        "name": "Bug Report",
        "default_title": "BUG: ",
        "default_tags": ["bug"],
        "default_priority": "high",
        "checklist": [
          { "text": "Шаги воспроизведения", "required": true },
          { "text": "Ожидаемый результат", "required": true },
          { "text": "Фактический результат", "required": true }
        ]
      }
    ]
  }
}
```

### 8.2. Расширение Task

```json
{
  "id": "task-123",
  "project_id": "proj-zavlab",
  "title": "Реализовать авторизацию",
  "status": "in_progress",
  "priority": "high",
  "assignee_id": "agent-owl",
  "dependencies": ["task-100", "task-101"],
  "tags": ["auth", "backend"],
  "checklist": [
    { "id": "cl-1", "text": "JWT генерация", "checked": true, "required": true },
    { "id": "cl-2", "text": "Refresh token rotation", "checked": false, "required": true },
    { "id": "cl-3", "text": "Тесты", "checked": false, "required": true }
  ],
  "acceptance_criteria": [
    "Пользователь может залогиниться",
    "Токен обновляется автоматически",
    "Сессия истекает через 24ч"
  ],
  "dueDate": "2026-05-15T18:00:00Z",
  "parent_id": null,
  "linked_tasks": ["task-muravey-456"],
  "created_at": "2026-05-08T10:00:00Z",
  "updated_at": "2026-05-10T14:00:00Z",
  "completed_at": null
}
```

---

## 9. Приоритеты реализации

### Фаза 1: Фундамент (v0.2)

| # | Фича | Сложность | Обоснование |
|---|------|-----------|-------------|
| 1 | Статус `blocked` в TaskStatus | Низкая | Базовый статус для блокировок |
| 2 | Валидация переходов (state machine) | Низкая | Защита от некорректных переходов |
| 3 | Модель уведомлений (Notification) | Средняя | База для всей системы уведомлений |
| 4 | Stale detection (ежедневный сканер) | Средняя | Самый востребованный триггер |
| 5 | Чек-листы в задачах (ChecklistItem) | Низкая | Основа для DoR/DoD |
| 6 | Расширение Task: checklist, acceptance_criteria, dueDate | Низкая | Поддержка DoR/DoD и дедлайнов |

### Фаза 2: Умная автоматизация (v0.3)

| # | Фича | Сложность | Обоснование |
|---|------|-----------|-------------|
| 1 | Система правил (automation_rules) | Высокая | Ядро автоматизации |
| 2 | Повторяющиеся задачи (recurring_rules) | Высокая | Автосоздание по расписанию |
| 3 | Шаблоны задач (task_templates) | Средняя | Ускорение создания типовых задач |
| 4 | Кросс-досочная синхронизация | Высокая | Связь ЗавЛаб <-> МУРАВЕЙ <-> КОТ |
| 5 | Автоматические переходы | Средняя | blocked -> todo при снятии зависимостей |
| 6 | Дедлайны и эскалации | Средняя | dueDate + overdue detection |

### Фаза 3: Продвинутые фичи (v0.4+)

| # | Фича | Сложность | Обоснование |
|---|------|-----------|-------------|
| 1 | Группировка уведомлений | Средняя | Уменьшение шума |
| 2 | Quiet Hours | Низкая | UX для уведомлений |
| 3 | Метрики выполнения (duration, throughput) | Средняя | Аналитика продуктивности |
| 4 | Автоназначение исполнителей | Высокая | Балансировка нагрузки |
| 5 | Экспорт правил автоматизации | Низкая | Переносимость конфигурации |
| 6 | Webhook-интеграции (Telegram, Email) | Высокая | Внешние каналы уведомлений |

---

## Приложение A: Сводная таблица триггеров

| # | Триггер | Тип | Действия | Фаза |
|---|---------|-----|----------|------|
| T1 | Задача не двигается N дней | Schedule | Тег + уведомление | 1 |
| T2 | Задача заблокирована | Event | Уведомление + проверка зависимостей | 2 |
| T3 | Все задачи проекта выполнены | Event | Уведомление + предложение архивировать | 2 |
| T4 | Агент завершил задачу | Event | Обновить агента + найти следующую задачу | 2 |
| T5 | Задача без исполнителя | Event | Предложить назначить + эскалация через 24ч | 2 |
| T6 | Дедлайн приближается | Schedule | Тег + уведомление + повышение приоритета | 2 |
| T7 | Зависимости выполнены | Event | Автопереход blocked -> todo | 2 |
| T8 | Проект архивирован | Event | Все задачи -> cancelled | 2 |
| T9 | Кросс-досочное создание | Event | Создать linked_task | 2 |
| T10 | Повторяющаяся задача (cron) | Schedule | Создать задачу из шаблона | 2 |

## Приложение B: Сводная таблица переходов статусов

```
backlog ──► todo ──► in_progress ──► review ──► done
   ▲          ▲           ▲             ▲
   │          │           │             │
   └──────────┴───────────┴─────────────┴── blocked
   │                                      │
   └──────────────────────────────────────┘
              (возврат в backlog из любого статуса — только админ)
```

| Переход | Кто | Условие | Автоматический |
|---------|-----|---------|----------------|
| backlog -> todo | Админ, Агент | DoR выполнен | Нет |
| todo -> in_progress | Агент (свой), Админ | Назначен assignee | Да (при назначении) |
| in_progress -> review | Агент (свой), Админ | DoD выполнен | Нет |
| review -> done | Админ, Reviewer | Одобрено | Нет |
| review -> in_progress | Админ, Reviewer | Отклонено | Нет |
| * -> blocked | Агент, Админ | Указана причина | Нет |
| blocked -> todo | Админ, Агент | Блокировка снята | Да (зависимости done) |
| * -> backlog | Админ | — | Нет |
| * -> cancelled | Админ | Проект архивирован | Да |

## Приложение C: Существующие компоненты для переиспользования

При реализации автоматизации можно переиспользовать существующие компоненты Myrmex Control:

| Компонент | Расположение | Как использовать |
|-----------|-------------|------------------|
| `ToastContainer` | `src/client/shared/ui/ToastContainer.tsx` | Отображение уведомлений в реальном времени |
| `useToast` | `src/client/shared/hooks/useToast.tsx` | Хук для показа toast-уведомлений |
| `ChangelogEntry` | `src/shared/types.ts` | Логирование срабатываний автоматизации |
| `writeState` | `src/server/myrmex.ts` | Точка входа для automation engine |
| `createLogEntry` | `src/server/myrmex.ts` | Создание записей в changelog |
| `watchdog.ts` | `src/server/watchdog.ts` | Паттерн для периодического сканера |
| `auditLog` | `myrmex.json` | Хранение истории действий автоматизации |
| `Task.dependencies` | `src/shared/types.ts` | Уже есть — использовать для проверки зависимостей |
| `Task.tags` | `src/shared/types.ts` | Уже есть — использовать для тегов stale, overdue и т.д. |
| `Agent.status` | `src/shared/types.ts` | Уже есть — использовать для автоназначения |
| `Agent.current_task_id` | `src/shared/types.ts` | Уже есть — обновлять при завершении задачи |
| `BottomBar` | `src/client/shared/ui/BottomBar.tsx` | Добавить иконку Bell с badge уведомлений |
| `Bell icon` | Lucide React | Иконка для центра уведомлений |