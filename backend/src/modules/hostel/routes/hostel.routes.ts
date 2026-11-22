import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { HostelRepository } from '../repositories/hostel.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  listHostels,
  createHostel,
  listRooms,
  createRoom,
  applyHostel,
  allocateRoom,
  requestTransfer,
  listTransfers,
  approveTransfer,
  listApplications,
  getMyAllocation,
} from '../controllers/hostel.controller.ts';

export function createHostelRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  hostelRepo: HostelRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/', listHostels(hostelRepo));
  router.get('/applications', listApplications(hostelRepo));
  router.get('/allocation/me', getMyAllocation(hostelRepo));
  router.post('/', requireRoles(['administrator', 'hostel_warden']), createHostel(hostelRepo));

  router.get('/:hostelId/rooms', listRooms(hostelRepo));
  router.post('/:hostelId/rooms', requireRoles(['administrator', 'hostel_warden']), createRoom(hostelRepo));

  router.post('/apply', applyHostel(hostelRepo));
  router.post('/allocate', requireRoles(['administrator', 'hostel_warden']), allocateRoom(hostelRepo));

  router.post('/transfers', requestTransfer(hostelRepo));
  router.get('/transfers', listTransfers(hostelRepo));
  router.patch('/transfers/:id/approve', requireRoles(['administrator', 'hostel_warden']), approveTransfer(hostelRepo));

  return router;
}
