// ============================================================
// BL-044: Load Testing — Spike Test
// 10x normal traffic spike
// ============================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },    // Normal
    { duration: '10s', target: 500 },   // Spike!
    { duration: '1m', target: 500 },    // Sustained spike
    { duration: '10s', target: 10 },    // Recovery
    { duration: '1m', target: 10 },     // Post-spike
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, { 'status 200': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);
  sleep(0.05);
}
