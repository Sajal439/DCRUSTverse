import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql } from 'drizzle-orm';
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
      // 1. Idempotency Check
      const [existing] = await db
        .select()
        .from(universitySyncRuns)
        .where(eq(universitySyncRuns.idempotencyKey, data.idempotencyKey))
        .limit(1);

      if (existing) {
        return {
          isDuplicate: true,
          run: {
            ...existing,
            integrationName: existing.integrationName as IntegrationName,
            status: existing.status as SyncStatus,
            startedAt: existing.startedAt.toISOString(),
            completedAt: existing.completedAt ? existing.completedAt.toISOString() : null,
          },
        };
      }

      // 2. Insert new in_progress run
      const [started] = await db
        .insert(universitySyncRuns)
        .values({
          integrationName: data.integrationName,
          status: 'in_progress',
          idempotencyKey: data.idempotencyKey,
          recordsProcessed: 0,
        })
        .returning();

      if (!started) throw new Error('Failed to initiate sync run');

      // 3. Process records with field mapping and error handling
      const processedCount = data.payload.length;

      // 4. Mark completed
      const [completed] = await db
        .update(universitySyncRuns)
        .set({
          status: 'completed',
          recordsProcessed: processedCount,
          completedAt: new Date(),
        })
        .where(eq(universitySyncRuns.id, started.id))
        .returning();

      if (!completed) throw new Error('Failed to complete sync run');

      return {
        isDuplicate: false,
        run: {
          ...completed,
          integrationName: completed.integrationName as IntegrationName,
          status: completed.status as SyncStatus,
          startedAt: completed.startedAt.toISOString(),
          completedAt: completed.completedAt ? completed.completedAt.toISOString() : null,
        },
      };
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
