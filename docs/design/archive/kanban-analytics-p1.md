# Концепция аналитики для канбан-досок Myrmex Control

> **Версия:** 1.0 | **Дата:** 2026-05-11 | **Автор:** Data Scientist / Аналитик

---

## Содержание

1. Обзор системы
2. Источники данных
3. Кумулятивная диаграмма потока (CFD)
4. Время цикла (Cycle Time)
5. Пропускная способность (Throughput)
6. WIP-анализ
7. Старение задач
8. Эффективность агентов
9. Дашборд доски
10. API-контракты
11. Визуальный язык
12. Roadmap внедрения
13. Приложение: Формулы

---

## 1. Обзор системы

### Принципы

- **Данные первичны.** Каждая метрика выводится из фактов (changelog + текущее состояние).
- **Реальное время.** Аналитика пересчитывается из актуального myrmex.json.
- **Доказуемость.** За каждым числом — список задач.
- **Три уровня:** Доска (мини-виджеты), Проект (графики), Колония (сводка).

### Архитектура

```
Frontend (React)                  Backend (Express)
Board Widgets      ──REST──>     /api/analytics/*
Project Charts     <──JSON──     CFD, Cycle Time, Throughput
Colony Overview                   WIP, Aging, Agents, Health
                                       │
                                  readState()
                                       │
                                  myrmex.json
```

---

## 2. Источники данных

### Первичные данные

| Источник | Поля | Использование |
|----------|------|---------------|
| Task[] | id, project_id, status, priority, assignee_id, created_at, updated_at, completed_at | Состояние, WIP |
| ChangelogEntry[] | id, timestamp, action, entity_type, entity_id, diff | История переходов |
| Agent[] | id, name, status, project_id, current_task_id | Загрузка агентов |
| Project[] | id, name, status | Группировка |

### Вычисляемые поля

| Поле | Формула | Описание |
|------|---------|----------|
| cycle_time_hours | completed_at - created_at | Полное время жизни |
| time_in_status_hours | updated_at - последний переход | Время в текущем статусе |
| age_hours | now - created_at | Возраст задачи |
| is_stale | time_in_status > threshold | Задача застряла |

### Рекомендация по changelog

При изменении статуса записывать структурированный diff:
```json
{ "field": "status", "from": "todo", "to": "in_progress" }
```

---

## 3. Кумулятивная диаграмма потока (CFD)

CFD показывает, как задачи накапливаются в каждом статусе во времени.

**Оси:** X = время (7/14/30/90 дней), Y = количество задач, слои = статусы.

**Цвета:** backlog=#6b7280, todo=#3b82f6, in_progress=#f59e0b, review=#8b5cf6, done=#22c55e, cancelled=#ef4444

**Интерпретация:**
- Параллельные линии = стабильный поток
- Расхождение (веер) = узкое место
- in_progress расширяется = WIP растёт, остановить набор
- done выпрямляется = пропускная способность упала

**Алгоритм:** для каждого дня восстановить состояние задач через changelog, посчитать по статусам, построить stacked area chart.

**Метрики:** band_widths, bottleneck, stability_index = 1 - (std_dev/mean) ширины in_progress.

---

## 4. Время цикла (Cycle Time)

**Типы:**
- Lead Time: created_at -> completed_at (ожидание + работа)
- Cycle Time: переход в in_progress -> completed_at (чистая работа)
- Review Time: переход в review -> completed_at

**Метрики:** mean, median, p90, p95, std_dev, trend (линейная регрессия по неделям).

**Разбивка по приоритетам:**
- critical: < 4ч, high: < 24ч, medium: < 72ч, low: < 1 недели

**Визуализация:** гистограмма распределения, линия тренда по неделям, box plot по приоритетам.

---

## 5. Пропускная способность (Throughput)

Количество завершённых задач за единицу времени.

**Метрики:** daily_avg, weekly_avg, trend, variability (CV).

**Прогноз:**
- Бэклог готов через: backlog_count / throughput.week недель
- N задач завершены через: N / throughput.day дней

