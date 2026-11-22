import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { DigitalIdRepository } from '../repositories/digital-id.repository.ts';

export function getMyDigitalId(repo: DigitalIdRepository): RequestHandler {
  return async (_req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    let card = await repo.getCredentialForUser(actor.id);
    if (!card) {
      card = await repo.issueCredential(actor.id);
    }

    card.roles = actor.roles.map((r: { role: string }) => r.role);
    res.json({ data: card });
  };
}

export function issueDigitalId(repo: DigitalIdRepository): RequestHandler {
  return async (_req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const previous = await repo.getCredentialForUser(actor.id);
    if (previous?.status === 'revoked') {
      throw new HttpError(403, 'CREDENTIAL_REVOKED', 'Contact the campus administrator to restore a revoked credential');
    }
    const card = await repo.issueCredential(actor.id);
    card.roles = actor.roles.map((r: { role: string }) => r.role);
    res.status(201).json({ data: card });
  };
}

export function verifyDigitalId(repo: DigitalIdRepository): RequestHandler {
  return async (req, res) => {
    const token = req.params.token as string;
    const result = await repo.verifyToken(token);

    if (!result.valid) {
      throw new HttpError(400, 'INVALID_OR_REVOKED_CREDENTIAL', result.message ?? 'Invalid or expired credential');
    }

    res.json({ data: result });
  };
}

export function revokeDigitalId(repo: DigitalIdRepository): RequestHandler {
  return async (req, res) => {
    const userId = req.params.userId as string;
    const revoked = await repo.revokeCredential(userId);
    res.json({ data: { userId, revoked } });
  };
}
