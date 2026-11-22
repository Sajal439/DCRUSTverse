import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { facilities, facilityBookings } from '../../../database/schema.ts';

import type {
  FacilityItem,
  FacilityBookingItem,
  FacilitiesRepository,
} from '../../../types/facilities.ts';

export type {
  FacilityItem,
  FacilityBookingItem,
  FacilitiesRepository,
};

export function createDrizzleFacilitiesRepository(db: NodePgDatabase<typeof schema>): FacilitiesRepository {
  return {
    async listFacilities(): Promise<FacilityItem[]> {
      const rows = await db.select().from(facilities).orderBy(facilities.code);
      return rows.map(r => ({
        id: r.id,
        code: r.code,
        name: r.name,
        type: r.type as FacilityItem['type'],
        capacity: r.capacity,
      }));
    },

    async createFacility(data): Promise<FacilityItem> {
      const [row] = await db
        .insert(facilities)
        .values({
          code: data.code.toUpperCase().trim(),
          name: data.name.trim(),
          type: data.type,
          capacity: data.capacity,
        })
        .returning();
      if (!row) throw new Error('Failed to create facility');
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        type: row.type as FacilityItem['type'],
        capacity: row.capacity,
      };
    },

    async getFacilityById(id): Promise<FacilityItem | null> {
      const [row] = await db.select().from(facilities).where(eq(facilities.id, id)).limit(1);
      if (!row) return null;
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        type: row.type as FacilityItem['type'],
        capacity: row.capacity,
      };
    },

    async hasBookingConflict(facilityId, startTime, endTime, excludeBookingId): Promise<boolean> {
      const rows = await db
        .select()
        .from(facilityBookings)
        .where(
          and(
            eq(facilityBookings.facilityId, facilityId),
            eq(facilityBookings.status, 'approved'),
            sql`${facilityBookings.startTime} < ${endTime} AND ${facilityBookings.endTime} > ${startTime}`,
            excludeBookingId ? sql`${facilityBookings.id} != ${excludeBookingId}` : undefined,
          ),
        );
      return rows.length > 0;
    },

    async requestBooking(data): Promise<FacilityBookingItem> {
      const [row] = await db
        .insert(facilityBookings)
        .values({
          facilityId: data.facilityId,
          userId: data.userId,
          startTime: data.startTime,
          endTime: data.endTime,
          purpose: data.purpose.trim(),
          status: 'pending',
        })
        .returning();
      if (!row) throw new Error('Failed to request facility booking');
      return {
        id: row.id,
        facilityId: row.facilityId,
        userId: row.userId,
        startTime: row.startTime.toISOString(),
        endTime: row.endTime.toISOString(),
        purpose: row.purpose,
        status: row.status as FacilityBookingItem['status'],
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async listBookings(filters = {}): Promise<FacilityBookingItem[]> {
      const conditions = [];
      if (filters.facilityId) conditions.push(eq(facilityBookings.facilityId, filters.facilityId));
      if (filters.userId) conditions.push(eq(facilityBookings.userId, filters.userId));
      if (filters.status) conditions.push(eq(facilityBookings.status, filters.status as any));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(facilityBookings).where(whereClause).orderBy(facilityBookings.startTime);
      return rows.map(r => ({
        id: r.id,
        facilityId: r.facilityId,
        userId: r.userId,
        startTime: r.startTime.toISOString(),
        endTime: r.endTime.toISOString(),
        purpose: r.purpose,
        status: r.status as FacilityBookingItem['status'],
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      }));
    },

    async updateBookingStatus(id, status, reviewedBy): Promise<FacilityBookingItem | null> {
      const [row] = await db
        .update(facilityBookings)
        .set({
          status,
          ...(reviewedBy ? { reviewedBy, reviewedAt: new Date() } : {}),
        })
        .where(eq(facilityBookings.id, id))
        .returning();
      if (!row) return null;
      return {
        id: row.id,
        facilityId: row.facilityId,
        userId: row.userId,
        startTime: row.startTime.toISOString(),
        endTime: row.endTime.toISOString(),
        purpose: row.purpose,
        status: row.status as FacilityBookingItem['status'],
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      };
    },
  };
}
