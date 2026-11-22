import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { AiAssistantRepository } from '../repositories/ai.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser } from '../../auth/middleware/authorize.ts';
import { askAssistant } from '../controllers/ai.controller.ts';

export function createAiAssistantRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  aiRepo: AiAssistantRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);
  router.post('/assistant', askAssistant(aiRepo));

  return router;
}
