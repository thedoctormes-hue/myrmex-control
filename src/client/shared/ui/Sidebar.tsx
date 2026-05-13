import { NavLink } from 'react-router-dom';
import type { MyrmexState } from '@shared/types';
import { isTWA } from '../lib/twa';
import { t, useLang } from '../lib/i18n';
import {
  LayoutDashboard,
  FolderKanban,
  Library,
  FolderOpen,
  Network,
  BarChart3,
  ClipboardList,
  Sun,
  Moon,
  LogOut,
  Globe,
  Bug,
  Bot,
  Server,
  Settings,
  MessageCircle,
  FileText,
  Brain,
  RefreshCw,
  DollarSign,
  Zap,
} from 'lucide-react';

interface Props {
  state: MyrmexState | null;
  theme: string;
  onToggleTheme: () => void;
  onLogout?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function Sidebar({ state, theme, onToggleTheme, onLogout }: Props) {
  const [lang, , toggleLang] = useLang();

  const groups: NavGroup[] = [
    {
      label: t('nav.group.main'),
      items: [
        { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
      ],
    },
    {
      label: t('nav.group.manage'),
      items: [
        { to: '/projects', label: t('nav.projects'), icon: FolderKanban },
        { to: '/agents', label: t('nav.agents'), icon: Bot },
        { to: '/chat', label: t('chat.title'), icon: MessageCircle },
        { to: '/library', label: t('nav.library'), icon: Library },
        { to: '/files', label: t('nav.files'), icon: FolderOpen },
      ],
    },
    {
      label: t('nav.group.kanban'),
      items: [
        { to: '/board/zavlab', label: '🏭 ЗАВЛАБ', icon: LayoutDashboard },
        { to: '/board/ant', label: '🐜 МУРАВЕЙ', icon: LayoutDashboard },
        { to: '/board/cat', label: '🐱 КОТ', icon: LayoutDashboard },
      ],
    },
    {
      label: t('nav.group.system'),
      items: [
        { to: '/servers', label: t('nav.servers'), icon: Server },
        { to: '/graph', label: t('nav.graph'), icon: Network },
        { to: '/analytics', label: t('nav.analytics'), icon: BarChart3 },
        { to: '/audit', label: t('nav.audit'), icon: ClipboardList },
        { to: '/settings', label: t('nav.settings'), icon: Settings },
      ],
    },
    {
      label: t('nav.group.product'),
      items: [
        { to: '/artifacts', label: t('nav.artifacts'), icon: FileText },
        { to: '/knowledge', label: t('nav.knowledge'), icon: Brain },
        { to: '/sessions', label: t('nav.sessions'), icon: MessageCircle },
        { to: '/evolution', label: t('nav.evolution'), icon: RefreshCw },
        { to: '/pricing', label: t('nav.pricing'), icon: DollarSign },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 bg-card border-r border-border">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold font-mono flex items-center gap-2">
          <Bug className="w-5 h-5 text-primary" />
          <span>Myrmex</span>
        </h1>
        {state && (
          <p className="text-xs text-muted-foreground mt-1">
            {state.workspace.name}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
        {groups.map(group => (
          <div key={group.label}>
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {group.label}
            </div>
            <div className="space-y-0.5 mt-1 stagger-children">
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    aria-label={item.label}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-foreground/70 hover:text-foreground hover:bg-accent'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        <button
          onClick={toggleLang}
          className="w-full text-left text-xs text-foreground/70 hover:text-foreground px-3 py-1.5 rounded hover:bg-accent transition-colors flex items-center gap-2"
        >
          <Globe className="w-3.5 h-3.5" />
          {lang === 'en' ? 'Русский' : 'English'}
        </button>
        <button
          onClick={onToggleTheme}
          className="w-full text-left text-xs text-foreground/70 hover:text-foreground px-3 py-1.5 rounded hover:bg-accent transition-colors flex items-center gap-2"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {theme === 'dark' ? t('theme.light') : t('theme.dark')}
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full text-left text-xs text-foreground/70 hover:text-destructive px-3 py-1.5 rounded hover:bg-accent transition-colors flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('auth.logout')}
          </button>
        )}
        {state && (
          <p className="text-[10px] text-muted-foreground px-3">
            v{state._meta.version} · {state._meta.change_count} {lang === 'ru' ? 'изменений' : 'changes'}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground px-3">
          🔐 Session + TOTP + RBAC
        </p>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="w-full text-left text-[10px] text-muted-foreground hover:text-foreground px-3 flex items-center gap-1.5"
        >
          <kbd className="bg-secondary px-1 rounded text-[9px]">⌘K</kbd>
          {lang === 'ru' ? 'Команды' : 'Commands'}
        </button>
        {isTWA() && (
          <p className="text-[10px] text-green-400 px-3">
            ✈️ Telegram Web App
          </p>
        )}
      </div>
    </aside>
  );
}
