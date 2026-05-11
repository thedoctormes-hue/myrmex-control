import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Moon, Sun, Globe, Keyboard, HelpCircle } from 'lucide-react';
import { t, toggleLang, getLang } from '../lib/i18n';

// ============================================================
// ProfileDropdown — меню пользователя в шапке
// ============================================================

interface Props {
  username?: string;
  role?: string;
  theme: string;
  onToggleTheme: () => void;
  onLogout?: () => void;
  onOpenSettings?: () => void;
  onOpenShortcuts?: () => void;
}

export function ProfileDropdown({ username = 'DoctorM', role = 'admin', theme, onToggleTheme, onLogout, onOpenSettings, onOpenShortcuts }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lang = getLang();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleLabels: Record<string, string> = {
    admin: 'Администратор',
    operator: 'Оператор',
    viewer: 'Наблюдатель',
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium leading-tight">{username}</div>
          <div className="text-[10px] text-muted-foreground">{roleLabels[role] || role}</div>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border">
            <div className="font-medium text-sm">{username}</div>
            <div className="text-xs text-muted-foreground">{roleLabels[role] || role}</div>
          </div>

          {/* Actions */}
          <div className="p-1">
            {onOpenSettings && (
              <button
                onClick={() => { onOpenSettings(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                {t('nav.settings')}
              </button>
            )}

            <button
              onClick={() => { onToggleTheme(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
              {theme === 'dark' ? t('theme.light') : t('theme.dark')}
            </button>

            <button
              onClick={() => { toggleLang(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              {lang === 'en' ? 'Русский' : 'English'}
            </button>

            {onOpenShortcuts && (
              <button
                onClick={() => { onOpenShortcuts(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <Keyboard className="w-4 h-4 text-muted-foreground" />
                Горячие клавиши
                <kbd className="ml-auto text-[10px] text-muted-foreground bg-secondary px-1 rounded">⌘K</kbd>
              </button>
            )}
          </div>

          {/* Logout */}
          {onLogout && (
            <div className="p-1 border-t border-border">
              <button
                onClick={() => { onLogout(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
