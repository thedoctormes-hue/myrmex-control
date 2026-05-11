ISO_date}
  &to={ISO_date}
```

### Формат ответа CFD

```json
{
  "project_id": "zavlab",
  "from": "2026-05-04T00:00:00Z",
  "to": "2026-05-11T23:59:59Z",
  "granularity": "day",
  "series": [
    {
      "date": "2026-05-04",
      "backlog": 12,
      "todo": 5,
      "in_progress": 3,
      "review": 2,
      "done": 8
    }
  ],
  "summary": {
    "bottleneck": "in_progress",
    "stability_index": 0.72
  }
}
```

### Формат ответа Cycle Time

```json
{
  "project_id": "zavlab",
  "from": "2026-05-04T00:00:00Z",
  "to": "2026-05-11T23:59:59Z",
  "completed_tasks": 15,
  "mean_hours": 18.4,
  "median_hours": 12.0,
  "p90_hours": 36.0,
  "p95_hours": 48.0,
  "std_dev": 14.2,
  "trend": "improving",
  "trend_slope_per_week": -2.1,
  "by_priority": {
    "critical": { "mean_hours": 3.2, "count": 2 },
    "high": { "mean_hours": 14.5, "count": 5 },
    "medium": { "mean_hours": 22.1, "count": 6 },
    "low": { "mean_hours": 45.0, "count": 2 }
  },
  "by_week": [
    { "week": "2026-W18", "mean_hours": 22.0, "count": 4 },
    { "week": "2026-W19", "mean_hours": 15.2, "count": 7 },
    { "week": "2026-W20", "mean_hours": 12.8, "count": 4 }
  ]
}
```

### Формат ответа Throughput

```json
{
  "project_id": "zavlab",
  "from": "2026-05-04T00:00:00Z",
  "to": "2026-05-11T23:59:59Z",
  "granularity": "day",
  "daily_avg": 2.1,
  "weekly_avg": 14.7,
  "trend": "growing",
  "variability": 0.18,
  "forecast_weeks_to_clear_backlog": 3.2,
  "series": [
    { "date": "2026-05-04", "completed": 3 },
    { "date": "2026-05-05", "completed": 1 },
    { "date": "2026-05-06", "completed": 4 }
  ]
}
```

### Формат ответа Health

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

### Цветовая система статусов

Единая палитра для всех виджетов и графиков:

| Статус | HEX | Tailwind класс | Использование |
|--------|-----|----------------|---------------|
| backlog | `#6b7280` | `bg-gray-500` | CFD, bar charts, labels |
| todo | `#3b82f6` | `bg-blue-500` | CFD, bar charts, labels |
| in_progress | `#f59e0b` | `bg-amber-500` | CFD, bar charts, labels |
| review | `#8b5cf6` | `bg-violet-500` | CFD, bar charts, labels |
| done | `#22c55e` | `bg-green-500` | CFD, bar charts, labels |
| cancelled | `#ef4444` | `bg-red-500` | CFD, bar charts, labels |

### Цветовая система приоритетов

| Приоритет | HEX | Использование |
|-----------|-----|---------------|
| critical | `#dc2626` | Красный, максимальное внимание |
| high | `#f97316` | Оранжевый |
| medium | `#3b82f6` | Синий |
| low | `#9ca3af` | Серый |

### Цветовая система алертов

| Уровень | HEX | Использование |
|---------|-----|---------------|
| healthy | `#22c55e` | Зелёный, всё в порядке |
| warning | `#f59e0b` | Жёлтый/янтарный, внимание |
| critical | `#ef4444` | Красный, требует действия |

### Типографика

| Элемент | Шрифт | Размер | Примечание |
|---------|-------|--------|------------|
| KPI значение | JetBrains Mono | 24-32px | Моноширинное, для чисел |
| KPI лейбл | Inter (system) | 12-14px | Обычный текст |
| Заголовок графика | Inter (system) | 16px | Жирный |
| Подпись оси | Inter (system) | 11px | Серый |
| Тултип | JetBrains Mono | 12px | Для чисел в тултипе |

