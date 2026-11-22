import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { ClubsRepository } from '../repositories/clubs.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  listClubs,
  createClub,
  joinClub,
  listEvents,
  createEvent,
  approveEvent,
  registerForEvent,
} from '../controllers/clubs.controller.ts';

export function createClubsRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  clubsRepo: ClubsRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/', listClubs(clubsRepo));
  router.post('/', requireRoles(['administrator', 'club_coordinator']), createClub(clubsRepo));
  router.post('/:id/join', joinClub(clubsRepo));

  router.get('/events', listEvents(clubsRepo));
  router.post('/events', requireRoles(['administrator', 'club_coordinator', 'faculty']), createEvent(clubsRepo));
  router.patch('/events/:id/approve', requireRoles(['administrator', 'club_coordinator']), approveEvent(clubsRepo));
  router.post('/events/:id/register', registerForEvent(clubsRepo));

  return router;
}
