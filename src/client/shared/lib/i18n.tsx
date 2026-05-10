// ============================================================
// i18n — простая локализация (RU / EN / ZH)
// ============================================================

export type Lang = 'ru' | 'en' | 'zh';

const translations: Record<string, Record<Lang, string>> = {
  // Navigation
  'nav.dashboard': { ru: 'Дашборд', en: 'Dashboard', zh: '仪表盘' },
  'nav.projects': { ru: 'Проекты', en: 'Projects', zh: '项目' },
  'nav.library': { ru: 'Библиотека', en: 'Library', zh: '库' },
  'nav.files': { ru: 'Файлы', en: 'Files', zh: '文件' },
  'nav.graph': { ru: 'Граф', en: 'Graph', zh: '图' },

  // Dashboard
  'dashboard.title': { ru: 'Дашборд', en: 'Dashboard' },
  'dashboard.refresh': { ru: 'Обновить', en: 'Refresh' },
  'dashboard.projects': { ru: 'Проекты', en: 'Projects' },
  'dashboard.tasks': { ru: 'Задачи', en: 'Tasks' },
  'dashboard.agents': { ru: 'Агенты', en: 'Agents' },
  'dashboard.servers': { ru: 'Серверы', en: 'Servers' },
  'dashboard.empty': { ru: 'Муравейник пуст', en: 'The hive is empty' },
  'dashboard.empty.hint': { ru: 'Создайте первый проект и добавьте задачи', en: 'Create your first project and add tasks' },
  'dashboard.create_project': { ru: '+ Создать проект', en: '+ Create Project' },
  'dashboard.online': { ru: 'онлайн', en: 'online' },
  'dashboard.done': { ru: 'выполнено', en: 'done' },
  'dashboard.updated': { ru: 'Обновлено', en: 'Updated' },

  // Projects
  'projects.title': { ru: 'Проекты', en: 'Projects' },
  'projects.new': { ru: '+ Новый проект', en: '+ New Project' },
  'projects.cancel': { ru: '✕', en: '✕' },
  'projects.name': { ru: 'Название проекта *', en: 'Project name *' },
  'projects.description': { ru: 'Описание (опционально)', en: 'Description (optional)' },
  'projects.create': { ru: 'Создать', en: 'Create' },
  'projects.creating': { ru: 'Создание...', en: 'Creating...' },
  'projects.tasks_count': { ru: 'задач', en: 'tasks' },
  'projects.no_projects': { ru: 'Нет проектов', en: 'No projects' },
  'projects.no_projects.hint': { ru: 'Создайте первый проект для начала работы', en: 'Create your first project to get started' },

  // Board / Kanban
  'board.backlog': { ru: 'Бэклог', en: 'Backlog' },
  'board.todo': { ru: 'К выполнению', en: 'To Do' },
  'board.in_progress': { ru: 'В работе', en: 'In Progress' },
  'board.review': { ru: 'На проверке', en: 'Review' },
  'board.done': { ru: 'Готово', en: 'Done' },
  'board.new_task': { ru: '+ Задача', en: '+ Task' },
  'board.task_name': { ru: 'Название задачи', en: 'Task name' },
  'board.create': { ru: 'Создать', en: 'Create' },
  'board.drop_hint': { ru: 'Перетащите задачу сюда', en: 'Drop task here' },
  'board.delete_confirm': { ru: 'Удалить задачу?', en: 'Delete task?' },

  // Library
  'library.title': { ru: 'Библиотека', en: 'Library' },
  'library.skills': { ru: 'Скиллы', en: 'Skills' },
  'library.hooks': { ru: 'Хуки', en: 'Hooks' },
  'library.agents': { ru: 'Агенты', en: 'Agents' },
  'library.new_skill': { ru: '+ Новый скилл', en: '+ New Skill' },
  'library.name': { ru: 'Название', en: 'Name' },
  'library.content': { ru: 'Содержимое', en: 'Content' },
  'library.tags': { ru: 'Теги (через запятую)', en: 'Tags (comma separated)' },
  'library.save': { ru: 'Сохранить', en: 'Save' },
  'library.no_items': { ru: 'Библиотека пуста', en: 'Library is empty' },

  // Files
  'files.title': { ru: 'Файлообменник', en: 'File Exchange' },
  'files.inbox': { ru: 'Входящие', en: 'Inbox' },
  'files.outbox': { ru: 'Исходящие', en: 'Outbox' },
  'files.empty': { ru: 'Папка пуста', en: 'Folder is empty' },
  'files.loading': { ru: 'Загрузка...', en: 'Loading...' },

  // Graph
  'graph.title': { ru: 'Граф связей', en: 'Connection Graph' },
  'graph.nodes': { ru: 'Узлов', en: 'nodes' },
  'graph.edges': { ru: 'связей', en: 'edges' },
  'graph.coming_soon': { ru: 'Визуализация графа будет добавлена в v0.2 (D3.js / Cytoscape.js). Пока — текстовое представление:', en: 'Graph visualization coming in v0.2 (D3.js / Cytoscape.js). Text view for now:' },
  'graph.node_list': { ru: 'Узлы', en: 'Nodes' },
  'graph.edge_list': { ru: 'Связи', en: 'Edges' },

  // Auth
  'auth.login': { ru: 'Вход', en: 'Login' },
  'auth.password': { ru: 'Пароль', en: 'Password' },
  'auth.password.placeholder': { ru: 'Введите пароль', en: 'Enter password' },
  'auth.submit': { ru: 'Войти', en: 'Sign In' },
  'auth.wrong': { ru: 'Неверный пароль', en: 'Wrong password' },
  'auth.setup.title': { ru: 'Первичная настройка', en: 'Initial Setup' },
  'auth.setup.subtitle': { ru: 'Задайте пароль для доступа к системе', en: 'Set a password to access the system' },
  'auth.setup.password': { ru: 'Пароль (мин. 4 символа)', en: 'Password (min. 4 chars)' },
  'auth.setup.confirm': { ru: 'Подтвердите пароль', en: 'Confirm password' },
  'auth.setup.submit': { ru: 'Создать пароль', en: 'Create Password' },
  'auth.setup.mismatch': { ru: 'Пароли не совпадают', en: 'Passwords do not match' },
  'auth.setup.short': { ru: 'Минимум 4 символа', en: 'Minimum 4 characters' },
  'auth.logout': { ru: 'Выйти', en: 'Logout' },

  // Common
  'common.cancel': { ru: 'Отмена', en: 'Cancel' },
  'common.save': { ru: 'Сохранить', en: 'Save' },
  'common.delete': { ru: 'Удалить', en: 'Delete' },
  'common.edit': { ru: 'Редактировать', en: 'Edit' },
  'common.close': { ru: 'Закрыть', en: 'Close' },
  'common.loading': { ru: 'Загрузка...', en: 'Loading...' },
  'common.error': { ru: 'Ошибка', en: 'Error' },
  'common.retry': { ru: 'Повторить', en: 'Retry' },
  'common.theme': { ru: 'Тема', en: 'Theme' },
  'common.language': { ru: 'Язык', en: 'Language' },

  // Demo
  'demo.banner': { ru: 'Демо-режим — данные сбрасываются каждый час', en: 'Demo mode — data resets every hour' },

  // Priority
  'priority.low': { ru: 'Низкий', en: 'Low' },
  'priority.medium': { ru: 'Средний', en: 'Medium' },
  'priority.high': { ru: 'Высокий', en: 'High' },
  'priority.critical': { ru: 'Критический', en: 'Critical' },

  // Server status
  'server.online': { ru: 'онлайн', en: 'online' },
  'server.offline': { ru: 'оффлайн', en: 'offline' },
  'server.checking': { ru: 'проверка...', en: 'checking...' },
};

export function t(key: string, lang: Lang = 'ru'): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] ?? entry['en'] ?? entry['ru'] ?? key;
}

// Хук для использования в компонентах
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem('myrmex_lang') as Lang;
    if (saved === 'ru' || saved === 'en' || saved === 'zh') return saved;
  } catch { /* ignore */ }
  // Auto-detect by browser
  const browserLang = (navigator.language || navigator.languages?.[0] || '').toLowerCase();
  if (browserLang.startsWith('ru')) return 'ru';
  if (browserLang.startsWith('zh')) return 'zh';
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    try { localStorage.setItem('myrmex_lang', newLang); } catch { /* ignore */ }
  }, []);

  const translate = useCallback((key: string) => t(key, lang), [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
