import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { AttendanceRepository } from '../repositories/attendance.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  recordAttendance,
  listSessionAttendance,
  getMyAttendanceSummary,
  requestCorrection,
  listCorrections,
  reviewCorrection,
} from '../controllers/attendance.controller.ts';

export function createAttendanceRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  attendanceRepo: AttendanceRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.post('/record', requireRoles(['administrator', 'faculty', 'department_head']), recordAttendance(attendanceRepo));
  router.get('/sessions/:sessionId', listSessionAttendance(attendanceRepo));
  router.get('/summary', getMyAttendanceSummary(attendanceRepo));
  router.post('/corrections', requestCorrection(attendanceRepo));
  router.get('/corrections', listCorrections(attendanceRepo));
  router.patch(
    '/corrections/:id/review',
    requireRoles(['administrator', 'faculty', 'department_head']),
    reviewCorrection(attendanceRepo),
  );

  return router;
}
