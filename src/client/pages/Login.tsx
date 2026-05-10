import { useState } from 'react';
import { login } from '../shared/lib/api';

interface Props {
  onLogin: (token: string) => void;
}

export function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpRequired, setTotpRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('Введите имя пользователя'); return; }
    if (!password.trim()) { setError('Введите пароль'); return; }
    if (totpRequired && !totpCode.trim()) { setError('Введите код 2FA'); return; }

    try {
      setLoading(true);
      setError(null);
      const res = await login(username, password, totpRequired ? totpCode : undefined);
      if (res.access_token) {
        onLogin(res.access_token);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка входа';
      if (msg.includes('TOTP code required')) {
        setTotpRequired(true);
        setError('Введите код из приложения аутентификации');
      } else {
        setError(msg);
        setPassword('');
        setTotpCode('');
      }
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
          <p className="text-sm text-muted-foreground mt-1">Муравейник агентов</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1.5">Пользователь</label>
            <input id="username" type="text" value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Имя пользователя"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus required />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">Пароль</label>
            <input id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Введите пароль"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required />
          </div>

          {totpRequired && (
            <div>
              <label htmlFor="totp" className="block text-sm font-medium mb-1.5">Код 2FA</label>
              <input id="totp" type="text" value={totpCode}
                onChange={e => setTotpCode(e.target.value)}
                placeholder="6 цифр из приложения"
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
            {loading ? 'Вход...' : totpRequired ? 'Подтвердить' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
