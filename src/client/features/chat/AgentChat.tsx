// ============================================================
// AgentChat — BL-028: WebSocket Chat Panel для коммуникации с агентами
// Split-pane: список агентов / чат / контекст
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useWebSocket } from '../../shared/hooks/useWebSocket';
import type { Agent } from '@shared/types';

interface AgentChatProps {
  agents: Agent[];
  onClose?: () => void;
}

type AgentStatusIndicator = 'online' | 'busy' | 'offline';

const statusColors: Record<AgentStatusIndicator, string> = {
  online: 'bg-green-500',
  busy: 'bg-amber-500',
  offline: 'bg-gray-500',
};

const statusLabels: Record<AgentStatusIndicator, string> = {
  online: 'Онлайн',
  busy: 'Занят',
  offline: 'Оффлайн',
};

export function AgentChat({ agents, onClose }: AgentChatProps) {
  const { connected, messages, send, error } = useWebSocket();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [commandMode, setCommandMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const agentMessages = selectedAgent
    ? messages.filter(m => m.agent_id === selectedAgent || !m.agent_id)
    : messages;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages.length]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !selectedAgent) return;

    // Command mode: /command
    if (input.startsWith('/')) {
      const [cmd, ...args] = input.slice(1).split(' ');
      switch (cmd) {
        case 'status':
          send({ type: 'status', agent_id: selectedAgent, payload: { action: 'get_status' } });
          break;
        case 'assign':
          send({ type: 'event', agent_id: selectedAgent, payload: { action: 'assign', task: args.join(' ') } });
          break;
        case 'deploy':
          send({ type: 'event', agent_id: selectedAgent, payload: { action: 'deploy', target: args.join(' ') } });
          break;
        case 'logs':
          send({ type: 'event', agent_id: selectedAgent, payload: { action: 'get_logs', lines: args[0] || '50' } });
          break;
        default:
          send({ type: 'chat', agent_id: selectedAgent, payload: { text: input, from: 'user' } });
      }
    } else {
      send({ type: 'chat', agent_id: selectedAgent, payload: { text: input, from: 'user' } });
    }

    setInput('');
    setCommandMode(false);
  }, [input, selectedAgent, send]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === '/' && input === '') {
      setCommandMode(true);
    }
    if (e.key === 'Escape') {
      setCommandMode(false);
      setInput('');
    }
  }, [handleSend, input]);

  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  return (
    <div className="flex h-full bg-card rounded-lg border border-border overflow-hidden">
      {/* Left: Agent list */}
      <div className="w-64 border-r border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Агенты</h3>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
                  title={connected ? 'Подключено' : 'Отключено'} />
          </div>
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
        <div className="flex-1 overflow-y-auto">
          {agents.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">Нет агентов</p>
          ) : (
            agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent/50 transition-colors ${
                  selectedAgent === agent.id ? 'bg-accent border-l-2 border-amber-500' : ''
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusColors[agent.status as AgentStatusIndicator] || 'bg-gray-500'}`} />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{agent.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Center: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedAgent ? (
          <>
            {/* Chat header */}
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusColors[selectedAgentData?.status as AgentStatusIndicator] || 'bg-gray-500'}`} />
                <span className="text-sm font-medium text-foreground">{selectedAgentData?.name}</span>
                <span className="text-xs text-muted-foreground">
                  {statusLabels[selectedAgentData?.status as AgentStatusIndicator] || 'Неизвестно'}
                </span>
              </div>
              {onClose && (
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {agentMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Начните диалог с {selectedAgentData?.name}
                </div>
              ) : (
                agentMessages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Command palette hint */}
            {commandMode && (
              <div className="px-3 py-2 border-t border-border bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Команды: <span className="text-amber-500">/status</span> · <span className="text-amber-500">/assign</span> · <span className="text-amber-500">/deploy</span> · <span className="text-amber-500">/logs</span>
                </p>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={commandMode ? 'Введите команду...' : 'Сообщение... ( / для команд)'}
                  className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="px-4 py-2 bg-amber-500 text-black rounded text-sm font-medium hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ↑
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">💬</p>
              <p className="text-sm">Выберите агента для начала диалога</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Context panel */}
      {selectedAgent && selectedAgentData && (
        <div className="w-56 border-l border-border p-3 shrink-0 hidden lg:block">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Контекст</h4>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground">Роль:</span>
              <p className="text-foreground">{selectedAgentData.role}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Модель:</span>
              <p className="text-foreground">{selectedAgentData.model}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Последняя активность:</span>
              <p className="text-foreground">
                {new Date(selectedAgentData.last_seen).toLocaleTimeString('ru-RU')}
              </p>
            </div>
            {selectedAgentData.current_task_id && (
              <div>
                <span className="text-muted-foreground">Текущая задача:</span>
                <p className="text-amber-500">{selectedAgentData.current_task_id}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Message bubble ---

function MessageBubble({ message }: { message: WSMessage }) {
  const isUser = message.payload?.from === 'user';
  const isSystem = message.type === 'event' || message.type === 'error';

  if (isSystem) {
    return (
      <div className="text-center">
        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
          {message.payload?.message as string || JSON.stringify(message.payload)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
        isUser
          ? 'bg-amber-500 text-black'
          : 'bg-muted text-foreground'
      }`}>
        <p>{message.payload?.text as string || JSON.stringify(message.payload)}</p>
        <p className={`text-[10px] mt-1 ${isUser ? 'text-black/50' : 'text-muted-foreground'}`}>
          {new Date(message.timestamp).toLocaleTimeString('ru-RU')}
        </p>
      </div>
    </div>
  );
}
