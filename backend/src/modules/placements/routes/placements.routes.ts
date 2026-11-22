import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { PlacementsRepository } from '../repositories/placements.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  listOpportunities,
  createOpportunity,
  applyOpportunity,
  listApplications,
  updateApplicationStatus,
} from '../controllers/placements.controller.ts';

export function createPlacementsRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  placementsRepo: PlacementsRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/opportunities', listOpportunities(placementsRepo));
  router.post('/opportunities', requireRoles(['administrator', 'placement_officer']), createOpportunity(placementsRepo));
  router.post('/opportunities/:id/apply', applyOpportunity(placementsRepo));
  router.get('/applications', listApplications(placementsRepo));
  router.patch(
    '/applications/:id/status',
    requireRoles(['administrator', 'placement_officer']),
    updateApplicationStatus(placementsRepo),
  );

  return router;
}
