// ============================================================
// Myrmex Nerve — TypeScript типы для myrmex.json
// Единый источник правды для server и client
// ============================================================

// --- Enums ---

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type AgentStatus = 'idle' | 'working' | 'error' | 'offline';
export type ServerStatus = 'online' | 'offline' | 'degraded';
export type SkillType = 'skill' | 'mask' | 'hook' | 'template';

// --- BL-040: RBAC ---

export type UserRole = 'admin' | 'manager' | 'developer' | 'viewer' | 'agent';

export interface RolePermissions {
  role: UserRole;
  permissions: string[]; // e.g. ['tasks:read', 'tasks:write', 'agents:read']
}

// --- Meta ---

export interface MyrmexMeta {
  version: string;
  last_updated: string;
  last_updated_by: string;
  change_count: number;
}

// --- Workspace ---

export interface Workspace {
  name: string;
  description: string;
  owner: string;
  created_at: string;
}

// --- Projects ---

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
  source?: string;
}

// --- Agents ---

export interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  status: AgentStatus;
  project_id: string | null;
  current_task_id: string | null;
  last_seen: string;
  config: Record<string, unknown>;
}

// --- Tasks ---

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  parent_id: string | null;
  dependencies: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  source?: string;
}

// --- Library (Skills / Masks / Hooks) ---

export interface Skill {
  id: string;
  type: SkillType;
  name: string;
  description: string;
  content: string;
  file_path: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  source?: string;
}

// --- Files ---

export interface MyrmexFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

// --- Servers ---

export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  status: ServerStatus;
  services: string[];
  last_check: string;
  meta: Record<string, unknown>;
}

// --- Settings ---

export interface Settings {
  theme: 'dark' | 'light' | 'auto';
  language: string;
  refresh_interval_sec: number;
  notifications_enabled: boolean;
  custom: Record<string, unknown>;
}

// --- MCP Servers ---

export interface MCPServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  enabled: boolean;
}

// --- Users (persistent auth) ---

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  last_login?: string;
}

// --- Changelog ---

export interface ChangelogEntry {
  id: string;
  timestamp: string;
  source: string;
  action: string;
  entity_type: string;
  entity_id: string;
  diff: Record<string, unknown>;
}

// --- BL-034: Deploy ---

export type DeployColor = 'blue' | 'green';
export type DeployStatus = 'idle' | 'deploying' | 'healthy' | 'unhealthy' | 'rolling_back';

export interface DeployEntry {
  id: string;
  color: DeployColor;
  version: string;
  status: DeployStatus;
  started_at: string;
  finished_at: string | null;
  health_check_passed: boolean | null;
  rollback_triggered: boolean;
  commit_sha?: string;
  deploy_log: string[];
}

// --- BL-035: Artifacts ---

export type ArtifactType = 'BL' | 'INC' | 'PAT' | 'RUL' | 'ADR' | 'SKILL' | 'AGENT';
export type ArtifactStatus = 'draft' | 'review' | 'approved' | 'active' | 'deprecated' | 'archived';

export interface ArtifactFrontmatter {
  id: string;
  type: ArtifactType;
  title: string;
  status: ArtifactStatus;
  created: string;
  updated: string;
  author: string;
  tags: string[];
  links: string[];
  description?: string;
  version?: string;
}

// --- BL-038: Webhooks ---

export type WebhookEvent =
  | 'task.created' | 'task.completed' | 'task.updated'
  | 'agent.status_changed' | 'agent.online' | 'agent.offline'
  | 'deploy.started' | 'deploy.completed' | 'deploy.failed'
  | 'artifact.created' | 'artifact.updated';

export interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  created_at: string;
  last_delivery: string | null;
  failure_count: number;
}

// --- BL-043: Knowledge Graph ---

export interface GraphNode {
  id: string;
  type: 'agent' | 'project' | 'task' | 'artifact' | 'skill' | 'server' | 'user';
  label: string;
  status: string;
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight?: number;
}

// --- BL-046: Sessions ---

export type SessionStatus = 'active' | 'idle' | 'archived';

export interface SessionMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  agent_id: string;
  title: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  tags: string[];
  bookmarks: string[];
  summary?: string;
}

// --- BL-047: SaaS ---

export type PlanTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface PricingTier {
  id: PlanTier;
  name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  agents_limit: number;
  projects_limit: number;
  features: string[];
  popular: boolean;
}

// --- Root State ---

export interface MyrmexState {
  _meta: MyrmexMeta;
  workspace: Workspace;
  projects: Project[];
  agents: Agent[];
  tasks: Task[];
  library: Skill[];
  files: MyrmexFile[];
  servers: Server[];
  settings: Settings;
  mcp_servers: MCPServer[];
  changelog: ChangelogEntry[];
  users: User[];
  refresh_tokens: Record<string, { user_id: string; created_at: string }>;
}
