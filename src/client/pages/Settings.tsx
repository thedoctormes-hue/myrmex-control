import { useState, useEffect } from 'react';
import { t, useLang } from '../shared/lib/i18n';
import type { Settings as SettingsType } from '@shared/types';
import { getSettings, updateSettings } from '../shared/lib/api';
import { ErrorBanner } from '../shared/ui/ErrorBanner';
import { notify } from '../shared/ui/Notifications';
import { Settings as SettingsIcon, Save, Sun, Moon, Monitor } from 'lucide-react';

export function Settings() {
  const [lang] = useLang();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setError(t('settings.loadError')));
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
      notify('success', t('settings.saved'));
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground-foreground">
        <div className="animate-pulse">{t('settings.loading')}</div>
      </div>
    );
  }

  const themeOptions = [
    { value: 'dark', label: t('settings.themeDark'), icon: Moon },
    { value: 'light', label: t('settings.themeLight'), icon: Sun },
    { value: 'auto', label: t('settings.themeAuto'), icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" />
          {t('settings.title')}
        </h1>
        <p className="text-sm text-muted-foreground-foreground">{t('settings.subtitle')}</p>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {saved && (
        <div className="bg-success/10 border border-success text-success px-4 py-2 rounded-md text-sm">
          ✓ {t('settings.saved')}
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        {/* Theme */}
        <div>
          <label className="text-sm font-medium mb-3 block">{t('settings.theme')}</label>
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
          <label className="text-sm font-medium mb-3 block">{t('settings.language')}</label>
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
            {t('settings.refreshInterval', { n: settings.refresh_interval_sec })}
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
          <div className="flex justify-between text-xs text-muted-foreground-foreground mt-1">
            <span>5с</span>
            <span>120с</span>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">{t('settings.notifications')}</label>
            <p className="text-xs text-muted-foreground-foreground">{t('settings.notificationsDesc')}</p>
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
        {saving ? t('settings.saving') : t('common.save')}
      </button>
    </div>
  );
}
export default Settings;
