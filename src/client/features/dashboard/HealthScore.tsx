// ============================================================
// HealthScore — BL-029: Agent Health Score Dashboard
// Визуализация здоровья системы (0-100)
// ============================================================

import { useState, useEffect, useCallback } from 'react';

interface HealthScoreData {
  overall: number;
  servers: { online: number; total: number; score: number };
  tasks: { total: number; done: number; inProgress: number; score: number };
  agents: { active: number; total: number; score: number };
  timestamp: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green
  if (score >= 50) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Отлично';
  if (score >= 60) return 'Хорошо';
  if (score >= 40) return 'Удовлетворительно';
  if (score >= 20) return 'Плохо';
  return 'Критично';
}

function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-green-500 to-emerald-500';
  if (score >= 50) return 'from-amber-500 to-yellow-500';
  return 'from-red-500 to-rose-500';
}

export function HealthScore() {
  const [data, setData] = useState<HealthScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health/score');
      if (!res.ok) throw new Error('Failed to fetch health score');
      const json: HealthScoreData = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Health Score недоступен</p>
        <button onClick={fetchHealth} className="text-xs text-amber-500 mt-1 hover:underline">
          Повторить
        </button>
      </div>
    );
  }

  const scoreColor = getScoreColor(data.overall);

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Health Score</h3>
        <span className="text-xs text-muted-foreground">
          {new Date(data.timestamp).toLocaleTimeString('ru-RU')}
        </span>
      </div>

      {/* Overall score — circular gauge */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3"
              className="text-muted" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="3"
              strokeDasharray={`${data.overall} ${100 - data.overall}`}
              strokeLinecap="round"
              className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold" style={{ color: scoreColor }}>{data.overall}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: scoreColor }}>{getScoreLabel(data.overall)}</p>
          <p className="text-xs text-muted-foreground">Общий показатель здоровья</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        <ScoreBar label="Серверы" score={data.servers.score}
          detail={`${data.servers.online}/${data.servers.total} онлайн`} />
        <ScoreBar label="Задачи" score={data.tasks.score}
          detail={`${data.tasks.done} выполнено, ${data.tasks.inProgress} в работе`} />
        <ScoreBar label="Агенты" score={data.agents.score}
          detail={`${data.agents.active}/${data.agents.total} активны`} />
      </div>
    </div>
  );
}

function ScoreBar({ label, score, detail }: { label: string; score: number; detail: string }) {
  const color = getScoreColor(score);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">{detail}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
