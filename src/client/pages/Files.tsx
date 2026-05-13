import { useState, useEffect } from 'react';
import { t, useLang } from '../shared/lib/i18n';

interface FileMessage {
  id: string;
  sender: string;
  receiver: string;
  type: 'inbox' | 'outbox';
  priority: 'urgent' | 'normal' | 'low';
  subject: string;
  content: string;
  file_name?: string;
  file_hash?: string;
  file_size?: number;
  status: 'unread' | 'read' | 'processed' | 'archived';
  tags: string[];
  created_at: string;
  read_at?: string;
}

export function Files() {
  const [lang] = useLang();
  const [tab, setTab] = useState<'inbox' | 'outbox'>('inbox');
  const [files, setFiles] = useState<FileMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/files?dir=${tab}`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { setFiles(data); setLoading(false); })
      .catch(() => { setError(t('common.error')); setLoading(false); });
  }, [tab, lang]);

  const priorityColors: Record<string, string> = {
    urgent: 'text-red-400',
    normal: 'text-foreground',
    low: 'text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('files.title')}</h1>
        <p className="text-sm text-muted-foreground-foreground">{t('files.subtitle')}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('inbox')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            tab === 'inbox' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          📥 {t('files.inbox')} ({files.length})
        </button>
        <button
          onClick={() => setTab('outbox')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            tab === 'outbox' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          📤 {t('files.outbox')} ({files.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground-foreground">{t('common.loading')}</div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">{error}</div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground-foreground">
          <div className="text-4xl mb-2">📂</div>
          <p>{t('files.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
              <span className="text-xl">{getFileIcon(file.subject)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium truncate ${priorityColors[file.priority]}`}>
                    {file.subject}
                  </p>
                  {file.status === 'unread' && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground-foreground">
                  {file.sender} → {file.receiver} · {formatSize(file.file_size || 0)} · {new Date(file.created_at).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}
                </p>
                {file?.tags?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {file?.tags?.map(tag => (
                      <span key={tag} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getFileIcon(subject: string | undefined): string {
  const s = (subject || '').toLowerCase();
  if (s.includes('urgent') || s.includes('срочн')) return '🔴';
  if (s.includes('report') || s.includes('отчёт') || s.includes('отчет')) return '📊';
  if (s.includes('deploy') || s.includes('деплой')) return '🚀';
  if (s.includes('bug') || s.includes('ошибк')) return '🐛';
  if (s.includes('feature') || s.includes('функц')) return '✨';
  return '📎';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default Files;
