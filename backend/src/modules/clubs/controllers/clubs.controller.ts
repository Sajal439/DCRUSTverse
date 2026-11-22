import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { ClubsRepository } from '../repositories/clubs.repository.ts';
import { createClubSchema, createEventSchema } from '../schemas/clubs.schema.ts';

export function listClubs(repo: ClubsRepository): RequestHandler {
  return async (_req, res) => {
    const data = await repo.listClubs();
    res.json({ data });
  };
}

export function createClub(repo: ClubsRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createClubSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid club data');
    }
    const data = await repo.createClub(parsed.data);
    res.status(201).json({ data });
  };
}

export function joinClub(repo: ClubsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');
    const clubId = req.params.id as string;
    try {
      const data = await repo.joinClub(clubId, actor.id);
      res.status(201).json({ data });
    } catch {
      throw new HttpError(409, 'ALREADY_MEMBER', 'User is already a member of this club');
    }
  };
}

export function listEvents(repo: ClubsRepository): RequestHandler {
  return async (req, res) => {
    const clubId = req.query.clubId as string | undefined;
    const status = req.query.status as string | undefined;
    const data = await repo.listEvents({ clubId, status });
    res.json({ data });
  };
}

export function createEvent(repo: ClubsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid event data');
    }

    const data = await repo.createEvent({
      ...parsed.data,
      startTime: new Date(parsed.data.startTime),
      endTime: new Date(parsed.data.endTime),
      createdBy: actor.id,
    });

    res.status(201).json({ data });
  };
}

export function approveEvent(repo: ClubsRepository): RequestHandler {
  return async (req, res) => {
    const id = req.params.id as string;
    const data = await repo.approveEvent(id);
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Event not found');
    res.json({ data });
  };
}

export function registerForEvent(repo: ClubsRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const eventId = req.params.id as string;
    try {
      const data = await repo.registerForEvent(eventId, actor.id);
      res.status(201).json({ data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.includes('capacity')) {
        throw new HttpError(409, 'EVENT_FULL', 'Event has reached maximum capacity');
      }
      throw new HttpError(409, 'ALREADY_REGISTERED', 'Already registered for this event');
    }
  };
}
