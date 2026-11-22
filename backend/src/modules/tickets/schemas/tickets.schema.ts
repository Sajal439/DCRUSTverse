import { z } from 'zod';

export const createTicketSchema = z.object({
  category: z.enum(['hostel', 'academic', 'facility', 'harassment', 'general']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  isSensitive: z.boolean().optional(),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(5).max(5000),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'reopened']),
  resolutionNotes: z.string().trim().max(1000).optional(),
});

export const assignStaffSchema = z.object({
  staffId: z.uuid(),
});

export const addCommentSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  isInternal: z.boolean().default(false),
});
