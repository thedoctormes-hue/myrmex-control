// ============================================================
// Audit Log API — просмотр changelog
// ============================================================

import { Router, Request, Response } from 'express';
import { readState } from '../myrmex.js';

export const router = Router();

interface AuditLogQuery {
  entity_type?: string;
  entity_id?: string;
  source?: string;
  action?: string;
  limit?: string;
  offset?: string;
}

router.get('/', async (req: Request<object, object, object, AuditLogQuery>, res: Response) => {
  const state = await readState();
  const {
    entity_type,
    entity_id,
    source,
    action,
    limit: limitStr = '50',
    offset: offsetStr = '0',
  } = req.query;

  let entries = [...state.changelog];

  // Filters
  if (entity_type) {
    entries = entries.filter(e => e.entity_type === entity_type);
  }
  if (entity_id) {
    entries = entries.filter(e => e.entity_id === entity_id);
  }
  if (source) {
    entries = entries.filter(e => e.source === source);
  }
  if (action) {
    entries = entries.filter(e => e.action === action);
  }

  const total = entries.length;
  const limit = Math.min(parseInt(limitStr, 10) || 50, 200);
  const offset = parseInt(offsetStr, 10) || 0;

  entries = entries.slice(offset, offset + limit);

  res.json({
    entries,
    total,
    limit,
    offset,
  });
});

// Entity types for filter dropdown
router.get('/entity-types', async (_req: Request, res: Response) => {
  const state = await readState();
  const types = [...new Set(state.changelog.map(e => e.entity_type))];
  res.json(types);
});

// Sources for filter dropdown
router.get('/sources', async (_req: Request, res: Response) => {
  const state = await readState();
  const sources = [...new Set(state.changelog.map(e => e.source))];
  res.json(sources);
});
