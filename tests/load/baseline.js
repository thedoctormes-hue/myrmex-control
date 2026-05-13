// ============================================================
// BL-044: Load Testing — Baseline Test
// 100 concurrent users, 2 min duration
// Target: API latency p95 < 500ms
// ============================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up
    { duration: '1m', target: 100 },   // Ramp to 100
    { duration: '2m', target: 100 },   // Stay at 100
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // p95 < 500ms
    http_req_failed: ['rate<0.01'],     // <1% errors
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Health check (public)
  const healthRes = http.get(`${BASE_URL}/api/health`);
  const healthOk = check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(!healthOk);
  apiLatency.add(healthRes.timings.duration);

  sleep(0.5);

  // Version endpoint (public)
  const verRes = http.get(`${BASE_URL}/api/version`);
  const verOk = check(verRes, {
    'version status 200': (r) => r.status === 200,
  });
  errorRate.add(!verOk);

  sleep(0.5);

  // Skills list (public-ish)
  const skillsRes = http.get(`${BASE_URL}/api/skills`);
  const skillsOk = check(skillsRes, {
    'skills status 200': (r) => r.status === 200,
  });
  errorRate.add(!skillsOk);

  sleep(1);
}
