import { useState } from 'react';
import type { MyrmexState, Agent, AgentStatus } from '@shared/types';
import { createAgent, deleteAgent, updateAgent } from '../shared/lib/api';
import { ErrorBanner } from '../shared/ui/ErrorBanner';
import { notify } from '../shared/ui/Notifications';
import { confirmDialog } from '../shared/ui/ConfirmDialog';
import { Bot, Cpu, Play, Pause, Trash2, Plus, X } from 'lucide-react';

interface Props {
  state: MyrmexState | null;
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; icon: typeof Bot }> = {
  idle: { label: 'Ожидание', color: '#6b7280', icon: Pause },
  working: { label: 'Работает', color: '#22c55e', icon: Play },
  error: { label: 'Ошибка', color: '#ef4444', icon: Cpu },
  offline: { label: 'Оффлайн', color: '#374151', icon: Cpu },
};

export function Agents({ state, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [model, setModel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const agents = state?.agents || [];
  const projects = state?.projects || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Имя агента обязательно'); return; }
    try {
      setSaving(true);
      setError(null);
      await createAgent({ name: name.trim(), role: role.trim() || 'worker', model: model.trim() || 'unknown', source: 'ui' });
      notify('success', `Агент «${name.trim()}» создан`);
      setName(''); setRole(''); setModel('');
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания агента');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirmDialog({
      title: 'Удалить агента?',
      message: `Агент «${name}» будет удалён. Это действие нельзя отменить.`,
      confirmLabel: 'Удалить',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteAgent(id);
      notify('info', `Агент «${name}» удалён`);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  const handleStatusChange = async (agent: Agent, status: AgentStatus) => {
    try {
      await updateAgent(agent.id, { status, source: 'ui' });
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            Агенты
          </h1>
          <p className="text-sm text-muted-foreground-foreground">{agents.length} агентов</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition flex items-center gap-1.5"
        >
          {showForm ? <><X className="w-4 h-4" /> Отмена</> : <><Plus className="w-4 h-4" /> Новый агент</>}
        </button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Имя агента *"
              className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              required
              minLength={2}
            />
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Роль (worker, reviewer, ...)"
              className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="Модель (gpt-4, claude, ...)"
              className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Создание...' : 'Создать'}
          </button>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} projects={projects} onDelete={handleDelete} onStatusChange={handleStatusChange} />
        ))}
      </div>

      {agents.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground-foreground">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Нет агентов. Создайте первого!</p>
        </div>
      )}
    </div>
  );
}

function AgentCard({
  agent,
  projects,
  onDelete,
  onStatusChange,
}: {
  agent: Agent;
  projects: { id: string; name: string; icon: string }[];
  onDelete: (id: string) => void;
  onStatusChange: (agent: Agent, status: AgentStatus) => void;
}) {
  const config = STATUS_CONFIG[agent.status] || STATUS_CONFIG.offline;
  const StatusIcon = config.icon;
  const project = projects.find(p => p.id === agent.project_id);

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{agent.name}</h3>
            <p className="text-xs text-muted-foreground-foreground">{agent.role} · {agent.model}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(agent.id, agent.name)}
          className="text-muted-foreground-foreground hover:text-destructive transition-colors p-1"
          aria-label="Удалить"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => onStatusChange(agent, agent.status === 'idle' ? 'working' : 'idle')}
          className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors"
          style={{ backgroundColor: config.color + '20', color: config.color }}
        >
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </button>
        {project && (
          <span className="text-xs text-muted-foreground-foreground bg-secondary px-1.5 py-0.5 rounded">
            {project.icon} {project.name}
          </span>
        )}
      </div>

      <div className="mt-2 text-[10px] text-muted-foreground-foreground">
        Виден: {new Date(agent.last_seen).toLocaleString('ru')}
      </div>
    </div>
  );
}
export default Agents;
