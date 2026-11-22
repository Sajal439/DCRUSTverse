import { z } from 'zod';
export const privateFileLinkSchema = z.string().regex(/^campus-file:[0-9a-f-]{36}$/i);
export const uploadSchema = z.object({
  name: z.string().trim().min(1).max(150).refine(name => !/[\\/\x00-\x1f]/.test(name), 'Use a plain file name'),
  mimeType: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'text/plain']),
  contentBase64: z.string().min(4).max(2800000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
});
