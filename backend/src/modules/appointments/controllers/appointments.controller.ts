import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { AppointmentsRepository } from '../repositories/appointments.repository.ts';
import {
  setAvailabilitySchema,
  requestAppointmentSchema,
  reviewAppointmentSchema,
} from '../schemas/appointments.schema.ts';

export function setAvailability(repo: AppointmentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = setAvailabilitySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid availability data');
    }

    const data = await repo.setAvailability({
      facultyId: actor.id,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
    });

    res.status(201).json({ data });
  };
}

export function getFacultyAvailabilities(repo: AppointmentsRepository): RequestHandler {
  return async (req, res) => {
    const facultyId = req.params.facultyId as string;
    const data = await repo.getFacultyAvailabilities(facultyId);
    res.json({ data });
  };
}

export function requestAppointment(repo: AppointmentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = requestAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid appointment data');
    }

    const startTime = new Date(parsed.data.startTime);
    const endTime = new Date(parsed.data.endTime);

    const hasConflict = await repo.hasOverlappingConfirmedAppointment(parsed.data.facultyId, startTime, endTime);
    if (hasConflict) {
      throw new HttpError(409, 'APPOINTMENT_CONFLICT', 'Faculty is already booked for a confirmed appointment during this slot');
    }

    const data = await repo.requestAppointment({
      facultyId: parsed.data.facultyId,
      studentId: actor.id,
      startTime,
      endTime,
      reason: parsed.data.reason,
    });

    res.status(201).json({ data });
  };
}

export function listMyAppointments(repo: AppointmentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const isFaculty = actor.roles.some(r => r.role === 'faculty');
    const filters = isFaculty
      ? { facultyId: actor.id }
      : { studentId: actor.id };

    const data = await repo.listAppointments(filters);
    res.json({ data });
  };
}

export function reviewAppointment(repo: AppointmentsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const appointmentId = req.params.id as string;
    const parsed = reviewAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid review data');
    }

    const data = await repo.updateAppointmentStatus(appointmentId, parsed.data.status, parsed.data.notes);
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Appointment not found');

    res.json({ data });
  };
}
