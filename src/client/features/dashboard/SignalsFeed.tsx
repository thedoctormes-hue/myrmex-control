import type { ChangelogEntry } from '@shared/types';

export function SignalsFeed({ changelog }: { changelog: ChangelogEntry[] }) {
  const recent = changelog.slice(0, 10);

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:col-span-2">
      <h2 className="text-sm font-semibold mb-3">📡 Сигналы</h2>
      {recent.length === 0 ? (
        <p className="text-xs text-muted-foreground">Нет событий</p>
      ) : (
        <div className="space-y-2">
          {recent.map(entry => (
            <div key={entry.id} className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground whitespace-nowrap">
                {new Date(entry.timestamp).toLocaleTimeString('ru')}
              </span>
              <span className="text-primary">{entry.source}</span>
              <span className="text-muted-foreground">{entry.action}</span>
              <span>{entry.entity_type} #{entry.entity_id.slice(0, 8)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
