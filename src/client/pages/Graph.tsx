import { useState, useMemo } from 'react';
import type { MyrmexState } from '@shared/types';
import { ForceGraph, type GraphNode, type GraphEdge } from '../shared/ui/ForceGraph';
import { Network, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Props {
  state: MyrmexState | null;
}

type FilterGroup = 'all' | GraphNode['group'];

export function Graph({ state }: Props) {
  const [filter, setFilter] = useState<FilterGroup>('all');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const { nodes, edges } = useMemo(() => {
    if (!state) return { nodes: [], edges: [] };

    const n: GraphNode[] = [];
    const e: GraphEdge[] = [];

    // Projects
    state.projects.forEach(p => {
      n.push({ id: `proj-${p.id}`, label: p.name, group: 'project' });
    });

    // Agents
    state.agents.forEach(a => {
      n.push({ id: `agent-${a.id}`, label: a.name, group: 'agent' });
      if (a.project_id) {
        e.push({ source: `agent-${a.id}`, target: `proj-${a.project_id}`, label: 'assigned' });
      }
    });

    // Servers
    state.servers.forEach(s => {
      n.push({ id: `server-${s.id}`, label: s.name, group: 'server' });
    });

    // Tasks → Projects
    state.tasks.forEach(t => {
      if (t.project_id) {
        n.push({ id: `task-${t.id}`, label: t.title, group: 'task' });
        e.push({ source: `task-${t.id}`, target: `proj-${t.project_id}`, label: t.status });
        if (t.assignee_id) {
          e.push({ source: `task-${t.id}`, target: `agent-${t.assignee_id}`, label: 'assignee' });
        }
      }
    });

    // Library artifacts
    state.library.forEach(l => {
      n.push({ id: `lib-${l.id}`, label: l.name, group: 'artifact' });
    });

    return { nodes: n, edges: e };
  }, [state]);

  const filteredNodes = filter === 'all' ? nodes : nodes.filter(n => n.group === filter);
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = edges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { all: nodes.length };
    nodes.forEach(n => { counts[n.group] = (counts[n.group] || 0) + 1; });
    return counts;
  }, [nodes]);

  if (!state) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="w-6 h-6 text-primary" />
            Карта лаборатории
          </h1>
          <p className="text-sm text-muted-foreground">
            {nodes.length} узлов · {edges.length} связей
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'all', label: 'Все', icon: '🗺️' },
          { key: 'project', label: 'Проекты', icon: '📦' },
          { key: 'agent', label: 'Агенты', icon: '🤖' },
          { key: 'server', label: 'Серверы', icon: '🖥️' },
          { key: 'task', label: 'Задачи', icon: '📋' },
          { key: 'artifact', label: 'Артефакты', icon: '📚' },
        ] as { key: FilterGroup; label: string; icon: string }[]).map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
              filter === opt.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            <span>{opt.icon}</span>
            {opt.label}
            <span className="opacity-60">({groupCounts[opt.key] || 0})</span>
          </button>
        ))}
      </div>

      {/* Graph */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <ForceGraph
            nodes={filteredNodes}
            edges={filteredEdges}
            width={800}
            height={500}
            onNodeClick={setSelectedNode}
          />
          <p className="text-[10px] text-muted-foreground mt-2">
            Колёсико — зум · Перетаскивание узлов · Клик — информация
          </p>
        </div>

        {/* Details panel */}
        {selectedNode && (
          <div className="w-64 bg-card border border-border rounded-lg p-4 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">
                {{ project: '📦', agent: '🤖', server: '🖥️', task: '📋', artifact: '📚' }[selectedNode.group]}
              </span>
              <div>
                <h3 className="font-semibold text-sm">{selectedNode.label}</h3>
                <p className="text-xs text-muted-foreground capitalize">{selectedNode.group}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>ID: <span className="font-mono">{selectedNode.id}</span></p>
              <p>Связей: {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length}</p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕ Закрыть
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {[
          { group: 'project', label: 'Проекты', color: '#6366f1' },
          { group: 'agent', label: 'Агенты', color: '#f59e0b' },
          { group: 'server', label: 'Серверы', color: '#22c55e' },
          { group: 'task', label: 'Задачи', color: '#3b82f6' },
          { group: 'artifact', label: 'Артефакты', color: '#8b5cf6' },
        ].map(item => (
          <div key={item.group} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
export default Graph;
