import { useState } from 'react';
import { t, useLang } from '../shared/lib/i18n';
import { login } from '../shared/lib/api';
import { isTWA, expandTWA } from '../shared/lib/twa';

interface Props {
  onLogin: () => void;
}

export function Login({ onLogin }: Props) {
  const [lang] = useLang();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setError(t('auth.enterPassword')); return; }
    try {
      setLoading(true);
      setError(null);
      if (isTWA()) {
        const initData = window.Telegram?.WebApp?.initData;
        if (initData) {
          const res = await fetch('/api/auth/twa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ init_data: initData }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || t('auth.twaAuthFailed'));
          }
        } else {
          throw new Error(t('auth.twaUnavailable'));
        }
      } else {
        await login('DoctorM', password);
      }
      expandTWA();
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.wrongPassword'));
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐜</div>
          <h1 className="text-2xl font-bold">Myrmex Control</h1>
          <p className="text-sm text-muted-foreground-foreground mt-1">{t('auth.antColony')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md p-3">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
          >
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground-foreground mt-4">
          {t('auth.passwordSetOnServer')}
        </p>
      </div>
    </div>
  );
}

export default Login;
