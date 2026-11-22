import { z } from 'zod';

export const createNoticeSchema = z.object({
  title: z.string().trim().min(3).max(200),
  content: z.string().trim().min(5).max(10000),
  targetRoles: z.array(z.string().trim()).default([]),
  targetDepartmentId: z.uuid().optional(),
  isUrgent: z.boolean().default(false),
  expiresAt: z.string().datetime({ offset: true }).optional(),
});
