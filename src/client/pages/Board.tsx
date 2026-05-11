import { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { MyrmexState, Task, TaskStatus } from '@shared/types';
import { createTask, moveTask, deleteTask } from '../shared/lib/api';
import { notify } from '../shared/ui/Notifications';
import { confirmDialog } from '../shared/ui/ConfirmDialog';
import { Plus, Trash2, GripVertical, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

// ============================================================
// Board — Канбан-доска с поддержкой 3 режимов:
//   ЗАВЛАБ (стратегическая), МУРАВЕЙ (тактическая), КОТ (личная)
// + проектные доски (/project/:id)
// ============================================================

interface Props {
  state: MyrmexState | null;
  onRefresh: () => void;
}

// ─── Конфигурация досок ───

interface BoardConfig {
  id: string;
  title: string;
  icon: string;
  color: string;
  columns: { status: TaskStatus; label: string; color: string; wipLimit: number }[];
}

const BOARD_CONFIGS: Record<string, BoardConfig> = {
  zavlab: {
    id: 'zavlab',
    title: 'ЗАВЛАБ',
    icon: '🏭',
    color: '#10b981',
    columns: [
      { status: 'backlog', label: 'Бэклог', color: '#6b7280', wipLimit: 0 },
      { status: 'todo', label: 'К выполнению', color: '#3b82f6', wipLimit: 5 },
      { status: 'in_progress', label: 'В работе', color: '#f59e0b', wipLimit: 3 },
      { status: 'review', label: 'На проверке', color: '#8b5cf6', wipLimit: 2 },
      { status: 'done', label: 'Готово', color: '#22c55e', wipLimit: 0 },
    ],
  },
  ant: {
    id: 'ant',
    title: 'МУРАВЕЙ',
    icon: '🐜',
    color: '#f59e0b',
    columns: [
      { status: 'backlog', label: 'Очередь', color: '#6b7280', wipLimit: 0 },
      { status: 'todo', label: 'Работает', color: '#22c55e', wipLimit: 1 },
      { status: 'in_progress', label: 'Заблокировано', color: '#ef4444', wipLimit: 0 },
      { status: 'review', label: 'Тестирование', color: '#8b5cf6', wipLimit: 3 },
      { status: 'done', label: 'Завершено', color: '#22c55e', wipLimit: 0 },
    ],
  },
  cat: {
    id: 'cat',
    title: 'КОТ',
    icon: '🐱',
    color: '#8b5cf6',
    columns: [
      { status: 'backlog', label: 'Inbox', color: '#6b7280', wipLimit: 0 },
      { status: 'todo', label: 'Эта неделя', color: '#3b82f6', wipLimit: 7 },
      { status: 'in_progress', label: 'Делаю', color: '#f59e0b', wipLimit: 1 },
      { status: 'review', label: 'Жду', color: '#f97316', wipLimit: 0 },
      { status: 'done', label: 'Готово', color: '#22c55e', wipLimit: 0 },
    ],
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: '🔴', color: '#ef4444' },
  high: { label: '🟠', color: '#f97316' },
  medium: { label: '🟡', color: '#eab308' },
  low: { label: '🟢', color: '#22c55e' },
};

export function Board({ state, onRefresh }: Props) {
  const { id, owner } = useParams<{ id: string; owner: string }>();
  const isKanban = !!owner;
  const config = isKanban ? BOARD_CONFIGS[owner] : null;

  // Фильтрация задач
  const tasks = useMemo(() => {
    if (!state) return [];
    if (isKanban && owner) {
      return state.tasks.filter(t => t.owner === owner || (!t.owner && !t.project_id));
    }
    if (id) {
      return state.tasks.filter(t => t.project_id === id);
    }
    return state.tasks;
  }, [state, isKanban, owner, id]);

  const project = !isKanban ? state?.projects.find(p => p.id === id) : undefined;

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const taskData: Record<string, string> = { title: title.trim(), priority, source: 'ui' };
    if (isKanban && owner) {
      taskData.owner = owner;
    } else if (id) {
      taskData.project_id = id;
    }
    try {
      await createTask(taskData);
      notify('success', `Задача «${title.trim()}» создана`);
      setTitle('');
      setPriority('medium');
      setShowForm(false);
      onRefresh();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Ошибка создания');
    }
  };

  const handleMove = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await moveTask(taskId, newStatus);
      onRefresh();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Ошибка перемещения');
    }
  };

  const handleDelete = async (taskId: string, taskTitle: string) => {
    const ok = await confirmDialog({
      title: 'Удалить задачу?',
      message: `Задача «${taskTitle}» будет удалена.`,
      confirmLabel: 'Удалить',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteTask(taskId);
      notify('info', `Задача «${taskTitle}» удалена`);
      onRefresh();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  // Рендер карточки задачи
  const renderTaskCard = (task: Task) => {
    const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
    const age = Math.floor((Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const isOld = age > 7;
    const isVeryOld = age > 14;

    return (
      <div
        key={task.id}
        draggable
        onDragStart={e => {
          e.dataTransfer.setData('taskId', task.id);
          setDragTaskId(task.id);
        }}
        onDragEnd={() => { setDragTaskId(null); setDragOverCol(null); }}
        className={`bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:border-primary/50 ${
          isVeryOld ? 'border-red-500/50 animate-pulse' :
          isOld ? 'border-amber-500/30' :
          'border-border'
        } ${dragTaskId === task.id ? 'opacity-50' : ''}`}
      >
        {/* Заголовок */}
        <div className="flex items-start gap-2">
          <GripVertical className="w-3 h-3 text-muted-foreground mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
        </div>

        {/* Метаданные */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs" title={task.priority}>{prio.label}</span>
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
          {isOld && (
            <span className="text-[10px] text-amber-400 flex items-center gap-0.5" title={`Возраст: ${age} дней`}>
              <Clock className="w-2.5 h-2.5" />
              {age}д
            </span>
          )}
        </div>

        {/* Действия */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground">
            {new Date(task.created_at).toLocaleDateString('ru')}
          </span>
          <div className="flex items-center gap-1">
            {/* Кнопки перемещения */}
            {config && (() => {
              const colIdx = config.columns.findIndex(c => c.status === task.status);
              const prevCol = colIdx > 0 ? config.columns[colIdx - 1] : null;
              const nextCol = colIdx < config.columns.length - 1 ? config.columns[colIdx + 1] : null;
              return (
                <>
                  {prevCol && (
                    <button
                      onClick={() => handleMove(task.id, prevCol.status)}
                      className="text-muted-foreground hover:text-foreground p-0.5"
                      title={`← ${prevCol.label}`}
                    >
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </button>
                  )}
                  {nextCol && (
                    <button
                      onClick={() => handleMove(task.id, nextCol.status)}
                      className="text-muted-foreground hover:text-foreground p-0.5"
                      title={`${nextCol.label} →`}
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </>
              );
            })()}
            <button
              onClick={() => handleDelete(task.id, task.title)}
              className="text-muted-foreground hover:text-destructive p-0.5"
              title="Удалить"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Рендер колонки
  const renderColumn = (col: BoardConfig['columns'][0]) => {
    const colTasks = tasks.filter(t => t.status === col.status);
    const isOverWip = col.wipLimit > 0 && colTasks.length > col.wipLimit;
    const isNearWip = col.wipLimit > 0 && colTasks.length === col.wipLimit;

    return (
      <div
        key={col.status}
        className={`flex flex-col min-w-[240px] max-w-[280px] flex-shrink-0 ${
          dragOverCol === col.status ? 'ring-2 ring-primary/50 rounded-lg' : ''
        }`}
        onDragOver={e => { e.preventDefault(); setDragOverCol(col.status); }}
        onDragLeave={() => setDragOverCol(null)}
        onDrop={e => {
          e.preventDefault();
          const taskId = e.dataTransfer.getData('taskId');
          if (taskId) handleMove(taskId, col.status);
          setDragOverCol(null);
        }}
      >
        {/* Заголовок колонки */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${
          isOverWip ? 'bg-red-500/10' : 'bg-secondary/50'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
            <span className="text-sm font-medium">{col.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-xs font-mono ${isOverWip ? 'text-red-400' : isNearWip ? 'text-amber-400' : 'text-muted-foreground'}`}>
              {colTasks.length}
              {col.wipLimit > 0 && `/${col.wipLimit}`}
            </span>
            {isOverWip && <AlertTriangle className="w-3 h-3 text-red-400" />}
          </div>
        </div>

        {/* Карточки */}
        <div className="flex-1 space-y-2 p-2 bg-background/30 rounded-b-lg min-h-[100px]">
          {colTasks.map(renderTaskCard)}
          {colTasks.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Перетащите задачу сюда
            </div>
          )}
        </div>
      </div>
    );
  };

  // Заголовок доски
  const boardTitle = isKanban && config
    ? `${config.icon} ${config.title}`
    : project?.name || 'Доска';

  const boardColor = isKanban && config ? config.color : project?.color || '#6366f1';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span style={{ color: boardColor }}>{boardTitle}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {tasks.length} задач · {tasks.filter(t => t.status !== 'done').length} активных
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition flex items-center gap-1.5"
        >
          {showForm ? '✕' : <><Plus className="w-4 h-4" /> Задача</>}
        </button>
      </div>

      {/* Форма создания */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-border rounded-lg p-4 space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Название задачи *"
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            required
          />
          <div className="flex gap-2">
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Task['priority'])}
              className="px-3 py-2 bg-background border border-border rounded-md text-sm"
            >
              <option value="low">🟢 Низкий</option>
              <option value="medium">🟡 Средний</option>
              <option value="high">🟠 Высокий</option>
              <option value="critical">🔴 Критический</option>
            </select>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
            >
              Создать
            </button>
          </div>
        </form>
      )}

      {/* WIP-предупреждения */}
      {isKanban && config && (() => {
        const overWip = config.columns.filter(c => c.wipLimit > 0 && tasks.filter(t => t.status === c.status).length > c.wipLimit);
        if (overWip.length === 0) return null;
        return (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            WIP-лимит превышен в: {overWip.map(c => c.label).join(', ')}
          </div>
        );
      })()}

      {/* Колонки */}
      {isKanban && config ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {config.columns.map(renderColumn)}
        </div>
      ) : (
        /* Проектная доска — стандартные колонки */
        <div className="flex gap-3 overflow-x-auto pb-4">
          {BOARD_CONFIGS.zavlab.columns.map(col => renderColumn(col))}
        </div>
      )}

      {/* Пустое состояние */}
      {tasks.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-4xl mb-3">{isKanban ? config?.icon : '📭'}</div>
          <p>Доска пуста. Создайте первую задачу!</p>
        </div>
      )}
    </div>
  );
}
export default Board;
