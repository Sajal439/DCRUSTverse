import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import { assignRoleSchema, updateUserStatusSchema } from '../../auth/schemas/auth.schema.ts';

export function listUsers(userRepo: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const isGlobalAdmin = actor.roles.some(r => r.role === 'administrator' && r.scopeType === 'global');
    const isDeptHead = actor.roles.some(r => r.role === 'department_head');

    let departmentId = req.query.departmentId as string | undefined;
    if (!isGlobalAdmin && isDeptHead) {
      // Department head is strictly scoped to their own department
      departmentId = actor.departmentId ?? undefined;
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const offset = (page - 1) * limit;

    const result = await userRepo.listUsers({
      departmentId,
      status: req.query.status as any,
      role: req.query.role as any,
      limit,
      offset,
    });

    res.json({
      data: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  };
}

export function getUser(userRepo: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const targetId = req.params.id as string;
    const targetUser = await userRepo.findById(targetId);
    if (!targetUser) throw new HttpError(404, 'NOT_FOUND', 'User not found');

    const isGlobalAdmin = actor.roles.some(r => r.role === 'administrator' && r.scopeType === 'global');
    const isSelf = actor.id === targetId;
    const isDeptHeadOfUser = actor.roles.some(
      r => r.role === 'department_head' && actor.departmentId && actor.departmentId === targetUser.departmentId,
    );

    if (!isGlobalAdmin && !isSelf && !isDeptHeadOfUser) {
      throw new HttpError(403, 'FORBIDDEN', 'Access to user profile is restricted');
    }

    const profile = await userRepo.getProfile(targetId);
    res.json({
      data: {
        ...targetUser,
        profile,
      },
    });
  };
}

export function updateUserStatus(userRepo: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const targetId = req.params.id as string;
    if (actor.id === targetId) {
      throw new HttpError(400, 'SELF_MODIFICATION_DISALLOWED', 'You cannot change your own account status');
    }

    const parsed = updateUserStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid status');
    }

    const targetUser = await userRepo.findById(targetId);
    if (!targetUser) throw new HttpError(404, 'NOT_FOUND', 'User not found');

    const updated = await userRepo.updateStatus(targetId, parsed.data.status);

    await userRepo.logAudit({
      actorId: actor.id,
      action: 'user.status_updated',
      targetType: 'user',
      targetId,
      details: {
        previousStatus: targetUser.status,
        newStatus: parsed.data.status,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    res.json({ data: updated });
  };
}

export function assignUserRole(userRepo: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const targetId = req.params.id as string;
    if (actor.id === targetId) {
      throw new HttpError(400, 'SELF_MODIFICATION_DISALLOWED', 'Users cannot grant themselves roles');
    }

    const parsed = assignRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid role assignment');
    }

    const isGlobalAdmin = actor.roles.some(r => r.role === 'administrator' && r.scopeType === 'global');
    const isDeptHead = actor.roles.some(r => r.role === 'department_head');

    // Scoped restriction for department heads: can only assign roles in their own department
    if (!isGlobalAdmin) {
      if (!isDeptHead) {
        throw new HttpError(403, 'FORBIDDEN', 'Only administrators and department heads can assign roles');
      }
      if (parsed.data.scopeType !== 'department' || parsed.data.scopeId !== actor.departmentId) {
        throw new HttpError(403, 'SCOPE_FORBIDDEN', 'Department heads can only assign roles within their department');
      }
      // Department heads cannot assign administrator or other department_head roles
      if (parsed.data.role === 'administrator' || parsed.data.role === 'department_head') {
        throw new HttpError(403, 'FORBIDDEN', 'Department heads cannot grant administrative roles');
      }
    }

    const targetUser = await userRepo.findById(targetId);
    if (!targetUser) throw new HttpError(404, 'NOT_FOUND', 'User not found');

    const assignment = await userRepo.assignRole({
      userId: targetId,
      role: parsed.data.role,
      scopeType: parsed.data.scopeType,
      scopeId: parsed.data.scopeId ?? null,
      assignedBy: actor.id,
    });

    await userRepo.logAudit({
      actorId: actor.id,
      action: 'role.assigned',
      targetType: 'role_assignment',
      targetId: assignment.id,
      details: {
        targetUserId: targetId,
        role: assignment.role,
        scopeType: assignment.scopeType,
        scopeId: assignment.scopeId,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    res.status(201).json({ data: assignment });
  };
}

export function revokeUserRole(userRepo: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const targetId = req.params.id as string;
    const assignmentId = req.params.assignmentId as string;

    const targetUser = await userRepo.findById(targetId);
    if (!targetUser) throw new HttpError(404, 'NOT_FOUND', 'User not found');

    const assignment = targetUser.roles.find(r => r.id === assignmentId);
    if (!assignment) throw new HttpError(404, 'NOT_FOUND', 'Role assignment not found');

    const isGlobalAdmin = actor.roles.some(r => r.role === 'administrator' && r.scopeType === 'global');
    const isDeptHead = actor.roles.some(r => r.role === 'department_head');

    if (!isGlobalAdmin) {
      if (!isDeptHead) {
        throw new HttpError(403, 'FORBIDDEN', 'Only administrators and department heads can revoke roles');
      }
      if (assignment.scopeType !== 'department' || assignment.scopeId !== actor.departmentId) {
        throw new HttpError(403, 'SCOPE_FORBIDDEN', 'Department heads can only revoke roles within their department');
      }
    }

    const revoked = await userRepo.revokeRole(assignmentId);
    if (!revoked) throw new HttpError(404, 'NOT_FOUND', 'Role assignment could not be revoked');

    await userRepo.logAudit({
      actorId: actor.id,
      action: 'role.revoked',
      targetType: 'role_assignment',
      targetId: assignmentId,
      details: {
        targetUserId: targetId,
        role: assignment.role,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    res.json({ data: { revoked: true, assignmentId } });
  };
}
