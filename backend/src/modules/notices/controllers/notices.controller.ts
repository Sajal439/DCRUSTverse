import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { NoticesRepository } from '../repositories/notices.repository.ts';
import { createNoticeSchema } from '../schemas/notices.schema.ts';

export function listNotices(repo: NoticesRepository): RequestHandler {
  return async (_req, res) => {
    const actor = res.locals.campusUser;
    const allNotices = await repo.listNotices();

    // Filter by targeting if actor is not an admin
    const actorRoles = actor?.roles.map((r: { role: string }) => r.role) ?? [];
    const isAdmin = actorRoles.includes('administrator');

    const filtered = isAdmin
      ? allNotices
      : allNotices.filter(notice => {
          if (!notice.targetRoles || notice.targetRoles.length === 0) return true;
          return notice.targetRoles.some(role => actorRoles.includes(role));
        });

    res.json({ data: filtered });
  };
}

export function createNotice(repo: NoticesRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = createNoticeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid notice data');
    }

    const notice = await repo.createNotice({
      ...parsed.data,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      publishedBy: actor.id,
    });

    res.status(201).json({ data: notice });
  };
}

export function listNotifications(repo: NoticesRepository): RequestHandler {
  return async (_req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const data = await repo.listNotifications(actor.id);
    res.json({ data });
  };
}

export function markNotificationRead(repo: NoticesRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const id = req.params.id as string;
    const ok = await repo.markNotificationRead(id);
    if (!ok) throw new HttpError(404, 'NOT_FOUND', 'Notification not found');

    res.json({ data: { id, isRead: true } });
  };
}
