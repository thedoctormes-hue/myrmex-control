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
} from 'lucide-react';

interface Props {
  state: MyrmexState | null;
  theme: string;
  onToggleTheme: () => void;
  onLogout?: () => void;
}

export function Sidebar({ state, theme, onToggleTheme, onLogout }: Props) {
  const [lang, , toggleLang] = useLang();

  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/projects', label: t('nav.projects'), icon: FolderKanban },
    { to: '/library', label: t('nav.library'), icon: Library },
    { to: '/files', label: t('nav.files'), icon: FolderOpen },
    { to: '/graph', label: t('nav.graph'), icon: Network },
    { to: '/analytics', label: t('nav.analytics'), icon: BarChart3 },
    { to: '/audit', label: t('nav.audit'), icon: ClipboardList },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 header-gradient text-primary-foreground border-r border-border">
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
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        <button
          onClick={toggleLang}
          className="w-full text-left text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded hover:bg-accent transition-colors flex items-center gap-2"
        >
          <Globe className="w-3.5 h-3.5" />
          {lang === 'en' ? 'Русский' : 'English'}
        </button>
        <button
          onClick={onToggleTheme}
          className="w-full text-left text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded hover:bg-accent transition-colors flex items-center gap-2"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {theme === 'dark' ? t('theme.light') : t('theme.dark')}
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full text-left text-xs text-muted-foreground hover:text-destructive px-3 py-1.5 rounded hover:bg-accent transition-colors flex items-center gap-2"
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
          🔐 JWT + TOTP + RBAC
        </p>
        {isTWA() && (
          <p className="text-[10px] text-green-400 px-3">
            ✈️ Telegram Web App
          </p>
        )}
      </div>
    </aside>
  );
}
