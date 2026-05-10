import { useState, useEffect } from 'react';
import type { MyrmexFile } from '@shared/types';
import { getFiles } from '../shared/lib/api';

export function Files() {
  const [tab, setTab] = useState<'inbox' | 'outbox'>('inbox');
  const [files, setFiles] = useState<MyrmexFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFiles(tab).then(data => {
      setFiles(data);
      setLoading(false);
    });
  }, [tab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Файлообменник</h1>
        <p className="text-sm text-muted-foreground">Inbox / Outbox</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('inbox')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            tab === 'inbox' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          📥 Inbox ({files.length})
        </button>
        <button
          onClick={() => setTab('outbox')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            tab === 'outbox' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          📤 Outbox ({files.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-2">📂</div>
          <p>Папка пуста</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
              <span className="text-xl">{getFileIcon(file.mime_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(file.size)} · {new Date(file.uploaded_at).toLocaleString('ru')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getFileIcon(mime: string): string {
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.includes('pdf')) return '📄';
  if (mime.includes('zip')) return '📦';
  if (mime.includes('json')) return '📋';
  if (mime.startsWith('text/')) return '📝';
  return '📎';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
