// ============================================================
// BL-035: Artifact CRUD System — Client Page
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { t, useLang } from '../shared/lib/i18n';

interface ArtifactSummary {
  id: string;
  type: string;
  title: string;
  status: string;
  author: string;
  tags: string[];
  links: string[];
  updated: string;
}

const TYPE_COLORS: Record<string, string> = {
  BL: 'bg-blue-500/20 text-blue-400',
  INC: 'bg-red-500/20 text-red-400',
  PAT: 'bg-purple-500/20 text-purple-400',
  RUL: 'bg-amber-500/20 text-amber-400',
  ADR: 'bg-green-500/20 text-green-400',
  SKILL: 'bg-cyan-500/20 text-cyan-400',
  AGENT: 'bg-orange-500/20 text-orange-400',
};

export default function Artifacts() {
  const [lang] = useLang();
  const [artifacts, setArtifacts] = useState<ArtifactSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [showGraph, setShowGraph] = useState(false);

  const fetchArtifacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (search) params.set('search', search);
      const res = await fetch(`/api/artifacts?${params}`);
      const data = await res.json();
      setArtifacts(data.artifacts || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch artifacts:', err);
    }
    setLoading(false);
  }, [filterType, search]);

  useEffect(() => { fetchArtifacts(); }, [fetchArtifacts]);

  const fetchGraph = async () => {
    if (graphData) { setShowGraph(!showGraph); return; }
    try {
      const res = await fetch('/api/artifacts/graph/data');
      const data = await res.json();
      setGraphData(data);
      setShowGraph(true);
    } catch (err) {
      console.error('Failed to fetch graph:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('artifacts.title')}</h1>
          <p className="text-muted-foreground-foreground text-sm mt-1">
            {total} {t('artifacts.title').toLowerCase()}
          </p>
        </div>
        <button onClick={fetchGraph} className="px-3 py-1.5 text-sm bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors">
          {showGraph ? t('artifacts.hideGraph') : t('artifacts.showGraph')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
        >
          <option value="">{t('artifacts.allTypes')}</option>
          <option value="BL">BL — Backlog</option>
          <option value="INC">INC — Incidents</option>
          <option value="PAT">PAT — Patterns</option>
          <option value="RUL">RUL — Rules</option>
          <option value="ADR">ADR — Architecture</option>
          <option value="SKILL">SKILL — Skills</option>
          <option value="AGENT">AGENT — Agents</option>
        </select>
      </div>

      {/* Graph visualization (simple) */}
      {showGraph && graphData && (
        <div className="bg-card border border-border rounded-xl p-4 animate-fade-in">
          <h3 className="text-sm font-semibold mb-3">Граф зависимостей</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-auto">
            {graphData.nodes.map(node => (
              <div key={node.id} className={`px-2 py-1 rounded text-xs ${TYPE_COLORS[node.type] || 'bg-muted'}`}>
                <span className="font-mono">{node.id}</span>
                <span className="ml-1 opacity-70">{node.title.slice(0, 30)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground-foreground mt-2">
            {graphData.nodes.length} узлов, {graphData.edges.length} связей
          </p>
        </div>
      )}

      {/* Artifact list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground-foreground">Загрузка...</div>
      ) : (
        <div className="grid gap-3">
          {artifacts.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${TYPE_COLORS[a.type] || 'bg-muted'}`}>
                      {a.type}
                    </span>
                    <span className="font-medium text-sm">{a.title}</span>
                    <span className="text-xs text-muted-foreground-foreground">{a.status}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground-foreground font-mono">{a.id}</span>
                    <span className="text-xs text-muted-foreground-foreground">by {a.author}</span>
                    <span className="text-xs text-muted-foreground-foreground">
                      {new Date(a.updated).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  {a?.tags?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {a?.tags?.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-muted rounded text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                  {a.links.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {a.links.map(link => (
                        <span key={link} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-mono">
                          → {link}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {artifacts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground-foreground">Артефакты не найдены</div>
          )}
        </div>
      )}
    </div>
  );
}
