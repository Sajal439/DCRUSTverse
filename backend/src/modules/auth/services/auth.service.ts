import type { SupabaseClient } from '@supabase/supabase-js';
import type { VerifyIdentity } from '../../../types/auth.ts';
import { HttpError } from '../../../lib/http-error.ts';
import { identitySchema } from '../schemas/auth.schema.ts';

export function createVerifyIdentity(client: SupabaseClient | undefined): VerifyIdentity {
  return async token => {
    if (!client) throw new HttpError(503, 'AUTH_UNAVAILABLE', 'Authentication is unavailable');
    let result;
    try {
      result = await client.auth.getUser(token);
    } catch {
      throw new HttpError(503, 'AUTH_UNAVAILABLE', 'Authentication is unavailable');
    }
    if (result.error) {
      if (!result.error.status || result.error.status >= 500 || result.error.status === 429) {
        throw new HttpError(503, 'AUTH_UNAVAILABLE', 'Authentication is unavailable');
      }
      throw new HttpError(401, 'INVALID_TOKEN', 'A valid access token is required');
    }
    const user = result.data.user;
    if (!user || user.is_anonymous || !user.email_confirmed_at) {
      throw new HttpError(403, 'EMAIL_NOT_VERIFIED', 'A verified email account is required');
    }
    const identity = identitySchema.safeParse({ id: user.id, email: user.email });
    if (!identity.success) throw new HttpError(401, 'INVALID_IDENTITY', 'Invalid account identity');
    return identity.data;
  };
}
