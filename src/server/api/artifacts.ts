// ============================================================
// BL-035: Artifact CRUD System с Frontmatter
// YAML frontmatter CRUD для BL, INC, PAT, RUL, ADR, Skills, Agents
// ============================================================

import { Router, Request, Response } from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import crypto from 'crypto';

export const router = Router();

// --- Types ---

type ArtifactType = 'BL' | 'INC' | 'PAT' | 'RUL' | 'ADR' | 'SKILL' | 'AGENT';
type ArtifactStatus = 'draft' | 'review' | 'approved' | 'active' | 'deprecated' | 'archived';

interface ArtifactFrontmatter {
  id: string;
  type: ArtifactType;
  title: string;
  status: ArtifactStatus;
  created: string;
  updated: string;
  author: string;
  tags: string[];
  links: string[];       // e.g. ['BL-001', 'ADR-005']
  description?: string;
  version?: string;
}

interface Artifact {
  frontmatter: ArtifactFrontmatter;
  content: string;
  file_path: string;
}

// --- Storage ---

const ARTIFACTS_DIRS: Record<ArtifactType, string> = {
  BL: join(process.cwd(), '../specs'),
  INC: join(process.cwd(), '../incidents'),
  PAT: join(process.cwd(), '../patterns'),
  RUL: join(process.cwd(), '../rules'),
  ADR: join(process.cwd(), '../adr'),
  SKILL: join(process.cwd(), '../../.qwen/skills'),
  AGENT: join(process.cwd(), '../../.qwen/agents'),
};

// --- Helpers ---

function parseFrontmatter(raw: string): { frontmatter: Record<string, any>; body: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };

  const yamlBlock = match[1];
  const body = match[2];
  const fm: Record<string, any> = {};

  for (const line of yamlBlock.split('\n')) {
    const kvMatch = line.match(/^(\w[\w_]*):\s*(.*)/);
    if (kvMatch) {
      const key = kvMatch[1];
      const rawVal = kvMatch[2].trim();
      let val: string | string[] = rawVal;
      // Array syntax
      if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
        val = rawVal.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
      }
      // Remove quotes
      else if ((rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"))) {
        val = rawVal.slice(1, -1);
      }

      fm[key] = val;
    }
  }

  return { frontmatter: fm, body };
}

function serializeFrontmatter(fm: Record<string, any>, body: string): string {
  const lines = ['---'];
  for (const [key, val] of Object.entries(fm)) {
    if (Array.isArray(val)) {
      lines.push(`${key}: [${val.map(v => `"${v}"`).join(', ')}]`);
    } else if (typeof val === 'boolean') {
      lines.push(`${key}: ${val}`);
    } else {
      lines.push(`${key}: ${val}`);
    }
  }
  lines.push('---');
  lines.push('');
  return lines.join('\n') + body;
}

function scanArtifacts(dir: string, type: ArtifactType): Artifact[] {
  const results: Artifact[] = [];

  if (!existsSync(dir)) return results;

  function scan(directory: string) {
    let entries: string[];
    try {
      entries = readdirSync(directory);
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = join(directory, entry);
      try {
        const s = statSync(full);
        if (s.isDirectory()) {
          scan(full);
        } else if (entry.endsWith('.md')) {
          try {
            const raw = readFileSync(full, 'utf-8');
            const { frontmatter, body } = parseFrontmatter(raw);
            results.push({
              frontmatter: {
                id: frontmatter.id || basename(full, '.md'),
                type,
                title: frontmatter.title || frontmatter.name || basename(full, '.md'),
                status: (frontmatter.status || 'active') as ArtifactStatus,
                created: frontmatter.created || new Date(s.birthtime).toISOString(),
                updated: frontmatter.updated || new Date(s.mtime).toISOString(),
                author: frontmatter.author || 'system',
                tags: frontmatter.tags || [],
                links: frontmatter.links || [],
                description: frontmatter.description,
                version: frontmatter.version,
              },
              content: body,
              file_path: full,
            });
          } catch {
            // skip unreadable
          }
        }
      } catch {
        // skip
      }
    }
  }

  scan(dir);
  return results;
}

function findArtifactFile(id: string, type: ArtifactType): string | null {
  const dir = ARTIFACTS_DIRS[type];
  if (!existsSync(dir)) return null;

  function scan(directory: string): string | null {
    let entries: string[];
    try {
      entries = readdirSync(directory);
    } catch {
      return null;
    }

    for (const entry of entries) {
      const full = join(directory, entry);
      try {
        const s = statSync(full);
        if (s.isDirectory()) {
          const found = scan(full);
          if (found) return found;
        } else if (entry.endsWith('.md')) {
          const raw = readFileSync(full, 'utf-8');
          const { frontmatter } = parseFrontmatter(raw);
          if (frontmatter.id === id || basename(full, '.md') === id) {
            return full;
          }
        }
      } catch { /* skip */ }
    }
    return null;
  }

  return scan(dir);
}

// --- Routes ---

/** GET /api/artifacts — list all artifacts (with optional type filter) */
router.get('/', (req: Request, res: Response) => {
  const typeFilter = req.query.type as ArtifactType | undefined;
  const search = (req.query.search as string || '').toLowerCase();
  const tag = req.query.tag as string | undefined;

  let all: Artifact[] = [];

  const types: ArtifactType[] = typeFilter ? [typeFilter] : ['BL', 'INC', 'PAT', 'RUL', 'ADR', 'SKILL', 'AGENT'];

  for (const type of types) {
    all = all.concat(scanArtifacts(ARTIFACTS_DIRS[type], type));
  }

  // Filter by search
  if (search) {
    all = all.filter(a =>
      a.frontmatter.id.toLowerCase().includes(search) ||
      a.frontmatter.title.toLowerCase().includes(search) ||
      a.content.toLowerCase().includes(search)
    );
  }

  // Filter by tag
  if (tag) {
    all = all.filter(a => a.frontmatter.tags.includes(tag));
  }

  // Return light version (no content)
  const light = all.map(a => ({
    id: a.frontmatter.id,
    type: a.frontmatter.type,
    title: a.frontmatter.title,
    status: a.frontmatter.status,
    author: a.frontmatter.author,
    tags: a.frontmatter.tags,
    links: a.frontmatter.links,
    updated: a.frontmatter.updated,
  }));

  res.json({ total: light.length, artifacts: light });
});

