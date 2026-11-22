import type { RequestHandler } from 'express';

export const currentIdentity: RequestHandler = (_req, res) => {
  res.json({ data: res.locals.identity });
};
