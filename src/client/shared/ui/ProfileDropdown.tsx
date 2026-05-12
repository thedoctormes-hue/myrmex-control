import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Moon, Sun, Globe, Keyboard, HelpCircle, KeyRound, Eye, EyeOff, X, Check, AlertTriangle } from 'lucide-react';
import { t, toggleLang, getLang } from '../lib/i18n';
import { changePassword } from '../lib/api';

// ============================================================
// ChangePasswordModal — модальное окно смены пароля
// ============================================================

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const validate = (): string | null => {
    if (!currentPassword) return 'Введите текущий пароль';
    if (newPassword.length < 8) return 'Новый пароль должен быть минимум 8 символов';
    if (newPassword !== confirmPassword) return 'Пароли не совпадают';
    if (newPassword === currentPassword) return 'Новый пароль должен отличаться от текущего';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка смены пароля';
      if (message.includes('401') || message.includes('Неверный')) {
        setError('Неверный текущий пароль');
      } else if (message.includes('Validation')) {
        setError('Проверьте правильность данных');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-base">Смена пароля</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground-foreground" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-green-500">Пароль успешно изменён!</p>
            </div>
          ) : (
            <>
              {/* Current password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground-foreground">
                  Текущий пароль
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    placeholder="Введите текущий пароль"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground-foreground">
                  Новый пароль
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    placeholder="Минимум 8 символов"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground-foreground hover:text-foreground transition-colors"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword.length > 0 && newPassword.length < 8 && (
                  <p className="text-[11px] text-amber-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    ещё {8 - newPassword.length} символов
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground-foreground">
                  Подтверждение пароля
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-500/50'
                      : 'border-border focus:border-primary'
                  }`}
                  placeholder="Повторите новый пароль"
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[11px] text-red-500">Пароли не совпадают</p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              )}

              {/* Info */}
              <p className="text-[11px] text-muted-foreground-foreground leading-relaxed">
                ⚠️ После смены пароля текущая сессия останется активной. Все связанные устройства будут разлогинены.
              </p>
            </>
          )}
        </form>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  Сменить пароль
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [changePwOpen, setChangePwOpen] = useState(false);
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
          <div className="text-[10px] text-muted-foreground-foreground">{roleLabels[role] || role}</div>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border">
            <div className="font-medium text-sm">{username}</div>
            <div className="text-xs text-muted-foreground-foreground">{roleLabels[role] || role}</div>
          </div>

          {/* Actions */}
          <div className="p-1">
            {onOpenSettings && (
              <button
                onClick={() => { onOpenSettings(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground-foreground" />
                {t('nav.settings')}
              </button>
            )}

            {/* BL-026: Change password button */}
            <button
              onClick={() => { setOpen(false); setChangePwOpen(true); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              <KeyRound className="w-4 h-4 text-muted-foreground-foreground" />
              Сменить пароль
            </button>

            <button
              onClick={() => { onToggleTheme(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-muted-foreground-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground-foreground" />}
              {theme === 'dark' ? t('theme.light') : t('theme.dark')}
            </button>

            <button
              onClick={() => { toggleLang(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              <Globe className="w-4 h-4 text-muted-foreground-foreground" />
              {lang === 'en' ? 'Русский' : 'English'}
            </button>

            {onOpenShortcuts && (
              <button
                onClick={() => { onOpenShortcuts(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <Keyboard className="w-4 h-4 text-muted-foreground-foreground" />
                Горячие клавиши
                <kbd className="ml-auto text-[10px] text-muted-foreground-foreground bg-secondary px-1 rounded">⌘K</kbd>
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

      {/* BL-026: Change password modal */}
      <ChangePasswordModal open={changePwOpen} onClose={() => setChangePwOpen(false)} />
    </div>
  );
}
