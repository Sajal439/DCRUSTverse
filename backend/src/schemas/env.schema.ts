import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().trim().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.url().refine(value => {
    const url = new URL(value);
    return ['postgres:', 'postgresql:'].includes(url.protocol) && Boolean(url.hostname) && url.pathname.length > 1;
  }, 'Must be a PostgreSQL connection URL with a database name').optional(),
  DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10),
  CORS_ORIGIN: z.url().refine(value => {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
  }, 'Must be an exact HTTP(S) origin without a trailing slash').default('http://localhost:3000'),
});
