import type { MyrmexState } from '@shared/types';
import { ServerWidget } from '../features/dashboard/ServerWidget';
import { BalanceWidget } from '../features/dashboard/BalanceWidget';
import { SignalsFeed } from '../features/dashboard/SignalsFeed';
import { HealthScoreWidget } from '../features/dashboard/HealthScore';
import { Network, Download } from 'lucide-react';

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
        <div className="flex items-center gap-2">
          <a
            href="/api/state/export?format=json"
            className="px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            JSON
          </a>
          <a
            href="/api/state/export?format=csv"
            className="px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            CSV
          </a>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition"
          >
            🔄 Обновить
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Проекты" value={activeProjects.length} icon="📁" color="#6366f1" />
        <StatCard label="Задачи" value={activeTasks.length} sub={`${doneTasks.length} выполнено`} icon="✅" color="#22c55e" />
        <StatCard label="Агенты" value={state.agents.length} icon="🤖" color="#f59e0b" />
        <StatCard label="Серверы" value={`${onlineServers}/${state.servers.length}`} icon="🖥️" color="#3b82f6" />
      </div>

      {/* Kanban Boards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Канбан-борда</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { owner: 'zavlab', label: '🏭 ЗАВЛАБ', color: '#10b981' },
            { owner: 'ant', label: '🐜 МУРАВЕЙ', color: '#f59e0b' },
            { owner: 'cat', label: '🐱 КОТ', color: '#8b5cf6' },
          ].map(board => {
            const boardTasks = state.tasks.filter(t => t.owner === board.owner);
            const active = boardTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length;
            return (
              <a
                key={board.owner}
                href={`/board/${board.owner}`}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="font-semibold text-sm">{board.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {boardTasks.length} задач · {active} активных
                </div>
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: boardTasks.length ? `${((boardTasks.length - active) / boardTasks.length) * 100}%` : '0%',
                      backgroundColor: board.color,
                    }}
                  />
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Lab Map */}
      <a
        href="/graph"
        className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Network className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="font-semibold text-sm">Карта лаборатории</div>
          <div className="text-xs text-muted-foreground">Интерактивный граф связей</div>
        </div>
      </a>

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
export default Dashboard;
