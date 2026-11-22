import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../repositories/user.repository.ts';
import { authenticate } from '../middleware/authenticate.ts';
import { currentIdentity, onboard } from '../controllers/auth.controller.ts';

export function createAuthRouter(verify: VerifyIdentity, userRepo?: CampusUserRepository) {
  const router = Router();
  router.get('/me', authenticate(verify), currentIdentity(userRepo));
  if (userRepo) {
    router.post('/onboard', authenticate(verify), onboard(userRepo));
  }
  return router;
}
