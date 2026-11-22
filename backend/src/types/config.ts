import type { z } from 'zod';
import type { envSchema } from '../schemas/env.schema.ts';

export type Config = z.infer<typeof envSchema>;
