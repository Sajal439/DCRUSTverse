import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { rooms, classSessions } from '../../../database/schema.ts';

import type {
  RoomItem,
  ClassSessionItem,
  TimetableRepository,
} from '../../../types/timetable.ts';

export type {
  RoomItem,
  ClassSessionItem,
  TimetableRepository,
};

export function createDrizzleTimetableRepository(db: NodePgDatabase<typeof schema>): TimetableRepository {
  return {
    async listRooms(): Promise<RoomItem[]> {
      const rows = await db.select().from(rooms).orderBy(rooms.code);
      return rows.map(r => ({
        id: r.id,
        code: r.code,
        name: r.name,
        building: r.building,
        capacity: r.capacity,
        type: r.type as RoomItem['type'],
        createdAt: r.createdAt.toISOString(),
      }));
    },

    async createRoom(data): Promise<RoomItem> {
      const [row] = await db
        .insert(rooms)
        .values({
          code: data.code.toUpperCase().trim(),
          name: data.name.trim(),
          building: data.building.trim(),
          capacity: data.capacity,
          type: data.type ?? 'classroom',
        })
        .returning();
      if (!row) throw new Error('Failed to create room');
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        building: row.building,
        capacity: row.capacity,
        type: row.type as RoomItem['type'],
        createdAt: row.createdAt.toISOString(),
      };
    },

    async getRoomById(id): Promise<RoomItem | null> {
      const [row] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
      if (!row) return null;
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        building: row.building,
        capacity: row.capacity,
        type: row.type as RoomItem['type'],
        createdAt: row.createdAt.toISOString(),
      };
    },

    async listSessions(filters = {}): Promise<ClassSessionItem[]> {
      const conditions = [];
      if (filters.sectionId) conditions.push(eq(classSessions.sectionId, filters.sectionId));
      if (filters.roomId) conditions.push(eq(classSessions.roomId, filters.roomId));
      if (filters.facultyId) conditions.push(eq(classSessions.facultyId, filters.facultyId));
      if (filters.dayOfWeek) conditions.push(eq(classSessions.dayOfWeek, filters.dayOfWeek));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(classSessions).where(whereClause).orderBy(classSessions.dayOfWeek, classSessions.startTime);
      return rows.map(r => ({
        id: r.id,
        sectionId: r.sectionId,
        roomId: r.roomId,
        facultyId: r.facultyId,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        date: r.date,
        status: r.status as ClassSessionItem['status'],
        createdAt: r.createdAt.toISOString(),
      }));
    },

    async checkRoomConflict(roomId, dayOfWeek, startTime, endTime, excludeSessionId): Promise<boolean> {
      // Overlap: existing.start < new.end AND existing.end > new.start
      const rows = await db
        .select()
        .from(classSessions)
        .where(
          and(
            eq(classSessions.roomId, roomId),
            eq(classSessions.dayOfWeek, dayOfWeek),
            eq(classSessions.status, 'scheduled'),
            sql`${classSessions.startTime} < ${endTime} AND ${classSessions.endTime} > ${startTime}`,
            excludeSessionId ? sql`${classSessions.id} != ${excludeSessionId}` : undefined,
          ),
        );
      return rows.length > 0;
    },

    async checkFacultyConflict(facultyId, dayOfWeek, startTime, endTime, excludeSessionId): Promise<boolean> {
      const rows = await db
        .select()
        .from(classSessions)
        .where(
          and(
            eq(classSessions.facultyId, facultyId),
            eq(classSessions.dayOfWeek, dayOfWeek),
            eq(classSessions.status, 'scheduled'),
            sql`${classSessions.startTime} < ${endTime} AND ${classSessions.endTime} > ${startTime}`,
            excludeSessionId ? sql`${classSessions.id} != ${excludeSessionId}` : undefined,
          ),
        );
      return rows.length > 0;
    },

    async createSession(data): Promise<ClassSessionItem> {
      const [row] = await db
        .insert(classSessions)
        .values({
          sectionId: data.sectionId,
          roomId: data.roomId,
          facultyId: data.facultyId,
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
          date: data.date ?? null,
          status: 'scheduled',
        })
        .returning();
      if (!row) throw new Error('Failed to create class session');
      return {
        id: row.id,
        sectionId: row.sectionId,
        roomId: row.roomId,
        facultyId: row.facultyId,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        date: row.date,
        status: row.status as ClassSessionItem['status'],
        createdAt: row.createdAt.toISOString(),
      };
    },

    async updateSessionStatus(id, status): Promise<ClassSessionItem | null> {
      const [row] = await db
        .update(classSessions)
        .set({ status })
        .where(eq(classSessions.id, id))
        .returning();
      if (!row) return null;
      return {
        id: row.id,
        sectionId: row.sectionId,
        roomId: row.roomId,
        facultyId: row.facultyId,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        date: row.date,
        status: row.status as ClassSessionItem['status'],
        createdAt: row.createdAt.toISOString(),
      };
    },
  };
}
