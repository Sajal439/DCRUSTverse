import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { AnalyticsRepository } from '../repositories/analytics.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import { getSummaryAnalytics } from '../controllers/analytics.controller.ts';

export function createAnalyticsRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  analyticsRepo: AnalyticsRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get(
    '/summary',
    requireRoles(['administrator', 'department_head', 'hostel_warden', 'placement_officer', 'librarian']),
    getSummaryAnalytics(analyticsRepo),
  );

  return router;
}
