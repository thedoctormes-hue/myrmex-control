// ============================================================
// Myrmex Nerve — TypeScript типы для myrmex.json
// Единый источник правды для server и client
// ============================================================

// --- Enums ---

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type AgentStatus = 'idle' | 'working' | 'error' | 'offline';
export type ServerStatus = 'online' | 'offline' | 'degraded';
export type SkillType = 'skill' | 'hook' | 'card' | 'config' | 'knowledge';

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
  dependencies: string[];       // task IDs
  tags: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  source?: string;              // кто создал (опционально)
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
  path: string;                 // inbox/ или outbox/
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

// --- Changelog ---

export interface ChangelogEntry {
  id: string;
  timestamp: string;
  source: string;               // кто внёс изменение
  action: string;               // create, update, delete, move
  entity_type: string;          // task, project, agent, etc.
  entity_id: string;
  diff: Record<string, unknown>; // что изменилось
}

// --- Users & RBAC ---

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  totp_secret: string | null;     // encrypted TOTP secret
  totp_enabled: boolean;
  created_at: string;
  last_login: string | null;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;             // SHA-256 hash of the token
  created_at: string;
  expires_at: string;
  revoked: boolean;
  replaced_by: string | null;      // token rotation: which token replaced this
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
  refresh_tokens: RefreshToken[];
}
