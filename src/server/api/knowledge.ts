// ============================================================
// BL-043: Lab Knowledge Graph
// Unified index всех сущностей + graph analytics
// ============================================================

import { Router, Request, Response } from 'express';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export const router = Router();

// --- Types ---

interface GraphNode {
  id: string;
  type: 'agent' | 'project' | 'task' | 'artifact' | 'skill' | 'server' | 'user';
  label: string;
  status: string;
  metadata: Record<string, unknown>;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string; // 'assigned_to', 'belongs_to', 'depends_on', 'links_to', 'runs_on'
  weight?: number;
}

interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  generated_at: string;
  stats: {
    total_nodes: number;
    total_edges: number;
    by_type: Record<string, number>;
  };
}

// --- Build graph from myrmex.json + artifacts ---

function buildGraph(): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const byType: Record<string, number> = {};

  // Load myrmex state
  try {
    const statePath = process.env.MYRMEX_FILE || join(process.cwd(), '../../myrmex.json');
    if (existsSync(statePath)) {
      const state = JSON.parse(readFileSync(statePath, 'utf-8'));

      // Projects
      for (const p of (state.projects || [])) {
        nodes.push({ id: p.id, type: 'project', label: p.name, status: p.status, metadata: { color: p.color, icon: p.icon } });
        byType['project'] = (byType['project'] || 0) + 1;
      }

      // Agents
      for (const a of (state.agents || [])) {
        nodes.push({ id: a.id, type: 'agent', label: a.name, status: a.status, metadata: { role: a.role, model: a.model } });
        byType['agent'] = (byType['agent'] || 0) + 1;

        // Agent → Project
        if (a.project_id) {
          edges.push({ source: a.id, target: a.project_id, type: 'assigned_to' });
        }
        // Agent → Task
        if (a.current_task_id) {
          edges.push({ source: a.id, target: a.current_task_id, type: 'working_on' });
        }
      }

      // Tasks
      for (const t of (state.tasks || [])) {
        nodes.push({ id: t.id, type: 'task', label: t.title, status: t.status, metadata: { priority: t.priority } });
        byType['task'] = (byType['task'] || 0) + 1;

        // Task → Project
        if (t.project_id) {
          edges.push({ source: t.id, target: t.project_id, type: 'belongs_to' });
        }
        // Task → Agent
        if (t.assignee_id) {
          edges.push({ source: t.id, target: t.assignee_id, type: 'assigned_to' });
        }
        // Task dependencies
        for (const dep of (t.dependencies || [])) {
          edges.push({ source: t.id, target: dep, type: 'depends_on' });
        }
      }

      // Servers
      for (const s of (state.servers || [])) {
        nodes.push({ id: s.id, type: 'server', label: s.name, status: s.status, metadata: { host: s.host, port: s.port } });
        byType['server'] = (byType['server'] || 0) + 1;
      }

      // Users
      for (const u of (state.users || [])) {
        nodes.push({ id: u.id, type: 'user', label: u.username, status: u.role, metadata: { role: u.role } });
        byType['user'] = (byType['user'] || 0) + 1;
      }
    }
  } catch (err) {
    console.error('[KnowledgeGraph] Error loading state:', err);
  }

  // Load artifacts (BL, INC, PAT, RUL, ADR)
  const artifactDirs = [
    { dir: join(process.cwd(), '../specs'), type: 'artifact' },
    { dir: join(process.cwd(), '../incidents'), type: 'artifact' },
    { dir: join(process.cwd(), '../patterns'), type: 'artifact' },
    { dir: join(process.cwd(), '../rules'), type: 'artifact' },
    { dir: join(process.cwd(), '../adr'), type: 'artifact' },
  ];

  for (const { dir, type } of artifactDirs) {
    if (!existsSync(dir)) continue;
    try {
      const files = readdirSync(dir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const id = file.replace('.md', '');
        const content = readFileSync(join(dir, file), 'utf-8');
        const titleMatch = content.match(/^#\s+(.+)/m);
        const title = titleMatch ? titleMatch[1] : id;

        nodes.push({ id, type: type as GraphNode['type'], label: title, status: 'active', metadata: { file } });
        byType['artifact'] = (byType['artifact'] || 0) + 1;

        // Extract links from content
        const linkRefs = content.match(/\[(BL|INC|PAT|RUL|ADR)-\d+\]/g) || [];
        for (const ref of linkRefs) {
          const targetId = ref.replace(/[\[\]]/g, '');
          edges.push({ source: id, target: targetId, type: 'links_to', weight: 1 });
        }
      }
    } catch {}
  }

  // Load skills from skill-registry.json
  try {
    const regPath = join(process.cwd(), 'skill-registry.json');
    if (existsSync(regPath)) {
      const reg = JSON.parse(readFileSync(regPath, 'utf-8'));
      for (const skill of (reg.skills || [])) {
        nodes.push({ id: skill.id, type: 'skill', label: skill.name, status: skill.status, metadata: { version: skill.version, category: skill.category } });
        byType['skill'] = (byType['skill'] || 0) + 1;

        for (const dep of (skill.dependencies || [])) {
          edges.push({ source: skill.id, target: dep, type: 'depends_on' });
        }
      }
    }
  } catch {}

  return {
    nodes,
    edges,
    generated_at: new Date().toISOString(),
    stats: {
      total_nodes: nodes.length,
      total_edges: edges.length,
      by_type: byType,
    },
  };
}

