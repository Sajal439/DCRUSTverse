import type { BulkRepository } from '../../../types/bulk-repository.ts';
import { executeUserImport, exportUsers } from '../controllers/bulk.controller.ts';
import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import { previewUserImport, sanitizeCsvExport } from '../controllers/bulk.controller.ts';

export function createBulkRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  bulkRepo?: BulkRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.post('/validate-import', requireRoles(['administrator']), previewUserImport());
  router.post('/sanitize-export', requireRoles(['administrator']), sanitizeCsvExport());

  if (bulkRepo) {
    router.post('/import-users', requireRoles(['administrator'], { scopeCheck: (_req, user) => user.roles.some(role => role.role === 'administrator' && role.scopeType === 'global') }), executeUserImport(bulkRepo));
    router.get('/export-users', requireRoles(['administrator'], { scopeCheck: (_req, user) => user.roles.some(role => role.role === 'administrator' && role.scopeType === 'global') }), exportUsers(bulkRepo));
  }
  return router;
}
