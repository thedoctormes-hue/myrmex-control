import type { Server } from '@shared/types';

export function ServerWidget({ servers }: { servers: Server[] }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h2 className="text-sm font-semibold mb-3">🖥️ Серверы</h2>
      {servers.length === 0 ? (
        <p className="text-xs text-muted-foreground-foreground">Нет серверов</p>
      ) : (
        <div className="space-y-2">
          {servers.map(server => (
            <div key={server.id} className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${
                server.status === 'online' ? 'bg-green-500' :
                server.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="flex-1 truncate">{server.name}</span>
              <span className="text-xs text-muted-foreground-foreground">{server.host}:{server.port}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
