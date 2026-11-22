import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { DirectoryRepository } from '../repositories/directory.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser } from '../../auth/middleware/authorize.ts';
import { searchDepartments, searchStaff } from '../controllers/directory.controller.ts';

export function createDirectoryRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  directoryRepo: DirectoryRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/departments', searchDepartments(directoryRepo));
  router.get('/staff', searchStaff(directoryRepo));

  return router;
}
