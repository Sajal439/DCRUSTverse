import { z } from 'zod';
import { timeRegex } from '../../timetable/schemas/timetable.schema.ts';

export const setAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(timeRegex, 'Format must be HH:mm'),
  endTime: z.string().regex(timeRegex, 'Format must be HH:mm'),
}).refine(data => data.startTime < data.endTime, {
  message: 'endTime must be after startTime',
  path: ['endTime'],
});

export const requestAppointmentSchema = z.object({
  facultyId: z.uuid(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  reason: z.string().trim().min(5).max(500),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
  message: 'endTime must be after startTime',
  path: ['endTime'],
});

export const reviewAppointmentSchema = z.object({
  status: z.enum(['confirmed', 'rejected', 'cancelled']),
  notes: z.string().trim().max(500).optional(),
});
