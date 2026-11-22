import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../../database/schema.ts';
import { users, departments, roleAssignments, auditEvents } from '../../../database/schema.ts';
import type { BulkRepository } from '../../../types/bulk-repository.ts';
import { HttpError } from '../../../lib/http-error.ts';

export function createBulkRepository(db: NodePgDatabase<typeof schema>): BulkRepository {
  return {
    async importUsers(rows, actorId) {
      return db.transaction(async tx => {
        // Serialize batches so concurrent imports cannot assign roles twice.
        await tx.execute(sql`select pg_advisory_xact_lock(742130, 2)`);
        let imported = 0; let skipped = 0;
        for (const row of rows) {
          const existing = await tx.select({ id: users.id }).from(users).where(eq(users.email, row.email)).limit(1);
          if (existing.length) { skipped++; continue; }
          const identity = await tx.execute<{ id: string }>(sql`select id from auth.users where lower(email) = ${row.email} and email_confirmed_at is not null`);
          if (!identity.rows[0]) throw new HttpError(400, 'UNVERIFIED_IDENTITY', `A confirmed Supabase login is required for ${row.email}. No rows were imported.`);
          let departmentId: string | undefined;
          if (row.departmentCode) {
            const [department] = await tx.select().from(departments).where(eq(departments.code, row.departmentCode));
            if (!department) throw new HttpError(400, 'UNKNOWN_DEPARTMENT', `Unknown department ${row.departmentCode}. No rows were imported.`);
            departmentId = department.id;
          }
          const [user] = await tx.insert(users).values({ authUserId: identity.rows[0].id, email: row.email, displayName: row.displayName, departmentId, status: 'pending' }).returning();
          if (!user) throw new Error('Import failed');
          if (row.role === 'student' || row.role === 'faculty') await tx.insert(roleAssignments).values({ userId: user.id, role: row.role, assignedBy: actorId, scopeType: departmentId ? 'department' : 'global', scopeId: departmentId });
          imported++;
        }
        await tx.insert(auditEvents).values({ actorId, action: 'users.bulk_imported', targetType: 'user', details: { imported, skipped } });
        return { imported, skipped };
      });
    },
    async exportUsers() {
      const rows = await db.select({ email: users.email, displayName: users.displayName, status: users.status, departmentCode: departments.code }).from(users).leftJoin(departments, eq(users.departmentId, departments.id));
      return rows.map(row => ({ ...row, departmentCode: row.departmentCode ?? '' }));
    },
  };
}
