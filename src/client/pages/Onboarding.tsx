import { useState } from 'react';
import { Bot, Server, FolderKanban, BarChart3, Shield, Zap, ChevronRight, ChevronLeft, Check } from 'lucide-react';

// ============================================================
// Onboarding — приветственный тур для новых пользователей
// ============================================================

interface Props {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: '🐜',
    title: 'Добро пожаловать в Myrmex Control',
    description: 'Пульт управления колонией AI-агентов. Управляйте проектами, агентами, серверами и задачами из одного места.',
    details: [
      '23 проекта лаборатории',
      '6 активных агентов-ботов',
      '3 сервера в разных локациях',
      'Канбан-доски для управления задачами',
    ],
  },
  {
    icon: '📁',
    title: 'Проекты и задачи',
    description: 'Каждый проект лаборатории — на одной странице. Задачи распределяются по канбан-доскам.',
    details: [
      'Проекты: боты, API, инфраструктура',
      '3 канбан-доски: ЗАВЛАБ, МУРАВЕЙ, КОТ',
      'Drag & drop задач между колонками',
      'WIP-лимиты и приоритеты',
    ],
  },
  {
    icon: '🤖',
    title: 'Агенты и серверы',
    description: 'Telegram-боты и сервисы — ваши цифровые агенты. Мониторинг статуса в реальном времени.',
    details: [
      '6 активных агентов-ботов',
      '3 сервера: Warsaw, Florida, RF',
      'Статус: online / offline / degraded',
      'Управление из единого интерфейса',
    ],
  },
  {
    icon: '📊',
    title: 'Аналитика и карта',
    description: 'Визуализация связей лаборатории, аналитика задач, журнал аудита.',
    details: [
      'Интерактивный граф связей (Jason)',
      'Аналитика: throughput, cycle time',
      'Журнал аудита всех действий',
      'Экспорт данных в JSON/CSV',
    ],
  },
  {
    icon: '⌨️',
    title: 'Быстрые действия',
    description: 'Работайте быстрее с горячими клавишами и командной палитрой.',
    details: [
      '⌘K — командная палитра',
      '↑↓ — навигация по спискам',
      'ESC — закрыть модальные окна',
      'S — быстрый поиск',
    ],
  },
];

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Progress */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="text-5xl mb-4">{current.icon}</div>
          <h2 className="text-xl font-bold mb-2">{current.title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{current.description}</p>

          <div className="space-y-2 text-left">
            {current.details.map((detail, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success flex-shrink-0" />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </button>

          <span className="text-xs text-muted-foreground">
            {step + 1} / {STEPS.length}
          </span>

          {isLast ? (
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition flex items-center gap-1"
            >
              Начать работу
              <Zap className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Далее
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Skip */}
        <div className="pb-4 text-center">
          <button
            onClick={onComplete}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Пропустить тур
          </button>
        </div>
      </div>
    </div>
  );
}
