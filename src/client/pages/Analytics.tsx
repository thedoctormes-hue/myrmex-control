// ============================================================
// Analytics — страница метрик и статистики
// ============================================================

import { useState, useEffect } from 'react';
import { getAnalytics } from '../shared/lib/api';
import { BarChart3, TrendingUp, Clock, Zap } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub }: {
  icon: typeof BarChart3; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-accent" />
        <span className="text-xs text-muted-foreground-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground-foreground mt-1">{sub}</div>}
    </div>
  );
}

function BarChart({ data, label }: { data: Record<string, number>; label: string }) {
  const max = Math.max(...Object.values(data), 1);
  const colors: Record<string, string> = {
    online: '#22c55e', offline: '#ef4444', degraded: '#f59e0b',
    active: '#22c55e', paused: '#f59e0b', archived: '#6b7280',
    backlog: '#6b7280', todo: '#3b82f6', in_progress: '#f59e0b',
    review: '#a855f7', done: '#22c55e', cancelled: '#ef4444',
    low: '#6b7280', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444',
    idle: '#3b82f6', working: '#22c55e', error: '#ef4444',
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <h3 className="text-sm font-semibold mb-3">{label}</h3>
      <div className="space-y-2">
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs w-20 text-muted-foreground-foreground truncate">{key}</span>
            <div className="flex-1 bg-secondary rounded-full h-4 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(val / max) * 100}%`, backgroundColor: colors[key] || '#6b7280' }} />
            </div>
            <span className="text-xs font-mono w-8 text-right">{val}</span>
          </div>
        ))}
        {Object.keys(data).length === 0 && (
          <div className="text-muted-foreground-foreground text-sm text-center py-4">No data</div>
        )}
      </div>
    </div>
  );
}

export function Analytics() {
  const [data, setData] = useState<ReturnType<typeof getAnalytics> extends Promise<infer T> ? T : null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground-foreground animate-pulse">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="text-center text-muted-foreground-foreground py-8">Failed to load analytics</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 size={20} className="text-accent" />
        <h1 className="text-xl font-bold">Analytics</h1>
      </div>

      {/* Activity */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground-foreground mb-3 uppercase tracking-wide">Activity</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Zap} label="Last 24h" value={data.activity.last24h} sub="changes" />
          <StatCard icon={TrendingUp} label="Last 7 days" value={data.activity.last7d} sub="changes" />
          <StatCard icon={Clock} label="Last 30 days" value={data.activity.last30d} sub="changes" />
          <StatCard icon={BarChart3} label="Projects" value={data.projects.total}
            sub={`${data.projects.active} active`} />
        </div>
      </div>

      {/* Task metrics */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground-foreground mb-3 uppercase tracking-wide">Tasks</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={BarChart3} label="Total" value={data.tasks.byStatus ? Object.values(data.tasks.byStatus).reduce((a, b) => a + b, 0) : 0} />
          <StatCard icon={TrendingUp} label="Completed (7d)" value={data.tasks.completedLast7Days} />
          <StatCard icon={Clock} label="Created (7d)" value={data.tasks.createdLast7Days} />
          <StatCard icon={Zap} label="Avg completion" value={data.tasks.avgCompletionHours !== null ? `${data.tasks.avgCompletionHours}h` : 'N/A'} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BarChart data={data.tasks.byStatus} label="Tasks by Status" />
        <BarChart data={data.tasks.byPriority} label="Tasks by Priority" />
        <BarChart data={data.servers.byStatus} label="Servers by Status" />
        <BarChart data={data.agents.byStatus} label="Agents by Status" />
      </div>

      {/* Project breakdown */}
      {data.tasks.byProject.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold mb-3">Tasks by Project</h3>
          <div className="space-y-2">
            {data.tasks.byProject.map(p => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="text-xs w-32 truncate">{p.name}</span>
                <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${(p.count / Math.max(...data.tasks.byProject.map(x => x.count))) * 100}%` }} />
                </div>
                <span className="text-xs font-mono w-6 text-right">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default Analytics;
