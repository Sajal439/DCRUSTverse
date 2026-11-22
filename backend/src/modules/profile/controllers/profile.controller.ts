import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { CampusUserRepository } from '../../auth/repositories/user.repository.ts';
import { updateProfileSchema } from '../../auth/schemas/auth.schema.ts';

export function getMyProfile(userRepo: CampusUserRepository): RequestHandler {
  return async (_req, res) => {
    const user = res.locals.campusUser;
    if (!user) throw new HttpError(401, 'AUTH_REQUIRED', 'Campus user required');

    const profile = await userRepo.getProfile(user.id);
    res.json({
      data: {
        user,
        profile,
      },
    });
  };
}

export function updateMyProfile(userRepo: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const user = res.locals.campusUser;
    if (!user) throw new HttpError(401, 'AUTH_REQUIRED', 'Campus user required');

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid profile update');
    }

    const { phone, bio, avatarUrl, metadata } = parsed.data;

    let profile = await userRepo.getProfile(user.id);
    if (!profile) {
      profile = await userRepo.createProfile(user.id, {
        phone: phone ?? null,
        bio: bio ?? null,
        avatarUrl: avatarUrl ?? null,
        metadata: metadata ?? {},
      });
    } else {
      profile = await userRepo.updateProfile(user.id, {
        phone: phone ?? undefined,
        bio: bio ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        metadata: metadata ?? undefined,
      });
    }

    res.json({
      data: {
        user,
        profile,
      },
    });
  };
}
