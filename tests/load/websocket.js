// ============================================================
// BL-044: Load Testing — WebSocket Stress Test
// 500+ concurrent WebSocket connections
// Target: <1% packet loss
// ============================================================

import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const messagesSent = new Counter('ws_messages_sent');
const messagesReceived = new Counter('ws_messages_received');
const connectionErrors = new Rate('ws_connection_errors');

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 300 },
    { duration: '2m', target: 500 },
    { duration: '2m', target: 500 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    ws_connection_errors: ['rate<0.01'],
  },
};

const WS_URL = __ENV.WS_URL || 'ws://localhost:3000/ws';

export default function () {
  const res = ws.connect(WS_URL, null, function (socket) {
    let msgCount = 0;

    socket.on('open', () => {
      // Send ping
      socket.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString(), payload: {} }));
      messagesSent.add(1);
    });

    socket.on('message', (data) => {
      messagesReceived.add(1);
      msgCount++;

      // Send a chat message every 5th message
      if (msgCount % 5 === 0) {
        socket.send(JSON.stringify({
          type: 'chat',
          agent_id: `agent-${__VU}`,
          timestamp: new Date().toISOString(),
          payload: { message: `Load test message from VU ${__VU}` },
        }));
        messagesSent.add(1);
      }
    });

    socket.on('close', () => {});

    socket.on('error', (e) => {
      connectionErrors.add(1);
    });

    // Keep connection open for 30s
    socket.setTimeout(() => {
      socket.close();
    }, 30000);

    // Send periodic pings
    socket.setInterval(() => {
      socket.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString(), payload: {} }));
      messagesSent.add(1);
    }, 5000);
  });

  check(res, { 'WebSocket connected': (r) => r && r.status === 101 });
  sleep(1);
}
