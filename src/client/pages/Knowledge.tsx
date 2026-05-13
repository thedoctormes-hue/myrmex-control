// ============================================================
// BL-043: Lab Knowledge Graph — Client Page
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { t, useLang } from '../shared/lib/i18n';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  status: string;
  metadata: Record<string, unknown>;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    total_nodes: number;
    total_edges: number;
    by_type: Record<string, number>;
    clusters_count: number;
    top_nodes: Array<{ id: string; score: number; label: string; type: string }>;
  };
}

const NODE_COLORS: Record<string, string> = {
  agent: '#f59e0b',
  project: '#3b82f6',
  task: '#10b981',
  artifact: '#8b5cf6',
  skill: '#06b6d4',
  server: '#ef4444',
  user: '#ec4899',
};

export default function Knowledge() {
  const [lang] = useLang();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodeDetails, setNodeDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GraphNode[]>([]);
  const [filterType, setFilterType] = useState('');

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const [graphRes, statsRes] = await Promise.all([
        fetch('/api/knowledge/graph'),
        fetch('/api/knowledge/graph/stats'),
      ]);
      const graph = await graphRes.json();
      const stats = await statsRes.json();
      setData({ ...graph, stats });
    } catch (err) {
      console.error('Failed to fetch graph:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  const selectNode = async (node: GraphNode) => {
    setSelectedNode(node);
    try {
      const res = await fetch(`/api/knowledge/graph/node/${node.id}`);
      const details = await res.json();
      setNodeDetails(details);
    } catch (err) {
      console.error('Failed to fetch node details:', err);
    }
  };

  const search = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`/api/knowledge/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const nodes = data?.nodes || [];
  const edges = data?.edges || [];
  const stats = data?.stats;

  const filteredNodes = filterType ? nodes.filter(n => n.type === filterType) : nodes;

  // Simple force-directed layout simulation (static positions)
  const nodePositions = new Map<string, { x: number; y: number }>();
  const types = [...new Set(filteredNodes.map(n => n.type))];
  filteredNodes.forEach((node, i) => {
    const typeIdx = types.indexOf(node.type);
    const angle = (i / filteredNodes.length) * Math.PI * 2;
    const radius = 150 + typeIdx * 40;
    nodePositions.set(node.id, {
      x: 300 + Math.cos(angle) * radius,
      y: 200 + Math.sin(angle) * radius,
    });
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t('knowledge.title')}</h1>
        <p className="text-muted-foreground-foreground text-sm mt-1">
          {stats ? `${stats.total_nodes} ${t('knowledge.nodes') || 'узлов'}, ${stats.total_edges} ${t('knowledge.edges') || 'связей'}, ${stats.clusters_count} ${t('knowledge.clusters') || 'кластеров'}` : t('knowledge.loading')}
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Поиск по графу..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
        />
        <button onClick={search} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm">
          Найти
        </button>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm">
          <option value="">Все типы</option>
          <option value="agent">Агенты</option>
          <option value="project">Проекты</option>
          <option value="task">Задачи</option>
          <option value="artifact">Артефакты</option>
          <option value="skill">Скиллы</option>
          <option value="server">Серверы</option>
        </select>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-3 animate-fade-in">
          <h3 className="text-sm font-semibold mb-2">Результаты поиска</h3>
          <div className="space-y-1">
            {searchResults.map(node => (
              <button key={node.id} onClick={() => selectNode(node)} className="w-full text-left px-2 py-1 rounded hover:bg-muted text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[node.type] || '#666' }} />
                <span className="font-mono text-xs">{node.id}</span>
                <span>{node.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graph visualization */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 min-h-[400px] relative overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground-foreground">Загрузка графа...</div>
          ) : (
            <svg viewBox="0 0 600 400" className="w-full h-full">
              {/* Edges */}
              {edges.map((edge, i) => {
                const src = nodePositions.get(edge.source);
                const tgt = nodePositions.get(edge.target);
                if (!src || !tgt) return null;
                return (
                  <line key={i} x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
                );
              })}
              {/* Nodes */}
              {filteredNodes.map(node => {
                const pos = nodePositions.get(node.id);
                if (!pos) return null;
                const color = NODE_COLORS[node.type] || '#666';
                const isSelected = selectedNode?.id === node.id;
                return (
                  <g key={node.id} onClick={() => selectNode(node)} className="cursor-pointer">
                    <circle cx={pos.x} cy={pos.y} r={isSelected ? 8 : 5}
                      fill={color} opacity={isSelected ? 1 : 0.7}
                      stroke={isSelected ? 'white' : 'none'} strokeWidth={2} />
                    <text x={pos.x + 10} y={pos.y + 4} fontSize={8} fill="currentColor" opacity={0.7}>
                      {node.label.length > 20 ? node.label.slice(0, 20) + '…' : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-2">Легенда</h3>
            <div className="space-y-1">
              {Object.entries(NODE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="capitalize">{type}</span>
                  <span className="text-muted-foreground-foreground ml-auto">
                    {stats?.by_type[type] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected node details */}
          {selectedNode && nodeDetails && (
            <div className="bg-card border border-border rounded-xl p-4 animate-fade-in">
              <h3 className="text-sm font-semibold mb-2">{selectedNode.label}</h3>
              <div className="text-xs space-y-1">
                <div><span className="text-muted-foreground-foreground">ID:</span> <span className="font-mono">{selectedNode.id}</span></div>
                <div><span className="text-muted-foreground-foreground">Тип:</span> {selectedNode.type}</div>
                <div><span className="text-muted-foreground-foreground">Статус:</span> {selectedNode.status}</div>
                <div><span className="text-muted-foreground-foreground">Centrality:</span> {nodeDetails.centrality_score}</div>
              </div>
              {nodeDetails.related?.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold mb-1">Связи ({nodeDetails.related.length})</h4>
                  <div className="space-y-1 max-h-40 overflow-auto">
                    {nodeDetails.related.map((r: any, i: number) => (
                      <div key={i} className="text-xs flex items-center gap-1">
                        <span className="text-muted-foreground-foreground">{r.edge_type}</span>
                        <span className="font-mono">{r.node?.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Top nodes by centrality */}
          {stats?.top_nodes && stats.top_nodes.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-2">Топ узлов (centrality)</h3>
              <div className="space-y-1">
                {stats.top_nodes.slice(0, 5).map(node => (
                  <button key={node.id} onClick={() => {
                    const n = nodes.find(nd => nd.id === node.id);
                    if (n) selectNode(n);
                  }} className="w-full text-left text-xs flex items-center gap-2 px-1 py-0.5 rounded hover:bg-muted">
                    <span className="font-mono">{node.id}</span>
                    <span className="flex-1 truncate">{node.label}</span>
                    <span className="text-muted-foreground-foreground">{node.score}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
