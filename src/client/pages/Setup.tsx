import { useState } from 'react';
import { t, useLang } from '../shared/lib/i18n';
import { setup } from '../shared/lib/api';

interface Props {
  onSetup: () => void;
}

export function Setup({ onSetup }: Props) {
  const [lang] = useLang();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) { setError(t('setup.minChars')); return; }
    if (password !== confirm) { setError(t('setup.passwordsMismatch')); return; }
    try {
      setLoading(true);
      setError(null);
      await setup(password);
      onSetup();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('setup.error'));
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
          <p className="text-sm text-muted-foreground-foreground mt-1">{t('setup.title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <p className="text-sm text-muted-foreground-foreground">
            {t('setup.subtitle')}
          </p>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              {t('setup.passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('setup.passwordPlaceholder')}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              required
              minLength={4}
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium mb-1.5">
              {t('setup.confirmLabel')}
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={t('setup.confirmPlaceholder')}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
              minLength={4}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md p-3">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
          >
            {loading ? t('setup.installing') : t('setup.installPassword')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Setup;
