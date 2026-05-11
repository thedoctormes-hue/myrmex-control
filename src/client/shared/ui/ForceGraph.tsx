import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================
// Force Graph — лёгкий SVG force-directed graph без D3
// Узлы перетаскиваются, зум колёсиком, клик выделяет
// ============================================================

export interface GraphNode {
  id: string;
  label: string;
  group: 'project' | 'agent' | 'server' | 'task' | 'artifact';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
}

const GROUP_COLORS: Record<GraphNode['group'], string> = {
  project: '#6366f1',
  agent: '#f59e0b',
  server: '#22c55e',
  task: '#3b82f6',
  artifact: '#8b5cf6',
};

const GROUP_ICONS: Record<GraphNode['group'], string> = {
  project: '📦',
  agent: '🤖',
  server: '🖥️',
  task: '📋',
  artifact: '📚',
};

const NODE_RADIUS = 24;

export function ForceGraph({ nodes, edges, width = 800, height = 500, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [dragging, setDragging] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Initialize positions
  useEffect(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      const r = Math.min(width, height) * 0.3;
      map.set(n.id, {
        x: n.x ?? width / 2 + r * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: n.y ?? height / 2 + r * Math.sin(angle) + (Math.random() - 0.5) * 40,
      });
    });
    setPositions(map);
  }, [nodes, width, height]);

  // Force simulation
  useEffect(() => {
    if (positions.size === 0) return;

    let running = true;
    const velocities = new Map<string, { vx: number; vy: number }>();
    nodes.forEach(n => velocities.set(n.id, { vx: 0, vy: 0 }));

    const simulate = () => {
      if (!running) return;

      const pos = new Map(positions);
      const vel = new Map(velocities);

      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const pa = pos.get(a.id)!, pb = pos.get(b.id)!;
          const dx = pa.x - pb.x, dy = pa.y - pb.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 2000 / (dist * dist);
          const fx = (dx / dist) * force, fy = (dy / dist) * force;
          const va = vel.get(a.id)!, vb = vel.get(b.id)!;
          vel.set(a.id, { vx: va.vx + fx, vy: va.vy + fy });
          vel.set(b.id, { vx: vb.vx - fx, vy: vb.vy - fy });
        }
      }

      // Attraction along edges
      edges.forEach(edge => {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target;
        const pa = pos.get(sourceId), pb = pos.get(targetId);
        if (!pa || !pb) return;
        const dx = pb.x - pa.x, dy = pb.y - pa.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 120) * 0.01;
        const fx = (dx / dist) * force, fy = (dy / dist) * force;
        const va = vel.get(sourceId)!, vb = vel.get(targetId)!;
        vel.set(sourceId, { vx: va.vx + fx, vy: va.vy + fy });
        vel.set(targetId, { vx: vb.vx - fx, vy: vb.vy - fy });
      });

      // Center gravity
      nodes.forEach(n => {
        const p = pos.get(n.id)!;
        const v = vel.get(n.id)!;
        vel.set(n.id, {
          vx: v.vx + (width / 2 - p.x) * 0.001,
          vy: v.vy + (height / 2 - p.y) * 0.001,
        });
      });

      // Update positions
      let moved = false;
      nodes.forEach(n => {
        if (dragging === n.id) return;
        const p = pos.get(n.id)!;
        const v = vel.get(n.id)!;
        const damping = 0.85;
        const newVx = v.vx * damping, newVy = v.vy * damping;
        vel.set(n.id, { vx: newVx, vy: newVy });
        const newX = p.x + newVx, newY = p.y + newVy;
        if (Math.abs(newVx) > 0.01 || Math.abs(newVy) > 0.01) moved = true;
        pos.set(n.id, { x: newX, y: newY });
      });

      velocities.clear();
      vel.forEach((v, k) => velocities.set(k, v));
      setPositions(new Map(pos));

      if (moved) {
        animRef.current = requestAnimationFrame(simulate);
      }
    };

    animRef.current = requestAnimationFrame(simulate);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [nodes, edges, positions, dragging, width, height]);

  const getSVGPoint = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  }, [zoom, pan]);

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDragging(nodeId);
    const pt = getSVGPoint(e);
    const pos = positions.get(nodeId);
    if (pos) {
      dragOffset.current = { x: pt.x - pos.x, y: pt.y - pos.y };
    }
  }, [getSVGPoint, positions]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const pt = getSVGPoint(e);
    const newPos = positions.get(dragging);
    if (newPos) {
      positions.set(dragging, {
        x: pt.x - dragOffset.current.x,
        y: pt.y - dragOffset.current.y,
      });
      setPositions(new Map(positions));
    }
  }, [dragging, getSVGPoint, positions]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.3, Math.min(3, z * delta)));
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelected(prev => prev === node.id ? null : node.id);
    onNodeClick?.(node);
  }, [onNodeClick]);

  // Build edge lines
  const edgeLines = edges.map(edge => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target;
    const sp = positions.get(sourceId);
    const tp = positions.get(targetId);
    if (!sp || !tp) return null;
    return { key: `${sourceId}-${targetId}`, x1: sp.x, y1: sp.y, x2: tp.x, y2: tp.y, label: edge.label };
  }).filter(Boolean);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="bg-background border border-border rounded-lg cursor-grab active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
        {/* Edges */}
        {edgeLines.map(e => e && (
          <line
            key={e.key}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="#374151"
            strokeWidth={1.5}
            markerEnd="url(#arrowhead)"
            opacity={0.6}
          />
        ))}

        {/* Nodes */}
        {nodes.map(node => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const color = GROUP_COLORS[node.group];
          const icon = GROUP_ICONS[node.group];
          const isSelected = selected === node.id;

          return (
            <g
              key={node.id}
              transform={`translate(${pos.x},${pos.y})`}
              onMouseDown={e => handleMouseDown(e, node.id)}
              onClick={() => handleNodeClick(node)}
              className="cursor-pointer"
              filter={isSelected ? 'url(#glow)' : undefined}
            >
              {/* Circle */}
              <circle
                r={NODE_RADIUS}
                fill={color + '20'}
                stroke={color}
                strokeWidth={isSelected ? 3 : 2}
              />
              {/* Icon */}
              <text textAnchor="middle" dominantBaseline="central" fontSize="16" className="select-none pointer-events-none">
                {icon}
              </text>
              {/* Label */}
              <text
                y={NODE_RADIUS + 14}
                textAnchor="middle"
                fontSize="10"
                fill="#9ca3af"
                className="select-none pointer-events-none"
              >
                {node.label.length > 16 ? node.label.slice(0, 14) + '…' : node.label}
              </text>
            </g>
          );
        })}
      </g>

      {/* Zoom indicator */}
      <text x={width - 10} y={height - 10} textAnchor="end" fontSize="10" fill="#6b7280">
        {Math.round(zoom * 100)}%
      </text>
    </svg>
  );
}
