import type { RequestHandler } from 'express';
import type { DirectoryRepository } from '../repositories/directory.repository.ts';

export function searchDepartments(repo: DirectoryRepository): RequestHandler {
  return async (req, res) => {
    const q = req.query.q as string | undefined;
    const data = await repo.searchDepartments(q);
    res.json({ data });
  };
}

export function searchStaff(repo: DirectoryRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    const actorRoles = actor?.roles.map((r: { role: string }) => r.role) ?? [];
    const isAdmin = actorRoles.includes('administrator');

    const q = req.query.q as string | undefined;
    const staff = await repo.searchStaff(q);

    const sanitized = staff.map(member => {
      const isSelf = actor?.id === member.id;
      if (isAdmin || isSelf) {
        return member;
      }
      if (member.contactVisibility === 'private') {
        return {
          ...member,
          phone: null,
        };
      }
      return member;
    });

    res.json({ data: sanitized });
  };
}
