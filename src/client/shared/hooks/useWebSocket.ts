// ============================================================
// useWebSocket — BL-028: WebSocket hook для real-time коммуникации
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';

export type WSMessageType = 'chat' | 'status' | 'event' | 'error' | 'ping' | 'pong';

export interface WSMessage {
  type: WSMessageType;
  agent_id?: string;
  timestamp: string;
  payload: Record<string, unknown>;
  status?: 'online' | 'busy' | 'offline';
}

export interface UseWebSocketReturn {
  connected: boolean;
  messages: WSMessage[];
  send: (msg: Omit<WSMessage, 'timestamp'>) => void;
  onlineAgents: Array<{ clientId: string; agentId: string | null; connectedAt: number }>;
  error: string | null;
}

const WS_RECONNECT_DELAY = 3000;
const WS_MAX_RECONNECT = 10;

export function useWebSocket(agentId?: string): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [onlineAgents, setOnlineAgents] = useState<Array<{ clientId: string; agentId: string | null; connectedAt: number }>>([]);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectCount.current = 0;
        console.log('[WS] Connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          setMessages(prev => {
            const next = [...prev, msg];
            // Keep last 200 messages
            return next.length > 200 ? next.slice(-200) : next;
          });
        } catch {
          // Ignore invalid messages
        }
      };

      ws.onclose = (event) => {
        setConnected(false);
        wsRef.current = null;

        if (!event.wasClean && reconnectCount.current < WS_MAX_RECONNECT) {
          reconnectCount.current++;
          console.log(`[WS] Reconnecting (${reconnectCount.current}/${WS_MAX_RECONNECT})...`);
          reconnectTimer.current = setTimeout(connect, WS_RECONNECT_DELAY);
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection failed');
      };
    } catch (err) {
      setError('Failed to create WebSocket');
    }
  }, []);

  const send = useCallback((msg: Omit<WSMessage, 'timestamp'>) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setError('WebSocket not connected');
      return;
    }
    const full: WSMessage = { ...msg, timestamp: new Date().toISOString() };
    wsRef.current.send(JSON.stringify(full));
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { connected, messages, send, onlineAgents, error };
}
