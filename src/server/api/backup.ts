import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const BACKUP_DIR = '/root/LabDoctorM/backups';
const PROJECT_DIR = '/root/LabDoctorM/projects/myrmex-control';
const MYRMEX_FILE = process.env.MYRMEX_FILE || 'myrmex.json';

export const router = Router();

// POST /api/backup/create — ручной бэкап
router.post('/create', (req: Request, res: Response) => {
  try {
    const label = req.body.label || 'manual';
    const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = join(BACKUP_DIR, `myrmex-${label}-${date}.json`);

    execSync(`mkdir -p "${BACKUP_DIR}"`);
    execSync(`cp "${join(PROJECT_DIR, MYRMEX_FILE)}" "${backupFile}"`);

    const stats = statSync(backupFile);
    res.json({
      success: true,
      file: backupFile,
      size_bytes: stats.size,
      created_at: stats.mtime.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Backup failed', details: (err as Error).message });
  }
});

// GET /api/backup/list — список бэкапов
router.get('/list', (_req: Request, res: Response) => {
  try {
    if (!existsSync(BACKUP_DIR)) {
      return res.json({ backups: [], total: 0 });
    }

    const files = readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('myrmex-') && f.endsWith('.json'))
      .map(f => {
        const filePath = join(BACKUP_DIR, f);
        const stats = statSync(filePath);
        return {
          filename: f,
          path: filePath,
          size_bytes: stats.size,
          created_at: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const totalSize = files.reduce((sum, f) => sum + f.size_bytes, 0);

    res.json({
      backups: files,
      total: files.length,
      total_size_bytes: totalSize,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list backups', details: (err as Error).message });
  }
});

// POST /api/backup/restore — восстановление из бэкапа
router.post('/restore', (req: Request, res: Response) => {
  try {
    const { filename } = req.body;
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'filename is required' });
    }

    // Безопасность: только файлы из BACKUP_DIR
    const backupFile = join(BACKUP_DIR, filename.replace(/[^a-zA-Z0-9._-]/g, ''));
    if (!existsSync(backupFile)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    // Бэкап текущего перед восстановлением
    const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const preRestore = join(BACKUP_DIR, `myrmex-pre-restore-${date}.json`);
    execSync(`cp "${join(PROJECT_DIR, MYRMEX_FILE)}" "${preRestore}"`);
    execSync(`cp "${backupFile}" "${join(PROJECT_DIR, MYRMEX_FILE)}"`);

    res.json({ success: true, restored_from: filename, pre_restore_backup: preRestore });
  } catch (err) {
    res.status(500).json({ error: 'Restore failed', details: (err as Error).message });
  }
});