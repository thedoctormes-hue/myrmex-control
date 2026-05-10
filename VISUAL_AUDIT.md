# Visual Audit: myrmex-control vs myrmex-demo

## 1. Цветовые схемы

| Элемент | myrmex-control | myrmex-demo | Разница |
|---------|---------------|-------------|---------|
| **Фон** | `hsl(222.2 84% 4.9%)` — очень тёмный синий | `#0a0a0f` — фиолетово-чёрный | Оттенок |
| **Карточки** | `hsl(222.2 84% 4.9%)` — такой же как фон | `#1e293b` — тёмно-серый синий | Контраст |
| **Границы** | `hsl(217.2 32.6% 17.5%)` — почти незаметные | `#334155` — чуть светлее | Видимость |
| **Primary** | `hsl(160 84% 39.4%)` — teal/emerald | `#10b981` — emerald | Хорошо сочетается |
| **Text Primary** | `hsl(210 40% 98%)` — почти белый | `#e2e8f0` — серый | Читаемость |
| **Text Muted** | `hsl(215 20.2% 65.1%)` | `#94a3b8` | Цвет |
| **Status Online** | `hsl(160 84% 39.4%)` | `#10b981` | Одинаково |
| **Status Warning** | `#f59e0b` — amber | `#f59e0b` — amber | Идентично |
| **Status Offline** | `#ef4444` — red | `#ef4444` — red | Идентично |

### Рекомендация по унификации
```css
/* Единый primary */
--primary: 160 84% 39.4%;     /* teal */
--success: 160 84% 39.4%;
--warning: 38 92% 50%;        /* amber */
--destructive: 0 84% 30%;      /* red */
```

---

## 2. Типография и шрифты

| Параметр | myrmex-control | myrmex-demo |
|----------|---------------|-------------|
| **Font Family** | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | `'JetBrains Mono', monospace` |
| **Base Size** | 16px (наследуется) | 16px (наследуется) |
| **Code Font** | Нет явно заданного | JetBrains Mono как основной |
| **Font Weight** | 400 normal / 600 для заголовков | 400 normal |

### Различия:
- Control: гибридные системные шрифты (читаемость)
- Demo: моноширинный шрифт (технической эстетики)

### Рекомендация
```css
/* Основной текст — системные шрифты */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Код/моноширинные блоки — JetBrains Mono */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

---

## 3. Компоненты

### Header

| | myrmex-control | myrmex-demo |
|---|----------------|-------------|
| **Расположение** | Встроен в layout, рядом с sidebar | Отдельная шапка над контентом |
| **Высота** | Автоматическая | 60px фиксированная |
| **Фон** | Прозрачный (через sidebar) | `linear-gradient(135deg, #1a1a2e, #16213e)` |
| **Элементы** | Лого + workspace | Лого + "LIVE DEMO" бейдж |

### Cards

| | myrmex-control | myrmex-demo |
|---|----------------|-------------|
| **Border radius** | `var(--radius)` = 0.5rem | 8px |
| **Padding** | 1rem | 16px |
| **Border** | 1px `hsl(var(--border))` | 1px `#334155` |
| **Hover** | `hover:border-primary/30` | `transition: transform 0.2s` + `hover:border-color` |

### Buttons

| | myrmex-control | myrmex-demo |
|---|----------------|-------------|
| **Nav кнопки** | React Router NavLink | Обычные button с state |
| **Active state** | `bg-primary text-primary-foreground` | `.active` — `#10b981` фон |
| **Hover** | `hover:bg-accent` | `hover:border-color` |
| **Border radius** | `rounded-md` (0.375rem) | 6px |

### Navigation

| | myrmex-control | myrmex-demo |
|---|----------------|-------------|
| **Позиция** | Sidebar слева (desktop) | Горизонтальная панель под header |
| **Элементы** | 5 пунктов с иконками | 2 вкладки (Monitoring/Kanban) |
| **Активный** | Зелёный фон с белым текстом | Зелёный фон с чёрным текстом |

---

## 4. Анимации и переходы

| Элемент | myrmex-control | myrmex-demo |
|---------|---------------|-------------|
| **Hover переходы** | `transition-colors` | `transition` |
| **Progress bar** | `transition: width 0.5s` | `transition: width 0.5s` |
| **Kanban карточки** | Нет drag&drop | `cursor: grab` + `:hover { transform: translateY(-2px) }` |
| **Pulse анимация** | Нет | `@keyframes pulse` для индикатора |
| **Scrollbar** | Кастомный стиль | Нет |

---

## 5. Layout и отступы

| Параметр | myrmex-control | myrmex-demo |
|----------|----------------|-------------|
| **Контейнер** | `<main>` с padding | `.container` — 20px 40px |
| **Grid gap** | `gap-4` (1rem) | 16px |
| **Sidebar ширина** | 56 (14rem) | Нет |
| **Min-height cards** | Нет | Kanban: 300px |
| **Breakpoint** | `md:` (768px) | Нет мобильной адаптации |

---

## Чек-лист унификации

### 🔴 Критично (нужно исправить)

- [ ] **Font Family** — унифицировать: системные шрифты для текста, JetBrains Mono для кода
- [ ] **Header стиль** — выбрать один подход: gradient или flat
- [ ] **Border radius** — использовать единый `--radius` (0.5rem / 8px)
- [ ] **Цвет карточек** — контрастировать с фоном (`hsl(222.2 84% 4.9%)` vs `#1e293b`)

### 🟡 Средне (рекомендуется)

- [ ] Добавить scrollbar стили в demo
- [ ] Унифицировать hover эффекты карточек
- [ ] Добавить pulse анимацию для live-элементов в control
- [ ] Вынести цвета в CSS variables

### 🟢 Мелко (по желанию)

- [ ] Унифицировать значения gap (1rem → 16px)
- [ ] Добавить drag&drop в control
- [ ] Унифицировать badge стили

---

## Единый стиль (рекомендация)

```css
:root {
  /* Colors */
  --background: 222.2 84% 4.9%;
  --card: 222.2 84% 6.9%;        /* чуть светлее фона */
  --border: 217.2 32.6% 17.5%;
  --primary: 160 84% 39.4%;
  
  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Layout */
  --radius: 0.5rem;
  --border-radius: 8px;  /* для совместимости с demo */
  
  /* Spacing */
  --gap: 1rem;
}
```