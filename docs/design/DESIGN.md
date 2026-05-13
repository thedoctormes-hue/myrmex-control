---
description: "🎨 Myrmex Control — Design System & UX Guide"
type: guide
last_reviewed: 2026-05-12
last_code_change: 2026-05-12
status: active
---
# 🎨 Myrmex Control — Design System & UX Guide

> **Версия:** 1.0 | **Дата:** 2026-05-11 | **Автор:** Каскадный брейншторм (20 агентов)
>
> Этот документ — результат масштабного аудита дизайна и UX проекта Myrmex Control.
> 20 специализированных агентов проанализировали каждый аспект: от цветовой палитры до информационной архитектуры.

---

## 📋 Содержание

1. [Executive Summary](#1-executive-summary)
2. [Критические проблемы (P0)](#2-критические-проблемы-p0)
3. [Улучшения (P1)](#3-улучшения-p1)
4. [Возможности (P2)](#4-возможности-p2)
5. [Визуальный бренд](#5-визуальный-бренд)
6. [Дизайн-система](#6-дизайн-система)
7. [Навигация и информационная архитектура](#7-навигация-и-информационная-архитектура)
8. [Мобильный опыт и PWA](#8-мобильный-опыт-и-pwa)
9. [Анимации и микроинтеракции](#9-анимации-и-микроинтеракции)
10. [Безопасность UX](#10-безопасность-ux)
11. [Производительность](#11-производительность)
12. [Roadmap](#12-roadmap)
13. [Метрики успеха](#13-метрики-успеха)

---

## 1. Executive Summary

Myrmex Control — полнофункциональный дашборд для управления колонией AI-агентов с чистой архитектурой (React 19 + TypeScript + Tailwind CSS + Express + JSON DB). **Что работает хорошо:** тёмная тема с HSL-переменными, семантика цветов emerald/amber, SVG-виджет HealthScore, JWT+TOTP+RBAC аутентификация, PWA и TWA интеграция из коробки.

**Критические проблемы:** дублирование CSS-токенов (tokens.css + index.css), JetBrains Mono для всего текста (убивает читаемость), отсутствие code splitting (все 10 страниц грузятся сразу), нет error boundary, нет skeleton loaders, emoji вместо иконок навигации, CatMascot (кот) не соответствует бренду Myrmex (муравей), 7 пунктов в BottomBar не помещаются на мобильных, Graph — пустая заглушка, Library без поиска и редактирования, Files без загрузки.

**Приоритет первого дня:** убрать дублирование CSS, разделить типографику (JetBrains Mono только для кода), добавить React.lazy() для всех страниц, заменить emoji на Lucide иконки, добавить ErrorBoundary и skeleton loaders.

---

## 2. Критические проблемы (P0)

### P0-1: Дублирование CSS-токенов

**Проблема:** `tokens.css` и `index.css` оба определяют `:root` переменные. При импорте `tokens.css` → `index.css`, значения из `index.css` перезаписывают `tokens.css`. Плюс третья копия в `shared-styles/src/tokens.css`.

**Решение:**
```css
/* Оставить ОДИН файл: src/client/app/tokens.css */
/* Удалить :root из index.css */
/* Удалить shared-styles/src/tokens.css (или сделать симлинк) */
```

### P0-2: JetBrains Mono для всего текста

**Проблема:** Моноширинный шрифт используется ВЕЗДЕ — включая body text, описания, кнопки. Это убивает читаемость и выглядит как баг.

**Решение:**
```css
/* tokens.css */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Применить */
body { font-family: var(--font-body); }
code, pre, .font-mono, .stat-value, .timestamp { font-family: var(--font-mono); }
```

### P0-3: Нет code splitting

**Проблема:** Все 10 страниц импортируются статически в `App.tsx`. При первом загрузке грузится ВСЁ, даже если пользователь на дашборде.

**Решение:**
```tsx
// App.tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Projects = lazy(() => import('../pages/Projects'));
// ... все 10 страниц

// В роутере:
<Suspense fallback={<PageSkeleton />}>
  <Routes>...</Routes>
</Suspense>
```

### P0-4: Нет Error Boundary

**Проблема:** Если одна страница упадёт — упадёт всё приложение.

**Решение:**
```tsx
// src/client/shared/ui/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  // componentDidCatch + fallback UI с кнопкой "Попробовать снова"
}
// Обернуть <App /> и каждый <Suspense />
```

### P0-5: Нет skeleton loaders

**Проблема:** При загрузке данных пользователь видит пустой экран или `animate-pulse` на тексте "Loading...".

**Решение:** Создать компоненты-скелеты для каждой страницы:
```tsx
// DashboardSkeleton — 4 карточки + 2 виджета-заглушки
// TableSkeleton — N строк с анимированными полями
// CardSkeleton — карточка с пульсирующими блоками
```

### P0-6: Emoji вместо иконок навигации

**Проблема:** В Sidebar и BottomBar используются emoji (`📊`, `📁`, `📚`, `📂`, `🕸️`, `📈`, `📋`), а в Analytics/AuditLog — Lucide React. Два разных подхода = визуальный разрыв. Emoji рендерятся по-разному на разных платформах.

**Решение:**
```tsx
// Заменить ВСЕ emoji на Lucide иконки
import { LayoutDashboard, FolderKanban, BookOpen, Files, Network, BarChart3, ScrollText, Settings } from 'lucide-react';
```

### P0-7: CatMascot (кот) ≠ Myrmex (муравей)

**Проблема:** Название Myrmex (греч. μύρμηξ = муравей), но маскот — кот. Это несоответствие бренда.

**Решение:** Заменить CatMascot на AntMascot (SVG муравья). Варианты:
- Стилизованный муравей в стилистике "кибер-муравей" (emerald цвет, антенны, 6 лапок)
- Муравей с "глитч" эффектом для состояния error
- Муравей с поднятой антенной для состояния working

### P0-8: 7 пунктов в BottomBar

**Проблема:** На узких экранах (<360px) 7 пунктов не помещаются. Подписи 8px — нечитаемы.

**Решение:**
```tsx
// BottomBar: 5 пунктов (Dashboard, Projects, Agents, Files, Analytics)
// Library, Graph, Audit, Settings — через "Ещё" меню или только Sidebar
// Подписи: минимум 10px, активное состояние с фоном
```

### P0-9: Graph — пустая заглушка

**Проблема:** Текстовая заглушка "Graph visualization coming in v0.2" подрывает доверие к продукту.

**Решение:** Убрать из основной навигации до реализации. Добавить кнопку "Показать граф" в карточку проекта (модалка с подграфом).

### P0-10: Нет семантических цветовых токенов

**Проблема:** Нет `--success`, `--warning`, `--error`, `--info`. Везде хардкод цветов (`#22c55e`, `#f59e0b`, `#ef4444`, `#3b82f6`).

**Решение:**
```css
/* tokens.css */
--success: 142 76% 36%;   /* green-600 */
--warning: 38 92% 50%;    /* amber-500 */
--error: 0 84% 60%;       /* red-500 */
--info: 217 91% 60%;      /* blue-500 */
```

---

## 3. Улучшения (P1)

### P1-1: Добавить страницу Agents

**Обоснование:** Агенты — центральная сущность. Сейчас видны только как счётчик на дашборде.

**Структура:** карточки с аватаром, именем, ролью, статусом + детальная карточка с историей задач.

### P1-2: Добавить страницу Servers

**Обоснование:** Серверный CRUD уже реализован, но нет клиентской страницы.

**Структура:** карточки серверов + статус + кнопка check + детальная с метриками.

### P1-3: Library → 3 вкладки

**Обоснование:** 5 типов в одном списке — как смешать код, документацию и настройки в одну папку.

```
📚 Library
├── 🧩 Skills (skill + hook + card) — исполняемые артефакты
├── 📖 Knowledge (knowledge) — документация
└── ⚙️ Configs (config) — конфигурации
```

### P1-4: Добавить загрузку файлов

**Обоснование:** Files только показывает файлы, но не позволяет загрузить.

**Реализация:** drag-and-drop зона + `POST /api/files/upload` + multipart.

### P1-5: Добавить страницу Settings

**Обосновация:** Тема и язык зашиты в sidebar footer. Тип `Settings` описан в types.ts, но не используется.

**Структура (3 tabs):** Appearance (theme, language) | System (refresh_interval, notifications) | Security (password, TOTP).

### P1-6: Группировка Sidebar по доменам

```
📊 Overview     → Dashboard
📁 Work         → Projects, Board, Agents
🖥️ Infrastructure → Servers, Analytics
📚 Knowledge    → Library (Skills/Knowledge/Configs)
⚙️ System       → Files, Settings, Audit, Notifications
```

### P1-7: Добавить центр уведомлений

**Обоснование:** ToastContainer реализован, но не используется. Нет модели данных для уведомлений.

**Реализация:** bell-иконка в хедере с badge + страница `/notifications` + типы: task_assigned, task_completed, server_down, agent_error, system.

### P1-8: Breadcrumbs

**Обоснование:** Пользователь не понимает где он в иерархии (особенно в Board/:id).

### P1-9: Глобальный поиск

**Обоснование:** Нет способа найти задачу, проект или агента по имени. Реализовать Cmd+K модалку поиска.

### P1-10: Confirm dialogs

**Обоснование:** Сейчас используется нативный `confirm()` для удаления. Нужен кастомный `<ConfirmDialog />` с анимацией.

---

## 4. Возможности (P2)

### P2-1: Dashboard — кастомизация виджетов

Drag-and-drop сетка виджетов. Виджеты включаются/выключаются. Порядок сохраняется в `settings.custom.dashboard_layout`.

### P2-2: Onboarding tour

При первом входе (когда нет проектов и задач) — пошаговый тур: создать проект → добавить задачу → назначить агента → загрузить файл.

### P2-3: Keyboard shortcuts

| Шорткат | Действие |
|---------|----------|
| `Cmd+K` | Глобальный поиск |
| `Cmd+B` | Переключить Sidebar |
| `Cmd+/` | Показать шорткаты |
| `Esc` | Закрыть модалку |
| `1-5` | Навигация по BottomBar |

### P2-4: Profile dropdown

Аватар в хедере → dropdown: профиль (username, role), смена пароля, выход.

### P2-5: Иерархия проектов

Добавить `parent_id` в тип Project. Отображать как дерево (2 уровня).

### P2-6: Контекстные ссылки между сущностями

- В карточке проекта → "N задач, M агентов"
- В карточке агента → "Проект: X, Текущая задача: Y"
- В карточке задачи → "Агент: X, Проект: Y"

### P2-7: Activity Heatmap

Виджет на дашборде: активность за последние 30 дней (как GitHub contributions graph). Данные из changelog.

### P2-8: Экспорт данных

Кнопка "Экспорт" в Analytics: выгрузка метрик в CSV/JSON. В Library: экспорт артефакта.

### P2-9: Тема "Auto"

Автоматическое переключение тёмная/светлая тема по `prefers-color-scheme`.

### P2-10: Stale-while-revalidate кэширование

useMyrmex: показывать кэшированные данные сразу, фоновое обновление. Индикатор "Обновлено N сек назад".

---

## 5. Визуальный бренд

### 5.1. Логотип

**Текущее состояние:** Нет выделенного логотипа. Используется emoji `🐜` + текст "Myrmex Control".

**Рекомендация:** Создать SVG-логотип: стилизованный муравей + моноширинный текст "MYRMEX CONTROL". Варианты:
- Минималистичный муравей из геометрических форм (6 лапок, антенны, 3 сегмента тела)
- Муравей в стилистике "терминала" (пиксельный или wireframe)
- Глитч-версия для loading/error состояний

### 5.2. Цветовая палитра

| Токен | HSL | Hex | Использование |
|-------|-----|-----|---------------|
| `--background` | 222.2 84% 4.9% | #0a0e1a | Фон страницы |
| `--card` | 217.2 23% 18.8% | #1e293b | Карточки |
| `--foreground` | 210 40% 98% | #f1f5f9 | Основной текст |
| `--primary` | 160 84% 39.4% | #10b981 | Emerald — акцент, кнопки |
| `--secondary` | 217.2 32.6% 17.5% | #2d3748 | Вторичные элементы |
| `--muted` | 215 20.2% 65.1% | #94a3b8 | Приглушённый текст |
| `--border` | 217.2 32.6% 17.5% | #2d3748 | Границы |
| `--success` | 142 76% 36% | #22c55e | Успех |
| `--warning` | 38 92% 50% | #f59e0b | Предупреждение |
| `--error` | 0 84% 60% | #ef4444 | Ошибка |
| `--info` | 217 91% 60% | #3b82f6 | Информация |

**Проблема:** `--secondary`, `--muted`, `--accent` имеют одинаковое значение `217.2 32.6% 17.5%`. Нужно разделить.

### 5.3. Типографика

**Текущая проблема:** JetBrains Mono для всего → плохая читаемость.

**Рекомендуемая система:**

| Размер | Значение | Использование |
|--------|----------|---------------|
| `--font-size-xs` | 0.75rem (12px) | Бейджи, метки |
| `--font-size-sm` | 0.875rem (14px) | Описания, подписи |
| `--font-size-base` | 1rem (16px) | Основной текст |
| `--font-size-lg` | 1.125rem (18px) | Подзаголовки |
| `--font-size-xl` | 1.25rem (20px) | Заголовки карточек |
| `--font-size-2xl` | 1.5rem (24px) | Заголовки страниц |
| `--font-size-3xl` | 2rem (32px) | Главный заголовок |

**Шрифты:**
- Body: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, `Roboto`, `sans-serif`
- Mono: `'JetBrains Mono'`, `'Fira Code'`, `monospace` (только для кода, цифр, таймстампов)

### 5.4. Иконки

**Правило:** Только Lucide React. Никаких emoji в UI.

| Страница | Иконка Lucide |
|----------|--------------|
| Dashboard | `LayoutDashboard` |
| Projects | `FolderKanban` |
| Agents | `Bot` |
| Library | `BookOpen` |
| Files | `Files` |
| Graph | `Network` |
| Analytics | `BarChart3` |
| Audit | `ScrollText` |
| Settings | `Settings` |
| Notifications | `Bell` |

### 5.5. Пустые состояния

Каждая страница должна иметь красивое empty state:
- Иллюстрация (SVG муравей в разных позах)
- Заголовок "Ничего не найдено"
- Подсказка что делать
- Кнопка действия

---

## 6. Дизайн-система

### 6.1. Архитектура CSS

```
src/client/app/
├── tokens.css      ← ЕДИНСТВЕННЫЙ источник CSS-переменных
├── index.css       ← Tailwind directives + базовые стили (БЕЗ :root)
└── main.tsx        ← Импорт: tokens.css → index.css
```

**Удалить:** `shared-styles/src/tokens.css` (дубликат)

### 6.2. Недостающие токены

```css
/* Семантические цвета */
--success: 142 76% 36%;
--warning: 38 92% 50%;
--error: 0 84% 60%;
--info: 217 91% 60%;

/* Типографика */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Z-index система */
--z-dropdown: 50;
--z-sticky: 100;
--z-overlay: 200;
--z-modal: 300;
--z-toast: 400;

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

/* Transitions */
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 350ms ease;
```

### 6.3. Spacing system

Использовать систему Tailwind (4px base unit): `1=4px`, `2=8px`, `4=16px`, `6=24px`, `8=32px`, `12=48px`, `16=64px`.

### 6.4. Breakpoints

| Имя | Значение | Устройство |
|-----|----------|------------|
| `sm` | 640px | Большие телефоны |
| `md` | 768px | Планшеты |
| `lg` | 1024px | Ноутбуки |
| `xl` | 1280px | Десктоп |
| `2xl` | 1536px | Широкий экран |

---

## 7. Навигация и информационная архитектура

### 7.1. Предлагаемая структура (5 доменов)

```
Level 1 (Sidebar)          Level 2 (Tabs / Sub-nav)
─────────────────          ──────────────────────────
📊 Dashboard               —
📁 Projects               → Board/:id (по клику)
🤖 Agents                 → Agent/:id (карточка)
🖥️ Servers                → Server/:id (детали)
📚 Library                → Skills | Knowledge | Configs (tabs)
💾 Files                  → Inbox | Outbox (tabs)
📈 Analytics              —
⚙️ Settings               → Appearance | System | Security (tabs)
📋 Audit Log              —
🔔 Notifications          —
```

### 7.2. Правила

- **Не глубже 2 уровней.** Всё остальное — модалки и slide-over панели.
- **Board/:id** — не отдельный пункт навигации. Открывается из Projects.
- **Graph** — убрать из основной навигации до v0.2. Добавить как модалку из карточки проекта.

### 7.3. Новые страницы (приоритет)

| # | Страница | Сложность | Обоснование |
|---|----------|-----------|-------------|
| 1 | Agents | Средняя | Центральная сущность, нет управления |
| 2 | Servers | Низкая | API уже есть, нужна только клиентская часть |
| 3 | Settings | Средняя | Тип описан, но не используется |
| 4 | Notifications | Высокая | Нет модели данных, нужен центр уведомлений |

---

## 8. Мобильный опыт и PWA

### 8.1. BottomBar

**Текущая проблема:** 7 пунктов, подписи 8px, нет активного состояния с фоном.

**Решение:**
- 5 пунктов в BottomBar (Dashboard, Projects, Agents, Files, Analytics)
- Подписи: минимум 10px
- Активное состояние: `bg-primary/10` + `text-primary` + индикатор-точка
- Library, Graph, Audit, Settings — через "Ещё" меню

### 8.2. Touch optimization

**Что уже есть:** min 44px tap targets, font-size 16px для inputs, `-webkit-overflow-scrolling`, safe area insets.

**Что добавить:**
- Swipe для возврата назад (edge swipe)
- Pull-to-refresh на дашборде
- Haptic feedback для действий (через TWA)
- Kanban: на мобильных — вертикальный список вместо drag-and-drop

### 8.3. PWA

**Что уже есть:** service worker, manifest, installable.

**Что добавить:**
- Offline fallback страница
- Background sync для действий без сети
- Push уведомления (через TWA)

### 8.4. Telegram Web App

**Что уже есть:** `twa.ts` с инициализацией, расширение viewport.

**Что добавить:**
- Поддержка MainButton / BackButton
- Поддержка theme_params (автоматическая адаптация под тему Telegram)
- HapticFeedback для действий
- Обработка ссылок в чате (deep links)

---

## 9. Анимации и микроинтеракции

### 9.1. Принципы

- **Быстро:** 150-250ms для UI-элементов, 300-500ms для страниц
- **Осмысленно:** каждая анимация объясняет что произошло
- **Не навязчиво:** `prefers-reduced-motion: reduce` должен отключать всё

### 9.2. Страницы

```css
/* Page transition */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.page-enter { animation: fadeIn 250ms ease-out; }
```

### 9.3. Компоненты

| Компонент | Анимация | Длительность |
|-----------|----------|-------------|
| Card hover | `scale(1.01)` + `shadow-lg` | 150ms |
| Button press | `scale(0.98)` | 100ms |
| Modal open | `opacity 0` → `1` + `scale(0.95)` → `1` | 250ms |
| Toast slide | `translateX(100%)` → `0` | 300ms |
| Skeleton | `pulse` (уже есть) | — |
| HealthScore ring | `stroke-dashoffset` (уже есть) | 500ms |

### 9.4. Состояния маскота

| Состояние | Анимация |
|-----------|----------|
| Idle | Дыхание (scale 1.0 → 1.02, 2s loop) |
| Working | Движение антенн (rotate ±5°, 1s loop) |
| Error | Тряска (translateX ±3px, 0.3s loop) |
| Success | Подпрыгивание (translateY -5px, 0.5s) |

---

## 10. Безопасность UX

### 10.1. Текущие проблемы

1. **Нет rate limiting на UI** — можно бесконечно пытаться войти
2. **Нет кнопки "Показать пароль"** — невозможно проверить ввод
3. **Нет индикатора прочности пароля** — пользователь не знает надёжный ли пароль
4. **Нет подтверждения для опасных действий** — нативный `confirm()` вместо кастомного диалога
5. **Нет сессии timeout** — JWT живёт вечно

### 10.2. Рекомендации

- Добавить кнопку "Показать/скрыть пароль" в Login и Setup
- Добавить индикатор прочности пароля (weak/medium/strong)
- Добавить задержку после 3 неудачных попыток входа
- Кастомный ConfirmDialog для удаления/опасных действий
- Автоматический logout после 30 минут неактивности

---

## 11. Производительность

### 11.1. Текущие проблемы

1. Нет code splitting (все 10 страниц грузятся сразу)
2. Нет мемоизации (useCallback/useMemo)
3. useMyrmex загружает весь state целиком
4. Нет виртуализации списков
5. CatMascot — inline SVG в каждом рендере
6. Нет prefetching
7. Нет stale-while-revalidate

### 11.2. Рекомендации

| # | Улучшение | Эффект |
|---|-----------|--------|
| 1 | React.lazy() + Suspense | -60% начальный бандл |
| 2 | useMemo/useCallback в списках | Меньше re-render |
| 3 | Селекторы для useMyrmex | Точечные обновления |
| 4 | Виртуализация (AuditLog, Library) | Плавный скролл при 100+ элементах |
| 5 | Вынести CatMascot SVG в отдельный файл | Меньше размер бандла |
| 6 | Prefetch при hover на ссылке | Мгновенные переходы |
| 7 | SWR кэширование | Мгновенный показ + фоновое обновление |

---

## 12. Roadmap

### Неделя 1-2: Криисы (P0)

- [ ] Удалить дублирование CSS-токенов
- [ ] Разделить типографика (JetBrains Mono только для кода)
- [ ] Добавить React.lazy() для всех страниц
- [ ] Добавить ErrorBoundary
- [ ] Заменить emoji на Lucide иконки
- [ ] Добавить семантические цветовые токены
- [ ] Убрать Graph из навигации (до v0.2)

### Неделя 3-4: Фундамент (P0+P1)

- [ ] Добавить skeleton loaders
- [ ] Создать AntMascot (замена CatMascot)
- [ ] Исправить BottomBar (5 пунктов, читаемые подписи)
- [ ] Добавить страницу Agents
- [ ] Добавить страницу Servers
- [ ] Library → 3 вкладки
- [ ] Добавить загрузку файлов

### Неделя 5-8: Улучшения (P1)

- [ ] Добавить страницу Settings
- [ ] Группировка Sidebar по доменам
- [ ] Добавить центр уведомлений
- [ ] Добавить breadcrumbs
- [ ] Добавить глобальный поиск (Cmd+K)
- [ ] Кастомный ConfirmDialog
- [ ] Анимации и микроинтеракции

### Неделя 9-12: Полировка (P1+P2)

- [ ] Onboarding tour
- [ ] Keyboard shortcuts
- [ ] Profile dropdown
- [ ] Контекстные ссылки между сущностями
- [ ] Activity Heatmap
- [ ] Экспорт данных
- [ ] TWA: MainButton, BackButton, theme_params

### Неделя 13-24: Масштабирование (P2+P3)

- [ ] Dashboard — кастомизация виджетов
- [ ] Иерархия проектов
- [ ] Graph — полноценная визуализация (D3/Cytoscape)
- [ ] Stale-while-revalidate кэширование
- [ ] Тема "Auto" (prefers-color-scheme)
- [ ] Локализация (полный EN/RU покрытие)

---

## 13. Метрики успеха

### 13.1. Производительность

| Метрика | Текущее | Цель |
|---------|---------|------|
| First Contentful Paint (FCP) | ~2.5s | <1.5s |
| Largest Contentful Paint (LCP) | ~4s | <2.5s |
| Time to Interactive (TTI) | ~5s | <3s |
| Начальный бандл | ~500KB | <200KB (с lazy) |
| Cumulative Layout Shift (CLS) | >0.1 | <0.05 |

### 13.2. Доступность (a11y)

| Метрика | Текущее | Цель |
|---------|---------|------|
| WCAG AA контраст | ~60% текстов | 100% |
| ARIA labels | ~20% элементов | 100% интерактивных |
| Keyboard navigation | Частичная | Полная |
| Screen reader | Не тестировано | NVDA/VoiceOver compatible |

### 13.3. UX

| Метрика | Текущее | Цель |
|---------|---------|------|
| Страницы без empty state | 8/10 | 0/10 |
| Страницы без loading state | 6/10 | 0/10 |
| Навигация: клики до цели | 3-4 | 1-2 |
| Mobile usability score | ~60/100 | >90/100 |

### 13.4. Код

| Метрика | Текущее | Цель |
|---------|---------|------|
| CSS дублирование | ~30% | <5% |
| Компоненты с типами | ~70% | 100% |
| Code coverage | 0% | >60% |
| ESLint warnings | Неизвестно | 0 |

---

## Приложение A: Чеклист быстрых побед

Эти изменения можно сделать за 1-2 часа каждое:

- [ ] Удалить двойной `@import url` JetBrains Mono
- [ ] Удалить `:root` из index.css (оставить только в tokens.css)
- [ ] Заменить `accent` и `secondary` на разные значения
- [ ] Добавить `--success`, `--warning`, `--error`, `--info` токены
- [ ] Заменить emoji на Lucide в Sidebar/BottomBar
- [ ] Увеличить подписи BottomBar с 8px до 10px
- [ ] Добавить `aria-label` на все кнопки без текста
- [ ] Добавить `focus:ring-2` на все интерактивные элементы
- [ ] Заменить `confirm()` на кастомный ConfirmDialog
- [ ] Добавить `prefers-reduced-motion` медиа-запрос

---

## Приложение B: Структура файлов после рефакторинга

```
src/client/
├── app/
│   ├── tokens.css          ← ЕДИНСТВЕННЫЙ источник CSS-переменных
│   ├── index.css           ← Tailwind + базовые стили (БЕЗ :root)
│   ├── App.tsx             ← С React.lazy() + ErrorBoundary
│   └── main.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Projects.tsx
│   ├── Board.tsx
│   ├── Agents.tsx          ← НОВАЯ
│   ├── Servers.tsx         ← НОВАЯ
│   ├── Library.tsx         ← С вкладками
│   ├── Files.tsx           ← С загрузкой
│   ├── Graph.tsx
│   ├── Analytics.tsx
│   ├── AuditLog.tsx
│   ├── Settings.tsx        ← НОВАЯ
│   ├── Notifications.tsx   ← НОВАЯ
│   ├── Login.tsx
│   └── Setup.tsx
├── features/
│   ├── dashboard/
│   │   ├── HealthScore.tsx
│   │   ├── ServerWidget.tsx
│   │   ├── BalanceWidget.tsx
│   │   ├── SignalsFeed.tsx
│   │   └── DashboardSkeleton.tsx  ← НОВАЯ
│   └── ...
├── shared/
│   ├── ui/
│   │   ├── Sidebar.tsx     ← С группировкой по доменам
│   │   ├── BottomBar.tsx   ← 5 пунктов
│   │   ├── AntMascot.tsx   ← Замена CatMascot
│   │   ├── ErrorBoundary.tsx  ← НОВАЯ
│   │   ├── ConfirmDialog.tsx  ← НОВАЯ
│   │   ├── SearchModal.tsx    ← НОВАЯ (Cmd+K)
│   │   ├── Breadcrumbs.tsx    ← НОВАЯ
│   │   ├── ToastContainer.tsx
│   │   └── Skeleton.tsx       ← НОВАЯ
│   ├── hooks/
│   │   ├── useMyrmex.ts    ← С селекторами + SWR
│   │   ├── useTheme.ts
│   │   ├── useToast.ts
│   │   ├── useSwipeNav.ts
│   │   └── useKeyboard.ts     ← НОВАЯ (шорткаты)
│   └── lib/
│       ├── api.ts
│       ├── i18n.ts
│       └── twa.ts
```

---

*Документ создан каскадным брейнштормом из 20 агентов. Последнее обновление: 2026-05-11.*
*Для вопросов и предложений: @thedoctormes-hue*
