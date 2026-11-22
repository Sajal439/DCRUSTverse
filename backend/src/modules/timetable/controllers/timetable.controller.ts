import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { TimetableRepository } from '../repositories/timetable.repository.ts';
import { createRoomSchema, createSessionSchema, updateSessionStatusSchema } from '../schemas/timetable.schema.ts';

export function listRooms(repo: TimetableRepository): RequestHandler {
  return async (_req, res) => {
    const data = await repo.listRooms();
    res.json({ data });
  };
}

export function createRoom(repo: TimetableRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid room data');
    }
    const data = await repo.createRoom(parsed.data);
    res.status(201).json({ data });
  };
}

export function listSessions(repo: TimetableRepository): RequestHandler {
  return async (req, res) => {
    const sectionId = req.query.sectionId as string | undefined;
    const roomId = req.query.roomId as string | undefined;
    const facultyId = req.query.facultyId as string | undefined;
    const dayOfWeek = req.query.dayOfWeek ? parseInt(req.query.dayOfWeek as string, 10) : undefined;

    const data = await repo.listSessions({ sectionId, roomId, facultyId, dayOfWeek });
    res.json({ data });
  };
}

export function createSession(repo: TimetableRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid session data');
    }

    const { roomId, facultyId, dayOfWeek, startTime, endTime } = parsed.data;

    // Check room collision
    const roomOccupied = await repo.checkRoomConflict(roomId, dayOfWeek, startTime, endTime);
    if (roomOccupied) {
      throw new HttpError(409, 'ROOM_CONFLICT', 'Room is already scheduled for another class during this time window');
    }

    // Check faculty collision
    const facultyBusy = await repo.checkFacultyConflict(facultyId, dayOfWeek, startTime, endTime);
    if (facultyBusy) {
      throw new HttpError(409, 'FACULTY_CONFLICT', 'Faculty is already scheduled to teach another class during this time window');
    }

    const data = await repo.createSession(parsed.data);
    res.status(201).json({ data });
  };
}

export function updateSessionStatus(repo: TimetableRepository): RequestHandler {
  return async (req, res) => {
    const id = req.params.id as string;
    const parsed = updateSessionStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid status');
    }

    const data = await repo.updateSessionStatus(id, parsed.data.status);
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Class session not found');

    res.json({ data });
  };
}
