import { useState } from 'react';
import type { MyrmexState, Skill } from '@shared/types';
import { createSkill, deleteSkill } from '../shared/lib/api';
import { ErrorBanner } from '../shared/ui/ErrorBanner';
import { t, useLang } from '../shared/lib/i18n';

interface Props {
  state: MyrmexState | null;
  onRefresh: () => void;
}

export function Library({ state, onRefresh }: Props) {
  const [lang] = useLang();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<Skill['type']>('skill');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const allSkills = state?.library || [];
  const skills = filter === 'all' ? allSkills : allSkills.filter(s => s.type === filter);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(lang === 'ru' ? 'Название обязательно' : 'Name is required'); return; }
    if (!content.trim()) { setError(lang === 'ru' ? 'Содержимое обязательно' : 'Content is required'); return; }
    try {
      setSaving(true);
      setError(null);
      await createSkill({
        name: name.trim(),
        type,
        content: content.trim(),
        description: description.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        source: 'ui',
      });
      setName(''); setContent(''); setDescription(''); setTags('');
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : (lang === 'ru' ? 'Ошибка создания' : 'Create error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const msg = lang === 'ru' ? 'Удалить?' : 'Delete?';
    if (!confirm(msg)) return;
    try {
      await deleteSkill(id);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : (lang === 'ru' ? 'Ошибка удаления' : 'Delete error'));
    }
  };

  const typeLabels: Record<string, Record<Lang, string>> = {
    all:    { en: 'All',       ru: 'Все' },
    skill:  { en: 'Skills',    ru: 'Скиллы' },
    mask:   { en: 'Masks',     ru: 'Маски' },
    hook:   { en: 'Hooks',     ru: 'Хуки' },
    template: { en: 'Templates', ru: 'Шаблоны' },
  };

  const lt = (key: string) => typeLabels[key]?.[lang] ?? key;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('lib.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {allSkills.length} {lang === 'ru' ? 'элементов' : 'items'}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition"
        >
          {showForm ? '✕' : `+ ${t('lib.add')}`}
        </button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="flex gap-2 flex-wrap">
        {Object.keys(typeLabels).map(key => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              filter === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {lt(key)}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex gap-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('lib.name')}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              required
              minLength={2}
            />
            <select
              value={type}
              onChange={e => setType(e.target.value as Skill['type'])}
              className="px-3 py-2 bg-background border border-border rounded-md text-sm"
            >
              <option value="skill">{t('lib.type.skill')}</option>
              <option value="mask">{t('lib.type.mask')}</option>
              <option value="hook">{t('lib.type.hook')}</option>
              <option value="template">{t('lib.type.template')}</option>
            </select>
          </div>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('lib.description')}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={t('lib.content')}
            rows={6}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder={t('lib.tags')}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={saving || !name.trim() || !content.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
          >
            {saving ? (lang === 'ru' ? 'Сохранение...' : 'Saving...') : t('common.save')}
          </button>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map(skill => (
          <div key={skill.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {skill.type}
                </span>
                <h3 className="font-semibold mt-1 truncate">{skill.name}</h3>
              </div>
              <button onClick={() => handleDelete(skill.id)} className="text-muted-foreground hover:text-destructive text-sm ml-2 flex-shrink-0">
                ✕
              </button>
            </div>
            {skill.description && (
              <p className="text-sm text-muted-foreground mt-2">{skill.description}</p>
            )}
            {skill.content && (
              <pre className="text-xs text-muted-foreground mt-2 bg-background rounded p-2 overflow-x-auto max-h-24 overflow-y-auto">
                {skill.content}
              </pre>
            )}
            {skill.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {skill.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {skills.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-2">📚</div>
          <p>{t('lib.empty')}</p>
        </div>
      )}
    </div>
  );
}
