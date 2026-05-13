// ============================================================
// WebSocket Server — real-time коммуникация с агентами
// BL-028: WebSocket Chat Panel
// ============================================================

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import crypto from 'crypto';

// --- Types ---

export interface WSClient {
  id: string;
  ws: WebSocket;
  agentId: string | null;
  isAlive: boolean;
  connectedAt: number;
}

export type WSMessageType = 'chat' | 'status' | 'event' | 'error' | 'ping' | 'pong';

export interface WSMessage {
  type: WSMessageType;
  agent_id?: string;
  timestamp: string;
  payload: Record<string, unknown>;
  status?: 'online' | 'busy' | 'offline';
}

// --- Module state ---

let wss: WebSocketServer | null = null;
const clients = new Map<string, WSClient>();
const agentSubscriptions = new Map<string, Set<string>>(); // agentId → Set<clientId>

const HEARTBEAT_INTERVAL = 15_000; // 15s
const OFFLINE_TIMEOUT = 30_000; // 30s

// --- Init ---

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 64 * 1024, // 64KB
  });

  wss.on('connection', (ws, req) => {
    // Rate limit: extract IP
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
      || req.socket.remoteAddress
      || 'unknown';

    const clientId = crypto.randomUUID();
    const client: WSClient = {
      id: clientId,
      ws,
      agentId: null,
      isAlive: true,
      connectedAt: Date.now(),
    };

    clients.set(clientId, client);
    console.log(`[WS] Client connected: ${clientId} (${clients.size} total)`);

    // Rate limiting: max 10 msg/sec
    let msgCount = 0;
    let rateReset = Date.now() + 1000;

    ws.on('message', (raw: Buffer) => {
      // Rate limit check
      const now = Date.now();
      if (now > rateReset) {
        msgCount = 0;
        rateReset = now + 1000;
      }
      msgCount++;
      if (msgCount > 10) {
        sendToClient(clientId, {
          type: 'error',
          timestamp: new Date().toISOString(),
          payload: { message: 'Rate limit exceeded: max 10 msg/sec' },
        });
        return;
      }

      try {
        const data = JSON.parse(raw.toString()) as WSMessage;
        handleMessage(clientId, data);
      } catch {
        sendToClient(clientId, {
          type: 'error',
          timestamp: new Date().toISOString(),
          payload: { message: 'Invalid JSON' },
        });
      }
    });

    ws.on('pong', () => {
      client.isAlive = true;
    });

    ws.on('close', () => {
      handleDisconnect(clientId);
    });

    ws.on('error', (err) => {
      console.error(`[WS] Client ${clientId} error:`, err.message);
    });

    // Send welcome
    sendToClient(clientId, {
      type: 'event',
      timestamp: new Date().toISOString(),
      payload: { message: 'Connected to Myrmex Control', clientId },
    });
  });

  // Heartbeat interval — detect dead connections
  const heartbeat = setInterval(() => {
    if (!wss) { clearInterval(heartbeat); return; }
    for (const [clientId, client] of clients) {
      if (!client.isAlive) {
        console.log(`[WS] Client ${clientId} timed out, terminating`);
        client.ws.terminate();
        handleDisconnect(clientId);
        continue;
      }
      client.isAlive = false;
      client.ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  console.log(`[WS] WebSocket server initialized on /ws`);
}

// --- Message handling ---

function handleMessage(clientId: string, msg: WSMessage): void {
  const client = clients.get(clientId);
  if (!client) return;

  switch (msg.type) {
    case 'ping':
      sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString(), payload: {} });
      break;

    case 'chat': {
      // Chat message — broadcast to agent subscribers
      const agentId = msg.agent_id || client.agentId;
      if (!agentId) {
        sendToClient(clientId, {
          type: 'error',
          timestamp: new Date().toISOString(),
          payload: { message: 'agent_id required for chat messages' },
        });
        return;
      }

      // Ensure client is associated with agent
      if (!client.agentId) {
        client.agentId = agentId;
        subscribeToAgent(clientId, agentId);
      }

      const broadcastMsg: WSMessage = {
        type: 'chat',
        agent_id: agentId,
        timestamp: new Date().toISOString(),
        payload: msg.payload,
      };

      broadcastToAgent(agentId, broadcastMsg);
      break;
    }

    case 'status': {
      // Agent status update
      const agentId = msg.agent_id || client.agentId;
      if (!agentId) return;

      const statusMsg: WSMessage = {
        type: 'status',
        agent_id: agentId,
        timestamp: new Date().toISOString(),
        payload: msg.payload,
        status: (msg.status as 'online' | 'busy' | 'offline') || 'online',
      };

      broadcastToAgent(agentId, statusMsg);
      // Also broadcast to /ws/status subscribers
      broadcastToAll(statusMsg);
      break;
    }

    case 'event': {
      // General event — broadcast to all
      const eventMsg: WSMessage = {
        type: 'event',
        timestamp: new Date().toISOString(),
        payload: msg.payload,
      };
      broadcastToAll(eventMsg);
      break;
    }
  }
}

// --- Subscription management ---

function subscribeToAgent(clientId: string, agentId: string): void {
  if (!agentSubscriptions.has(agentId)) {
    agentSubscriptions.set(agentId, new Set());
  }
  agentSubscriptions.get(agentId)!.add(clientId);
}

function handleDisconnect(clientId: string): void {
  const client = clients.get(clientId);
  if (!client) return;

  // Remove from agent subscriptions
  if (client.agentId) {
    const subs = agentSubscriptions.get(client.agentId);
    if (subs) {
      subs.delete(clientId);
      if (subs.size === 0) agentSubscriptions.delete(client.agentId);
    }
  }

  clients.delete(clientId);
  console.log(`[WS] Client disconnected: ${clientId} (${clients.size} total)`);

  // Notify others that agent went offline (if it was an agent)
  if (client.agentId) {
    broadcastToAll({
      type: 'status',
      agent_id: client.agentId,
      timestamp: new Date().toISOString(),
      payload: {},
      status: 'offline',
    });
  }
}

// --- Send helpers ---

function sendToClient(clientId: string, msg: WSMessage): void {
  const client = clients.get(clientId);
  if (!client || client.ws.readyState !== WebSocket.OPEN) return;
  try {
    client.ws.send(JSON.stringify(msg));
  } catch (err) {
    console.error(`[WS] Send error to ${clientId}:`, err);
  }
}

function broadcastToAgent(agentId: string, msg: WSMessage): void {
  const subs = agentSubscriptions.get(agentId);
  if (!subs) return;
  for (const clientId of subs) {
    sendToClient(clientId, msg);
  }
}

function broadcastToAll(msg: WSMessage): void {
  for (const clientId of clients.keys()) {
    sendToClient(clientId, msg);
  }
}

// --- Public API ---

/** Get status of all connected agents */
export function getOnlineAgents(): Array<{ clientId: string; agentId: string | null; connectedAt: number }> {
  return Array.from(clients.values()).map(c => ({
    clientId: c.id,
    agentId: c.agentId,
    connectedAt: c.connectedAt,
  }));
}

/** Broadcast an event to all connected clients (for server-triggered events) */
export function broadcastEvent(payload: Record<string, unknown>): void {
  broadcastToAll({
    type: 'event',
    timestamp: new Date().toISOString(),
    payload,
  });
}

/** Graceful shutdown */
export function closeWebSocket(): void {
  if (!wss) return;
  for (const client of clients.values()) {
    client.ws.close(1000, 'Server shutting down');
  }
  wss.close();
  wss = null;
  clients.clear();
  agentSubscriptions.clear();
}
