import type { RequestHandler } from 'express';
import type { CampusUserRepository } from '../../../types/user-repository.ts';
import { HttpError } from '../../../lib/http-error.ts';
import { requireDepartmentManager } from '../services/role-policy.ts';

export function listUserRoles(repo: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');
    const user = await repo.findById(String(req.params.id));
    if (!user) throw new HttpError(404, 'NOT_FOUND', 'User not found');
    if (actor.id !== user.id) requireDepartmentManager(actor, user.departmentId);
    res.json({ data: user.roles });
  };
}
