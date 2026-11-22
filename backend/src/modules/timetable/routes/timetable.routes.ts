import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { TimetableRepository } from '../repositories/timetable.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  listRooms,
  createRoom,
  listSessions,
  createSession,
  updateSessionStatus,
} from '../controllers/timetable.controller.ts';

export function createTimetableRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  timetableRepo: TimetableRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/rooms', listRooms(timetableRepo));
  router.post('/rooms', requireRoles(['administrator', 'department_head']), createRoom(timetableRepo));

  router.get('/sessions', listSessions(timetableRepo));
  router.post('/sessions', requireRoles(['administrator', 'department_head', 'faculty']), createSession(timetableRepo));
  router.patch('/sessions/:id/status', requireRoles(['administrator', 'department_head', 'faculty']), updateSessionStatus(timetableRepo));

  return router;
}
