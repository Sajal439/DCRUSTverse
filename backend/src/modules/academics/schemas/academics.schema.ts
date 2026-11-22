import { z } from 'zod';

export const createDepartmentSchema = z.object({
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(200),
});

export const createProgramSchema = z.object({
  departmentId: z.uuid(),
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(200),
  type: z.enum(['undergraduate', 'postgraduate', 'doctorate', 'diploma']),
  totalSemesters: z.number().int().min(1).max(12),
});

export const createAcademicTermSchema = z.object({
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(200),
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }),
  status: z.enum(['upcoming', 'active', 'completed']).default('upcoming'),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: 'endDate must be after startDate',
  path: ['endDate'],
});

export const createCourseSchema = z.object({
  departmentId: z.uuid(),
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(200),
  credits: z.number().int().min(1).max(20),
  type: z.enum(['core', 'elective', 'lab']).default('core'),
  description: z.string().trim().max(1000).optional(),
});

export const createSectionSchema = z.object({
  courseId: z.uuid(),
  academicTermId: z.uuid(),
  name: z.string().trim().min(1).max(20),
  capacity: z.number().int().min(1).max(500).default(60),
});

export const enrollStudentSchema = z.object({
  studentId: z.uuid(),
  sectionId: z.uuid(),
});

export const assignFacultySchema = z.object({
  facultyId: z.uuid(),
  sectionId: z.uuid(),
  role: z.enum(['primary', 'assistant']).default('primary'),
});
