import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { TimetableRepository } from '../../timetable/repositories/timetable.repository.ts';
import type { AssignmentsRepository } from '../../assignments/repositories/assignments.repository.ts';
import type { AppointmentsRepository } from '../../appointments/repositories/appointments.repository.ts';
import type { AcademicsRepository } from '../../academics/repositories/academics.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser } from '../../auth/middleware/authorize.ts';
import { getUnifiedCalendar } from '../controllers/calendar.controller.ts';

export function createCalendarRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  timetableRepo: TimetableRepository,
  assignmentsRepo: AssignmentsRepository,
  appointmentsRepo: AppointmentsRepository,
  academicsRepo: AcademicsRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/me', getUnifiedCalendar(timetableRepo, assignmentsRepo, appointmentsRepo, academicsRepo));

  return router;
}
