import { z } from 'zod';

export const createDocumentRequestSchema = z.object({
  documentType: z.enum(['bonafide', 'transcript', 'character_certificate', 'no_objection']),
  purpose: z.string().trim().min(5).max(500),
});

export const reviewDocumentRequestSchema = z.object({
  status: z.enum(['approved', 'issued', 'rejected']),
  issuedFileUrl: z.string().url().optional(),
});
