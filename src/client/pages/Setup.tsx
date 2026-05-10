import { useState } from 'react';
import { setup } from '../shared/lib/api';
import { t, useLang } from '../shared/lib/i18n';

interface Props {
  onSetup: (token: string) => void;
}

export function Setup({ onSetup }: Props) {
  const [lang] = useLang();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const err = (ru: string, en: string) => lang === 'ru' ? ru : en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) { setError(err('Имя минимум 3 символа', 'Username min 3 chars')); return; }
    if (password.length < 8) { setError(err('Пароль минимум 8 символов', 'Password min 8 chars')); return; }
    if (password !== confirm) { setError(err('Пароли не совпадают', 'Passwords do not match')); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await setup(username, password);
      if (res.access_token) {
        onSetup(res.access_token);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : err('Ошибка установки', 'Setup error'));
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
          <p className="text-sm text-muted-foreground mt-1">{t('auth.firstSetup')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            {lang === 'ru'
              ? 'Создайте учётную запись администратора. Она будет использоваться для входа в центр управления.'
              : 'Create your admin account. It will be used to sign in to the control center.'}
          </p>

          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1.5">{t('auth.username')}</label>
            <input id="username" type="text" value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus required minLength={3} />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">{t('auth.password')}</label>
            <input id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={lang === 'ru' ? 'Минимум 8 символов' : 'Minimum 8 characters'}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required minLength={8} />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium mb-1.5">
              {lang === 'ru' ? 'Подтверждение' : 'Confirm password'}
            </label>
            <input id="confirm" type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={lang === 'ru' ? 'Повторите пароль' : 'Repeat password'}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required minLength={8} />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md p-3">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading || !username || !password || !confirm}
            className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition">
            {loading
              ? (lang === 'ru' ? 'Создание...' : 'Creating...')
              : (lang === 'ru' ? 'Создать администратора' : 'Create admin')}
          </button>
        </form>
      </div>
    </div>
  );
}
