import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { SearchRepository } from '../repositories/search.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser } from '../../auth/middleware/authorize.ts';
import { searchGlobal } from '../controllers/search.controller.ts';

export function createSearchRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  searchRepo: SearchRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/', searchGlobal(searchRepo));

  return router;
}
