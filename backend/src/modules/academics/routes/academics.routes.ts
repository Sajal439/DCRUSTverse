import { Router } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import type { AcademicsRepository } from '../repositories/academics.repository.ts';
import { authenticate } from '../../auth/middleware/authenticate.ts';
import { requireCampusUser, requireRoles } from '../../auth/middleware/authorize.ts';
import { listSectionRoster } from '../controllers/roster.controller.ts';
import {
  listDepartments,
  createDepartment,
  listPrograms,
  createProgram,
  listTerms,
  createTerm,
  listCourses,
  createCourse,
  listSections,
  createSection,
  enrollStudent,
  dropStudent,
  listEnrollments,
  assignFaculty,
  removeFaculty,
  listTeachingAssignments,
} from '../controllers/academics.controller.ts';

export function createAcademicsRouter(
  verify: VerifyIdentity,
  userRepo: CampusUserRepository,
  academicsRepo: AcademicsRepository,
) {
  const router = Router();
  const auth = authenticate(verify);
  const campusUser = requireCampusUser(userRepo);

  router.use(auth, campusUser);
  router.get('/sections/:sectionId/roster', requireRoles(['administrator', 'faculty', 'department_head']), listSectionRoster(academicsRepo, userRepo));

  // Departments
  router.get('/departments', listDepartments(academicsRepo));
  router.post('/departments', requireRoles(['administrator']), createDepartment(academicsRepo));

  // Programs
  router.get('/programs', listPrograms(academicsRepo));
  router.post('/programs', requireRoles(['administrator', 'department_head']), createProgram(academicsRepo));

  // Terms
  router.get('/terms', listTerms(academicsRepo));
  router.post('/terms', requireRoles(['administrator']), createTerm(academicsRepo));

  // Courses
  router.get('/courses', listCourses(academicsRepo));
  router.post('/courses', requireRoles(['administrator', 'department_head']), createCourse(academicsRepo));

  // Sections
  router.get('/sections', listSections(academicsRepo));
  router.post('/sections', requireRoles(['administrator', 'department_head']), createSection(academicsRepo));

  // Enrollments
  router.get('/enrollments', listEnrollments(academicsRepo));
  router.post(
    '/enrollments',
    requireRoles(['administrator', 'department_head', 'faculty']),
    enrollStudent(academicsRepo, userRepo),
  );
  router.delete('/enrollments/:studentId/:sectionId', dropStudent(academicsRepo));

  // Teaching Assignments
  router.get('/teaching-assignments', listTeachingAssignments(academicsRepo));
  router.post(
    '/teaching-assignments',
    requireRoles(['administrator', 'department_head']),
    assignFaculty(academicsRepo, userRepo),
  );
  router.delete(
    '/teaching-assignments/:assignmentId',
    requireRoles(['administrator', 'department_head']),
    removeFaculty(academicsRepo),
  );

  return router;
}
