import { Router, Request, Response } from 'express';
import { readState } from '../myrmex.js';

export const router = Router();

// GET /api/state — полное состояние (для инициализации клиента)
router.get('/', (_req: Request, res: Response) => {
  try {
    const state = readState();
    res.json(state);
  } catch {
    res.status(500).json({ error: 'Failed to read myrmex state' });
  }
});

// GET /api/state/export?format=json|csv — экспорт данных
router.get('/export', (req: Request, res: Response) => {
  try {
    const state = readState();
    const format = req.query.format === 'csv' ? 'csv' : 'json';

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="myrmex-export.json"');
      res.json(state);
      return;
    }

    // CSV export — tasks
    const headers = ['id', 'title', 'status', 'priority', 'project_id', 'assignee_id', 'created_at', 'updated_at'];
    const rows = state.tasks.map(t =>
      headers.map(h => {
        const val = (t as unknown as Record<string, unknown>)[h];
        const str = val == null ? '' : String(val);
        return str.includes(',') ? `"${str}"` : str;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="myrmex-tasks.csv"');
    res.send(csv);
  } catch {
    res.status(500).json({ error: 'Failed to export' });
  }
});
