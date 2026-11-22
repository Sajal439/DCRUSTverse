import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { DigitalIdRepository } from '../repositories/digital-id.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  getMyDigitalId,
  issueDigitalId,
  verifyDigitalId,
  revokeDigitalId,
} from '../controllers/digital-id.controller.ts';

export function createDigitalIdRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  digitalIdRepo: DigitalIdRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  // Verification endpoint: can be called by gate scanners
  router.get('/verify/:token', verifyDigitalId(digitalIdRepo));

  // User endpoints
  router.use(auth, campusUser);
  router.get('/me', getMyDigitalId(digitalIdRepo));
  router.post('/issue', issueDigitalId(digitalIdRepo));
  router.post('/revoke/:userId', requireRoles(['administrator', 'service_staff']), revokeDigitalId(digitalIdRepo));

  return router;
}
