import { z } from 'zod';

export const importRowSchema = z.object({
  email: z.email().trim().toLowerCase(),
  displayName: z.string().trim().min(1).max(200),
  departmentCode: z.string().trim().toUpperCase().max(30).optional(),
  role: z.enum(['student', 'faculty']).optional(),
});
export const bulkRowsSchema = z.object({ rows: z.array(z.record(z.string(), z.string().max(2000))).min(1).max(200) });
export const executeImportSchema = bulkRowsSchema.extend({ confirm: z.literal(true) });
