import { registerPushTokenSchema, deviceIdSchema } from '../schemas/push.schema.ts';
import type { PushRepository } from '../../../types/push.ts';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { HttpError } from '../../../lib/http-error.ts';

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

export function registerPushToken(repo?: PushRepository): RequestHandler {
  return async (req, res) => {
    const actor = res.locals.campusUser;
    if (!actor) throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');

    const parsed = registerPushTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid push token');
    }

    if (!repo) throw new HttpError(503, 'UNAVAILABLE', 'Push storage is unavailable');
    const device = await repo.register(actor.id, parsed.data.deviceToken, parsed.data.platform);
    res.status(201).json({ data: { ...device, registered: true } });
  };
}
export function listPushDevices(repo?: PushRepository): RequestHandler {
  return async (_req, res) => {
    if (!repo) throw new HttpError(503, 'UNAVAILABLE', 'Push storage is unavailable');
    res.json({ data: await repo.list(res.locals.campusUser!.id) });
  };
}
export function removePushDevice(repo?: PushRepository): RequestHandler {
  return async (req, res) => {
    if (!repo) throw new HttpError(503, 'UNAVAILABLE', 'Push storage is unavailable');
    const id = deviceIdSchema.safeParse(req.params.id);
    if (!id.success) throw new HttpError(400, 'INVALID_INPUT', 'Invalid device');
    if (!await repo.remove(res.locals.campusUser!.id, id.data)) throw new HttpError(404, 'NOT_FOUND', 'Device not found');
    res.json({ data: { removed: true } });
  };
}
