import { z } from 'zod';

export const createHostelSchema = z.object({
  name: z.string().trim().min(1).max(100),
  gender: z.enum(['male', 'female', 'coed']),
  capacity: z.number().int().min(1).max(5000),
  wardenId: z.uuid().optional(),
});

export const createHostelRoomSchema = z.object({
  hostelId: z.uuid(),
  roomNumber: z.string().trim().min(1).max(20),
  capacity: z.number().int().min(1).max(10).default(2),
});

export const applyHostelSchema = z.object({
  hostelId: z.uuid(),
});

export const allocateRoomSchema = z.object({
  studentId: z.uuid(),
  roomId: z.uuid(),
});

export const requestTransferSchema = z.object({
  toRoomId: z.uuid(),
  reason: z.string().trim().min(5).max(500),
});
