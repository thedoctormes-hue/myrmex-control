// ============================================================
// HealthScore — виджет оценки здоровья системы
// ============================================================

import { useState, useEffect } from 'react';
import { getHealthScore, type HealthScore as HealthScoreType } from '../../shared/lib/api';
import { Activity, Server, CheckCircle2, Users } from 'lucide-react';

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="var(--bg-secondary)" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-700" />
    </svg>
  );
}

export function HealthScoreWidget() {
  const [health, setHealth] = useState<HealthScoreType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHealthScore()
      .then(setHealth)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="animate-pulse text-muted">Loading health...</div>
      </div>
    );
  }

  if (!health) return null;

  const scoreColor = health.overall >= 80 ? 'text-green-400' : health.overall >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={18} className="text-accent" />
        <h3 className="font-semibold text-sm">Health Score</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center">
          <ScoreRing score={health.overall} />
          <span className={`absolute text-lg font-bold ${scoreColor}`}>{health.overall}</span>
        </div>
        <div className="flex-1 space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <Server size={14} className="text-muted" />
            <span>Servers</span>
            <span className="ml-auto font-mono">{health.servers.online}/{health.servers.total}</span>
            <span className="text-muted">({health.servers.score}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-muted" />
            <span>Tasks</span>
            <span className="ml-auto font-mono">{health.tasks.done}/{health.tasks.total}</span>
            <span className="text-muted">({health.tasks.score}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-muted" />
            <span>Agents</span>
            <span className="ml-auto font-mono">{health.agents.active}/{health.agents.total}</span>
            <span className="text-muted">({health.agents.score}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
