import type { RequestHandler } from 'express';
import type { ReadinessCheck } from '../types/database.ts';

export function readiness(check: ReadinessCheck): RequestHandler {
  return async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      await check();
      res.json({ status: 'ready', service: 'dcrustverse-api' });
    } catch {
      res.status(503).json({
        error: { code: 'NOT_READY', message: 'Service is not ready', requestId: res.locals.requestId },
      });
    }
  };
}
