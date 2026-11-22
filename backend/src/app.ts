import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './lib/logger.ts';
import { handleErrors, notFound } from './middleware/errors.ts';
import { requestContext } from './middleware/request-context.ts';
import { v1Router } from './routes/v1.ts';
import type { Config } from './types/config.ts';
import type { Logger } from './types/logger.ts';

export function createApp(config: Config, log: Logger = logger) {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestContext(log));
  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN, exposedHeaders: ['X-Request-ID'] }));
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1', v1Router);
  app.use(notFound);
  app.use(handleErrors(log));
  return app;
}
