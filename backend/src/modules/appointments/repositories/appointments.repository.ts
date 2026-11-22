import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { facultyAvailabilities, appointments } from '../../../database/schema.ts';

import type {
  FacultyAvailabilityItem,
  AppointmentItem,
  AppointmentsRepository,
} from '../../../types/appointments.ts';

export type {
  FacultyAvailabilityItem,
  AppointmentItem,
  AppointmentsRepository,
};

export function createDrizzleAppointmentsRepository(db: NodePgDatabase<typeof schema>): AppointmentsRepository {
  return {
    async setAvailability(data): Promise<FacultyAvailabilityItem> {
      const [row] = await db
        .insert(facultyAvailabilities)
        .values({
          facultyId: data.facultyId,
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
        })
        .returning();
      if (!row) throw new Error('Failed to set availability');
      return {
        id: row.id,
        facultyId: row.facultyId,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async getFacultyAvailabilities(facultyId): Promise<FacultyAvailabilityItem[]> {
      const rows = await db
        .select()
        .from(facultyAvailabilities)
        .where(eq(facultyAvailabilities.facultyId, facultyId))
        .orderBy(facultyAvailabilities.dayOfWeek, facultyAvailabilities.startTime);
      return rows.map(r => ({
        id: r.id,
        facultyId: r.facultyId,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        createdAt: r.createdAt.toISOString(),
      }));
    },

    async hasOverlappingConfirmedAppointment(facultyId, startTime, endTime, excludeId): Promise<boolean> {
      const rows = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.facultyId, facultyId),
            eq(appointments.status, 'confirmed'),
            sql`${appointments.startTime} < ${endTime} AND ${appointments.endTime} > ${startTime}`,
            excludeId ? sql`${appointments.id} != ${excludeId}` : undefined,
          ),
        );
      return rows.length > 0;
    },

    async requestAppointment(data): Promise<AppointmentItem> {
      const [row] = await db
        .insert(appointments)
        .values({
          facultyId: data.facultyId,
          studentId: data.studentId,
          startTime: data.startTime,
          endTime: data.endTime,
          reason: data.reason.trim(),
          status: 'pending',
        })
        .returning();
      if (!row) throw new Error('Failed to request appointment');
      return {
        id: row.id,
        facultyId: row.facultyId,
        studentId: row.studentId,
        startTime: row.startTime.toISOString(),
        endTime: row.endTime.toISOString(),
        status: row.status as AppointmentItem['status'],
        reason: row.reason,
        notes: row.notes,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async listAppointments(filters): Promise<AppointmentItem[]> {
      const conditions = [];
      if (filters.facultyId) conditions.push(eq(appointments.facultyId, filters.facultyId));
      if (filters.studentId) conditions.push(eq(appointments.studentId, filters.studentId));
      if (filters.status) conditions.push(eq(appointments.status, filters.status));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(appointments).where(whereClause).orderBy(appointments.startTime);
      return rows.map(r => ({
        id: r.id,
        facultyId: r.facultyId,
        studentId: r.studentId,
        startTime: r.startTime.toISOString(),
        endTime: r.endTime.toISOString(),
        status: r.status as AppointmentItem['status'],
        reason: r.reason,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
      }));
    },

    async updateAppointmentStatus(id, status, notes): Promise<AppointmentItem | null> {
      const [row] = await db
        .update(appointments)
        .set({
          status,
          ...(notes !== undefined ? { notes } : {}),
        })
        .where(eq(appointments.id, id))
        .returning();
      if (!row) return null;
      return {
        id: row.id,
        facultyId: row.facultyId,
        studentId: row.studentId,
        startTime: row.startTime.toISOString(),
        endTime: row.endTime.toISOString(),
        status: row.status as AppointmentItem['status'],
        reason: row.reason,
        notes: row.notes,
        createdAt: row.createdAt.toISOString(),
      };
    },
  };
}
