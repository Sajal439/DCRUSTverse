import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import {
  departments,
  programs,
  academicTerms,
  courses,
  sections,
  enrollments,
  teachingAssignments,
} from '../../../database/schema.ts';
import type {
  DepartmentItem,
  ProgramItem,
  AcademicTermItem,
  CourseItem,
  SectionItem,
  EnrollmentItem,
  TeachingAssignmentItem,
  AcademicsRepository,
} from '../../../types/academics.ts';

export type {
  DepartmentItem,
  ProgramItem,
  AcademicTermItem,
  CourseItem,
  SectionItem,
  EnrollmentItem,
  TeachingAssignmentItem,
  AcademicsRepository,
};

export function createDrizzleAcademicsRepository(db: NodePgDatabase<typeof schema>): AcademicsRepository {
  return {
    async listDepartments(): Promise<DepartmentItem[]> {
      const rows = await db.select().from(departments).orderBy(departments.code);
      return rows.map(r => ({
        id: r.id,
        code: r.code,
        name: r.name,
        createdAt: r.createdAt.toISOString(),
      }));
    },

    async createDepartment(data): Promise<DepartmentItem> {
      const [row] = await db
        .insert(departments)
        .values({
          code: data.code.toUpperCase().trim(),
          name: data.name.trim(),
        })
        .returning();
      if (!row) throw new Error('Failed to create department');
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async getDepartmentById(id): Promise<DepartmentItem | null> {
      const [row] = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
      if (!row) return null;
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async listPrograms(departmentId): Promise<ProgramItem[]> {
      const query = departmentId
        ? db.select().from(programs).where(eq(programs.departmentId, departmentId))
        : db.select().from(programs);
      const rows = await query.orderBy(programs.code);
      return rows.map(r => ({
        id: r.id,
        departmentId: r.departmentId,
        code: r.code,
        name: r.name,
        type: r.type as ProgramItem['type'],
        totalSemesters: r.totalSemesters,
        createdAt: r.createdAt.toISOString(),
      }));
    },

    async createProgram(data): Promise<ProgramItem> {
      const [row] = await db
        .insert(programs)
        .values({
          departmentId: data.departmentId,
          code: data.code.toUpperCase().trim(),
          name: data.name.trim(),
          type: data.type,
          totalSemesters: data.totalSemesters,
        })
        .returning();
      if (!row) throw new Error('Failed to create program');
      return {
        id: row.id,
        departmentId: row.departmentId,
        code: row.code,
        name: row.name,
        type: row.type as ProgramItem['type'],
        totalSemesters: row.totalSemesters,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async listTerms(): Promise<AcademicTermItem[]> {
      const rows = await db.select().from(academicTerms).orderBy(academicTerms.startDate);
      return rows.map(r => ({
        id: r.id,
        code: r.code,
        name: r.name,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
        status: r.status as AcademicTermItem['status'],
        createdAt: r.createdAt.toISOString(),
      }));
    },

    async createTerm(data): Promise<AcademicTermItem> {
      const [row] = await db
        .insert(academicTerms)
        .values({
          code: data.code.toUpperCase().trim(),
          name: data.name.trim(),
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status ?? 'upcoming',
        })
        .returning();
      if (!row) throw new Error('Failed to create academic term');
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        startDate: row.startDate.toISOString(),
        endDate: row.endDate.toISOString(),
        status: row.status as AcademicTermItem['status'],
        createdAt: row.createdAt.toISOString(),
      };
    },

    async listCourses(departmentId): Promise<CourseItem[]> {
      const query = departmentId
        ? db.select().from(courses).where(eq(courses.departmentId, departmentId))
        : db.select().from(courses);
      const rows = await query.orderBy(courses.code);
      return rows.map(r => ({
        id: r.id,
        departmentId: r.departmentId,
        code: r.code,
        name: r.name,
        credits: r.credits,
        type: r.type as CourseItem['type'],
        description: r.description,
        createdAt: r.createdAt.toISOString(),
      }));
    },

    async createCourse(data): Promise<CourseItem> {
      const [row] = await db
        .insert(courses)
        .values({
          departmentId: data.departmentId,
          code: data.code.toUpperCase().trim(),
          name: data.name.trim(),
          credits: data.credits,
          type: data.type ?? 'core',
          description: data.description ?? null,
        })
        .returning();
      if (!row) throw new Error('Failed to create course');
      return {
        id: row.id,
        departmentId: row.departmentId,
        code: row.code,
        name: row.name,
        credits: row.credits,
        type: row.type as CourseItem['type'],
        description: row.description,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async listSections(filters = {}): Promise<SectionItem[]> {
      const conditions = [];
      if (filters.courseId) conditions.push(eq(sections.courseId, filters.courseId));
      if (filters.academicTermId) conditions.push(eq(sections.academicTermId, filters.academicTermId));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(sections).where(whereClause).orderBy(sections.name);
      return rows.map(r => ({
        id: r.id,
        courseId: r.courseId,
        academicTermId: r.academicTermId,
        name: r.name,
        capacity: r.capacity,
        createdAt: r.createdAt.toISOString(),
      }));
    },

    async createSection(data): Promise<SectionItem> {
      const [row] = await db
        .insert(sections)
        .values({
          courseId: data.courseId,
          academicTermId: data.academicTermId,
          name: data.name.trim(),
          capacity: data.capacity ?? 60,
        })
        .returning();
      if (!row) throw new Error('Failed to create section');
      return {
        id: row.id,
        courseId: row.courseId,
        academicTermId: row.academicTermId,
        name: row.name,
        capacity: row.capacity,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async getSectionById(id): Promise<SectionItem | null> {
      const [row] = await db.select().from(sections).where(eq(sections.id, id)).limit(1);
      if (!row) return null;
      return {
        id: row.id,
        courseId: row.courseId,
        academicTermId: row.academicTermId,
        name: row.name,
        capacity: row.capacity,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async enrollStudent(data): Promise<EnrollmentItem> {
      // Check section capacity before enrollment
      const [section] = await db.select().from(sections).where(eq(sections.id, data.sectionId)).limit(1);
      if (!section) throw new Error('Section not found');

      const [enrolledCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(enrollments)
        .where(and(eq(enrollments.sectionId, data.sectionId), eq(enrollments.status, 'enrolled')));

      if ((enrolledCount?.count ?? 0) >= section.capacity) {
        throw new Error('Section is already at full capacity');
      }

      const [row] = await db
        .insert(enrollments)
        .values({
          studentId: data.studentId,
          sectionId: data.sectionId,
          status: 'enrolled',
        })
        .returning();
      if (!row) throw new Error('Failed to enroll student');
      return {
        id: row.id,
        studentId: row.studentId,
        sectionId: row.sectionId,
        status: row.status as EnrollmentItem['status'],
        enrolledAt: row.enrolledAt.toISOString(),
      };
    },

    async dropStudent(studentId, sectionId): Promise<boolean> {
      const [row] = await db
        .update(enrollments)
        .set({ status: 'dropped' })
        .where(and(eq(enrollments.studentId, studentId), eq(enrollments.sectionId, sectionId)))
        .returning();
      return !!row;
    },

    async listEnrollments(filters): Promise<EnrollmentItem[]> {
      const conditions = [];
      if (filters.sectionId) conditions.push(eq(enrollments.sectionId, filters.sectionId));
      if (filters.studentId) conditions.push(eq(enrollments.studentId, filters.studentId));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(enrollments).where(whereClause);
      return rows.map(r => ({
        id: r.id,
        studentId: r.studentId,
        sectionId: r.sectionId,
        status: r.status as EnrollmentItem['status'],
        enrolledAt: r.enrolledAt.toISOString(),
      }));
    },

    async assignFaculty(data): Promise<TeachingAssignmentItem> {
      const [row] = await db
        .insert(teachingAssignments)
        .values({
          facultyId: data.facultyId,
          sectionId: data.sectionId,
          role: data.role ?? 'primary',
        })
        .returning();
      if (!row) throw new Error('Failed to assign faculty');
      return {
        id: row.id,
        facultyId: row.facultyId,
        sectionId: row.sectionId,
        role: row.role as TeachingAssignmentItem['role'],
        assignedAt: row.assignedAt.toISOString(),
      };
    },

    async removeFaculty(assignmentId): Promise<boolean> {
      const result = await db.delete(teachingAssignments).where(eq(teachingAssignments.id, assignmentId)).returning();
      return result.length > 0;
    },

    async listTeachingAssignments(filters): Promise<TeachingAssignmentItem[]> {
      const conditions = [];
      if (filters.sectionId) conditions.push(eq(teachingAssignments.sectionId, filters.sectionId));
      if (filters.facultyId) conditions.push(eq(teachingAssignments.facultyId, filters.facultyId));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(teachingAssignments).where(whereClause);
      return rows.map(r => ({
        id: r.id,
        facultyId: r.facultyId,
        sectionId: r.sectionId,
        role: r.role as TeachingAssignmentItem['role'],
        assignedAt: r.assignedAt.toISOString(),
      }));
    },
  };
}
