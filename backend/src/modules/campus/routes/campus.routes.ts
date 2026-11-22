import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { CampusRepository } from '../repositories/campus.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  listLocations,
  getLocation,
  createLocation,
  addEntrance,
  addPathSegment,
  getRoute,
  generateQrLink,
  scanQrCode,
} from '../controllers/campus.controller.ts';

export function createCampusRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  campusRepo: CampusRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  // Public / visitor accessible endpoints
  router.get('/locations', listLocations(campusRepo));
  router.get('/locations/:id', getLocation(campusRepo));
  router.get('/paths', auth, campusUser, requireRoles(['administrator', 'service_staff']), async (_req, res) => { res.json({ data: await campusRepo.listPaths() }); });
  router.get('/routes', getRoute(campusRepo));
  router.get('/qr/scan/:code', scanQrCode(campusRepo));

  // Protected administration endpoints
  router.post(
    '/locations',
    auth,
    campusUser,
    requireRoles(['administrator', 'service_staff']),
    createLocation(campusRepo),
  );
  router.post(
    '/locations/:id/entrances',
    auth,
    campusUser,
    requireRoles(['administrator', 'service_staff']),
    addEntrance(campusRepo),
  );
  router.post(
    '/paths',
    auth,
    campusUser,
    requireRoles(['administrator', 'service_staff']),
    addPathSegment(campusRepo),
  );
  router.post(
    '/locations/:id/qr',
    auth,
    campusUser,
    requireRoles(['administrator', 'service_staff']),
    generateQrLink(campusRepo),
  );

  return router;
}
