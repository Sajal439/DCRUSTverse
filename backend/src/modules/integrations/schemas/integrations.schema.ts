import { z } from 'zod';
export const attendanceImportRow = z.object({ sessionId: z.uuid(), studentId: z.uuid(), status: z.enum(['present', 'absent', 'late', 'excused']) }).strict();
export const gradeImportRow = z.object({ submissionId: z.uuid(), marksObtained: z.number().int().min(0).max(10000), feedback: z.string().max(2000).optional() }).strict();
export const directoryImportRow = z.object({ email: z.email(), designation: z.string().trim().min(1).max(100), phone: z.string().trim().min(7).max(20).optional() }).strict();
export const triggerSyncSchema = z.discriminatedUnion('integrationName', [
  z.object({ integrationName: z.literal('erp_attendance'), idempotencyKey: z.string().trim().min(8).max(100), payload: z.array(attendanceImportRow).min(1).max(200) }),
  z.object({ integrationName: z.literal('exam_portal'), idempotencyKey: z.string().trim().min(8).max(100), payload: z.array(gradeImportRow).min(1).max(200) }),
  z.object({ integrationName: z.literal('hr_directory'), idempotencyKey: z.string().trim().min(8).max(100), payload: z.array(directoryImportRow).min(1).max(200) }),
]);
