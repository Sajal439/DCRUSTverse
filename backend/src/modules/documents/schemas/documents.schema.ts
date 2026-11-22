import { privateFileLinkSchema } from '../../files/schemas/files.schema.ts';
import { z } from 'zod';

export const createDocumentRequestSchema = z.object({
  documentType: z.enum(['bonafide', 'transcript', 'character_certificate', 'no_objection']),
  purpose: z.string().trim().min(5).max(500),
});

export const reviewDocumentRequestSchema = z.object({
  status: z.enum(['approved', 'issued', 'rejected']),
  issuedFileUrl: privateFileLinkSchema.optional(),
}).refine(data => data.status !== 'issued' || !!data.issuedFileUrl, { message: 'Attach the issued certificate before marking this request issued', path: ['issuedFileUrl'] });
