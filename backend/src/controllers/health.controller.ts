import type { RequestHandler } from 'express';
import { getHealth } from '../services/health.service.ts';

export const health: RequestHandler = (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(getHealth());
};
