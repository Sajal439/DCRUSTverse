import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { AuditRepository } from '../controllers/audit.controller.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import { listAuditLogs } from '../controllers/audit.controller.ts';

export function createAuditRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  auditRepo: AuditRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/', requireRoles(['administrator']), listAuditLogs(auditRepo));

  return router;
}
