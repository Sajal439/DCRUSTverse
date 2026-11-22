import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { auditEvents } from '../../../database/schema.ts';

import type {
  AuditLogItem,
  AuditRepository,
} from '../../../types/audit.ts';

export type {
  AuditLogItem,
  AuditRepository,
};

export function createDrizzleAuditRepository(db: NodePgDatabase<typeof schema>): AuditRepository {
  return {
    async listAuditEvents(filters = {}) {
      const limit = Math.min(filters.limit ?? 50, 100);
      const offset = filters.offset ?? 0;
      const conditions = [];

      if (filters.actorId) conditions.push(eq(auditEvents.actorId, filters.actorId));
      if (filters.targetType) conditions.push(eq(auditEvents.targetType, filters.targetType));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select()
        .from(auditEvents)
        .where(whereClause)
        .orderBy(sql`${auditEvents.createdAt} DESC`)
        .limit(limit)
        .offset(offset);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditEvents)
        .where(whereClause);

      return {
        events: rows.map(r => ({
          id: r.id,
          actorId: r.actorId,
          action: r.action,
          targetType: r.targetType,
          targetId: r.targetId,
          details: (r.details as Record<string, unknown>) ?? {},
          ipAddress: r.ipAddress,
          userAgent: r.userAgent,
          createdAt: r.createdAt.toISOString(),
        })),
        total: countResult?.count ?? 0,
      };
    },
  };
}

export function listAuditLogs(repo: AuditRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const offset = (page - 1) * limit;

    const data = await repo.listAuditEvents({
      actorId: req.query.actorId as string | undefined,
      targetType: req.query.targetType as string | undefined,
      limit,
      offset,
    });

    res.json({
      data: data.events,
      pagination: {
        page,
        limit,
        total: data.total,
        totalPages: Math.ceil(data.total / limit),
      },
    });
  };
}
