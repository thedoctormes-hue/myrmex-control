import { Router, Request, Response } from 'express';
import { readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import multer from 'multer';
import { readState, writeState, createLogEntry } from '../myrmex.js';
import type { MyrmexFile } from '@shared/types.js';

export const router = Router();

// Multer config — store files in inbox/ or outbox/
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = _req.query.dir === 'outbox' ? 'outbox' : 'inbox';
    const fullPath = join(process.cwd(), dir);
    if (!existsSync(fullPath)) mkdirSync(fullPath, { recursive: true });
    cb(null, fullPath);
  },
  filename: (_req, file, cb) => {
    // Sanitize filename: keep only safe chars
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

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
  } catch {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// POST /api/files/upload — загрузить файл
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не прикреплён' });
    }

    const dir = req.query.dir === 'outbox' ? 'outbox' : 'inbox';
    const now = new Date().toISOString();

    const fileEntry: MyrmexFile = {
      id: `${dir}/${req.file.filename}`,
      name: req.file.originalname,
      path: `${dir}/${req.file.filename}`,
      size: req.file.size,
      mime_type: req.file.mimetype || guessMimeType(req.file.originalname),
      uploaded_by: req.body.uploaded_by || 'ui',
      uploaded_at: now,
    };

    // Add to state
    const state = readState();
    state.files.unshift(fileEntry);
    // Keep max 200 files in state
    if (state.files.length > 200) state.files.length = 200;
    await writeState(state, 'ui', createLogEntry(
      'ui', 'create', 'file', fileEntry.id, { name: fileEntry.name, size: fileEntry.size }
    ));

    res.status(201).json(fileEntry);
  } catch {
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// DELETE /api/files/:id — удалить файл
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const state = readState();
    const idx = state.files.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'File not found' });

    const deleted = state.files.splice(idx, 1)[0];
    await writeState(state, 'ui', createLogEntry(
      'ui', 'delete', 'file', deleted.id, { name: deleted.name }
    ));

    res.json({ success: true, id: deleted.id });
  } catch {
    res.status(500).json({ error: 'Failed to delete file' });
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
