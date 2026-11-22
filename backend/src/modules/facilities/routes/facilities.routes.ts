import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { FacilitiesRepository } from '../repositories/facilities.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  listFacilities,
  createFacility,
  requestBooking,
  listBookings,
  reviewBooking,
} from '../controllers/facilities.controller.ts';

export function createFacilitiesRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  facilitiesRepo: FacilitiesRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/', listFacilities(facilitiesRepo));
  router.post('/', requireRoles(['administrator', 'service_staff']), createFacility(facilitiesRepo));

  router.post('/bookings', requestBooking(facilitiesRepo));
  router.get('/bookings', listBookings(facilitiesRepo));
  router.patch(
    '/bookings/:id/review',
    requireRoles(['administrator', 'service_staff']),
    reviewBooking(facilitiesRepo),
  );

  return router;
}
