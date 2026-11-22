import type { FilesRepository } from '../../../types/files.ts';
import { requireOwnedAttachment } from '../../files/controllers/files.controller.ts';
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
  filesRepo?: FilesRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);
  if (filesRepo) router.use('/:id/review', requireOwnedAttachment(filesRepo, 'issuedFileUrl'));

  router.post('/', createRequest(documentsRepo));
  router.get('/', listRequests(documentsRepo, userRepo));
  router.get('/:id', getRequest(documentsRepo, userRepo));
  router.patch(
    '/:id/review',
    requireRoles(['administrator', 'service_staff', 'department_head']),
    reviewRequest(documentsRepo, userRepo),
  );

  return router;
}
