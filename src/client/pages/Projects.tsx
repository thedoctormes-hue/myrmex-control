import { useState } from 'react';
import { Link } from 'react-router-dom';
import { t, useLang } from '../shared/lib/i18n';
import type { MyrmexState, Project } from '@shared/types';
import { createProject, deleteProject } from '../shared/lib/api';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { confirmDialog } from '../shared/ui/ConfirmDialog';

interface Props {
  state: MyrmexState | null;
  onRefresh: () => void;
}

export function Projects({ state, onRefresh }: Props) {
  const [lang] = useLang();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const projects = state?.projects || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('projects.nameRequired'));
      return;
    }
    if (name.trim().length < 2) {
      setError(t('projects.nameMinLength'));
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await createProject({ name: name.trim(), description: description.trim(), source: 'ui' });
      setName('');
      setDescription('');
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects.createError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({ title: t('projects.deleteTitle'), message: t('projects.deleteConfirm'), variant: 'danger' });
    if (!ok) return;
    try {
      await deleteProject(id);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects.deleteError'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('projects.title')}</h1>
          <p className="text-sm text-muted-foreground-foreground">{t('projects.count', { n: projects.length })}</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition"
        >
          {showForm ? '✕' : t('projects.newProject')}
        </button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('projects.nameLabel')}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              required
              minLength={2}
              maxLength={100}
            />
          </div>
          <div>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('projects.descriptionLabel')}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              maxLength={500}
            />
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('projects.creating') : t('projects.create')}
          </button>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
        ))}
      </div>

      {projects.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground-foreground">
          <div className="text-4xl mb-2">📁</div>
          <p>{t('projects.noProjects')}</p>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const [lang] = useLang();

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between">
        <Link to={`/project/${project.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{project.icon}</span>
            <h3 className="font-semibold truncate">{project.name}</h3>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground-foreground mt-1 line-clamp-2">{project.description}</p>
          )}
        </Link>
        <button
          onClick={() => onDelete(project.id)}
          className="text-muted-foreground-foreground hover:text-destructive text-sm ml-2 flex-shrink-0"
          aria-label={t('common.delete')}
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
        <span className="text-xs text-muted-foreground-foreground">{project.status}</span>
        <span className="text-xs text-muted-foreground-foreground ml-auto">
          {new Date(project.created_at).toLocaleDateString(lang === 'ru' ? 'ru' : 'en')}
        </span>
      </div>
    </div>
  );
}

export default Projects;
