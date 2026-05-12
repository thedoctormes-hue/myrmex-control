import { z } from 'zod';

// --- Task schemas ---

export const taskCreateSchema = z.object({
  project_id: z.string().uuid().optional().default(''),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().default(''),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled']).optional().default('backlog'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  assignee_id: z.string().uuid().nullable().optional().default(null),
  parent_id: z.string().uuid().nullable().optional().default(null),
  dependencies: z.array(z.string().uuid()).optional().default([]),
  tags: z.array(z.string().max(50)).optional().default([]),
});

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled']).optional(),
  completed_at: z.string().datetime().nullable().optional(),
});

export const taskMoveSchema = z.object({
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled']),
});

// --- Project schemas ---

export const projectCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().default(''),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#6366f1'),
  icon: z.string().max(10).optional().default('📦'),
  status: z.enum(['active', 'paused', 'archived']).optional().default('active'),
});

export const projectUpdateSchema = projectCreateSchema.partial();

// --- Server schemas ---

export const serverCreateSchema = z.object({
  name: z.string().min(1).max(255),
  host: z.string().min(1).max(255),
  port: z.number().int().min(1).max(65535),
  services: z.array(z.string()).optional().default([]),
  meta: z.record(z.string(), z.unknown()).optional().default({}),
});

export const serverUpdateSchema = serverCreateSchema.partial();

// --- Library schemas ---

export const libraryCreateSchema = z.object({
  type: z.enum(['skill', 'mask', 'hook', 'template']),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().default(''),
  content: z.string().max(100000).optional().default(''),
  file_path: z.string().max(500).nullable().optional().default(null),
  tags: z.array(z.string().max(50)).optional().default([]),
});

export const libraryUpdateSchema = libraryCreateSchema.partial();

// --- File schemas ---

export const fileUploadSchema = z.object({
  name: z.string().min(1).max(255),
  mime_type: z.string().max(100).optional().default('application/octet-stream'),
});

// --- Settings schema ---

export const settingsUpdateSchema = z.object({
  theme: z.enum(['dark', 'light', 'auto']).optional(),
  language: z.string().max(10).optional(),
  refresh_interval_sec: z.number().int().min(5).max(3600).optional(),
  notifications_enabled: z.boolean().optional(),
  custom: z.record(z.string(), z.unknown()).optional(),
}).strict();

// --- Auth schemas ---

export const loginSchema = z.object({
  password: z.string().min(1).max(128),
});

export const setupSchema = z.object({
  password: z.string().min(8).max(128),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1).max(128),
  new_password: z.string().min(8).max(128),
});

// --- Type exports ---
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ServerCreateInput = z.infer<typeof serverCreateSchema>;
export type ServerUpdateInput = z.infer<typeof serverUpdateSchema>;
export type LibraryCreateInput = z.infer<typeof libraryCreateSchema>;
export type LibraryUpdateInput = z.infer<typeof libraryUpdateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
