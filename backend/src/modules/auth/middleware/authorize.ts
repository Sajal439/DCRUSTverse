import type { Request, RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { CampusUser, RoleName, ScopeType } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../repositories/user.repository.ts';

export function hasRole(
  user: CampusUser,
  role: RoleName,
  scopeType?: ScopeType,
  scopeId?: string | null,
): boolean {
  // Global administrator has authority across all scopes
  const isGlobalAdmin = user.roles.some(r => r.role === 'administrator' && r.scopeType === 'global');
  if (isGlobalAdmin) return true;

  return user.roles.some(r => {
    if (r.role !== role) return false;
    if (!scopeType) return true;
    if (r.scopeType === 'global') return true;
    if (r.scopeType !== scopeType) return false;
    if (scopeId === undefined) return true;
    return r.scopeId === scopeId;
  });
}

export function requireCampusUser(userRepo: CampusUserRepository): RequestHandler {
  return async (_req, res, next) => {
    const identity = res.locals.identity;
    if (!identity) {
      throw new HttpError(401, 'AUTH_REQUIRED', 'A bearer access token is required');
    }
    const user = await userRepo.findByAuthId(identity.id);
    if (!user) {
      throw new HttpError(404, 'USER_NOT_REGISTERED', 'Campus user account has not been onboarded');
    }
    if (user.status === 'disabled') {
      throw new HttpError(403, 'ACCOUNT_DISABLED', 'This campus account has been deactivated');
    }
    if (user.status !== 'active') {
      throw new HttpError(403, 'ACCOUNT_PENDING_APPROVAL', 'Your campus account is awaiting administrative approval');
    }
    res.locals.campusUser = user;
    next();
  };
}

export interface RequireRolesOptions {
  requireActive?: boolean;
  scopeCheck?: (req: Request, user: CampusUser) => boolean;
}

export function requireRoles(
  allowedRoles: RoleName[],
  options: RequireRolesOptions = {},
): RequestHandler {
  const requireActive = options.requireActive ?? true;

  return (req, res, next) => {
    const user = res.locals.campusUser;
    if (!user) {
      throw new HttpError(401, 'AUTH_REQUIRED', 'Campus authentication required');
    }

    if (requireActive && user.status !== 'active') {
      throw new HttpError(403, 'ACCOUNT_PENDING_APPROVAL', 'Your campus account is awaiting administrative approval');
    }

    // Global admin always bypasses specific role requirement
    const isGlobalAdmin = user.roles.some(r => r.role === 'administrator' && r.scopeType === 'global');
    if (isGlobalAdmin) {
      return next();
    }

    const hasAllowedRole = allowedRoles.some(role => user.roles.some(r => r.role === role));
    if (!hasAllowedRole) {
      throw new HttpError(403, 'FORBIDDEN', 'Insufficient permissions to perform this action');
    }

    if (options.scopeCheck && !options.scopeCheck(req, user)) {
      throw new HttpError(403, 'SCOPE_FORBIDDEN', 'Access restricted to assigned scope');
    }

    next();
  };
}
