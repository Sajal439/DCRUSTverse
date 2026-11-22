import type { RequestHandler } from 'express';
import type { SearchRepository } from '../repositories/search.repository.ts';

export function searchGlobal(repo: SearchRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    const actorRoles = actor?.roles.map((r: { role: string }) => r.role) ?? [];
    const q = (req.query.q as string | undefined) ?? '';

    const results = await repo.search(q, actorRoles);
    res.json({ data: results });
  };
}
