/**
 * Lightweight i18n — auto-detects language, supports EN/RU.
 * No external dependencies, just a simple key-value map.
 */

export type Lang = 'en' | 'ru';

const translations: Record<string, Record<Lang, string>> = {
  // Navigation
  'nav.dashboard':    { en: 'Dashboard',     ru: 'Дашборд' },
  'nav.projects':     { en: 'Projects',      ru: 'Проекты' },
  'nav.library':      { en: 'Library',       ru: 'Библиотека' },
  'nav.files':        { en: 'Files',         ru: 'Файлы' },
  'nav.graph':        { en: 'Graph',         ru: 'Граф' },
  'nav.analytics':    { en: 'Analytics',     ru: 'Аналитика' },
  'nav.audit':        { en: 'Audit',         ru: 'Аудит' },

  // Common
  'common.loading':   { en: 'Loading...',    ru: 'Загрузка...' },
  'common.save':      { en: 'Save',          ru: 'Сохранить' },
  'common.cancel':    { en: 'Cancel',        ru: 'Отмена' },
  'common.delete':    { en: 'Delete',        ru: 'Удалить' },
  'common.edit':      { en: 'Edit',          ru: 'Редактировать' },
  'common.create':    { en: 'Create',        ru: 'Создать' },
  'common.search':    { en: 'Search',        ru: 'Поиск' },
  'common.filter':    { en: 'Filter',        ru: 'Фильтр' },
  'common.all':       { en: 'All',           ru: 'Все' },
  'common.yes':       { en: 'Yes',           ru: 'Да' },
  'common.no':        { en: 'No',            ru: 'Нет' },
  'common.error':     { en: 'Error',         ru: 'Ошибка' },
  'common.success':   { en: 'Success',       ru: 'Успех' },

  // Auth
  'auth.login':       { en: 'Log in',        ru: 'Войти' },
  'auth.logout':      { en: 'Log out',       ru: 'Выйти' },
  'auth.setup':       { en: 'Setup',         ru: 'Настройка' },
  'auth.username':    { en: 'Username',      ru: 'Логин' },
  'auth.password':    { en: 'Password',      ru: 'Пароль' },
  'auth.totp':        { en: 'TOTP Code',     ru: 'TOTP код' },
  'auth.welcome':     { en: 'Welcome to Myrmex Control', ru: 'Добро пожаловать в Myrmex Control' },
  'auth.firstSetup':  { en: 'Create your admin account', ru: 'Создайте аккаунт администратора' },
  'auth.loginTitle':  { en: 'Sign in to continue', ru: 'Войдите для продолжения' },

  // Dashboard
  'dash.title':       { en: 'Dashboard',     ru: 'Дашборд' },
  'dash.agents':      { en: 'Agents',        ru: 'Агенты' },
  'dash.tasks':       { en: 'Tasks',         ru: 'Задачи' },
  'dash.projects':    { en: 'Projects',      ru: 'Проекты' },
  'dash.health':      { en: 'Health Score',  ru: 'Здоровье' },
  'dash.online':      { en: 'Online',        ru: 'Онлайн' },
  'dash.offline':     { en: 'Offline',       ru: 'Оффлайн' },
  'dash.working':     { en: 'Working',       ru: 'Работает' },
  'dash.idle':        { en: 'Idle',          ru: 'Ожидает' },
  'dash.paused':      { en: 'Paused',        ru: 'Пауза' },
  'dash.backlog':     { en: 'Backlog',       ru: 'Бэклог' },
  'dash.todo':        { en: 'To Do',         ru: 'Сделать' },
  'dash.inProgress':  { en: 'In Progress',   ru: 'В работе' },
  'dash.review':      { en: 'Review',        ru: 'Проверка' },
  'dash.done':        { en: 'Done',          ru: 'Готово' },

  // Library
  'lib.title':        { en: 'Library',       ru: 'Библиотека' },
  'lib.empty':        { en: 'Library is empty', ru: 'Библиотека пуста' },
  'lib.add':          { en: 'Add Item',      ru: 'Добавить' },
  'lib.name':         { en: 'Name *',        ru: 'Название *' },
  'lib.description':  { en: 'Description',   ru: 'Описание' },
  'lib.content':      { en: 'Content *',     ru: 'Содержимое *' },
  'lib.tags':         { en: 'Tags (comma-separated)', ru: 'Теги (через запятую)' },
  'lib.type.skill':    { en: 'Skill',         ru: 'Скилл' },
  'lib.type.hook':     { en: 'Hook',          ru: 'Хук' },
  'lib.type.card':     { en: 'Card',          ru: 'Карточка' },
  'lib.type.config':   { en: 'Config',        ru: 'Конфигурация' },
  'lib.type.knowledge':{ en: 'Knowledge',     ru: 'Знание' },

  // Analytics
  'analytics.title':  { en: 'Analytics',     ru: 'Аналитика' },

  // Audit
  'audit.title':      { en: 'Audit Log',     ru: 'Журнал аудита' },

  // Theme
  'theme.light':      { en: 'Light theme',   ru: 'Светлая тема' },
  'theme.dark':       { en: 'Dark theme',    ru: 'Тёмная тема' },

  // Demo
  'demo.badge':       { en: '🎮 Demo mode — data resets every hour', ru: '🎮 Демо-режим — данные сбрасываются каждый час' },
};

// Current language — stored in localStorage
let currentLang: Lang = detectLanguage();

function detectLanguage(): Lang {
  // 1. Check localStorage
  const stored = localStorage.getItem('myrmex_lang');
  if (stored === 'en' || stored === 'ru') return stored;

  // 2. Check browser language
  const browserLang = navigator.language?.toLowerCase() ?? '';
  if (browserLang.startsWith('ru')) return 'ru';

  // 3. Check Telegram Web App
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const twaLang = window.Telegram.WebApp.initDataUnsafe?.user?.language_code;
    if (twaLang?.startsWith('ru')) return 'ru';
  }

  // Default: English
  return 'en';
}

export function t(key: string): string {
  return translations[key]?.[currentLang] ?? key;
}

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  currentLang = lang;
  localStorage.setItem('myrmex_lang', lang);
  // Dispatch event so components can re-render
  window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
}

export function toggleLang(): void {
  setLang(currentLang === 'en' ? 'ru' : 'en');
}

// React hook
import { useState, useEffect } from 'react';

export function useLang(): [Lang, (lang: Lang) => void, () => void] {
  const [lang, setLangState] = useState<Lang>(getLang());

  useEffect(() => {
    const handler = (e: Event) => {
      setLangState((e as CustomEvent).detail);
    };
    window.addEventListener('langchange', handler);
    return () => window.removeEventListener('langchange', handler);
  }, []);

  return [lang, setLang, toggleLang];
}
