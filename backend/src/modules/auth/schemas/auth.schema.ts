import { z } from 'zod';

export const bearerSchema = z.string().max(16384).regex(/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/i);

export const identitySchema = z.object({
  id: z.uuid(),
  email: z.email(),
});

export const onboardSchema = z.object({
  displayName: z.string().trim().min(1).max(200),
  departmentId: z.uuid().optional(),
  rollNumber: z.string().trim().min(1).max(50).optional(),
  employeeId: z.string().trim().min(1).max(50).optional(),
  designation: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  bio: z.string().trim().max(1000).optional(),
});

export const assignRoleSchema = z.object({
  role: z.enum([
    'student',
    'faculty',
    'department_head',
    'librarian',
    'hostel_warden',
    'placement_officer',
    'club_coordinator',
    'service_staff',
    'administrator',
  ]),
  scopeType: z.enum(['global', 'department', 'course', 'hostel', 'club']).default('global'),
  scopeId: z.uuid().optional(),
}).refine(data => {
  if (data.role === 'administrator' && data.scopeType !== 'global') return false;
  if (data.scopeType === 'global') return data.scopeId === undefined || data.scopeId === null;
  return data.scopeId !== undefined && data.scopeId !== null;
}, {
  message: 'scopeId must be provided if and only if scopeType is not global',
  path: ['scopeId'],
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'disabled']),
});

export const updateProfileSchema = z.object({
  phone: z.string().trim().min(7).max(20).nullable().optional(),
  avatarUrl: z.url().nullable().optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
