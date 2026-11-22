import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { AssignmentsRepository } from '../repositories/assignments.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import {
  createAssignment,
  listAssignments,
  submitAssignment,
  listSubmissions,
  gradeSubmission,
  publishSectionResults,
  getSectionResults,
} from '../controllers/assignments.controller.ts';

export function createAssignmentsRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  assignmentsRepo: AssignmentsRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);

  router.post('/', requireRoles(['administrator', 'faculty', 'department_head']), createAssignment(assignmentsRepo));
  router.get('/', listAssignments(assignmentsRepo));
  router.post('/:id/submit', submitAssignment(assignmentsRepo));
  router.get('/:id/submissions', listSubmissions(assignmentsRepo));
  router.post(
    '/submissions/:submissionId/grade',
    requireRoles(['administrator', 'faculty', 'department_head']),
    gradeSubmission(assignmentsRepo),
  );
  router.post(
    '/sections/:sectionId/publish',
    requireRoles(['administrator', 'faculty', 'department_head']),
    publishSectionResults(assignmentsRepo),
  );
  router.get('/sections/:sectionId/results', getSectionResults(assignmentsRepo));

  return router;
}
