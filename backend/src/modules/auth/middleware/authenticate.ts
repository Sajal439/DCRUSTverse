import type { RequestHandler } from 'express';
import type { VerifyIdentity } from '../../../types/auth.ts';
import { HttpError } from '../../../lib/http-error.ts';
import { bearerSchema } from '../schemas/auth.schema.ts';

export function authenticate(verify: VerifyIdentity): RequestHandler {
  return async (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    const authorization = bearerSchema.safeParse(req.headers.authorization);
    if (!authorization.success) {
      res.setHeader('WWW-Authenticate', 'Bearer');
      throw new HttpError(401, 'AUTH_REQUIRED', 'A bearer access token is required');
    }
    res.locals.identity = await verify(authorization.data.slice(7));
    next();
  };
}
