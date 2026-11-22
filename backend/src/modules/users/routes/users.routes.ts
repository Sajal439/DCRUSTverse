import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  listUsers,
  getUser,
  updateUserStatus,
  assignUserRole,
  revokeUserRole,
} from '../controllers/users.controller.ts';

export function createUsersRouter(verify: VerifyIdentity, userRepo: CampusUserRepository) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/', requireRoles(['administrator', 'department_head']), listUsers(userRepo));
  router.get('/:id', getUser(userRepo));
  router.patch('/:id/status', requireRoles(['administrator']), updateUserStatus(userRepo));
  router.post('/:id/roles', requireRoles(['administrator', 'department_head']), assignUserRole(userRepo));
  router.delete('/:id/roles/:assignmentId', requireRoles(['administrator', 'department_head']), revokeUserRole(userRepo));

  return router;
}
