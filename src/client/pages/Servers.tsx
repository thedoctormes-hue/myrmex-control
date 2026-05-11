import { useState } from 'react';
import type { MyrmexState, Server, ServerStatus } from '@shared/types';
import { createServer, deleteServer, updateServer } from '../shared/lib/api';
import { ErrorBanner } from '../shared/ui/ErrorBanner';
import { notify } from '../shared/ui/Notifications';
import { confirmDialog } from '../shared/ui/ConfirmDialog';
import { Server as ServerIcon, Plus, X, Trash2, RefreshCw } from 'lucide-react';

interface Props {
  state: MyrmexState | null;
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<ServerStatus, { label: string; color: string }> = {
  online: { label: 'Онлайн', color: '#22c55e' },
  offline: { label: 'Оффлайн', color: '#6b7280' },
  degraded: { label: 'Деградация', color: '#f59e0b' },
};

export function Servers({ state, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const servers = state?.servers || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Имя сервера обязательно'); return; }
    if (!host.trim()) { setError('Хост обязателен'); return; }
    try {
      setSaving(true);
      setError(null);
      await createServer({
        name: name.trim(),
        host: host.trim(),
        port: parseInt(port) || 22,
        source: 'ui',
      });
      notify('success', `Сервер «${name.trim()}» добавлен`);
      setName(''); setHost(''); setPort('22');
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания сервера');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirmDialog({
      title: 'Удалить сервер?',
      message: `Сервер «${name}» будет удалён из списка.`,
      confirmLabel: 'Удалить',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteServer(id);
      notify('info', `Сервер «${name}» удалён`);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  const handleCheck = async (id: string) => {
    try {
      await updateServer(id, { source: 'ui' });
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка проверки');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ServerIcon className="w-6 h-6 text-primary" />
            Серверы
          </h1>
          <p className="text-sm text-muted-foreground">
            {servers.length} серверов · {servers.filter(s => s.status === 'online').length} онлайн
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition flex items-center gap-1.5"
        >
          {showForm ? <><X className="w-4 h-4" /> Отмена</> : <><Plus className="w-4 h-4" /> Добавить</>}
        </button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Имя сервера *"
              className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              required
            />
            <input
              value={host}
              onChange={e => setHost(e.target.value)}
              placeholder="Хост (IP или домен) *"
              className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <input
              value={port}
              onChange={e => setPort(e.target.value)}
              placeholder="Порт"
              type="number"
              min="1"
              max="65535"
              className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim() || !host.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Создание...' : 'Добавить'}
          </button>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map(server => (
          <ServerCard key={server.id} server={server} onDelete={handleDelete} onCheck={handleCheck} />
        ))}
      </div>

      {servers.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <ServerIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Нет серверов. Добавьте первый!</p>
        </div>
      )}
    </div>
  );
}

function ServerCard({
  server,
  onDelete,
  onCheck,
}: {
  server: Server;
  onDelete: (id: string) => void;
  onCheck: (id: string) => void;
}) {
  const config = STATUS_CONFIG[server.status] || STATUS_CONFIG.offline;

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ServerIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{server.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{server.host}:{server.port}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCheck(server.id)}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
            aria-label="Проверить"
            title="Проверить статус"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(server.id, server.name)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            aria-label="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span
          className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
          style={{ backgroundColor: config.color + '20', color: config.color }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
          {config.label}
        </span>
        {server.services.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {server.services.join(', ')}
          </span>
        )}
      </div>

      <div className="mt-2 text-[10px] text-muted-foreground">
        Проверен: {new Date(server.last_check).toLocaleString('ru')}
      </div>
    </div>
  );
}
export default Servers;
