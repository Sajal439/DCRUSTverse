import { z } from 'zod';

export const createRoomSchema = z.object({
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(100),
  building: z.string().trim().min(1).max(100),
  capacity: z.number().int().min(1).max(1000),
  type: z.enum(['lecture_hall', 'classroom', 'lab', 'seminar_hall']).default('classroom'),
});

export const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createSessionSchema = z.object({
  sectionId: z.uuid(),
  roomId: z.uuid(),
  facultyId: z.uuid(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(timeRegex, 'Format must be HH:mm'),
  endTime: z.string().regex(timeRegex, 'Format must be HH:mm'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD').optional(),
}).refine(data => data.startTime < data.endTime, {
  message: 'endTime must be strictly greater than startTime',
  path: ['endTime'],
});

export const updateSessionStatusSchema = z.object({
  status: z.enum(['scheduled', 'cancelled', 'rescheduled']),
});