### Иконки тренда

| Тренд | Иконка | Цвет |
|-------|--------|------|
| Рост (хорошо для throughput) | ↑ или ↗ | `#22c55e` |
| Падение (хорошо для cycle time) | ↓ или ↘ | `#22c55e` |
| Рост (плохо для cycle time) | ↑ или ↗ | `#ef4444` |
| Падение (плохо для throughput) | ↓ или ↘ | `#ef4444` |
| Стабильно | → | `#9ca3af` |

---

## 12. Roadmap внедрения

### Фаза 1: Фундамент (1-2 недели)

**Цель:** Базовые метрики и API

- [ ] Реализовать `/api/analytics/cfd` — расчёт кумулятивной диаграммы потока
- [ ] Реализовать `/api/analytics/cycle-time` — расчёт времени цикла
- [ ] Реализовать `/api/analytics/throughput` — расчёт пропускной способности
- [ ] Реализовать `/api/analytics/wip` — текущий WIP и тренд
- [ ] Добавить в changelog структурированный diff для переходов статусов
- [ ] Создать базовый компонент `AnalyticsPanel` на странице Board

### Фаза 2: Визуализация (2-3 недели)

**Цель:** Графики и виджеты

- [ ] Встроить библиотеку графиков (Recharts или Chart.js)
- [ ] Реализовать CFD stacked area chart
- [ ] Реализовать cycle time гистограмму с перцентилями
- [ ] Реализовать throughput bar chart
- [ ] Реализовать KPI-карточки на доске
- [ ] Реализовать sparkline-миниграфики

### Фаза 3: Аналитика (3-4 недели)

**Цель:** Глубокий анализ и алерты

- [ ] Реализовать `/api/analytics/aging` — heatmap и список стареющих задач
- [ ] Реализовать `/api/analytics/agents` — эффективность агентов
- [ ] Реализовать `/api/analytics/health` — Health Score
- [ ] Реализовать систему алертов (пороги + уведомления)
- [ ] Реализовать страницу Colony Overview (сравнение досок)
- [ ] Добавить фильтры по времени (7/14/30/90 дней)

### Фаза 4: Оптимизация (4+ недели)

**Цель:** Производительность и прогнозы

- [ ] Кэширование тяжёлых расчётов (CFD за 90 дней)
- [ ] Прогнозные модели (когда готов бэклог)
- [ ] Экспорт отчётов (CSV, PDF)
- [ ] Настраиваемые WIP-лимиты по колонкам
- [ ] Настраиваемые пороги старения
- [ ] Виджет для Dashboard-страницы сводной аналитики по колонии

---

## Приложение: Формулы и определения

### Перцентиль

```
P(X) = значение, ниже которого находится X% наблюдений
P50 = медиана
P90 = 90% задач завершаются за это время или быстрее
```

### Коэффициент вариации

```
CV = std_dev / mean
CV < 0.3  → стабильный процесс
CV 0.3-0.5 → умеренная вариативность
CV > 0.5  → нестабильный процесс
```

### Закон Литтла

```
Cycle Time = WIP / Throughput

Где:
- Cycle Time в днях
- WIP — количество задач в работе
- Throughput — задач в день
```

### Stability Index

```
SI = 1 - (σ_width / μ_width)

Где:
- σ_width — стандартное отклонение ширины полосы in_progress
- μ_width — средняя ширина полосы in_progress

SI близко к 1 → стабильный поток
SI близко к 0 → нестабильный поток
```

### Health Score

```
HS = Σ(factor_score × factor_weight)

Где:
- factor_score ∈ [0, 100] для каждого фактора
- factor_weight ∈ [0, 1], Σweights = 1

HS ≥ 80 → Здоровый поток
HS 60-79 → Внимание
HS < 60 → Критично
```
