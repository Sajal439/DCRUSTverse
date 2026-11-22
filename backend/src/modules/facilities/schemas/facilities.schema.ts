import { z } from 'zod';

export const createFacilitySchema = z.object({
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(100),
  type: z.enum(['hall', 'auditorium', 'lab', 'ground', 'conference_room']),
  capacity: z.number().int().min(1).max(10000),
});

export const requestBookingSchema = z.object({
  facilityId: z.uuid(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  purpose: z.string().trim().min(5).max(500),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
  message: 'endTime must be after startTime',
  path: ['endTime'],
});

export const reviewBookingSchema = z.object({
  status: z.enum(['approved', 'rejected', 'cancelled']),
});
