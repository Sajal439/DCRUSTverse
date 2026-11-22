import { z } from 'zod';

export const recordAttendanceSchema = z.object({
  sessionId: z.uuid(),
  records: z.array(
    z.object({
      studentId: z.uuid(),
      status: z.enum(['present', 'absent', 'late', 'excused']),
    }),
  ).min(1),
});

export const requestCorrectionSchema = z.object({
  attendanceRecordId: z.uuid(),
  requestedStatus: z.enum(['present', 'excused']),
  reason: z.string().trim().min(5).max(500),
});

export const reviewCorrectionSchema = z.object({
  action: z.enum(['approved', 'rejected']),
});
