import { z } from 'zod';

export const createClubSchema = z.object({
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
  coordinatorId: z.uuid().optional(),
});

export const createEventSchema = z.object({
  clubId: z.uuid().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(5).max(2000),
  location: z.string().trim().min(1).max(100),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  capacity: z.number().int().min(1).max(10000),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
  message: 'endTime must be after startTime',
  path: ['endTime'],
});
