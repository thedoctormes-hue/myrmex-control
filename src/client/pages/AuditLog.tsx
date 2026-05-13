// ============================================================
// Audit Log — страница просмотра changelog
// ============================================================

import { useState, useEffect } from 'react';
import { t, useLang } from '../shared/lib/i18n';
import { getAuditLog, getAuditEntityTypes, getAuditSources, type AuditLogEntry } from '../shared/lib/api';
import { FileText, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  create: 'text-green-400',
  update: 'text-amber-400',
  delete: 'text-red-400',
  move: 'text-blue-400',
};

function EntryRow({ entry }: { entry: AuditLogEntry }) {
  const [lang] = useLang();
  const [expanded, setExpanded] = useState(false);
  const time = new Date(entry.timestamp).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US');

  return (
    <div className="border-b border-border py-2 px-3 hover:bg-card/50 cursor-pointer"
      onClick={() => setExpanded(!expanded)}>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground font-mono text-xs w-40 shrink-0">{time}</span>
        <span className={`font-medium w-16 ${ACTION_COLORS[entry.action] || 'text-muted-foreground'}`}>
          {entry.action}
        </span>
        <span className="text-accent w-20">{entry.entity_type}</span>
        <span className="text-muted-foreground truncate flex-1">{entry.entity_id}</span>
        <span className="text-muted-foreground text-xs w-20">{entry.source}</span>
        {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </div>
      {expanded && Object.keys(entry.diff).length > 0 && (
        <div className="mt-2 ml-4 p-2 bg-secondary rounded text-xs font-mono text-muted-foreground overflow-x-auto">
          <pre>{JSON.stringify(entry.diff, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export function AuditLog() {
  const [lang] = useLang();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [filters, setFilters] = useState({ entity_type: '', source: '', action: '' });
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => {
    Promise.all([
      getAuditEntityTypes().catch(() => []),
      getAuditSources().catch(() => []),
    ]).then(([types, srcs]) => {
      setEntityTypes(types);
      setSources(srcs);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: String(limit), offset: String(page * limit) };
    if (filters.entity_type) params.entity_type = filters.entity_type;
    if (filters.source) params.source = filters.source;
    if (filters.action) params.action = filters.action;

    getAuditLog(params)
      .then(result => { setEntries(result.entries); setTotal(result.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-accent" />
        <h1 className="text-xl font-bold">{t('audit.title')}</h1>
        <span className="text-muted-foreground text-sm ml-2">{t('audit.entriesCount', { total })}</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={16} className="text-muted-foreground" />
        <select className="bg-secondary border border-border rounded px-2 py-1 text-sm"
          value={filters.entity_type}
          onChange={e => { setFilters(f => ({ ...f, entity_type: e.target.value })); setPage(0); }}>
          <option value="">{t('audit.allTypes')}</option>
          {entityTypes.map(tp => <option key={tp} value={tp}>{tp}</option>)}
        </select>
        <select className="bg-secondary border border-border rounded px-2 py-1 text-sm"
          value={filters.source}
          onChange={e => { setFilters(f => ({ ...f, source: e.target.value })); setPage(0); }}>
          <option value="">{t('audit.allSources')}</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="bg-secondary border border-border rounded px-2 py-1 text-sm"
          value={filters.action}
          onChange={e => { setFilters(f => ({ ...f, action: e.target.value })); setPage(0); }}>
          <option value="">{t('audit.allActions')}</option>
          <option value="create">create</option>
          <option value="update">update</option>
          <option value="delete">delete</option>
          <option value="move">move</option>
        </select>
      </div>

      {/* Entries */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">{t('common.loading')}</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">{t('audit.noEntries')}</div>
        ) : (
          entries.map(e => <EntryRow key={e.id} entry={e} />)
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 bg-secondary rounded text-sm disabled:opacity-50">{t('audit.prev')}</button>
          <span className="text-sm text-muted-foreground">{t('audit.page', { current: page + 1, total: totalPages })}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 bg-secondary rounded text-sm disabled:opacity-50">{t('audit.next')}</button>
        </div>
      )}
    </div>
  );
}
export default AuditLog;
