import type { RequestHandler } from 'express';
import type { AnalyticsRepository } from '../repositories/analytics.repository.ts';

export function getSummaryAnalytics(repo: AnalyticsRepository): RequestHandler {
  return async (_req, res) => {
    const data = await repo.getCampusAnalytics();
    res.json({ data });
  };
}
