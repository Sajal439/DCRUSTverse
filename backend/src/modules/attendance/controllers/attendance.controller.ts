import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { AttendanceRepository } from '../repositories/attendance.repository.ts';
import {
  recordAttendanceSchema,
  requestCorrectionSchema,
  reviewCorrectionSchema,
} from '../schemas/attendance.schema.ts';

export function recordAttendance(repo: AttendanceRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = recordAttendanceSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid attendance data');
    }

    const alreadyRecorded = await repo.hasRecordedAttendance(parsed.data.sessionId);
    if (alreadyRecorded) {
      throw new HttpError(409, 'DUPLICATE_SESSION_RECORD', 'Attendance has already been recorded for this session');
    }

    const data = await repo.recordSessionAttendance(parsed.data.sessionId, parsed.data.records, actor.id);
    res.status(201).json({ data });
  };
}

export function listSessionAttendance(repo: AttendanceRepository): RequestHandler {
  return async (req, res) => {
    const sessionId = req.params.sessionId as string;
    const data = await repo.listSessionAttendance(sessionId);
    res.json({ data });
  };
}

export function getMyAttendanceSummary(repo: AttendanceRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    let studentId = actor.id;
    const requestedStudentId = req.query.studentId as string | undefined;

    // Admin and Faculty can inspect any student
    const isPrivileged = actor.roles.some(r => ['administrator', 'faculty', 'department_head'].includes(r.role));
    if (isPrivileged && requestedStudentId) {
      studentId = requestedStudentId;
    }

    const data = await repo.getStudentAttendanceSummary(studentId);
    res.json({ data });
  };
}

export function requestCorrection(repo: AttendanceRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = requestCorrectionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid correction data');
    }

    const data = await repo.requestCorrection({
      attendanceRecordId: parsed.data.attendanceRecordId,
      studentId: actor.id,
      requestedStatus: parsed.data.requestedStatus,
      reason: parsed.data.reason,
    });

    res.status(201).json({ data });
  };
}

export function listCorrections(repo: AttendanceRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const isPrivileged = actor.roles.some(r => ['administrator', 'faculty', 'department_head'].includes(r.role));
    const studentId = isPrivileged ? (req.query.studentId as string | undefined) : actor.id;
    const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;

    const data = await repo.listCorrections({ studentId, status });
    res.json({ data });
  };
}

export function reviewCorrection(repo: AttendanceRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const correctionId = req.params.id as string;
    const parsed = reviewCorrectionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid review action');
    }

    const data = await repo.reviewCorrection(correctionId, parsed.data.action, actor.id);
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Attendance correction request not found');

    res.json({ data });
  };
}
