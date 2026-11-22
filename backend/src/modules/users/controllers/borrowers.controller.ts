import type { RequestHandler } from 'express';
import type { CampusUserRepository } from '../../../types/user-repository.ts';

// Library staff need borrower identity, not arbitrary profile/role administration.
export function listBorrowers(users: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const result = await users.listUsers({ status: 'active', limit: 100, offset: (page - 1) * 100 });
    res.json({ data: result.users.map(user => ({ id: user.id, displayName: user.displayName, email: user.email })), pagination: { page, totalPages: Math.ceil(result.total / 100) } });
  };
}