// --- Graph Analytics ---

function computeCentrality(graph: KnowledgeGraph): Record<string, number> {
  const degree: Record<string, number> = {};
  for (const node of graph.nodes) {
    degree[node.id] = 0;
  }
  for (const edge of graph.edges) {
    degree[edge.source] = (degree[edge.source] || 0) + 1;
    degree[edge.target] = (degree[edge.target] || 0) + 1;
  }
  return degree;
}

function findClusters(graph: KnowledgeGraph): string[][] {
  const adj = new Map<string, Set<string>>();
  for (const node of graph.nodes) adj.set(node.id, new Set());
  for (const edge of graph.edges) {
    adj.get(edge.source)?.add(edge.target);
    adj.get(edge.target)?.add(edge.source);
  }

  const visited = new Set<string>();
  const clusters: string[][] = [];

  for (const node of graph.nodes) {
    if (visited.has(node.id)) continue;

    const cluster: string[] = [];
    const queue = [node.id];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (visited.has(curr)) continue;
      visited.add(curr);
      cluster.push(curr);

      for (const neighbor of (adj.get(curr) || [])) {
        if (!visited.has(neighbor)) queue.push(neighbor);
      }
    }

    if (cluster.length > 1) clusters.push(cluster);
  }

  return clusters;
}

function findPath(graph: KnowledgeGraph, sourceId: string, targetId: string): string[] | null {
  const adj = new Map<string, string[]>();
  for (const node of graph.nodes) adj.set(node.id, []);
  for (const edge of graph.edges) {
    adj.get(edge.source)?.push(edge.target);
  }

  const visited = new Set<string>();
  const queue: string[][] = [[sourceId]];

  while (queue.length > 0) {
    const path = queue.shift()!;
    const curr = path[path.length - 1];

    if (curr === targetId) return path;
    if (visited.has(curr)) continue;
    visited.add(curr);

    for (const neighbor of (adj.get(curr) || [])) {
      if (!visited.has(neighbor)) {
        queue.push([...path, neighbor]);
      }
    }
  }

  return null;
}

// --- Routes ---

/** GET /api/knowledge/graph — full graph */
router.get('/graph', (_req: Request, res: Response) => {
  const graph = buildGraph();
  res.json(graph);
});

/** GET /api/knowledge/graph/stats — graph statistics */
router.get('/graph/stats', (_req: Request, res: Response) => {
  const graph = buildGraph();
  const centrality = computeCentrality(graph);
  const clusters = findClusters(graph);

  const topNodes = Object.entries(centrality)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, score]) => {
      const node = graph.nodes.find(n => n.id === id);
      return { id, score, label: node?.label || id, type: node?.type };
    });

  res.json({
    ...graph.stats,
    clusters_count: clusters.length,
    clusters,
    top_nodes: topNodes,
  });
});

/** GET /api/knowledge/graph/node/:id — node details + related */
router.get('/graph/node/:id', (req: Request, res: Response) => {
  const graph = buildGraph();
  const { id } = req.params;

  const node = graph.nodes.find(n => n.id === id);
  if (!node) {
    res.status(404).json({ error: 'Node not found' });
    return;
  }

  const related = graph.edges
    .filter(e => e.source === id || e.target === id)
    .map(e => {
      const otherId = e.source === id ? e.target : e.source;
      const other = graph.nodes.find(n => n.id === otherId);
      return {
        edge_type: e.type,
        node: other || { id: otherId, type: 'unknown', label: otherId, status: 'unknown', metadata: {} },
      };
    });

  const centrality = computeCentrality(graph);

  res.json({
    node,
    related,
    centrality_score: centrality[id] || 0,
    history_timeline: [], // placeholder for future
  });
});

/** GET /api/knowledge/graph/path — path finding */
router.get('/graph/path', (req: Request, res: Response) => {
  const { from, to } = req.query as { from: string; to: string };

  if (!from || !to) {
    res.status(400).json({ error: 'from and to required' });
    return;
  }

  const graph = buildGraph();
  const path = findPath(graph, from, to);

  if (!path) {
    res.status(404).json({ error: 'No path found' });
    return;
  }

  const pathNodes = path.map(id => graph.nodes.find(n => n.id === id)).filter(Boolean);

  res.json({ path: pathNodes, length: path.length - 1 });
});

/** GET /api/knowledge/search — search nodes */
router.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string || '').toLowerCase();
  const type = req.query.type as string | undefined;

  if (!q) {
    res.status(400).json({ error: 'q parameter required' });
    return;
  }

  const graph = buildGraph();
  let nodes = graph.nodes;

  if (type) nodes = nodes.filter(n => n.type === type);

  const results = nodes
    .filter(n =>
      n.id.toLowerCase().includes(q) ||
      n.label.toLowerCase().includes(q) ||
      JSON.stringify(n.metadata).toLowerCase().includes(q)
    )
    .slice(0, 20);

  res.json({ query: q, results });
});
