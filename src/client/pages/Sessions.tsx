// ============================================================
// BL-046: Session & Memory Management — Client Page
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { t, useLang } from '../shared/lib/i18n';

interface SessionItem {
  id: string;
  agent_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  summary?: string;
  memory: {
    short_term: Array<{ id: string; role: string; content: string; timestamp: string }>;
    long_term: string[];
  };
}

export default function Sessions() {
  const [lang] = useLang();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SessionItem | null>(null);
  const [agentFilter, setAgentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAgent, setNewAgent] = useState('');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (agentFilter) params.set('agent_id', agentFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/sessions?${params}`);
      const data = await res.json();
      setSessions(data.sessions || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
    setLoading(false);
  }, [agentFilter, statusFilter]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const selectSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      const data = await res.json();
      setSelected(data);
    } catch (err) { console.error(err); }
  };

  const createSession = async () => {
    if (!newAgent || !newTitle) return;
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: newAgent, title: newTitle }),
      });
      setNewTitle('');
      setNewAgent('');
      setShowCreate(false);
      fetchSessions();
    } catch (err) { console.error(err); }
  };

  const archiveSession = async (id: string) => {
    try {
      await fetch(`/api/sessions/${id}/archive`, { method: 'POST' });
      fetchSessions();
      if (selected?.id === id) setSelected(null);
    } catch (err) { console.error(err); }
  };

  const consolidate = async (id: string) => {
    try {
      await fetch(`/api/sessions/${id}/consolidate`, { method: 'POST' });
      selectSession(id);
    } catch (err) { console.error(err); }
  };

  const addMessage = async (id: string, content: string) => {
    if (!content.trim()) return;
    try {
      await fetch(`/api/sessions/${id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content }),
      });
      selectSession(id);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('sessions.title')}</h1>
          <p className="text-muted-foreground-foreground text-sm mt-1">{total} {t('sessions.title').toLowerCase()}</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg">
          {t('sessions.new')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input placeholder="Agent ID..." value={agentFilter} onChange={e => setAgentFilter(e.target.value)}
          className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm w-40" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm">
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="idle">Idle</option>
          <option value="archived">Архив</option>
        </select>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 animate-fade-in">
          <input placeholder="Agent ID" value={newAgent} onChange={e => setNewAgent(e.target.value)}
            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm" />
          <input placeholder="Название сессии" value={newTitle} onChange={e => setNewTitle(e.target.value)}
            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm" />
          <div className="flex gap-2">
            <button onClick={createSession} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm">Создать</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 bg-muted rounded-lg text-sm">Отмена</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Session list */}
        <div className="space-y-2 max-h-[600px] overflow-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground-foreground">Загрузка...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground-foreground">Нет сессий</div>
          ) : sessions.map(s => (
            <button key={s.id} onClick={() => selectSession(s.id)}
              className={`w-full text-left bg-card border rounded-xl p-3 transition-colors hover:border-primary/50 ${
                selected?.id === s.id ? 'border-primary' : 'border-border'
              }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{s.title}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  s.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  s.status === 'idle' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-muted text-muted-foreground-foreground'
                }`}>{s.status}</span>
              </div>
              <div className="text-xs text-muted-foreground-foreground mt-1">
                {s.agent_id} • {s.memory.short_term.length} сообщений
              </div>
              <div className="text-xs text-muted-foreground-foreground">
                {new Date(s.updated_at).toLocaleString('ru-RU')}
              </div>
            </button>
          ))}
        </div>

        {/* Session detail */}
        {selected ? (
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">{selected.title}</h3>
                <p className="text-xs text-muted-foreground-foreground">{selected.id} • {selected.agent_id}</p>
              </div>
              <div className="flex gap-2">
                {selected.status === 'active' && (
                  <>
                    <button onClick={() => consolidate(selected.id)}
                      className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded">
                      Консолидировать
                    </button>
                    <button onClick={() => archiveSession(selected.id)}
                      className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded">
                      Архивировать
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-2 max-h-80 overflow-auto">
              {selected.memory.short_term.map(msg => (
                <div key={msg.id} className={`p-2 rounded-lg text-sm ${
                  msg.role === 'user' ? 'bg-primary/10 ml-8' :
                  msg.role === 'agent' ? 'bg-muted mr-8' :
                  'bg-card border border-border text-xs text-center'
                }`}>
                  <div className="text-xs text-muted-foreground-foreground mb-0.5">{msg.role}</div>
                  <div>{msg.content}</div>
                  <div className="text-xs text-muted-foreground-foreground mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString('ru-RU')}
                  </div>
                </div>
              ))}
              {selected.memory.short_term.length === 0 && (
                <div className="text-center py-4 text-muted-foreground-foreground text-sm">Нет сообщений</div>
              )}
            </div>

            {/* Long-term memory */}
            {selected.memory.long_term.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Long-term memory</h4>
                {selected.memory.long_term.map((s, i) => (
                  <div key={i} className="text-xs text-muted-foreground-foreground bg-muted rounded p-2 mb-1">{s}</div>
                ))}
              </div>
            )}

            {/* Add message */}
            {selected.status === 'active' && (
              <form onSubmit={e => { e.preventDefault(); const f = e.target as HTMLFormElement; addMessage(selected.id, (f.elements.namedItem('msg') as HTMLInputElement).value); f.reset(); }}
                className="flex gap-2">
                <input name="msg" placeholder="Сообщение..."
                  className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-sm" />
                <button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm">→</button>
              </form>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-8 flex items-center justify-center text-muted-foreground-foreground">
            Выберите сессию для просмотра
          </div>
        )}
      </div>
    </div>
  );
}
