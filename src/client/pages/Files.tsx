import { useState, useEffect, useCallback } from 'react';
import type { MyrmexFile } from '@shared/types';
import { getFiles, uploadFile, deleteFile } from '../shared/lib/api';
import { ErrorBanner } from '../shared/ui/ErrorBanner';
import { Upload, Trash2, Download, FileText, Image, FileArchive, File, FolderOpen } from 'lucide-react';

export function Files() {
  const [tab, setTab] = useState<'inbox' | 'outbox'>('inbox');
  const [files, setFiles] = useState<MyrmexFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFiles(tab);
      setFiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (file.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой (макс. 10 МБ)');
      return;
    }
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      await uploadFile(file, tab, setUploadProgress);
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить файл?')) return;
    try {
      await deleteFile(id);
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" />
            Файлообменник
          </h1>
          <p className="text-sm text-muted-foreground">Inbox / Outbox</p>
        </div>
        <label className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer">
          <Upload className="w-4 h-4" />
          Загрузить
          <input
            type="file"
            className="hidden"
            onChange={e => handleUpload(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="text-sm text-muted-foreground">
          {uploading
            ? `Загрузка... ${uploadProgress}%`
            : 'Перетащите файл сюда или нажмите «Загрузить»'}
        </p>
        {uploading && (
          <div className="mt-3 w-48 mx-auto h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('inbox')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
            tab === 'inbox' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          📥 Inbox ({files.length})
        </button>
        <button
          onClick={() => setTab('outbox')}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
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
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Папка пуста</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(file => (
            <div key={file.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                {getFileIcon(file.mime_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(file.size)} · {new Date(file.uploaded_at).toLocaleString('ru')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={`/${file.path}`}
                  download
                  className="text-muted-foreground hover:text-primary transition-colors p-1.5"
                  title="Скачать"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1.5"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return <Image className="w-5 h-5 text-primary" />;
  if (mime.includes('pdf') || mime.includes('text')) return <FileText className="w-5 h-5 text-primary" />;
  if (mime.includes('zip') || mime.includes('tar') || mime.includes('gz')) return <FileArchive className="w-5 h-5 text-primary" />;
  return <File className="w-5 h-5 text-primary" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
export default Files;
