import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { SurveysRepository } from '../repositories/surveys.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  listSurveys,
  getSurvey,
  createSurvey,
  submitAnswers,
  getSurveyAggregation,
} from '../controllers/surveys.controller.ts';

export function createSurveysRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  repo: SurveysRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.get('/', listSurveys(repo));
  router.get('/:id', getSurvey(repo));
  router.post('/', requireRoles(['administrator', 'department_head', 'faculty']), createSurvey(repo));
  router.post('/:id/responses', submitAnswers(repo));
  router.get('/:id/results', requireRoles(['administrator', 'department_head', 'faculty']), getSurveyAggregation(repo));

  return router;
}
