import { useState } from 'react';
import { setup } from '../shared/lib/api';

interface Props {
  onSetup: (token: string) => void;
}

export function Setup({ onSetup }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) { setError('Имя минимум 3 символа'); return; }
    if (password.length < 8) { setError('Пароль минимум 8 символов'); return; }
    if (password !== confirm) { setError('Пароли не совпадают'); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await setup(username, password);
      if (res.access_token) {
        onSetup(res.access_token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка установки');
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
          <p className="text-sm text-muted-foreground mt-1">Первичная настройка</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Создайте учётную запись администратора. Она будет использоваться для входа в центр управления.
          </p>

          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1.5">Имя пользователя</label>
            <input id="username" type="text" value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus required minLength={3} />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">Пароль</label>
            <input id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Минимум 8 символов"
              className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required minLength={8} />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium mb-1.5">Подтверждение</label>
            <input id="confirm" type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Повторите пароль"
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
            {loading ? 'Создание...' : 'Создать администратора'}
          </button>
        </form>
      </div>
    </div>
  );
}
