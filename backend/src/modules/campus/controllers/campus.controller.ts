import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { CampusRepository, CampusCategory } from '../repositories/campus.repository.ts';
import {
  createLocationSchema,
  addEntranceSchema,
  addPathSegmentSchema,
  routeQuerySchema,
} from '../schemas/campus.schema.ts';

const validCategories: CampusCategory[] = ['academic', 'hostel', 'admin', 'library', 'sports', 'canteen', 'facility'];

export function listLocations(repo: CampusRepository): RequestHandler {
  return async (req, res) => {
    const rawCategory = req.query.category as string | undefined;
    const category = rawCategory && validCategories.includes(rawCategory as CampusCategory)
      ? (rawCategory as CampusCategory)
      : undefined;

    const locations = await repo.listLocations({ category });
    res.json({ data: locations });
  };
}

export function getLocation(repo: CampusRepository): RequestHandler {
  return async (req, res) => {
    const id = req.params.id as string;
    const location = await repo.getLocationById(id);
    if (!location) throw new HttpError(404, 'NOT_FOUND', 'Location not found');

    res.json({ data: location });
  };
}

export function createLocation(repo: CampusRepository): RequestHandler {
  return async (req, res) => {
    const parsed = createLocationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid location data');
    }

    const loc = await repo.createLocation(parsed.data);
    res.status(201).json({ data: loc });
  };
}

export function addEntrance(repo: CampusRepository): RequestHandler {
  return async (req, res) => {
    const locationId = req.params.id as string;
    const parsed = addEntranceSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid entrance data');
    }

    if (!await repo.getLocationById(locationId)) throw new HttpError(404, 'NOT_FOUND', 'Location not found');
    const entrance = await repo.addEntrance({ locationId, ...parsed.data });
    res.status(201).json({ data: entrance });
  };
}

export function addPathSegment(repo: CampusRepository): RequestHandler {
  return async (req, res) => {
    const parsed = addPathSegmentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid path segment');
    }

    if (!await repo.getLocationById(parsed.data.fromLocationId) || !await repo.getLocationById(parsed.data.toLocationId)) throw new HttpError(404, 'NOT_FOUND', 'Path endpoints must exist');
    const segment = await repo.addPathSegment(parsed.data);
    res.status(201).json({ data: segment });
  };
}

export function getRoute(repo: CampusRepository): RequestHandler {
  return async (req, res) => {
    const parsed = routeQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', 'Invalid from/to query parameters');
    }

    const route = await repo.findRoute(parsed.data.from, parsed.data.to, parsed.data.accessibleOnly);
    res.json({ data: route });
  };
}

export function generateQrLink(repo: CampusRepository): RequestHandler {
  return async (req, res) => {
    const locationId = req.params.id as string;
    const location = await repo.getLocationById(locationId);
    if (!location) throw new HttpError(404, 'NOT_FOUND', 'Location not found');

    const qr = await repo.createQrLink(locationId);
    res.status(201).json({ data: qr });
  };
}

export function scanQrCode(repo: CampusRepository): RequestHandler {
  return async (req, res) => {
    const code = req.params.code as string;
    const result = await repo.resolveQrScan(code);
    if (!result) {
      throw new HttpError(404, 'NOT_FOUND', 'QR Code not found');
    }

    if (!result.location) {
      return res.json({
        data: {
          qr: result.qr,
          location: null,
          status: 'unavailable',
          message: 'The requested campus location is no longer available or has been decommissioned.',
        },
      });
    }

    res.json({
      data: {
        qr: result.qr,
        location: result.location,
        status: 'available',
      },
    });
  };
}
