import { NavLink } from 'react-router-dom';
import type { MyrmexState } from '@shared/types';

interface Props {
  state: MyrmexState | null;
  theme: string;
  onToggleTheme: () => void;
  onLogout?: () => void;
}

const nav = [
  { to: '/', label: 'Дашборд', icon: '📊' },
  { to: '/projects', label: 'Проекты', icon: '📁' },
  { to: '/library', label: 'Библиотека', icon: '📚' },
  { to: '/files', label: 'Файлы', icon: '📂' },
  { to: '/graph', label: 'Граф', icon: '🕸️' },
];

export function Sidebar({ state, theme, onToggleTheme, onLogout }: Props) {
  return (
    <aside className="hidden md:flex flex-col w-56 bg-card border-r border-border">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span>🐜</span>
          <span>Myrmex</span>
        </h1>
        {state && (
          <p className="text-xs text-muted-foreground-foreground mt-1">
            {state.workspace.name}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        <button
          onClick={onToggleTheme}
          className="w-full text-left text-xs text-muted-foreground-foreground hover:text-foreground px-3 py-1.5 rounded hover:bg-accent transition-colors"
        >
          {theme === 'dark' ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full text-left text-xs text-muted-foreground-foreground hover:text-destructive px-3 py-1.5 rounded hover:bg-accent transition-colors"
          >
            🚪 Выйти
          </button>
        )}
        {state && (
          <p className="text-[10px] text-muted-foreground-foreground px-3">
            v{state._meta.version} · {state._meta.change_count} изменений
          </p>
        )}
      </div>
    </aside>
  );
}
