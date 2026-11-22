import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser } from '../../auth/middleware/authorize.ts';
import { getMyProfile, updateMyProfile } from '../controllers/profile.controller.ts';

export function createProfileRouter(verify: VerifyIdentity, userRepo: CampusUserRepository) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/me', getMyProfile(userRepo));
  router.patch('/me', updateMyProfile(userRepo));

  return router;
}
