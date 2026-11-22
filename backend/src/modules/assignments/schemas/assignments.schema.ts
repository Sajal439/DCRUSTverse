import { z } from 'zod';

export const createAssignmentSchema = z.object({
  sectionId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  dueDate: z.string().datetime({ offset: true }),
  maxMarks: z.number().int().min(1).max(1000).default(100),
  allowLate: z.boolean().default(true),
});

export const submitAssignmentSchema = z.object({
  content: z.string().trim().max(10000).optional(),
  fileUrl: z.string().url().optional(),
}).refine(data => data.content !== undefined || data.fileUrl !== undefined, {
  message: 'Either content or fileUrl must be provided',
});

export const gradeSubmissionSchema = z.object({
  marksObtained: z.number().int().min(0),
  feedback: z.string().trim().max(1000).optional(),
});
