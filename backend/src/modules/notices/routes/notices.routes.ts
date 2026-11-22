import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { NoticesRepository } from '../repositories/notices.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  listNotices,
  createNotice,
  listNotifications,
  markNotificationRead,
} from '../controllers/notices.controller.ts';

export function createNoticesRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  noticesRepo: NoticesRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/', listNotices(noticesRepo));
  router.post(
    '/',
    requireRoles(['administrator', 'department_head', 'faculty', 'placement_officer', 'club_coordinator']),
    createNotice(noticesRepo),
  );

  router.get('/notifications', listNotifications(noticesRepo));
  router.patch('/notifications/:id/read', markNotificationRead(noticesRepo));

  return router;
}
