import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import { authenticate } from '../middleware/authenticate.ts';
import { currentIdentity } from '../controllers/auth.controller.ts';

export function createAuthRouter(verify: VerifyIdentity) {
  const router = Router();
  router.get('/me', authenticate(verify), currentIdentity);
  return router;
}
