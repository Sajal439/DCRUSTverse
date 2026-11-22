import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { AcademicsRepository } from '../repositories/academics.repository.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import {
  createDepartmentSchema,
  createProgramSchema,
  createAcademicTermSchema,
  createCourseSchema,
  createSectionSchema,
  enrollStudentSchema,
  assignFacultySchema,
} from '../schemas/academics.schema.ts';

export function listDepartments(repo: AcademicsRepository): RequestHandler {
  return async (_req, res) => {
    const data = await repo.listDepartments();
    res.json({ data });
  };
}

export function createDepartment(repo: AcademicsRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid department data');
    }
    const data = await repo.createDepartment(parsed.data);
    res.status(201).json({ data });
  };
}

export function listPrograms(repo: AcademicsRepository): RequestHandler {
  return async (req, res) => {
    const departmentId = req.query.departmentId as string | undefined;
    const data = await repo.listPrograms(departmentId);
    res.json({ data });
  };
}

export function createProgram(repo: AcademicsRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createProgramSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid program data');
    }
    const data = await repo.createProgram(parsed.data);
    res.status(201).json({ data });
  };
}

export function listTerms(repo: AcademicsRepository): RequestHandler {
  return async (_req, res) => {
    const data = await repo.listTerms();
    res.json({ data });
  };
}

export function createTerm(repo: AcademicsRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createAcademicTermSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid term data');
    }
    const data = await repo.createTerm({
      code: parsed.data.code,
      name: parsed.data.name,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      status: parsed.data.status,
    });
    res.status(201).json({ data });
  };
}

export function listCourses(repo: AcademicsRepository): RequestHandler {
  return async (req, res) => {
    const departmentId = req.query.departmentId as string | undefined;
    const data = await repo.listCourses(departmentId);
    res.json({ data });
  };
}

export function createCourse(repo: AcademicsRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createCourseSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid course data');
    }
    const data = await repo.createCourse(parsed.data);
    res.status(201).json({ data });
  };
}

export function listSections(repo: AcademicsRepository): RequestHandler {
  return async (req, res) => {
    const courseId = req.query.courseId as string | undefined;
    const academicTermId = req.query.academicTermId as string | undefined;
    const data = await repo.listSections({ courseId, academicTermId });
    res.json({ data });
  };
}

export function createSection(repo: AcademicsRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createSectionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid section data');
    }
    const data = await repo.createSection(parsed.data);
    res.status(201).json({ data });
  };
}

export function enrollStudent(repo: AcademicsRepository, userRepo: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const parsed = enrollStudentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid enrollment data');
    }

    const student = await userRepo.findById(parsed.data.studentId);
    if (!student) {
      throw new HttpError(404, 'NOT_FOUND', 'Student account not found');
    }

    const hasStudentRole = student.roles.some(r => r.role === 'student');
    if (!hasStudentRole) {
      throw new HttpError(400, 'INVALID_ROLE', 'The user does not have an active student role');
    }

    try {
      const data = await repo.enrollStudent(parsed.data);
      res.status(201).json({ data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Enrollment failed';
      throw new HttpError(400, 'ENROLLMENT_FAILED', message);
    }
  };
}

export function dropStudent(repo: AcademicsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const studentId = req.params.studentId as string;
    const sectionId = req.params.sectionId as string;

    const isGlobalAdmin = actor.roles.some(r => r.role === 'administrator' && r.scopeType === 'global');
    const isSelf = actor.id === studentId;

    if (!isGlobalAdmin && !isSelf) {
      throw new HttpError(403, 'FORBIDDEN', 'Cannot drop another student from a section');
    }

    const dropped = await repo.dropStudent(studentId, sectionId);
    if (!dropped) {
      throw new HttpError(404, 'NOT_FOUND', 'Enrollment record not found');
    }

    res.json({ data: { dropped: true, studentId, sectionId } });
  };
}

export function listEnrollments(repo: AcademicsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const isGlobalAdmin = actor.roles.some(r => r.role === 'administrator' && r.scopeType === 'global');
    const isFacultyOrHead = actor.roles.some(r => ['faculty', 'department_head'].includes(r.role));

    let studentId = req.query.studentId as string | undefined;
    const sectionId = req.query.sectionId as string | undefined;

    // A student can ONLY view their own enrollments
    if (!isGlobalAdmin && !isFacultyOrHead) {
      studentId = actor.id;
    }

    const data = await repo.listEnrollments({ sectionId, studentId });
    res.json({ data });
  };
}

export function assignFaculty(repo: AcademicsRepository, userRepo: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const parsed = assignFacultySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid teaching assignment');
    }

    const faculty = await userRepo.findById(parsed.data.facultyId);
    if (!faculty) {
      throw new HttpError(404, 'NOT_FOUND', 'Faculty account not found');
    }

    const hasFacultyRole = faculty.roles.some(r => r.role === 'faculty');
    if (!hasFacultyRole) {
      throw new HttpError(400, 'INVALID_ROLE', 'The user does not hold a faculty role');
    }

    const data = await repo.assignFaculty(parsed.data);
    res.status(201).json({ data });
  };
}

export function removeFaculty(repo: AcademicsRepository): RequestHandler {
  return async (req, res) => {
    const assignmentId = req.params.assignmentId as string;
    const removed = await repo.removeFaculty(assignmentId);
    if (!removed) {
      throw new HttpError(404, 'NOT_FOUND', 'Teaching assignment not found');
    }
    res.json({ data: { removed: true, assignmentId } });
  };
}

export function listTeachingAssignments(repo: AcademicsRepository): RequestHandler {
  return async (req, res) => {
    const sectionId = req.query.sectionId as string | undefined;
    const facultyId = req.query.facultyId as string | undefined;
    const data = await repo.listTeachingAssignments({ sectionId, facultyId });
    res.json({ data });
  };
}
