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
  'nav.agents':       { en: 'Agents',        ru: 'Агенты' },
  'nav.servers':      { en: 'Servers',       ru: 'Серверы' },
  'nav.settings':     { en: 'Settings',      ru: 'Настройки' },
  'nav.group.main':   { en: 'Main',          ru: 'Основное' },
  'nav.group.manage': { en: 'Management',    ru: 'Управление' },
  'nav.group.system': { en: 'System',        ru: 'Система' },

  // Navigation extra
  'nav.group.kanban':   { en: 'Kanban',          ru: 'Канбан' },
  'nav.group.product':  { en: 'Product',         ru: 'Продукт' },
  'nav.artifacts':      { en: 'Artifacts',       ru: 'Артефакты' },
  'nav.knowledge':      { en: 'Knowledge Graph', ru: 'Граф знаний' },
  'nav.sessions':       { en: 'Sessions',        ru: 'Сессии' },
  'nav.evolution':      { en: 'Evolution',       ru: 'Evolution' },
  'nav.pricing':        { en: 'Pricing',         ru: 'Тарифы' },

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
  'auth.enterPassword': { en: 'Enter password', ru: 'Введите пароль' },
  'auth.passwordPlaceholder': { en: 'Enter password', ru: 'Введите пароль' },
  'auth.passwordRequired': { en: 'Password is required', ru: 'Пароль обязателен' },
  'auth.wrongPassword': { en: 'Wrong password', ru: 'Неверный пароль' },
  'auth.signIn':      { en: 'Sign in',       ru: 'Войти' },
  'auth.signingIn':   { en: 'Signing in...',  ru: 'Вход...' },
  'auth.antColony':   { en: 'Ant colony',    ru: 'Муравейник агентов' },
  'auth.passwordSetOnServer': { en: 'Password is set in MYRMEX_PASSWORD on the server', ru: 'Пароль задаётся в MYRMEX_PASSWORD на сервере' },
  'auth.twaAuthFailed': { en: 'TWA auth failed', ru: 'Ошибка TWA-авторизации' },
  'auth.twaUnavailable': { en: 'TWA initData unavailable', ru: 'TWA initData недоступен' },

  // Setup
  'setup.title':      { en: 'Initial Setup', ru: 'Первичная настройка' },
  'setup.subtitle':   { en: 'Create a password to access the control center. It will be saved and required for every login.', ru: 'Придумайте пароль для доступа к центру управления. Он будет сохранён и потребуется при каждом входе.' },
  'setup.passwordLabel': { en: 'Password',   ru: 'Пароль' },
  'setup.confirmLabel': { en: 'Confirm',     ru: 'Подтверждение' },
  'setup.passwordPlaceholder': { en: 'Min 4 characters', ru: 'Минимум 4 символа' },
  'setup.confirmPlaceholder': { en: 'Repeat password', ru: 'Повторите пароль' },
  'setup.minChars':   { en: 'Min 4 characters', ru: 'Минимум 4 символа' },
  'setup.passwordsMismatch': { en: 'Passwords do not match', ru: 'Пароли не совпадают' },
  'setup.installing': { en: 'Installing...',  ru: 'Установка...' },
  'setup.installPassword': { en: 'Set password', ru: 'Установить пароль' },
  'setup.error':      { en: 'Setup error',  ru: 'Ошибка установки' },

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
  'dash.overview':    { en: 'Colony overview', ru: 'Обзор муравейника' },
  'dash.updatedAt':   { en: 'Updated {time}', ru: 'Обновлено {time}' },
  'dash.refresh':     { en: 'Refresh',       ru: 'Обновить' },
  'dash.emptyTitle':  { en: 'Colony is empty', ru: 'Муравейник пуст' },
  'dash.emptyDesc':   { en: 'Create your first project and add tasks', ru: 'Создайте первый проект и добавьте задачи' },
  'dash.createProject': { en: '+ Create project', ru: '+ Создать проект' },
  'dash.doneTasks':   { en: '{n} done',      ru: '{n} выполнено' },
  'dash.projectsLabel': { en: 'Projects',    ru: 'Проекты' },
  'dash.tasksLabel':  { en: 'Tasks',         ru: 'Задачи' },
  'dash.agentsLabel': { en: 'Agents',        ru: 'Агенты' },
  'dash.serversLabel': { en: 'Servers',      ru: 'Серверы' },

  // Agents
  'agents.title':     { en: 'Agents',        ru: 'Агенты' },
  'agents.count':     { en: '{n} agents',    ru: '{n} агентов' },
  'agents.newAgent':  { en: 'New agent',     ru: 'Новый агент' },
  'agents.cancel':    { en: 'Cancel',        ru: 'Отмена' },
  'agents.nameLabel': { en: 'Agent name *',  ru: 'Имя агента *' },
  'agents.roleLabel': { en: 'Role (worker, reviewer, ...)', ru: 'Роль (worker, reviewer, ...)' },
  'agents.modelLabel': { en: 'Model (gpt-4, claude, ...)', ru: 'Модель (gpt-4, claude, ...)' },
  'agents.creating':  { en: 'Creating...',   ru: 'Создание...' },
  'agents.create':    { en: 'Create',        ru: 'Создать' },
  'agents.noAgents':  { en: 'No agents. Create the first one!', ru: 'Нет агентов. Создайте первого!' },
  'agents.deleteTitle': { en: 'Delete agent?', ru: 'Удалить агента?' },
  'agents.deleteConfirm': { en: 'Agent "{name}" will be deleted. This action cannot be undone.', ru: 'Агент «{name}» будет удалён. Это действие нельзя отменить.' },
  'agents.deleteLabel': { en: 'Delete',      ru: 'Удалить' },
  'agents.deleted':   { en: 'Agent "{name}" deleted', ru: 'Агент «{name}» удалён' },
  'agents.created':   { en: 'Agent "{name}" created', ru: 'Агент «{name}» создан' },
  'agents.unknownError': { en: 'Unknown error', ru: 'Неизвестная ошибка' },
  'agents.status.idle': { en: 'Idle',        ru: 'Ожидание' },
  'agents.status.working': { en: 'Working',  ru: 'Работает' },
  'agents.status.error': { en: 'Error',      ru: 'Ошибка' },
  'agents.status.offline': { en: 'Offline',  ru: 'Оффлайн' },
  'agents.lastSeen':  { en: 'Seen: {time}',  ru: 'Виден: {time}' },
  'agents.nameRequired': { en: 'Agent name is required', ru: 'Имя агента обязательно' },
  'agents.createError': { en: 'Failed to create agent', ru: 'Ошибка создания агента' },
  'agents.updateError': { en: 'Failed to update', ru: 'Ошибка обновления' },

  // Board / Kanban
  'board.projectNotFound': { en: 'Project not found', ru: 'Проект не найден' },
  'board.tasksCount': { en: '{n} tasks',      ru: '{n} задач' },
  'board.newTask':    { en: '+ Task',          ru: '+ Задача' },
  'board.taskTitlePlaceholder': { en: 'Task title', ru: 'Название задачи' },
  'board.create':     { en: 'Create',          ru: 'Создать' },
  'board.column.backlog': { en: 'Backlog',     ru: 'Бэклог' },
  'board.column.todo': { en: 'To Do',          ru: 'К выполнению' },
  'board.column.in_progress': { en: 'In Progress', ru: 'В работе' },
  'board.column.review': { en: 'In Review',    ru: 'На проверке' },
  'board.column.done': { en: 'Done',           ru: 'Готово' },
  'board.dragHint':   { en: 'Drop task here',  ru: 'Перетащите задачу сюда' },
  'board.deleteTaskTitle': { en: 'Delete task?', ru: 'Удалить задачу?' },
  'board.deleteTaskConfirm': { en: 'This action cannot be undone.', ru: 'Это действие нельзя отменить.' },
  'board.priority.low': { en: 'Low',           ru: 'Низкий' },
  'board.priority.medium': { en: 'Medium',     ru: 'Средний' },
  'board.priority.high': { en: 'High',         ru: 'Высокий' },
  'board.priority.critical': { en: 'Critical', ru: 'Критический' },

  // Servers
  'servers.title':    { en: 'Servers',        ru: 'Серверы' },
  'servers.count':    { en: '{n} servers · {online} online', ru: '{n} серверов · {online} онлайн' },
  'servers.add':      { en: 'Add',            ru: 'Добавить' },
  'servers.nameLabel': { en: 'Server name *', ru: 'Имя сервера *' },
  'servers.hostLabel': { en: 'Host (IP or domain) *', ru: 'Хост (IP или домен) *' },
  'servers.portLabel': { en: 'Port',          ru: 'Порт' },
  'servers.creating': { en: 'Creating...',    ru: 'Создание...' },
  'servers.noServers': { en: 'No servers. Add the first one!', ru: 'Нет серверов. Добавьте первый!' },
  'servers.deleteTitle': { en: 'Delete server?', ru: 'Удалить сервер?' },
  'servers.deleteConfirm': { en: 'Server "{name}" will be removed from the list.', ru: 'Сервер «{name}» будет удалён из списка.' },
  'servers.added':    { en: 'Server "{name}" added', ru: 'Сервер «{name}» добавлен' },
  'servers.deleted':  { en: 'Server "{name}" deleted', ru: 'Сервер «{name}» удалён' },
  'servers.nameRequired': { en: 'Server name is required', ru: 'Имя сервера обязательно' },
  'servers.hostRequired': { en: 'Host is required', ru: 'Хост обязателен' },
  'servers.createError': { en: 'Failed to create server', ru: 'Ошибка создания сервера' },
  'servers.checkError': { en: 'Check error',  ru: 'Ошибка проверки' },
  'servers.status.online': { en: 'Online',    ru: 'Онлайн' },
  'servers.status.offline': { en: 'Offline',   ru: 'Оффлайн' },
  'servers.status.degraded': { en: 'Degraded', ru: 'Деградация' },
  'servers.lastCheck': { en: 'Checked: {time}', ru: 'Проверен: {time}' },
  'servers.check':    { en: 'Check status',   ru: 'Проверить статус' },

  // Projects
  'projects.title':   { en: 'Projects',       ru: 'Проекты' },
  'projects.count':   { en: '{n} projects',   ru: '{n} проектов' },
  'projects.newProject': { en: 'New project', ru: 'Новый проект' },
  'projects.nameLabel': { en: 'Project name *', ru: 'Название проекта *' },
  'projects.descriptionLabel': { en: 'Description (optional)', ru: 'Описание (опционально)' },
  'projects.creating': { en: 'Creating...',   ru: 'Создание...' },
  'projects.create':  { en: 'Create',         ru: 'Создать' },
  'projects.noProjects': { en: 'No projects. Create the first one!', ru: 'Нет проектов. Создайте первый!' },
  'projects.deleteTitle': { en: 'Delete project?', ru: 'Удалить проект?' },
  'projects.deleteConfirm': { en: 'This action cannot be undone.', ru: 'Это действие нельзя отменить.' },
  'projects.nameRequired': { en: 'Project name is required', ru: 'Название проекта обязательно' },
  'projects.nameMinLength': { en: 'Name must be at least 2 characters', ru: 'Название — минимум 2 символа' },
  'projects.createError': { en: 'Failed to create project', ru: 'Ошибка создания проекта' },
  'projects.deleteError': { en: 'Failed to delete', ru: 'Ошибка удаления' },
  'projects.createdOn': { en: 'Created {date}', ru: '{date}' },

  // Graph
  'graph.title':      { en: 'Dependency Graph', ru: 'Граф связей' },
  'graph.nodesCount': { en: '{nodes} nodes · {edges} edges', ru: '{nodes} узлов · {edges} связей' },
  'graph.comingSoon': { en: '🕸️ Graph visualization will be added in v0.2 (D3.js / Cytoscape.js). For now — text representation:', ru: '🕸️ Визуализация графа будет добавлена в v0.2 (D3.js / Cytoscape.js). Пока — текстовое представление:' },
  'graph.nodes':      { en: 'Nodes',          ru: 'Узлы' },
  'graph.edges':      { en: 'Edges',          ru: 'Связи' },

  // Analytics
  'analytics.activity': { en: 'Activity',    ru: 'Активность' },
  'analytics.last24h': { en: 'Last 24h',     ru: 'Последние 24ч' },
  'analytics.last7d': { en: 'Last 7 days',   ru: 'Последние 7 дней' },
  'analytics.last30d': { en: 'Last 30 days', ru: 'Последние 30 дней' },
  'analytics.changes': { en: 'changes',       ru: 'изменений' },
  'analytics.activeProjects': { en: '{n} active', ru: '{n} активных' },
  'analytics.totalTasks': { en: 'Total',      ru: 'Всего' },
  'analytics.completed7d': { en: 'Completed (7d)', ru: 'Выполнено (7д)' },
  'analytics.created7d': { en: 'Created (7d)', ru: 'Создано (7д)' },
  'analytics.avgCompletion': { en: 'Avg completion', ru: 'Ср. выполнение' },
  'analytics.na':     { en: 'N/A',            ru: 'Н/Д' },
  'analytics.tasksByStatus': { en: 'Tasks by Status', ru: 'Задачи по статусу' },
  'analytics.tasksByPriority': { en: 'Tasks by Priority', ru: 'Задачи по приоритету' },
  'analytics.serversByStatus': { en: 'Servers by Status', ru: 'Серверы по статусу' },
  'analytics.agentsByStatus': { en: 'Agents by Status', ru: 'Агенты по статусу' },
  'analytics.tasksByProject': { en: 'Tasks by Project', ru: 'Задачи по проекту' },
  'analytics.loading': { en: 'Loading analytics...', ru: 'Загрузка аналитики...' },
  'analytics.loadError': { en: 'Failed to load analytics', ru: 'Не удалось загрузить аналитику' },
  'analytics.noData': { en: 'No data',        ru: 'Нет данных' },

  // Audit
  'audit.entries':    { en: '{total} entries', ru: '{total} записей' },
  'audit.allTypes':   { en: 'All types',      ru: 'Все типы' },
  'audit.allSources': { en: 'All sources',    ru: 'Все источники' },
  'audit.allActions': { en: 'All actions',    ru: 'Все действия' },
  'audit.entriesCount': { en: '{total} entries', ru: '{total} записей' },
  'audit.noEntries':  { en: 'No entries found', ru: 'Записи не найдены' },
  'audit.prev':       { en: '← Prev',         ru: '← Назад' },
  'audit.next':       { en: 'Next →',         ru: 'Далее →' },
  'audit.page':       { en: 'Page {current} of {total}', ru: 'Страница {current} из {total}' },

  // Settings
  'settings.title':   { en: 'Settings',       ru: 'Настройки' },
  'settings.subtitle': { en: 'Application configuration', ru: 'Конфигурация приложения' },
  'settings.loading': { en: 'Loading settings...', ru: 'Загрузка настроек...' },
  'settings.loadError': { en: 'Failed to load settings', ru: 'Не удалось загрузить настройки' },
  'settings.saved':   { en: 'Settings saved', ru: 'Настройки сохранены' },
  'settings.saveError': { en: 'Failed to save', ru: 'Ошибка сохранения' },
  'settings.theme':   { en: 'Theme',           ru: 'Тема' },
  'settings.themeDark': { en: 'Dark',          ru: 'Тёмная' },
  'settings.themeLight': { en: 'Light',        ru: 'Светлая' },
  'settings.themeAuto': { en: 'Auto',          ru: 'Авто' },
  'settings.language': { en: 'Language',       ru: 'Язык' },
  'settings.refreshInterval': { en: 'Refresh interval: {n}s', ru: 'Интервал обновления: {n}с' },
  'settings.notifications': { en: 'Notifications', ru: 'Уведомления' },
  'settings.notificationsDesc': { en: 'Show system notifications', ru: 'Показывать системные уведомления' },
  'settings.saving':  { en: 'Saving...',       ru: 'Сохранение...' },

  // Onboarding
  'onboarding.step1.title': { en: 'Welcome to Myrmex Control', ru: 'Добро пожаловать в Myrmex Control' },
  'onboarding.step1.description': { en: 'AI agent colony control center. Manage projects, agents, servers, and tasks from one place.', ru: 'Пульт управления колонией AI-агентов. Управляйте проектами, агентами, серверами и задачами из одного места.' },
  'onboarding.step1.detail1': { en: '23 lab projects', ru: '23 проекта лаборатории' },
  'onboarding.step1.detail2': { en: '6 active agent-bots', ru: '6 активных агентов-ботов' },
  'onboarding.step1.detail3': { en: '3 servers in different locations', ru: '3 сервера в разных локациях' },
  'onboarding.step1.detail4': { en: 'Kanban boards for task management', ru: 'Канбан-доски для управления задачами' },
  'onboarding.step2.title': { en: 'Projects & Tasks', ru: 'Проекты и задачи' },
  'onboarding.step2.description': { en: 'Each lab project on one page. Tasks distributed across Kanban boards.', ru: 'Каждый проект лаборатории — на одной странице. Задачи распределяются по канбан-доскам.' },
  'onboarding.step2.detail1': { en: 'Projects: bots, API, infrastructure', ru: 'Проекты: боты, API, инфраструктура' },
  'onboarding.step2.detail2': { en: '3 Kanban boards: ZAVLAB, MURAVEY, KOT', ru: '3 канбан-доски: ЗАВЛАБ, МУРАВЕЙ, КОТ' },
  'onboarding.step2.detail3': { en: 'Drag & drop tasks between columns', ru: 'Drag & drop задач между колонками' },
  'onboarding.step2.detail4': { en: 'WIP limits and priorities', ru: 'WIP-лимиты и приоритеты' },
  'onboarding.step3.title': { en: 'Agents & Servers', ru: 'Агенты и серверы' },
  'onboarding.step3.description': { en: 'Telegram bots and services are your digital agents. Real-time status monitoring.', ru: 'Telegram-боты и сервисы — ваши цифровые агенты. Мониторинг статуса в реальном времени.' },
  'onboarding.step3.detail1': { en: '6 active agent-bots', ru: '6 активных агентов-ботов' },
  'onboarding.step3.detail2': { en: '3 servers: Warsaw, Florida, RF', ru: '3 сервера: Warsaw, Florida, RF' },
  'onboarding.step3.detail3': { en: 'Status: online / offline / degraded', ru: 'Статус: online / offline / degraded' },
  'onboarding.step3.detail4': { en: 'Management from a single interface', ru: 'Управление из единого интерфейса' },
  'onboarding.step4.title': { en: 'Analytics & Map', ru: 'Аналитика и карта' },
  'onboarding.step4.description': { en: 'Lab relationship visualization, task analytics, audit log.', ru: 'Визуализация связей лаборатории, аналитика задач, журнал аудита.' },
  'onboarding.step4.detail1': { en: 'Interactive relationship graph (JSON)', ru: 'Интерактивный граф связей (JSON)' },
  'onboarding.step4.detail2': { en: 'Analytics: throughput, cycle time', ru: 'Аналитика: throughput, cycle time' },
  'onboarding.step4.detail3': { en: 'Audit log of all actions', ru: 'Журнал аудита всех действий' },
  'onboarding.step4.detail4': { en: 'Export data to JSON/CSV', ru: 'Экспорт данных в JSON/CSV' },
  'onboarding.step5.title': { en: 'Quick Actions', ru: 'Быстрые действия' },
  'onboarding.step5.description': { en: 'Work faster with hotkeys and command palette.', ru: 'Работайте быстрее с горячими клавишами и командной палитрой.' },
  'onboarding.step5.detail1': { en: 'Cmd+K — command palette', ru: '⌘K — командная палитра' },
  'onboarding.step5.detail2': { en: 'Up/Down — navigate lists', ru: '↑↓ — навигация по спискам' },
  'onboarding.step5.detail3': { en: 'ESC — close modals', ru: 'ESC — закрыть модальные окна' },
  'onboarding.step5.detail4': { en: 'S — quick search', ru: 'S — быстрый поиск' },
  'onboarding.back':  { en: 'Back',            ru: 'Назад' },
  'onboarding.next':  { en: 'Next',            ru: 'Далее' },
  'onboarding.start': { en: 'Get started',     ru: 'Начать работу' },
  'onboarding.skip':  { en: 'Skip tour',       ru: 'Пропустить тур' },
  'onboarding.stepIndicator': { en: '{current} / {total}', ru: '{current} / {total}' },

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

  // Chat
  'chat.title':         { en: '💬 Chat',                               ru: '💬 Чат' },
  'chat.subtitle':      { en: 'Real-time WebSocket agent communication', ru: 'WebSocket-панель для коммуникации с агентами в реальном времени' },
  'chat.open':          { en: 'Open chat',                             ru: 'Открыть чат' },
  'chat.noAgents':      { en: 'No agents',                             ru: 'Нет агентов' },
  'chat.addAgents':     { en: 'Add agents to start communicating',     ru: 'Добавьте агентов для начала коммуникации' },
  'chat.lastSeen':      { en: 'Last activity',                         ru: 'Последняя активность' },

  // Files
  'files.title':        { en: 'File Exchange',    ru: 'Файлообменник' },
  'files.subtitle':     { en: 'Inbox / Outbox',   ru: 'Inbox / Outbox' },
  'files.inbox':        { en: 'Inbox',            ru: 'Входящие' },
  'files.outbox':       { en: 'Outbox',           ru: 'Исходящие' },
  'files.empty':        { en: 'Folder is empty',  ru: 'Папка пуста' },

  // Artifacts (BL-035)
  'artifacts.title':         { en: 'Artifacts',              ru: 'Артефакты' },
  'artifacts.showGraph':     { en: 'Show graph',             ru: 'Показать граф' },
  'artifacts.hideGraph':     { en: 'Hide graph',             ru: 'Скрыть граф' },
  'artifacts.search':        { en: 'Search...',              ru: 'Поиск...' },
  'artifacts.allTypes':      { en: 'All types',              ru: 'Все типы' },
  'artifacts.loading':       { en: 'Loading...',             ru: 'Загрузка...' },
  'artifacts.empty':         { en: 'No artifacts found',     ru: 'Артефакты не найдены' },
  'artifacts.type.bl':       { en: 'BL — Backlog',           ru: 'BL — Бэклог' },
  'artifacts.type.inc':      { en: 'INC — Incident',         ru: 'INC — Инцидент' },
  'artifacts.type.pat':      { en: 'PAT — Pattern',          ru: 'PAT — Паттерн' },
  'artifacts.type.rul':      { en: 'RUL — Rule',             ru: 'RUL — Правило' },
  'artifacts.type.adr':      { en: 'ADR — Architecture',     ru: 'ADR — Архитектура' },
  'artifacts.type.agent':    { en: 'AGENT — Agents',         ru: 'AGENT — Агенты' },
  'artifacts.type.skill':    { en: 'SKILL — Skills',         ru: 'SKILL — Скиллы' },
  'artifacts.type.deploy':   { en: 'DEPLOY — Deploys',       ru: 'DEPLOY — Деплои' },
  'artifacts.deleted':       { en: 'Deleted',                ru: 'Удалён' },

  // Knowledge Graph (BL-043)
  'knowledge.title':         { en: 'Knowledge Graph',        ru: 'Граф знаний' },
  'knowledge.search':        { en: 'Search graph...',        ru: 'Поиск по графу...' },
  'knowledge.allTypes':      { en: 'All types',              ru: 'Все типы' },
  'knowledge.loading':       { en: 'Loading graph...',       ru: 'Загрузка графа...' },
  'knowledge.stats':         { en: '{nodes} nodes, {edges} edges, {clusters} clusters', ru: '{nodes} узлов, {edges} связей, {clusters} кластеров' },
  'knowledge.nodes':         { en: 'nodes',                  ru: 'узлов' },
  'knowledge.edges':         { en: 'edges',                  ru: 'связей' },
  'knowledge.clusters':      { en: 'clusters',               ru: 'кластеров' },
  'knowledge.noGraph':       { en: 'No graph data available', ru: 'Нет данных графа' },
  'knowledge.centrality':    { en: 'Centrality',            ru: 'Центральность' },
  'knowledge.topNodes':      { en: 'Top nodes (centrality)', ru: 'Топ узлов (центральность)' },
  'knowledge.type':          { en: 'Type',                  ru: 'Тип' },
  'knowledge.status':        { en: 'Status',                ru: 'Статус' },
  'knowledge.links':         { en: 'Links',                 ru: 'Связи' },
  'knowledge.cluster':       { en: 'Cluster',               ru: 'Кластер' },
  'knowledge.path':          { en: 'Path to root',          ru: 'Путь до корня' },
  'knowledge.noPath':        { en: 'No path found',         ru: 'Путь не найден' },

  // Sessions (BL-046)
  'sessions.title':          { en: 'Sessions',              ru: 'Сессии' },
  'sessions.new':            { en: '+ New session',         ru: '+ Новая сессия' },
  'sessions.agentId':        { en: 'Agent ID...',           ru: 'Agent ID...' },
  'sessions.allStatuses':    { en: 'All statuses',          ru: 'Все статусы' },
  'sessions.active':         { en: 'Active',                ru: 'Активные' },
  'sessions.idle':           { en: 'Idle',                  ru: 'Idle' },
  'sessions.archived':       { en: 'Archived',              ru: 'Архив' },
  'sessions.sessionName':    { en: 'Session name',          ru: 'Название сессии' },
  'sessions.create':         { en: 'Create',                ru: 'Создать' },
  'sessions.cancel':         { en: 'Cancel',                ru: 'Отмена' },
  'sessions.loading':        { en: 'Loading...',            ru: 'Загрузка...' },
  'sessions.empty':          { en: 'No sessions',           ru: 'Нет сессий' },
  'sessions.nMessages':      { en: '{n} messages',          ru: '{n} сообщений' },
  'sessions.consolidate':    { en: 'Consolidate',           ru: 'Консолидировать' },
  'sessions.archive':        { en: 'Archive',               ru: 'Архивировать' },
  'sessions.noMessages':     { en: 'No messages',           ru: 'Нет сообщений' },
  'sessions.longTerm':       { en: 'Long-term memory',      ru: 'Долговременная память' },
  'sessions.placeholder':    { en: 'Message...',            ru: 'Сообщение...' },
  'sessions.selectPrompt':   { en: 'Select a session',      ru: 'Выберите сессию для просмотра' },
  'sessions.messagesCount':  { en: '{n} messages',          ru: '{n} сообщений' },

  // Evolution (BL-045)
  'evolution.title':         { en: 'Evolution Loop',        ru: 'Evolution Loop' },
  'evolution.subtitle':      { en: 'Observe → Analyze → Plan → Implement → Verify', ru: 'Наблюдение → Анализ → План → Реализация → Проверка' },
  'evolution.analyze':       { en: '🔍 Analyze',           ru: '🔍 Анализ' },
  'evolution.proposal':      { en: '+ Proposal',            ru: '+ Предложение' },
  'evolution.total':         { en: 'Total',                 ru: 'Всего' },
  'evolution.active':        { en: 'Active',                ru: 'Активных' },
  'evolution.rolledBack':    { en: 'Rolled back',           ru: 'Откачено' },
  'evolution.avgImpact':     { en: 'Avg impact',            ru: 'Ср. impact' },
  'evolution.autoImprove':   { en: 'Auto-improve:',         ru: 'Авто-improve:' },
  'evolution.low':           { en: 'low',                   ru: 'низкий' },
  'evolution.medium':        { en: 'medium',                ru: 'средний' },
  'evolution.high':          { en: 'high',                  ru: 'высокий' },
  'evolution.impact':        { en: 'Impact: {n}/10',        ru: 'Impact: {n}/10' },
  'evolution.source':        { en: 'Source: {src}',         ru: 'Источник: {src}' },
  'evolution.empty':         { en: 'No proposals',          ru: 'Нет предложений' },
  'evolution.proposed':      { en: 'proposed',              ru: 'предложено' },
  'evolution.implementing':  { en: 'implementing',          ru: 'реализуется' },
  'evolution.verified':      { en: 'verified',              ru: 'проверено' },
  'evolution.categoryName':  { en: 'Category: {cat}',       ru: 'Категория: {cat}' },

  // Pricing (BL-047)
  'pricing.title':           { en: 'Pricing',               ru: 'Тарифы' },
  'pricing.subtitle':        { en: 'Simple, transparent pricing', ru: 'Простое и прозрачное ценообразование' },
  'pricing.monthly':         { en: 'Monthly',               ru: 'Месяц' },
  'pricing.annual':          { en: 'Annual',                ru: 'Год' },
  'pricing.perMonth':        { en: '/month',               ru: '/мес' },
  'pricing.perYear':         { en: '/year',                ru: '/год' },
  'pricing.popular':         { en: 'Popular',               ru: 'Популярный' },
  'pricing.current':         { en: 'Current plan',          ru: 'Текущий тариф' },
  'pricing.trial':           { en: 'Try free',              ru: 'Попробовать' },
  'pricing.contact':         { en: 'Contact sales',         ru: 'Связаться' },
  'pricing.unlimited':       { en: 'Unlimited',             ru: 'Без ограничений' },
  'pricing.mrr':             { en: 'MRR',                   ru: 'MRR' },
  'pricing.arr':             { en: 'ARR',                   ru: 'ARR' },
  'pricing.churn':           { en: 'Churn',                 ru: 'Churn' },
  'pricing.nps':             { en: 'NPS',                   ru: 'NPS' },
  'pricing.activeOrgs':      { en: 'Active orgs',           ru: 'Активные организации' },
  'pricing.free':            { en: 'Free',                  ru: 'Бесплатно' },
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

export function t(key: string, vars?: Record<string, string | number>): string {
  let str = translations[key]?.[currentLang] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
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