**Визуализация:** bar chart по дням/неделям, сравнительный chart по проектам.

---

## 6. WIP-анализ

WIP = задачи в in_progress + review.

**Правила лимитов:**
- Норма: WIP < 80% лимита
- Внимание: WIP 80-100%
- Превышение: WIP > лимит (блокировка + алерт)

**Метрики:** current, limit, utilization, avg_duration, violations_count.

**Закон Литтла:** Cycle Time = WIP / Throughput.

**Визуализация:** прогресс-бар, line chart тренда с линией лимита, таблица по колонкам.

---

## 7. Старение задач

**Пороги:**
- backlog: жёлтый > 30д, красный > 60д
- todo: жёлтый > 14д, красный > 30д
- in_progress: жёлтый > 5д, красный > 10д
- review: жёлтый > 3д, красный > 7д

**Алерты:**
- Задача > красного: уведомление + подсветка
- Задача > жёлтого: подсветка
- 3+ задачи in_progress > порога: остановить набор
- WIP > лимит 3+ дня: увеличить лимит

**Визуализация:** heatmap, таблица стареющих задач, индикаторы на карточках.

---

## 8. Эффективность агентов

**Метрики:** tasks_completed, tasks_in_progress, avg_cycle_time, utilization, throughput.

**Рекомендации:**
- Загрузка > 90%: не назначать новые
- Загрузка < 30%: назначить из бэклога
- Cycle time >> среднего: проверить блокеры
- Давно не завершал: проверить статус

**Визуализация:** сравнительный bar chart, heatmap загрузки по дням.

---

## 9. Дашборд доски

Компактная панель на странице канбан-доски.

**KPI-карточки:** WIP (текущий/лимит), Throughput (задач/день), Avg Cycle Time, Health Score.

**Health Score (0-100):**
- WIP в пределах: 30%
- Throughput стабилен: 25%
- Нет стареющих: 25%
- Cycle Time стабилен: 20%

**Sparkline:** throughput 7 дней, cycle time 4 недели, WIP 2 недели.

---

## 10. API-контракты

```
GET /api/analytics/cfd         ?project_id &from &to &granularity=day|week
GET /api/analytics/cycle-time  ?project_id &from &to &group_by=week|priority|assignee
GET /api/analytics/throughput  ?project_id &from &to &granularity=day|week
GET /api/analytics/wip         ?project_id &from &to
GET /api/analytics/aging       ?project_id &threshold_yellow &threshold_red
GET /api/analytics/agents      ?project_id &from &to
GET /api/analytics/health      ?project_id
GET /api/analytics/colony      &from &to
```

**Формат CFD:**
```json
{
  "project_id": "zavlab",
  "from": "2026-05-04T00:00:00Z",
  "to": "2026-05-11T23:59:59Z",
  "granularity": "day",
  "series": [{ "date": "2026-05-04", "backlog": 12, "todo": 5, "in_progress": 3, "review": 2, "done": 8 }],
  "summary": { "bottleneck": "in_progress", "stability_index": 0.72 }
}
```

**Формат Cycle Time:**
```json
{
  "project_id": "zavlab",
  "completed_tasks": 15,
  "mean_hours": 18.4,
  "median_hours": 12.0,
  "p90_hours": 36.0,
  "p95_hours": 48.0,
  "std_dev": 14.2,
  "trend": "improving",
  "trend_slope_per_week": -2.1,
  "by_priority": { "critical": { "mean_hours": 3.2, "count": 2 } },
  "by_week": [{ "week": "2026-W18", "mean_hours": 22.0, "count": 4 }]
}
```

**Формат Throughput:**
```json
{
  "project_id": "zavlab",
  "daily_avg": 2.1,
  "weekly_avg": 14.7,
  "trend": "growing",
  "variability": 0.18,
  "forecast_weeks_to_clear_backlog": 3.2,
  "series": [{ "date": "2026-05-04", "completed": 3 }]
}
```

