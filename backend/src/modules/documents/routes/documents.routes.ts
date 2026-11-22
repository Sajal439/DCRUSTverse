import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { DocumentsRepository } from '../repositories/documents.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  createRequest,
  listRequests,
  getRequest,
  reviewRequest,
} from '../controllers/documents.controller.ts';

export function createDocumentsRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  documentsRepo: DocumentsRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.post('/', createRequest(documentsRepo));
  router.get('/', listRequests(documentsRepo));
  router.get('/:id', getRequest(documentsRepo));
  router.patch(
    '/:id/review',
    requireRoles(['administrator', 'service_staff', 'department_head']),
    reviewRequest(documentsRepo),
  );

  return router;
}
