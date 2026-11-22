import type { RequestHandler } from 'express';
import { z } from 'zod';
import { HttpError } from '../../../lib/http-error.ts';

const registerPushTokenSchema = z.object({
  deviceToken: z.string().trim().min(10).max(500),
  platform: z.enum(['android', 'ios', 'web']),
});

export function getClientConfig(): RequestHandler {
  return async (_req, res) => {
    res.json({
      data: {
        appName: 'DCRUSTVerse',
        version: '1.0.0',
        timezone: 'Asia/Kolkata',
        offlinePolicy: {
          cacheableResources: ['/campus/locations', '/notices', '/academics/departments', '/calendar'],
          staleTimeMs: 3600000, // 1 hour
          unsupportedOfflineMutations: ['/assignments/submit', '/hostel/apply', '/library/reserve'],
          clearCacheOnLogout: true,
        },
        accessibility: {
          screenReaderOptimized: true,
          highContrastThemeAvailable: true,
          textAlternativesFor3d: true,
          keyboardNavigationShortcuts: {
            search: 'Alt+S',
            dashboard: 'Alt+D',
            timetable: 'Alt+T',
          },
        },
        distribution: {
          mobileApiCompatible: true,
          targets: ['Android (APK/AAB)', 'iOS (PWA/Capacitor)', 'Modern Desktop Browser'],
        },
      },
    });
  };
}

export function registerPushToken(): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = registerPushTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid push token');
    }

    res.status(201).json({
      data: {
        userId: actor.id,
        platform: parsed.data.platform,
        registered: true,
        updatedAt: new Date().toISOString(),
      },
    });
  };
}
