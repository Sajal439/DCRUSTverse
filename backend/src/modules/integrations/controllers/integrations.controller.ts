import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { IntegrationsRepository } from '../repositories/integrations.repository.ts';
import { triggerSyncSchema } from '../schemas/integrations.schema.ts';

export function triggerSync(repo: IntegrationsRepository): RequestHandler {
  return async (req, res) => {
    const parsed = triggerSyncSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid sync parameters');
    }

    const result = await repo.executeSync(parsed.data);
    if (result.isDuplicate) {
      return res.status(200).json({ data: result.run, message: 'Sync run already completed (idempotent result)' });
    }

    res.status(201).json({ data: result.run });
  };
}

export function listSyncRuns(repo: IntegrationsRepository): RequestHandler {
  return async (_req, res) => {
    const data = await repo.listSyncRuns();
    res.json({ data });
  };
}
