import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { clubs, clubMemberships, events, eventRegistrations } from '../../../database/schema.ts';

import type {
  ClubItem,
  EventItem,
  EventRegistrationItem,
  ClubsRepository,
} from '../../../types/clubs.ts';

export type {
  ClubItem,
  EventItem,
  EventRegistrationItem,
  ClubsRepository,
};

export function createDrizzleClubsRepository(db: NodePgDatabase<typeof schema>): ClubsRepository {
  return {
    async listClubs() {
      const rows = await db.select().from(clubs).orderBy(clubs.name);
      return rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));
    },
    async createClub(data) {
      const [row] = await db.insert(clubs).values({ ...data, code: data.code.toUpperCase().trim() }).returning();
      if (!row) throw new Error('Failed to create club');
      return { ...row, createdAt: row.createdAt.toISOString() };
    },
    async joinClub(clubId, studentId) {
      const [row] = await db.insert(clubMemberships).values({ clubId, studentId, role: 'member', status: 'active' }).returning();
      if (!row) throw new Error('Failed to join club');
      return { id: row.id, clubId: row.clubId, studentId: row.studentId, status: row.status };
    },
    async listEvents(filters = {}) {
      const conditions = [];
      if (filters.clubId) conditions.push(eq(events.clubId, filters.clubId));
      if (filters.status) conditions.push(eq(events.status, filters.status as any));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(events).where(whereClause).orderBy(events.startTime);
      return rows.map(r => ({
        ...r,
        status: r.status as EventItem['status'],
        startTime: r.startTime.toISOString(),
        endTime: r.endTime.toISOString(),
        createdAt: r.createdAt.toISOString(),
      }));
    },
    async createEvent(data) {
      const [row] = await db.insert(events).values({ ...data, status: 'pending' }).returning();
      if (!row) throw new Error('Failed to create event');
      return {
        ...row,
        status: row.status as EventItem['status'],
        startTime: row.startTime.toISOString(),
        endTime: row.endTime.toISOString(),
        createdAt: row.createdAt.toISOString(),
      };
    },
    async approveEvent(id) {
      const [row] = await db.update(events).set({ status: 'approved' }).where(eq(events.id, id)).returning();
      if (!row) return null;
      return {
        ...row,
        status: row.status as EventItem['status'],
        startTime: row.startTime.toISOString(),
        endTime: row.endTime.toISOString(),
        createdAt: row.createdAt.toISOString(),
      };
    },
    async getRegistrationCount(eventId) {
      const [count] = await db.select({ count: sql<number>`count(*)::int` }).from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
      return count?.count ?? 0;
    },
    async registerForEvent(eventId, studentId) {
      const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
      if (!event) throw new Error('Event not found');
      const count = await this.getRegistrationCount(eventId);
      if (count >= event.capacity) {
        throw new Error('Event is at full capacity');
      }
      const [row] = await db.insert(eventRegistrations).values({ eventId, studentId }).returning();
      if (!row) throw new Error('Failed to register');
      return { ...row, registeredAt: row.registeredAt.toISOString() };
    },
    async listRegistrations(eventId) {
      const rows = await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
      return rows.map(r => ({ ...r, registeredAt: r.registeredAt.toISOString() }));
    },
  };
}
