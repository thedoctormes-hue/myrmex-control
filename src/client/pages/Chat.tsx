// ============================================================
// Chat — BL-028: WebSocket Chat Panel страница
// ============================================================

import { useState } from 'react';
import { AgentChat } from '../features/chat/AgentChat';
import type { MyrmexState } from '@shared/types';
import { t, useLang } from '../shared/lib/i18n';

interface Props {
  state: MyrmexState | null;
}

export default function Chat({ state }: Props) {
  const [lang] = useLang();
  const [expanded, setExpanded] = useState(false);
  const agents = state?.agents || [];

  if (expanded) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <AgentChat agents={agents} onClose={() => setExpanded(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('chat.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('chat.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="px-4 py-2 bg-amber-500 text-black rounded-md text-sm font-medium hover:bg-amber-400 transition"
        >
          {t('chat.open')}
        </button>
      </div>

      {/* Agent cards */}
      {agents.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="text-4xl mb-3">🤖</div>
          <h2 className="text-lg font-semibold mb-1">{t('chat.noAgents')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('chat.addAgents')}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setExpanded(true)}
              className="bg-card border border-border rounded-lg p-4 text-left hover:border-amber-500/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-3 h-3 rounded-full ${
                  agent.status === 'working' ? 'bg-green-500' :
                  agent.status === 'idle' ? 'bg-amber-500' :
                  agent.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
                <span className="font-medium text-foreground">{agent.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{agent.role} · {agent.model}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('chat.lastSeen')}: {new Date(agent.last_seen).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
