import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { LibraryRepository } from '../repositories/library.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  searchTitles,
  createTitle,
  addCopy,
  listCopies,
  issueBook,
  returnBook,
  listMyLoans,
  reserveTitle,
} from '../controllers/library.controller.ts';

export function createLibraryRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  libraryRepo: LibraryRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/titles', searchTitles(libraryRepo));
  router.post('/titles', requireRoles(['administrator', 'librarian']), createTitle(libraryRepo));
  router.post('/titles/:titleId/copies', requireRoles(['administrator', 'librarian']), addCopy(libraryRepo));
  router.get('/titles/:titleId/copies', listCopies(libraryRepo));
  router.post('/titles/:titleId/reserve', reserveTitle(libraryRepo));

  router.post('/issue', requireRoles(['administrator', 'librarian']), issueBook(libraryRepo));
  router.post('/return', requireRoles(['administrator', 'librarian']), returnBook(libraryRepo));
  router.get('/loans', listMyLoans(libraryRepo));

  return router;
}
