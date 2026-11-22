import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser } from '../../auth/middleware/authorize.ts';
import { getClientConfig, registerPushToken } from '../controllers/client-services.controller.ts';

export function createClientServicesRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.get('/config', getClientConfig());
  router.post('/push/register', auth, campusUser, registerPushToken());

  return router;
}
