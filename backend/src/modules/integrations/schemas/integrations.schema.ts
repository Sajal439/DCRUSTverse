import { z } from 'zod';

export const triggerSyncSchema = z.object({
  integrationName: z.enum(['erp_attendance', 'exam_portal', 'hr_directory']),
  idempotencyKey: z.string().trim().min(8).max(100),
  payload: z.array(z.record(z.string(), z.any())).default([]),
});
