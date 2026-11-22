import { z } from 'zod';

export const bearerSchema = z.string().max(16384).regex(/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/i);
export const identitySchema = z.object({
  id: z.uuid(),
  email: z.email(),
});
