import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { FacilitiesRepository } from '../repositories/facilities.repository.ts';
import {
  createFacilitySchema,
  requestBookingSchema,
  reviewBookingSchema,
} from '../schemas/facilities.schema.ts';

export function listFacilities(repo: FacilitiesRepository): RequestHandler {
  return async (_req, res) => {
    const data = await repo.listFacilities();
    res.json({ data });
  };
}

export function createFacility(repo: FacilitiesRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createFacilitySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid facility data');
    }
    const data = await repo.createFacility(parsed.data);
    res.status(201).json({ data });
  };
}

export function requestBooking(repo: FacilitiesRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = requestBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid booking data');
    }

    const startTime = new Date(parsed.data.startTime);
    const endTime = new Date(parsed.data.endTime);

    const hasConflict = await repo.hasBookingConflict(parsed.data.facilityId, startTime, endTime);
    if (hasConflict) {
      throw new HttpError(409, 'BOOKING_CONFLICT', 'Facility is already booked for an approved event during this time window');
    }

    const data = await repo.requestBooking({
      facilityId: parsed.data.facilityId,
      userId: actor.id,
      startTime,
      endTime,
      purpose: parsed.data.purpose,
    });

    res.status(201).json({ data });
  };
}

export function listBookings(repo: FacilitiesRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const isStaff = actor.roles.some(r => ['administrator', 'service_staff', 'department_head'].includes(r.role));
    const userId = isStaff ? (req.query.userId as string | undefined) : actor.id;

    const data = await repo.listBookings({
      facilityId: req.query.facilityId as string | undefined,
      userId,
      status: req.query.status as string | undefined,
    });

    res.json({ data });
  };
}

export function reviewBooking(repo: FacilitiesRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const bookingId = req.params.id as string;
    const parsed = reviewBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid review data');
    }

    // If approving, re-check conflict concurrency
    if (parsed.data.status === 'approved') {
      const allBookings = await repo.listBookings();
      const target = allBookings.find(b => b.id === bookingId);
      if (target) {
        const hasConflict = await repo.hasBookingConflict(
          target.facilityId,
          new Date(target.startTime),
          new Date(target.endTime),
          bookingId,
        );
        if (hasConflict) {
          throw new HttpError(409, 'BOOKING_CONFLICT', 'Facility has a concurrent approved booking for this slot');
        }
      }
    }

    const data = await repo.updateBookingStatus(bookingId, parsed.data.status, actor.id);
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Booking not found');

    res.json({ data });
  };
}
