import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { TicketsRepository } from '../repositories/tickets.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  createTicket,
  getTicket,
  listTickets,
  updateTicketStatus,
  assignStaff,
  addComment,
} from '../controllers/tickets.controller.ts';

export function createTicketsRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  ticketsRepo: TicketsRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.post('/', createTicket(ticketsRepo));
  router.get('/', listTickets(ticketsRepo));
  router.get('/:id', getTicket(ticketsRepo));
  router.patch('/:id/status', updateTicketStatus(ticketsRepo));
  router.patch('/:id/assign', requireRoles(['administrator', 'service_staff', 'department_head']), assignStaff(ticketsRepo));
  router.post('/:id/comments', addComment(ticketsRepo));

  return router;
}
