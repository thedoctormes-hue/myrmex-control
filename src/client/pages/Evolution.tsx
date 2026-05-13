// ============================================================
// BL-045: Self-Improvement Loop — Client Page
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { t, useLang } from '../shared/lib/i18n';

interface Proposal {
  id: string;
  title: string;
  description: string;
  category: string;
  risk: string;
  status: string;
  source: string;
  impact_score: number;
  created_at: string;
  approved_at?: string;
  verified_at?: string;
  rolled_back_at?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  performance: '⚡', security: '🔒', ux: '🎨', code_quality: '💻', infrastructure: '🏗️',
};

const STATUS_COLORS: Record<string, string> = {
  proposed: 'bg-blue-500/20 text-blue-400',
  approved: 'bg-amber-500/20 text-amber-400',
  implementing: 'bg-purple-500/20 text-purple-400',
  verified: 'bg-green-500/20 text-green-400',
  rolled_back: 'bg-red-500/20 text-red-400',
};

export default function Evolution() {
  const [lang] = useLang();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('performance');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, mRes, cRes] = await Promise.all([
        fetch('/api/evolution/proposals'),
        fetch('/api/evolution/metrics'),
        fetch('/api/evolution/config'),
      ]);
      setProposals((await pRes.json()).proposals || []);
      setMetrics(await mRes.json());
      setConfig(await cRes.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createProposal = async () => {
    if (!newTitle || !newDesc) return;
    await fetch('/api/evolution/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, description: newDesc, category: newCategory, risk: 'low', source: 'manual' }),
    });
    setNewTitle(''); setNewDesc(''); setShowCreate(false);
    fetchData();
  };

  const updateStatus = async (id: string, action: string) => {
    await fetch(`/api/evolution/proposals/${id}/${action}`, { method: 'POST' });
    fetchData();
  };

  const runAnalysis = async () => {
    await fetch('/api/evolution/analyze', { method: 'POST' });
    fetchData();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('evolution.title')}</h1>
          <p className="text-muted-foreground-foreground text-sm mt-1">
            {t('evolution.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={runAnalysis}
            className="px-3 py-1.5 text-sm bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30">
            {t('evolution.analyze')}
          </button>
          <button onClick={() => setShowCreate(!showCreate)}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg">
            {t('evolution.proposal')}
          </button>
        </div>
      </div>

      {/* Metrics dashboard */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">{metrics.total_improvements}</div>
            <div className="text-xs text-muted-foreground-foreground">Всего</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{metrics.active_improvements}</div>
            <div className="text-xs text-muted-foreground-foreground">Активных</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{metrics.rolled_back}</div>
            <div className="text-xs text-muted-foreground-foreground">Откачено</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{metrics.avg_impact_score}</div>
            <div className="text-xs text-muted-foreground-foreground">Ср. impact</div>
          </div>
        </div>
      )}

      {/* Config */}
      {config && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Auto-improve:</span>
            <span className={`px-2 py-0.5 rounded text-xs ${config.auto_improve_enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {config.auto_improve_enabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground-foreground mt-1">
            Human override: {config.human_override_categories.join(', ') || 'none'} • Max auto risk: {config.max_auto_risk}
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 animate-fade-in">
          <input placeholder="Название" value={newTitle} onChange={e => setNewTitle(e.target.value)}
            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm" />
          <textarea placeholder="Описание" value={newDesc} onChange={e => setNewDesc(e.target.value)}
            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm h-20" />
          <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm">
            <option value="performance">Performance</option>
            <option value="security">Security</option>
            <option value="ux">UX</option>
            <option value="code_quality">Code Quality</option>
            <option value="infrastructure">Infrastructure</option>
          </select>
          <div className="flex gap-2">
            <button onClick={createProposal} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm">Создать</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 bg-muted rounded-lg text-sm">Отмена</button>
          </div>
        </div>
      )}

      {/* Proposals list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground-foreground">Загрузка...</div>
      ) : (
        <div className="space-y-3">
          {proposals.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{CATEGORY_ICONS[p.category] || '📦'}</span>
                    <span className="font-medium text-sm">{p.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${STATUS_COLORS[p.status] || 'bg-muted'}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground-foreground">{p.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground-foreground">
                    <span>Risk: <span className={p.risk === 'high' ? 'text-red-400' : p.risk === 'medium' ? 'text-amber-400' : 'text-green-400'}>{p.risk}</span></span>
                    <span>Impact: {p.impact_score}/10</span>
                    <span>Source: {p.source}</span>
                    <span>{new Date(p.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
                <div className="flex gap-1 ml-4">
                  {p.status === 'proposed' && (
                    <button onClick={() => updateStatus(p.id, 'approve')}
                      className="px-2 py-1 text-xs bg-primary/20 text-primary rounded hover:bg-primary/30">✓</button>
                  )}
                  {p.status === 'approved' && (
                    <button onClick={() => updateStatus(p.id, 'implement')}
                      className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30">⟳</button>
                  )}
                  {p.status === 'implementing' && (
                    <button onClick={() => updateStatus(p.id, 'verify')}
                      className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30">✓</button>
                  )}
                  {(p.status === 'implementing' || p.status === 'verified') && (
                    <button onClick={() => updateStatus(p.id, 'rollback')}
                      className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">↩</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {proposals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground-foreground">Нет предложений</div>
          )}
        </div>
      )}
    </div>
  );
}
