import { Router, Request, Response } from 'express';
import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

export const router = Router();

// GET /api/files — список файлов из inbox/ и outbox/
router.get('/', (req: Request, res: Response) => {
  try {
    const dir = req.query.dir === 'outbox' ? 'outbox' : 'inbox';
    const fullPath = join(process.cwd(), dir);

    if (!existsSync(fullPath)) {
      return res.json([]);
    }

    const files = readdirSync(fullPath)
      .filter(name => !name.startsWith('.'))
      .map(name => {
        const filePath = join(fullPath, name);
        const stat = statSync(filePath);
        return {
          id: `${dir}/${name}`,
          name,
          path: `${dir}/${name}`,
          size: stat.size,
          mime_type: guessMimeType(name),
          uploaded_by: 'system',
          uploaded_at: stat.birthtime.toISOString(),
        };
      });

    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

function guessMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    zip: 'application/zip',
  };
  return map[ext || ''] || 'application/octet-stream';
}
