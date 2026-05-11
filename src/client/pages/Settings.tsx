import { useState, useEffect } from 'react';
import type { Settings as SettingsType } from '@shared/types';
import { getSettings, updateSettings } from '../shared/lib/api';
import { ErrorBanner } from '../shared/ui/ErrorBanner';
import { Settings as SettingsIcon, Save, Sun, Moon, Monitor } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setError('Не удалось загрузить настройки'));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setError(null);
      setSaved(false);
      const updated = await updateSettings({ ...settings, source: 'ui' });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="animate-pulse">Загрузка настроек...</div>
      </div>
    );
  }

  const themeOptions = [
    { value: 'dark', label: 'Тёмная', icon: Moon },
    { value: 'light', label: 'Светлая', icon: Sun },
    { value: 'auto', label: 'Авто', icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" />
          Настройки
        </h1>
        <p className="text-sm text-muted-foreground">Конфигурация приложения</p>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {saved && (
        <div className="bg-success/10 border border-success text-success px-4 py-2 rounded-md text-sm">
          ✓ Настройки сохранены
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        {/* Theme */}
        <div>
          <label className="text-sm font-medium mb-3 block">Тема</label>
          <div className="flex gap-2">
            {themeOptions.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSettings({ ...settings, theme: opt.value as SettingsType['theme'] })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                    settings.theme === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="text-sm font-medium mb-3 block">Язык</label>
          <div className="flex gap-2">
            {[
              { value: 'ru', label: '🇷🇺 Русский' },
              { value: 'en', label: '🇬🇧 English' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSettings({ ...settings, language: opt.value })}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  settings.language === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Refresh interval */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Интервал обновления: {settings.refresh_interval_sec}с
          </label>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={settings.refresh_interval_sec}
            onChange={e => setSettings({ ...settings, refresh_interval_sec: parseInt(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>5с</span>
            <span>120с</span>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Уведомления</label>
            <p className="text-xs text-muted-foreground">Показывать системные уведомления</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, notifications_enabled: !settings.notifications_enabled })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.notifications_enabled ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                settings.notifications_enabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Сохранение...' : 'Сохранить'}
      </button>
    </div>
  );
}
export default Settings;
