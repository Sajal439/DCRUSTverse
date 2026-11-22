import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { HostelRepository } from '../repositories/hostel.repository.ts';
import {
  createHostelSchema,
  createHostelRoomSchema,
  applyHostelSchema,
  allocateRoomSchema,
  requestTransferSchema,
} from '../schemas/hostel.schema.ts';

export function listHostels(repo: HostelRepository): RequestHandler {
  return async (_req, res) => {
    const data = await repo.listHostels();
    res.json({ data });
  };
}

export function createHostel(repo: HostelRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createHostelSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid hostel data');
    }
    const data = await repo.createHostel(parsed.data);
    res.status(201).json({ data });
  };
}

export function listRooms(repo: HostelRepository): RequestHandler {
  return async (req, res) => {
    const hostelId = req.params.hostelId as string;
    const data = await repo.listRooms(hostelId);
    res.json({ data });
  };
}

export function createRoom(repo: HostelRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createHostelRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid room data');
    }
    const data = await repo.createRoom(parsed.data);
    res.status(201).json({ data });
  };
}

export function applyHostel(repo: HostelRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = applyHostelSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid application data');
    }

    const data = await repo.apply(actor.id, parsed.data.hostelId);
    res.status(201).json({ data });
  };
}

export function allocateRoom(repo: HostelRepository): RequestHandler {
  return async (req, res) => {
    const parsed = allocateRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid allocation data');
    }

    const existingAllocation = await repo.getAllocationByStudent(parsed.data.studentId);
    if (existingAllocation) {
      throw new HttpError(409, 'ALREADY_ALLOCATED', 'Student is already allocated a hostel room');
    }

    try {
      const data = await repo.allocateRoom(parsed.data.studentId, parsed.data.roomId);
      res.status(201).json({ data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Room allocation failed';
      throw new HttpError(400, 'ALLOCATION_FAILED', message);
    }
  };
}

export function requestTransfer(repo: HostelRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = requestTransferSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid transfer data');
    }

    try {
      const data = await repo.requestTransfer(actor.id, parsed.data.toRoomId, parsed.data.reason);
      res.status(201).json({ data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transfer request failed';
      throw new HttpError(400, 'TRANSFER_REQUEST_FAILED', message);
    }
  };
}

export function listTransfers(repo: HostelRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const isWardenOrAdmin = actor.roles.some(r => ['hostel_warden', 'administrator'].includes(r.role));
    const studentId = isWardenOrAdmin ? (req.query.studentId as string | undefined) : actor.id;

    const data = await repo.listTransfers({ studentId, status: req.query.status as string });
    res.json({ data });
  };
}

export function approveTransfer(repo: HostelRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const transferId = req.params.id as string;
    try {
      const data = await repo.approveTransfer(transferId, actor.id);
      if (!data) throw new HttpError(404, 'NOT_FOUND', 'Pending transfer request not found');
      res.json({ data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transfer approval failed';
      throw new HttpError(400, 'APPROVAL_FAILED', message);
    }
  };
}
