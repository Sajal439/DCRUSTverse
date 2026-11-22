import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import type * as schema from '../../../database/schema.ts';
import { attendanceRecords, attendanceCorrections, classSessions } from '../../../database/schema.ts';

import type {
  AttendanceRecordItem,
  AttendanceCorrectionItem,
  StudentAttendanceSummary,
  AttendanceRepository,
} from '../../../types/attendance.ts';

export type {
  AttendanceRecordItem,
  AttendanceCorrectionItem,
  StudentAttendanceSummary,
  AttendanceRepository,
};

export function createDrizzleAttendanceRepository(db: NodePgDatabase<typeof schema>): AttendanceRepository {
  return {
    async hasRecordedAttendance(sessionId: string): Promise<boolean> {
      const rows = await db.select().from(attendanceRecords).where(eq(attendanceRecords.sessionId, sessionId)).limit(1);
      return rows.length > 0;
    },

    async recordSessionAttendance(sessionId, records, recordedBy): Promise<AttendanceRecordItem[]> {
      const values = records.map(r => ({
        sessionId,
        studentId: r.studentId,
        status: r.status,
        recordedBy,
      }));
      const rows = await db.insert(attendanceRecords).values(values).returning();
      return rows.map(r => ({
        id: r.id,
        sessionId: r.sessionId,
        studentId: r.studentId,
        status: r.status as AttendanceRecordItem['status'],
        recordedBy: r.recordedBy,
        recordedAt: r.recordedAt.toISOString(),
      }));
    },

    async listSessionAttendance(sessionId: string): Promise<AttendanceRecordItem[]> {
      const rows = await db.select().from(attendanceRecords).where(eq(attendanceRecords.sessionId, sessionId));
      return rows.map(r => ({
        id: r.id,
        sessionId: r.sessionId,
        studentId: r.studentId,
        status: r.status as AttendanceRecordItem['status'],
        recordedBy: r.recordedBy,
        recordedAt: r.recordedAt.toISOString(),
      }));
    },

    async getStudentAttendanceSummary(studentId: string): Promise<StudentAttendanceSummary> {
      const rows = await db
        .select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.studentId, studentId));

      const totalSessions = rows.length;
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;

      for (const row of rows) {
        if (row.status === 'present') present++;
        else if (row.status === 'absent') absent++;
        else if (row.status === 'late') late++;
        else if (row.status === 'excused') excused++;
      }

      // Attended includes present, late, and excused
      const attended = present + late + excused;
      const attendancePercentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 1000) / 10 : 0;

      return {
        studentId,
        totalSessions,
        present,
        absent,
        late,
        excused,
        attendancePercentage,
      };
    },

    async requestCorrection(data): Promise<AttendanceCorrectionItem> {
      const [row] = await db
        .insert(attendanceCorrections)
        .values({
          attendanceRecordId: data.attendanceRecordId,
          studentId: data.studentId,
          requestedStatus: data.requestedStatus,
          reason: data.reason.trim(),
          status: 'pending',
        })
        .returning();
      if (!row) throw new Error('Failed to request attendance correction');
      return {
        id: row.id,
        attendanceRecordId: row.attendanceRecordId,
        studentId: row.studentId,
        requestedStatus: row.requestedStatus as AttendanceCorrectionItem['requestedStatus'],
        reason: row.reason,
        status: row.status as AttendanceCorrectionItem['status'],
        reviewedBy: row.reviewedBy,
        reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      };
    },

    async listCorrections(filters): Promise<AttendanceCorrectionItem[]> {
      const conditions = [];
      if (filters.studentId) conditions.push(eq(attendanceCorrections.studentId, filters.studentId));
      if (filters.status) conditions.push(eq(attendanceCorrections.status, filters.status));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(attendanceCorrections).where(whereClause);
      return rows.map(r => ({
        id: r.id,
        attendanceRecordId: r.attendanceRecordId,
        studentId: r.studentId,
        requestedStatus: r.requestedStatus as AttendanceCorrectionItem['requestedStatus'],
        reason: r.reason,
        status: r.status as AttendanceCorrectionItem['status'],
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      }));
    },

    async reviewCorrection(correctionId, action, reviewedBy): Promise<AttendanceCorrectionItem | null> {
      const [correction] = await db
        .update(attendanceCorrections)
        .set({
          status: action,
          reviewedBy,
          reviewedAt: new Date(),
        })
        .where(eq(attendanceCorrections.id, correctionId))
        .returning();

      if (!correction) return null;

      // If approved, update the underlying attendance record
      if (action === 'approved') {
        await db
          .update(attendanceRecords)
          .set({ status: correction.requestedStatus })
          .where(eq(attendanceRecords.id, correction.attendanceRecordId));
      }

      return {
        id: correction.id,
        attendanceRecordId: correction.attendanceRecordId,
        studentId: correction.studentId,
        requestedStatus: correction.requestedStatus as AttendanceCorrectionItem['requestedStatus'],
        reason: correction.reason,
        status: correction.status as AttendanceCorrectionItem['status'],
        reviewedBy: correction.reviewedBy,
        reviewedAt: correction.reviewedAt ? correction.reviewedAt.toISOString() : null,
        createdAt: correction.createdAt.toISOString(),
      };
    },
  };
}
