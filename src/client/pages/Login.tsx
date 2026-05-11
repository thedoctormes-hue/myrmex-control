import { useState, useEffect, useRef } from 'react';
import { login, twaLogin } from '../shared/lib/api';
import { t, useLang } from '../shared/lib/i18n';
import { isTWA, getTWA } from '../shared/lib/twa';

interface Props {
  onLogin: (token: string) => void;
}

export function Login({ onLogin }: Props) {
  const [lang] = useLang();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpRequired, setTotpRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [twaLoading, setTwaLoading] = useState(false);
  const twaAttempted = useRef(false);

  // Auto-login via Telegram Web App
  useEffect(() => {
    if (!isTWA() || twaAttempted.current) return;
    twaAttempted.current = true;

    const twa = getTWA();
    if (!twa?.initData) return;

    setTwaLoading(true);
    twaLogin(twa.initData)
      .then((res) => {
        if (res.access_token) {
          onLogin(res.access_token);
        }
      })
      .catch((err) => {
        // TWA auth failed — show login form
        console.warn('[TWA] Auth failed:', err.message);
        setError(lang === 'ru' ? '⚠️ Ошибка Telegram auth. Войдите вручную.' : '⚠️ Telegram auth failed. Please log in manually.');
      })
      .finally(() => setTwaLoading(false));
  }, [onLogin, lang]);

  const err = (ru: string, en: string) => lang === 'ru' ? ru : en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError(err('Введите имя пользователя', 'Enter username')); return; }
    if (!password.trim()) { setError(err('Введите пароль', 'Enter password')); return; }
    if (totpRequired && !totpCode.trim()) { setError(err('Введите код 2FA', 'Enter 2FA code')); return; }

    try {
      setLoading(true);
      setError(null);
      const res = await login(username, password, totpRequired ? totpCode : undefined);
      if (res.access_token) {
        onLogin(res.access_token);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : err('Ошибка входа', 'Login error');
      if (msg.includes('TOTP code required')) {
        setTotpRequired(true);
        setError(err('Введите код из приложения аутентификации', 'Enter code from authenticator app'));
      } else {
        setError(msg);
        setPassword('');
        setTotpCode('');
      }
    } finally {
      setLoading(false);
    }
  };

  // TWA auto-login in progress
  if (twaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🐜</div>
          <p className="text-muted-foreground">
            {lang === 'ru' ? 'Авторизация через Telegram...' : 'Authenticating via Telegram...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐜</div>
          <h1 className="text-2xl font-bold">Myrmex Control</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.loginTitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1.5">{t('auth.username')}</label>
            <input id="username" type="text" value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t('auth.username')}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus required />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">{t('auth.password')}</label>
            <input id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('auth.password')}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required />
          </div>

          {totpRequired && (
            <div>
              <label htmlFor="totp" className="block text-sm font-medium mb-1.5">{t('auth.totp')}</label>
              <input id="totp" type="text" value={totpCode}
                onChange={e => setTotpCode(e.target.value)}
                placeholder={lang === 'ru' ? '6 цифр из приложения' : '6 digits from app'}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring text-center text-lg tracking-widest"
                maxLength={6} pattern="[0-9]{6}" inputMode="numeric" />
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md p-3">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading || !username.trim() || !password.trim()}
            className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition">
            {loading
              ? (lang === 'ru' ? 'Вход...' : 'Signing in...')
              : totpRequired
                ? (lang === 'ru' ? 'Подтвердить' : 'Verify')
                : t('auth.login')}
          </button>
        </form>
      </div>
    </div>
  );
}
export default Login;