/** GET /api/artifacts/:id — get single artifact */
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const type = (req.query.type as ArtifactType) || null;

  const types: ArtifactType[] = type ? [type] : ['BL', 'INC', 'PAT', 'RUL', 'ADR', 'SKILL', 'AGENT'];

  for (const t of types) {
    const filePath = findArtifactFile(id, t);
    if (filePath) {
      const raw = readFileSync(filePath, 'utf-8');
      const { frontmatter, body } = parseFrontmatter(raw);
      res.json(frontmatter);
      return;
    }
  }

  res.status(404).json({ error: 'Artifact not found' });
});

/** GET /api/artifacts/:id/full — get artifact with content */
router.get('/:id/full', (req: Request, res: Response) => {
  const { id } = req.params;

  for (const type of Object.keys(ARTIFACTS_DIRS) as ArtifactType[]) {
    const filePath = findArtifactFile(id, type);
    if (filePath) {
      const raw = readFileSync(filePath, 'utf-8');
      const { frontmatter, body } = parseFrontmatter(raw);
      res.json({ frontmatter, content: body, file_path: filePath });
      return;
    }
  }

  res.status(404).json({ error: 'Artifact not found' });
});

/** POST /api/artifacts — create new artifact */
router.post('/', (req: Request, res: Response) => {
  const { type, title, content, tags, links, author } = req.body as {
    type: ArtifactType; title: string; content?: string;
    tags?: string[]; links?: string[]; author?: string;
  };

  if (!type || !title) {
    res.status(400).json({ error: 'type and title required' });
    return;
  }

  const id = `${type}-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();

  const frontmatter: ArtifactFrontmatter = {
    id,
    type,
    title,
    status: 'draft',
    created: now,
    updated: now,
    author: author || 'system',
    tags: tags || [],
    links: links || [],
    description: req.body.description,
    version: req.body.version || '1.0.0',
  };

  const dir = ARTIFACTS_DIRS[type];
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const fileName = `${id}-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9а-я-]/gi, '')}.md`;
  const filePath = join(dir, fileName);
  const body = content || `# ${title}\n`;

  writeFileSync(filePath, serializeFrontmatter(frontmatter as any, body), 'utf-8');

  res.status(201).json({ ...frontmatter, file_path: filePath });
});

/** PUT /api/artifacts/:id — update artifact */
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  for (const type of Object.keys(ARTIFACTS_DIRS) as ArtifactType[]) {
    const filePath = findArtifactFile(id, type);
    if (filePath) {
      const raw = readFileSync(filePath, 'utf-8');
      const { frontmatter, body } = parseFrontmatter(raw);

      // Update fields
      if (req.body.title) frontmatter.title = req.body.title;
      if (req.body.status) frontmatter.status = req.body.status;
      if (req.body.tags) frontmatter.tags = req.body.tags;
      if (req.body.links) frontmatter.links = req.body.links;
      if (req.body.description !== undefined) frontmatter.description = req.body.description;
      if (req.body.version) frontmatter.version = req.body.version;
      frontmatter.updated = new Date().toISOString();

      const newContent = req.body.content !== undefined ? req.body.content : body;

      writeFileSync(filePath, serializeFrontmatter(frontmatter, newContent), 'utf-8');
      res.json(frontmatter);
      return;
    }
  }

  res.status(404).json({ error: 'Artifact not found' });
});

/** DELETE /api/artifacts/:id — soft delete (archive) */
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const hard = req.query.hard === 'true';

  for (const type of Object.keys(ARTIFACTS_DIRS) as ArtifactType[]) {
    const filePath = findArtifactFile(id, type);
    if (filePath) {
      if (hard) {
        unlinkSync(filePath);
        res.json({ message: 'Artifact permanently deleted', id });
      } else {
        // Soft delete — update status to archived
        const raw = readFileSync(filePath, 'utf-8');
        const { frontmatter, body } = parseFrontmatter(raw);
        frontmatter.status = 'archived';
        frontmatter.updated = new Date().toISOString();
        writeFileSync(filePath, serializeFrontmatter(frontmatter, body), 'utf-8');
        res.json({ message: 'Artifact archived', id });
      }
      return;
    }
  }

  res.status(404).json({ error: 'Artifact not found' });
});

/** GET /api/artifacts/graph — dependency graph */
router.get('/graph/data', (_req: Request, res: Response) => {
  const nodes: Array<{ id: string; type: string; title: string; status: string }> = [];
  const edges: Array<{ source: string; target: string; type: string }> = [];

  for (const type of Object.keys(ARTIFACTS_DIRS) as ArtifactType[]) {
    const artifacts = scanArtifacts(ARTIFACTS_DIRS[type], type);
    for (const a of artifacts) {
      nodes.push({
        id: a.frontmatter.id,
        type: a.frontmatter.type,
        title: a.frontmatter.title,
        status: a.frontmatter.status,
      });

      for (const link of a.frontmatter.links) {
        edges.push({ source: a.frontmatter.id, target: link, type: 'links_to' });
      }
    }
  }

  res.json({ nodes, edges });
});
