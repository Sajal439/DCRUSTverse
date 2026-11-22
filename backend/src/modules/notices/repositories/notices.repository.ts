import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { notices, notifications } from '../../../database/schema.ts';

import type {
  NoticeItem,
  NotificationItem,
  NoticesRepository,
} from '../../../types/notices.ts';

export type {
  NoticeItem,
  NotificationItem,
  NoticesRepository,
};

export function createDrizzleNoticesRepository(db: NodePgDatabase<typeof schema>): NoticesRepository {
  return {
    async listNotices() {
      const rows = await db.select().from(notices).orderBy(sql`${notices.publishedAt} DESC`);
      return rows.map(r => ({
        ...r,
        targetRoles: (r.targetRoles as string[]) ?? [],
        expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
        publishedAt: r.publishedAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
      }));
    },
    async createNotice(data) {
      const [row] = await db
        .insert(notices)
        .values({
          title: data.title.trim(),
          content: data.content.trim(),
          targetRoles: data.targetRoles ?? [],
          targetDepartmentId: data.targetDepartmentId ?? null,
          isUrgent: data.isUrgent ?? false,
          expiresAt: data.expiresAt ?? null,
          publishedBy: data.publishedBy,
        })
        .returning();
      if (!row) throw new Error('Failed to create notice');
      await db.execute(sql`insert into notifications (user_id, title, message, link)
        select u.id, ${row.title}, ${row.content}, '/notices' from users u
        where u.status='active' and (${row.targetDepartmentId}::uuid is null or u.department_id=${row.targetDepartmentId}::uuid)
        and (${JSON.stringify(row.targetRoles)}::jsonb = '[]'::jsonb or exists
          (select 1 from role_assignments r where r.user_id=u.id and ${JSON.stringify(row.targetRoles)}::jsonb ? r.role))`);
      return {
        ...row,
        targetRoles: (row.targetRoles as string[]) ?? [],
        expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
        publishedAt: row.publishedAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      };
    },
    async listNotifications(userId) {
      const rows = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(sql`${notifications.createdAt} DESC`);
      return rows.map(r => ({
        ...r,
        readAt: r.readAt ? r.readAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      }));
    },
    async createNotification(data) {
      const [row] = await db.insert(notifications).values(data).returning();
      if (!row) throw new Error('Failed to create notification');
      return {
        ...row,
        readAt: row.readAt ? row.readAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      };
    },
    async markNotificationRead(id) {
      const [row] = await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.id, id)).returning();
      return !!row;
    },
  };
}
