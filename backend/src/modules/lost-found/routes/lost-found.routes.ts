import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { LostFoundRepository } from '../repositories/lost-found.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser } from '../../auth/middleware/authorize.ts';
import {
  listLostFoundItems,
  getLostFoundItem,
  createLostFoundItem,
  submitClaim,
  listClaims,
  reviewClaim,
  markRecovered,
} from '../controllers/lost-found.controller.ts';

export function createLostFoundRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  repo: LostFoundRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/items', listLostFoundItems(repo));
  router.get('/items/:id', getLostFoundItem(repo));
  router.post('/items', createLostFoundItem(repo));
  router.post('/items/:id/claim', submitClaim(repo));
  router.get('/items/:id/claims', listClaims(repo));
  router.patch('/items/:id/claims/:claimId/review', reviewClaim(repo));
  router.patch('/items/:id/recovered', markRecovered(repo));

  return router;
}
