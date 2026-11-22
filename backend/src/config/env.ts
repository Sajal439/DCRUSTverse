import { envSchema } from '../schemas/env.schema.ts';
import type { Config } from '../types/config.ts';

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const fields = result.error.issues.map(issue => issue.path.join('.'));
    throw new Error(`Invalid configuration: ${fields.join(', ')}`);
  }
  return result.data;
}
