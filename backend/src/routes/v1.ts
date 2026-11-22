import { Router } from 'express';
import { health } from '../controllers/health.controller.ts';
import { readiness } from '../controllers/readiness.controller.ts';
import type { ReadinessCheck } from '../types/database.ts';

export function createV1Router(check: ReadinessCheck) {
  const router = Router();
  router.get('/health', health);
  router.get('/ready', readiness(check));
  return router;
}
