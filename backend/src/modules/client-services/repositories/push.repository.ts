import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../../database/schema.ts';
import { pushDevices, pushDeliveries } from '../../../database/schema.ts';
import type { PushRepository } from '../../../types/push.ts';

export function createPushRepository(db: NodePgDatabase<typeof schema>): PushRepository {
  const fields = { id: pushDevices.id, platform: pushDevices.platform, enabled: pushDevices.enabled, updatedAt: pushDevices.updatedAt };
  return {
    async register(userId, deviceToken, platform) {
      return db.transaction(async tx => {
        const [previous] = await tx.select().from(pushDevices).where(eq(pushDevices.deviceToken, deviceToken)).for('update');
        const switched = previous && previous.userId !== userId;
        const [device] = await tx.insert(pushDevices).values({ userId, deviceToken, platform }).onConflictDoUpdate({ target: pushDevices.deviceToken, set: { userId, platform, enabled: true, updatedAt: new Date(), ...(switched ? { createdAt: new Date() } : {}) } }).returning(fields);
        if (!device) throw new Error('Device registration failed');
        // Clear old account deliveries when a physical device switches accounts.
        if (switched) await tx.delete(pushDeliveries).where(eq(pushDeliveries.deviceId, device.id));
        return device;
      });
    },
    async list(userId) { return db.select(fields).from(pushDevices).where(eq(pushDevices.userId, userId)); },
    async remove(userId, id) {
      const rows = await db.delete(pushDevices).where(and(eq(pushDevices.id, id), eq(pushDevices.userId, userId))).returning({ id: pushDevices.id });
      return rows.length > 0;
    },
  };
}