**Формат Health:**
```json
{
  "project_id": "zavlab",
  "health_score": 82,
  "status": "healthy",
  "factors": [
    { "name": "WIP", "score": 90, "weight": 0.30, "detail": "8/10, within limit" },
    { "name": "Throughput Stability", "score": 85, "weight": 0.25, "detail": "CV=0.18" },
    { "name": "Aging", "score": 70, "weight": 0.25, "detail": "2 tasks > yellow threshold" },
    { "name": "Cycle Time Trend", "score": 80, "weight": 0.20, "detail": "Improving -2.1h/week" }
  ],
  "recommendations": [
    "Review 2 aging tasks in in_progress",
    "Consider reducing WIP limit to 8 for better flow"
  ]
}
```

---

## 11. Визуальный язык

### Цвета статусов

| Статус | HEX | Tailwind |
|--------|-----|----------|
| backlog | #6b7280 | bg-gray-500 |
| todo | #3b82f6 | bg-blue-500 |
| in_progress | #f59e0b | bg-amber-500 |
| review | #8b5cf6 | bg-violet-500 |
| done | #22c55e | bg-green-500 |
| cancelled | #ef4444 | bg-red-500 |

### Цвета приоритетов

| Приоритет | HEX |
|-----------|-----|
| critical | #dc2626 |
| high | #f97316 |
| medium | #3b82f6 |
| low | #9ca3af |

### Цвета алертов

| Уровень | HEX |
|---------|-----|
| healthy | #22c55e |
| warning | #f59e0b |
| critical | #ef4444 |

### Типографика

| Элемент | Шрифт | Размер |
|---------|-------|--------|
| KPI значение | JetBrains Mono | 24-32px |
| KPI лейбл | Inter | 12-14px |
| Заголовок | Inter bold | 16px |
| Подпись оси | Inter | 11px |
| Тултип | JetBrains Mono | 12px |

### Иконки тренда

| Тренд | Иконка | Цвет |
|-------|--------|------|
| Рост (хорошо) | ↑ | #22c55e |
| Падение (хорошо) | ↓ | #22c55e |
| Рост (плохо) | ↑ | #ef4444 |
| Падение (плохо) | ↓ | #ef4444 |
| Стабильно | → | #9ca3af |

---

## 12. Roadmap внедрения

### Фаза 1: Фундамент (1-2 недели)

Базовые метрики и API:
- /api/analytics/cfd, /api/analytics/cycle-time, /api/analytics/throughput, /api/analytics/wip
- Структурированный diff в changelog
- Базовый компонент AnalyticsPanel на Board

### Фаза 2: Визуализация (2-3 недели)

Графики и виджеты:
- Библиотека графиков (Recharts или Chart.js)
- CFD stacked area chart, cycle time гистограмма, throughput bar chart
- KPI-карточки, sparkline-миниграфики

### Фаза 3: Аналитика (3-4 недели)

Глубокий анализ:
- /api/analytics/aging, /api/analytics/agents, /api/analytics/health
- Система алертов
- Страница Colony Overview
- Фильтры по времени (7/14/30/90 дней)

### Фаза 4: Оптимизация (4+ недели)

Производительность:
- Кэширование расчётов
- Прогнозные модели
- Экспорт отчётов (CSV, PDF)
- Настраиваемые WIP-лимиты и пороги старения
- Виджет сводной аналитики для Dashboard

---

## 13. Приложение: Формулы

### Перцентиль
P(X) = значение, ниже которого X% наблюдений. P50 = медиана.

### Коэффициент вариации
CV = std_dev / mean
- CV < 0.3: стабильный
- CV 0.3-0.5: умеренная вариативность
- CV > 0.5: нестабильный

### Закон Литтла
Cycle Time = WIP / Throughput

### Stability Index
SI = 1 - (σ_width / μ_width)
Близко к 1 = стабильный поток.

### Health Score
HS = Σ(factor_score × factor_weight)
- HS >= 80: Здоровый
- HS 60-79: Внимание
- HS < 60: Критично
