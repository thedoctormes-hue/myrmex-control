// ============================================================
// RBAC — BL-040: Role-Based Access Control
// 5 базовых ролей + permission matrix
// ============================================================

import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@shared/types.js';

// --- Permission matrix ---
// Format: 'resource:action' — e.g. 'tasks:read', 'agents:write'

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'], // Full access

  manager: [
    'tasks:read', 'tasks:write', 'tasks:delete',
    'projects:read', 'projects:write',
    'agents:read', 'agents:write',
    'library:read', 'library:write',
    'files:read', 'files:write',
    'servers:read', 'servers:write',
    'analytics:read',
    'audit:read',
    'settings:read',
    'chat:read', 'chat:write',
  ],

  developer: [
    'tasks:read', 'tasks:write',
    'projects:read',
    'agents:read',
    'library:read', 'library:write',
    'files:read', 'files:write',
    'servers:read',
    'analytics:read',
    'chat:read', 'chat:write',
  ],

  viewer: [
    'tasks:read',
    'projects:read',
    'agents:read',
    'library:read',
    'files:read',
    'servers:read',
    'analytics:read',
    'audit:read',
  ],

  agent: [
    'tasks:read', 'tasks:write',
    'projects:read',
    'chat:read', 'chat:write',
  ],
};

// --- Helper: extract role from session ---

function getUserRole(req: Request): UserRole | null {
  // Demo mode — treat as admin
  if (process.env.MYRMEX_FILE === 'myrmex-demo.json') return 'admin';

  // For now, authenticated users are admin (cookie-based single-user)
  // In multi-user setup, role would come from JWT or session
  const token = req.cookies?.myrmex_session;
  if (token) return 'admin';

  return null;
}

// --- Middleware: require specific permission ---

export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = getUserRole(req);

    if (!role) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const permissions = ROLE_PERMISSIONS[role];

    // Admin has all permissions
    if (permissions.includes('*')) {
      next();
      return;
    }

    const hasPermission = requiredPermissions.every(p => permissions.includes(p));

    if (!hasPermission) {
      res.status(403).json({
        error: 'Forbidden',
        required: requiredPermissions,
        role,
      });
      return;
    }

    next();
  };
}

// --- Middleware: require specific role ---

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = getUserRole(req);

    if (!role || !allowedRoles.includes(role)) {
      res.status(403).json({
        error: 'Forbidden',
        required_roles: allowedRoles,
        role: role || 'none',
      });
      return;
    }

    next();
  };
}

// --- Export for use in routes ---

export { ROLE_PERMISSIONS };
export type { UserRole as Role };
