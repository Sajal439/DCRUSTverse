import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { Logger } from '../types/logger.ts';

export function requestContext(log: Logger): RequestHandler {
  return (req, res, next) => {
    const requestId = randomUUID();
    res.locals.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    const start = performance.now();
    res.on('finish', () => log.info({
      event: 'request', requestId, method: req.method, status: res.statusCode,
      durationMs: Math.round(performance.now() - start),
    }));
    next();
  };
}
