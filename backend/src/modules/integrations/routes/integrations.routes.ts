import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { IntegrationsRepository } from '../repositories/integrations.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import { triggerSync, listSyncRuns } from '../controllers/integrations.controller.ts';

export function createIntegrationsRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  integrationsRepo: IntegrationsRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser, requireRoles(['administrator']));

  router.post('/sync', triggerSync(integrationsRepo));
  router.get('/sync/runs', listSyncRuns(integrationsRepo));

  return router;
}
