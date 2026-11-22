import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './lib/logger.ts';
import { handleErrors, notFound } from './middleware/errors.ts';
import { requestContext } from './middleware/request-context.ts';
import { createV1Router } from './routes/v1.ts';
import type { ReadinessCheck } from './types/database.ts';
import type { Config } from './types/config.ts';
import type { Logger } from './types/logger.ts';
import type { VerifyIdentity } from './types/auth.ts';
import { createSupabase } from './config/supabase.ts';
import { createVerifyIdentity } from './modules/auth/services/auth.service.ts';
import { createAuthRouter } from './modules/auth/routes/auth.routes.ts';

export function createApp(
  config: Config,
  log: Logger = logger,
  check: ReadinessCheck = async () => { throw new Error('Database is not configured'); },
  verify: VerifyIdentity = createVerifyIdentity(createSupabase(config)),
) {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestContext(log));
  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN, exposedHeaders: ['X-Request-ID'] }));
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1', createV1Router(check));
  app.use('/api/v1/auth', createAuthRouter(verify));
  app.use(notFound);
  app.use(handleErrors(log));
  return app;
}
