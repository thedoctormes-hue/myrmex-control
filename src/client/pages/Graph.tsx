import type { MyrmexState } from '@shared/types';

interface Props {
  state: MyrmexState | null;
}

export function Graph({ state }: Props) {
  if (!state) return null;

  // Простой текстовый граф связей (визуализация позже)
  const nodes = [
    ...state.projects.map(p => ({ id: p.id, label: p.icon + ' ' + p.name, type: 'project' })),
    ...state.agents.map(a => ({ id: a.id, label: '🤖 ' + a.name, type: 'agent' })),
    ...state.servers.map(s => ({ id: s.id, label: '🖥️ ' + s.name, type: 'server' })),
  ];

  const edges = state.tasks
    .filter(t => t.assignee_id)
    .map(t => ({
      from: t.project_id,
      to: t.assignee_id,
      label: t.title,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Граф связей</h1>
        <p className="text-sm text-muted-foreground-foreground">
          {nodes.length} узлов · {edges.length} связей
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-sm text-muted-foreground-foreground mb-4">
          🕸️ Визуализация графа будет добавлена в v0.2 (D3.js / Cytoscape.js).
          Пока — текстовое представление:
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Узлы</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {nodes.map(node => (
                <div key={node.id} className="text-xs bg-background border border-border rounded px-2 py-1 truncate">
                  {node.label}
                </div>
              ))}
            </div>
          </div>

          {edges.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Связи</h3>
              <div className="space-y-1">
                {edges.map((edge, i) => {
                  const from = nodes.find(n => n.id === edge.from);
                  const to = nodes.find(n => n.id === edge.to);
                  return (
                    <div key={i} className="text-xs text-muted-foreground-foreground">
                      {from?.label} → {to?.label} <span className="text-muted-foreground">({edge.label})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Graph;
