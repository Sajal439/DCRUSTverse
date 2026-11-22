import { createHash } from 'node:crypto';
import { HttpError } from '../../../lib/http-error.ts';
import { triggerSyncSchema } from '../schemas/integrations.schema.ts';
import { users, profiles, auditEvents, enrollments, classSessions, attendanceRecords, grades, assignments, submissions } from '../../../database/schema.ts';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, and } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { universitySyncRuns } from '../../../database/schema.ts';

import type {
  IntegrationName,
  SyncStatus,
  SyncRunRecord,
  SyncResult,
  IntegrationsRepository,
} from '../../../types/integrations.ts';

export type {
  IntegrationName,
  SyncStatus,
  SyncRunRecord,
  SyncResult,
  IntegrationsRepository,
};

export function createDrizzleIntegrationsRepository(db: NodePgDatabase<typeof schema>): IntegrationsRepository {
  return {
    async executeSync(data) {
      const parsed = triggerSyncSchema.parse(data);
      const digest = createHash('sha256').update(JSON.stringify(parsed)).digest('hex');
      return db.transaction(async tx => {
        await tx.execute(sql`select pg_advisory_xact_lock(742130, 4)`);
        const [existing] = await tx.select().from(universitySyncRuns).where(eq(universitySyncRuns.idempotencyKey, data.idempotencyKey));
        if (existing) {
          const [audit] = await tx.select().from(auditEvents).where(eq(auditEvents.targetId, existing.id));
          if ((audit?.details as { digest?: string } | undefined)?.digest !== digest) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'This import key has already been used for different data');
          return { isDuplicate: true, run: { ...existing, startedAt: existing.startedAt.toISOString(), completedAt: existing.completedAt?.toISOString() ?? null } };
        }
        if (parsed.integrationName === 'erp_attendance') {
          for (const row of parsed.payload) {
            const [enrolled] = await tx.select({ id: enrollments.id }).from(enrollments).innerJoin(classSessions, eq(classSessions.sectionId, enrollments.sectionId)).where(and(eq(classSessions.id, row.sessionId), eq(enrollments.studentId, row.studentId), eq(enrollments.status, 'enrolled')));
            if (!enrolled) throw new HttpError(400, 'INVALID_ENROLLMENT', 'An attendance row references a student outside the class');
            await tx.insert(attendanceRecords).values({ ...row, recordedBy: data.actorId }).onConflictDoUpdate({ target: [attendanceRecords.sessionId, attendanceRecords.studentId], set: { status: row.status, recordedBy: data.actorId, recordedAt: new Date() } });
          }
        } else if (parsed.integrationName === 'exam_portal') {
          for (const row of parsed.payload) {
            const [assignment] = await tx.select({ maxMarks: assignments.maxMarks }).from(submissions).innerJoin(assignments, eq(assignments.id, submissions.assignmentId)).where(eq(submissions.id, row.submissionId));
            if (!assignment || row.marksObtained > assignment.maxMarks) throw new HttpError(400, 'INVALID_MARKS', 'A grade references an unknown submission or exceeds maximum marks');
            await tx.insert(grades).values({ ...row, gradedBy: data.actorId }).onConflictDoUpdate({ target: grades.submissionId, set: { marksObtained: row.marksObtained, feedback: row.feedback, gradedBy: data.actorId, gradedAt: new Date() } });
          }
        } else {
          for (const row of parsed.payload) {
            const [user] = await tx.select().from(users).where(eq(users.email, row.email.toLowerCase()));
            if (!user || user.status !== 'active') throw new HttpError(400, 'UNKNOWN_USER', 'Directory imports require existing active campus accounts');
            await tx.insert(profiles).values({ userId: user.id, designation: row.designation, phone: row.phone }).onConflictDoUpdate({ target: profiles.userId, set: { designation: row.designation, ...(row.phone ? { phone: row.phone } : {}) } });
          }
        }
        const [completed] = await tx.insert(universitySyncRuns).values({ integrationName: parsed.integrationName, idempotencyKey: parsed.idempotencyKey, status: 'completed', recordsProcessed: parsed.payload.length, completedAt: new Date() }).returning();
        if (!completed) throw new Error('Import failed');
        await tx.insert(auditEvents).values({ actorId: data.actorId, action: 'integration.imported', targetType: 'integration_run', targetId: completed.id, details: { digest, count: parsed.payload.length } });
        return { isDuplicate: false, run: { ...completed, startedAt: completed.startedAt.toISOString(), completedAt: completed.completedAt?.toISOString() ?? null } };
      });
    },
    async listSyncRuns() {
      const rows = await db
        .select()
        .from(universitySyncRuns)
        .orderBy(sql`${universitySyncRuns.startedAt} DESC`)
        .limit(20);

      return rows.map(r => ({
        ...r,
        integrationName: r.integrationName as IntegrationName,
        status: r.status as SyncStatus,
        startedAt: r.startedAt.toISOString(),
        completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      }));
    },
  };
}
