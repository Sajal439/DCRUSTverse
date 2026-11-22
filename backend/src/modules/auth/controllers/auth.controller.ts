import type { RequestHandler } from 'express';
import { HttpError } from '../../../lib/http-error.ts';
import type { CampusUserRepository } from '../repositories/user.repository.ts';
import { onboardSchema } from '../schemas/auth.schema.ts';

export function currentIdentity(userRepo?: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const identity = res.locals.identity;
    if (!identity) {
      throw new HttpError(401, 'AUTH_REQUIRED', 'A bearer access token is required');
    }

    if (!userRepo) {
      return res.json({ data: identity });
    }

    const user = await userRepo.findByAuthId(identity.id);
    if (!user) {
      return res.json({ data: identity });
    }

    if (user.status === 'disabled') {
      throw new HttpError(403, 'ACCOUNT_DISABLED', 'This campus account has been deactivated');
    }

    const profile = await userRepo.getProfile(user.id);
    return res.json({
      data: {
        ...identity,
        campus: user,
        profile,
      },
    });
  };
}

export function onboard(userRepo: CampusUserRepository): RequestHandler {
  return async (req, res) => {
    const identity = res.locals.identity;
    if (!identity) {
      throw new HttpError(401, 'AUTH_REQUIRED', 'A bearer access token is required');
    }

    const existing = await userRepo.findByAuthId(identity.id);
    if (existing) {
      throw new HttpError(409, 'ALREADY_REGISTERED', 'Campus account already exists');
    }

    const parsed = onboardSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid onboarding data');
    }

    const { displayName, departmentId, rollNumber, employeeId, designation, phone, bio } = parsed.data;

    const user = await userRepo.create({
      authUserId: identity.id,
      email: identity.email,
      displayName,
      departmentId: departmentId ?? null,
      status: 'pending',
    });

    const profile = await userRepo.createProfile(user.id, {
      rollNumber: rollNumber ?? null,
      employeeId: employeeId ?? null,
      designation: designation ?? null,
      phone: phone ?? null,
      bio: bio ?? null,
    });

    await userRepo.logAudit({
      actorId: user.id,
      action: 'user.onboarded',
      targetType: 'user',
      targetId: user.id,
      details: { email: user.email, displayName: user.displayName },
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    res.status(201).json({
      data: {
        user,
        profile,
      },
    });
  };
}
