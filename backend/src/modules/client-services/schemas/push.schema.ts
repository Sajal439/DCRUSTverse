import { z } from 'zod';
export const registerPushTokenSchema = z.object({
  deviceToken: z.string().regex(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/).max(500),
  platform: z.enum(['android', 'ios']),
});
export const deviceIdSchema = z.uuid();
