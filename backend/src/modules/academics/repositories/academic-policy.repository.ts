import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../../database/schema.ts';
import { assignments, submissions, sections, courses, teachingAssignments, enrollments } from '../../../database/schema.ts';
import type { AcademicPolicy } from '../../../types/academic-policy.ts';
import { HttpError } from '../../../lib/http-error.ts';
export function createAcademicPolicy(db: NodePgDatabase<typeof schema>): AcademicPolicy {
  return {
    async authorize(actor, source, id, mode) {
      let sectionId = id;
      if (source === 'assignment') {
        const [row] = await db.select().from(assignments).where(eq(assignments.id, id));
        if (!row) throw new HttpError(404, 'NOT_FOUND', 'Assignment not found');
        sectionId = row.sectionId;
      } else if (source === 'submission') {
        const [row] = await db.select({ sectionId: assignments.sectionId }).from(submissions).innerJoin(assignments, eq(submissions.assignmentId, assignments.id)).where(eq(submissions.id, id));
        if (!row) throw new HttpError(404, 'NOT_FOUND', 'Submission not found');
        sectionId = row.sectionId;
      }
      const [section] = await db.select({ departmentId: courses.departmentId }).from(sections).innerJoin(courses, eq(sections.courseId, courses.id)).where(eq(sections.id, sectionId));
      if (!section) throw new HttpError(404, 'NOT_FOUND', 'Section not found');
      const admin = actor.roles.some(role => role.role === 'administrator' && role.scopeType === 'global');
      const head = actor.roles.some(role => role.role === 'department_head' && role.scopeType === 'department' && role.scopeId === section.departmentId);
      const [teacher] = await db.select().from(teachingAssignments).where(and(eq(teachingAssignments.sectionId, sectionId), eq(teachingAssignments.facultyId, actor.id)));
      const [student] = await db.select().from(enrollments).where(and(eq(enrollments.sectionId, sectionId), eq(enrollments.studentId, actor.id), eq(enrollments.status, 'enrolled')));
      if (mode === 'submit' ? !!student : mode === 'teach' ? admin || head || !!teacher : admin || head || !!teacher || !!student) return;
      throw new HttpError(403, 'ACADEMIC_SCOPE_FORBIDDEN', 'This class is outside your teaching or enrollment assignments');
    },
  };
}
