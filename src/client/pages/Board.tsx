import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { MyrmexState, Task, TaskStatus } from '@shared/types';
import { createTask, moveTask, deleteTask } from '../lib/api';
import { confirmDialog } from '../shared/ui/ConfirmDialog';

interface Props {
  state: MyrmexState | null;
  onRefresh: () => void;
}

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'backlog', label: 'Бэклог', color: '#6b7280' },
  { status: 'todo', label: 'К выполнению', color: '#3b82f6' },
  { status: 'in_progress', label: 'В работе', color: '#f59e0b' },
  { status: 'review', label: 'На проверке', color: '#8b5cf6' },
  { status: 'done', label: 'Готово', color: '#22c55e' },
];

export function Board({ state, onRefresh }: Props) {
  const { id } = useParams<{ id: string }>();
  const project = state?.projects.find(p => p.id === id);
  const tasks = state?.tasks.filter(t => t.project_id === id) || [];

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !id) return;
    await createTask({ title, project_id: id, source: 'ui' });
    setTitle('');
    setShowForm(false);
    onRefresh();
  };

  const handleMove = async (taskId: string, newStatus: TaskStatus) => {
    await moveTask(taskId, newStatus);
    onRefresh();
  };

  const handleDelete = async (taskId: string) => {
    const ok = await confirmDialog({ title: 'Удалить задачу?', message: 'Это действие нельзя отменить.', variant: 'danger' });
    if (!ok) return;
    await deleteTask(taskId);
    onRefresh();
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDragTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDragTaskId(null);
    setDragOverCol(null);
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground-foreground">
        <div className="text-center">
          <div className="text-4xl mb-2">📭</div>
          <p>Проект не найден</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>{project.icon}</span>
            <span>{project.name}</span>
          </h1>
          <p className="text-sm text-muted-foreground-foreground">{tasks.length} задач</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition"
        >
          {showForm ? '✕' : '+ Задача'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Название задачи"
            className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            required
          />
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
            Создать
          </button>
        </form>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.status}
            {...col}
            tasks={tasks.filter(t => t.status === col.status)}
            isDragOver={dragOverCol === col.status}
            dragTaskId={dragTaskId}
            onDragEnter={() => setDragOverCol(col.status)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={handleMove}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  color,
  tasks,
  isDragOver,
  dragTaskId,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  isDragOver: boolean;
  dragTaskId: string | null;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (taskId: string, newStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragLeave();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onDrop(taskId, status);
  };

  return (
    <div
      className={`flex-shrink-0 w-64 bg-card border rounded-lg p-3 transition-all ${
        isDragOver ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border'
      }`}
      onDragOver={e => { e.preventDefault(); onDragEnter(); }}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground-foreground ml-auto bg-secondary px-1.5 py-0.5 rounded">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2 min-h-[40px]">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            isDragging={dragTaskId === task.id}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {tasks.length === 0 && !isDragOver && (
          <div className="text-center py-4 text-xs text-muted-foreground-foreground border border-dashed border-border rounded">
            Перетащите задачу сюда
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  isDragging,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  isDragging: boolean;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}) {
  const priorityConfig: Record<string, { color: string; label: string }> = {
    low: { color: '#6b7280', label: 'Низкий' },
    medium: { color: '#3b82f6', label: 'Средний' },
    high: { color: '#f59e0b', label: 'Высокий' },
    critical: { color: '#ef4444', label: 'Критический' },
  };
  const prio = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      className={`bg-background border rounded-md p-3 cursor-grab active:cursor-grabbing transition-all hover:border-primary/50 hover:shadow-sm ${
        isDragging ? 'opacity-40 scale-95' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <button
          onClick={e => { e.stopPropagation(); onDelete(task.id); }}
          className="text-muted-foreground-foreground hover:text-destructive text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Удалить"
        >
          ✕
        </button>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground-foreground mt-1 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span
          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: prio.color + '20', color: prio.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: prio.color }} />
          {prio.label}
        </span>
        {task.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-[10px] text-muted-foreground-foreground bg-secondary px-1.5 py-0.5 rounded">
            {tag}
          </span>
        ))}
        {task.tags.length > 3 && (
          <span className="text-[10px] text-muted-foreground-foreground">+{task.tags.length - 3}</span>
        )}
      </div>
    </div>
  );
}

export default Board;
