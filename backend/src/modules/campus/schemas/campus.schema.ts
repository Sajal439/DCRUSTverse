import { z } from 'zod';

export const createLocationSchema = z.object({
  code: z.string().trim().min(2).max(50),
  name: z.string().trim().min(2).max(150),
  category: z.enum(['academic', 'hostel', 'admin', 'library', 'sports', 'canteen', 'facility']),
  building: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  coordinates: z.record(z.string(), z.any()).default({ lat: 28.98, lng: 77.08 }),
  openingHours: z.string().trim().max(100).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().trim().max(20).optional(),
});

export const addEntranceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  isAccessible: z.boolean().default(true),
});

export const addPathSegmentSchema = z.object({
  fromLocationId: z.uuid(),
  toLocationId: z.uuid(),
  distanceMeters: z.number().int().positive(),
  isAccessible: z.boolean().default(true),
}).refine(data => data.fromLocationId !== data.toLocationId, { message: 'Choose two different locations', path: ['toLocationId'] });

export const routeQuerySchema = z.object({
  from: z.uuid(),
  to: z.uuid(),
  accessibleOnly: z.enum(['true', 'false']).default('false').transform(value => value === 'true'),
});
