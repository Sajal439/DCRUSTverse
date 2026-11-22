import { Router, json } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../../types/user-repository.ts';
import type { FilesRepository } from '../../../types/files.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser } from '../../auth/middleware/authorize.ts';
import { downloadFile, uploadFile } from '../controllers/files.controller.ts';
export function createFilesRouter(verify: VerifyIdentity, users: CampusUserRepository, files: FilesRepository) {
  const router = Router();
  router.use(authenticate(verify), requireCampusUser(users));
  router.post('/', json({ limit: '3mb' }), uploadFile(files));
  router.get('/:id', downloadFile(files));
  return router;
}
