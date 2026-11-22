import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { AppointmentsRepository } from '../repositories/appointments.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  setAvailability,
  getFacultyAvailabilities,
  requestAppointment,
  listMyAppointments,
  reviewAppointment,
} from '../controllers/appointments.controller.ts';

export function createAppointmentsRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  appointmentsRepo: AppointmentsRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.post('/availability', requireRoles(['faculty', 'administrator', 'department_head']), setAvailability(appointmentsRepo));
  router.get('/faculty/:facultyId/availability', getFacultyAvailabilities(appointmentsRepo));
  router.post('/requests', requestAppointment(appointmentsRepo));
  router.get('/', listMyAppointments(appointmentsRepo));
  router.patch(
    '/:id/review',
    requireRoles(['faculty', 'administrator', 'department_head']),
    reviewAppointment(appointmentsRepo),
  );

  return router;
}
