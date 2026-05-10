import type { MyrmexState } from '@shared/types';
import { ServerWidget } from '../features/dashboard/ServerWidget';
import { BalanceWidget } from '../features/dashboard/BalanceWidget';
import { SignalsFeed } from '../features/dashboard/SignalsFeed';
import { HealthScoreWidget } from '../features/dashboard/HealthScore';

interface Props {
  state: MyrmexState | null;
  onRefresh: () => void;
}

export function Dashboard({ state, onRefresh }: Props) {
  if (!state) return null;

  const activeTasks = state.tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  const doneTasks = state.tasks.filter(t => t.status === 'done');
  const activeProjects = state.projects.filter(p => p.status === 'active');
  const onlineServers = state.servers.filter(s => s.status === 'online').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Дашборд</h1>
          <p className="text-sm text-muted-foreground">
            Обзор муравейника · Обновлено {new Date(state._meta.last_updated).toLocaleString('ru')}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition"
        >
          🔄 Обновить
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Проекты" value={activeProjects.length} icon="📁" color="#6366f1" />
        <StatCard label="Задачи" value={activeTasks.length} sub={`${doneTasks.length} выполнено`} icon="✅" color="#22c55e" />
        <StatCard label="Агенты" value={state.agents.length} icon="🤖" color="#f59e0b" />
        <StatCard label="Серверы" value={`${onlineServers}/${state.servers.length}`} icon="🖥️" color="#3b82f6" />
      </div>

      {/* Widgets */}
      <div className="grid md:grid-cols-2 gap-4">
        <HealthScoreWidget />
        <ServerWidget servers={state.servers} />
        <BalanceWidget />
        <SignalsFeed changelog={state.changelog} />
      </div>

      {/* Quick actions */}
      {activeProjects.length === 0 && activeTasks.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">🐜</div>
          <h2 className="text-lg font-semibold mb-1">Муравейник пуст</h2>
          <p className="text-sm text-muted-foreground mb-4">Создайте первый проект и добавьте задачи</p>
          <a
            href="/projects"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition"
          >
            + Создать проект
          </a>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon: _icon, color }: {
  label: string; value: string | number; sub?: string; icon: string; color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
