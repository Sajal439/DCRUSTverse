import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { AcademicsRepository } from '../../../types/academics.ts';
import type { CampusUserRepository } from '../../../types/user-repository.ts';

export function listSectionRoster(repo: AcademicsRepository, users: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');
    const sectionId = req.params.sectionId as string;
    const section = await repo.getSectionById(sectionId);
    if (!section) throw new HttpError(404, 'NOT_FOUND', 'Class section not found');
    const globalAdmin = actor.roles.some(role => role.role === 'administrator' && role.scopeType === 'global');
    const assigned = await repo.listTeachingAssignments({ sectionId, facultyId: actor.id });
    const departmentCourses = actor.departmentId ? await repo.listCourses(actor.departmentId) : [];
    const departmentHead = actor.roles.some(role => role.role === 'department_head' && (role.scopeType === 'global' || role.scopeId === actor.departmentId)) && departmentCourses.some(course => course.id === section.courseId);
    if (!globalAdmin && !departmentHead && !assigned.length) throw new HttpError(403, 'FORBIDDEN', 'Only assigned teaching staff can view this class roster');
    const enrollments = await repo.listEnrollments({ sectionId });
    const data = await Promise.all(enrollments.filter(row => row.status === 'enrolled').map(async row => {
      const [student, profile] = await Promise.all([users.findById(row.studentId), users.getProfile(row.studentId)]);
      return { studentId: row.studentId, displayName: student?.displayName ?? 'Unavailable student', rollNumber: profile?.rollNumber ?? null };
    }));
    res.json({ data });
  };
}
