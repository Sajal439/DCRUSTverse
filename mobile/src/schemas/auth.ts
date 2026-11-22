import { z } from 'zod';
export const registrationSchema = z.object({
  email: z.email().transform(value => value.trim().toLowerCase()),
  password: z.string().min(8, 'Choose a password of at least 8 characters').max(128),
});
