import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import { previewUserImport, sanitizeCsvExport } from '../controllers/bulk.controller.ts';

export function createBulkRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.post('/validate-import', requireRoles(['administrator']), previewUserImport());
  router.post('/sanitize-export', requireRoles(['administrator']), sanitizeCsvExport());

  return router;
}
