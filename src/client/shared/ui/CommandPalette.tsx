import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { t } from '../lib/i18n';

// ============================================================
// Command Palette — Cmd+K быстрая навигация и действия
// ============================================================

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  action: () => void;
  group: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export function CommandPalette({ isOpen, onClose, commands }: Props) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeCommand = useCallback((cmd: CommandItem) => {
    cmd.action();
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[selectedIndex]) {
          executeCommand(filtered[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filtered, selectedIndex, executeCommand, onClose]);

  if (!isOpen) return null;

  // Group commands
  const grouped = new Map<string, CommandItem[]>();
  filtered.forEach(cmd => {
    const arr = grouped.get(cmd.group) || [];
    arr.push(cmd);
    grouped.set(cmd.group, arr);
  });

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />

      {/* Palette */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-modal-in">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Поиск команд..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Ничего не найдено
            </div>
          ) : (
            Array.from(grouped.entries()).map(([group, items]) => (
              <div key={group}>
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {group}
                </div>
                {items.map(cmd => {
                  flatIndex++;
                  const idx = flatIndex;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 transition-colors ${
                        isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                      }`}
                    >
                      {cmd.icon && <span className="text-base">{cmd.icon}</span>}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{cmd.label}</div>
                        {cmd.description && (
                          <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
                        )}
                      </div>
                      {isSelected && <ArrowRight className="w-3 h-3 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>↑↓ Навигация</span>
          <span>↵ Выполнить</span>
          <span>ESC Закрыть</span>
        </div>
      </div>
    </div>
  );
}

// Hook для регистрации команд
export function useCommandPalette(navigate: (path: string) => void) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'nav-dashboard', label: t('nav.dashboard'), icon: '🏠', action: () => navigate('/'), group: 'Навигация' },
    { id: 'nav-projects', label: t('nav.projects'), icon: '📁', action: () => navigate('/projects'), group: 'Навигация' },
    { id: 'nav-agents', label: t('nav.agents'), icon: '🤖', action: () => navigate('/agents'), group: 'Навигация' },
    { id: 'nav-library', label: t('nav.library'), icon: '📚', action: () => navigate('/library'), group: 'Навигация' },
    { id: 'nav-files', label: t('nav.files'), icon: '📂', action: () => navigate('/files'), group: 'Навигация' },
    { id: 'nav-servers', label: t('nav.servers'), icon: '🖥️', action: () => navigate('/servers'), group: 'Навигация' },
    { id: 'nav-graph', label: t('nav.graph'), icon: '🕸️', action: () => navigate('/graph'), group: 'Навигация' },
    { id: 'nav-analytics', label: t('nav.analytics'), icon: '📊', action: () => navigate('/analytics'), group: 'Навигация' },
    { id: 'nav-audit', label: t('nav.audit'), icon: '📋', action: () => navigate('/audit'), group: 'Навигация' },
    { id: 'nav-settings', label: t('nav.settings'), icon: '⚙️', action: () => navigate('/settings'), group: 'Навигация' },
    // Kanban boards
    { id: 'board-cat', label: '🐱 Кот — Kanban', action: () => navigate('/board/cat'), group: 'Канбан' },
    { id: 'board-ant', label: '🐜 Муравей — Kanban', action: () => navigate('/board/ant'), group: 'Канбан' },
    { id: 'board-zavlab', label: '🏭 ЗавЛаб — Kanban', action: () => navigate('/board/zavlab'), group: 'Канбан' },
  ], [navigate]);

  return { isOpen, setIsOpen, commands };
}
