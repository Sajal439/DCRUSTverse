import { z } from 'zod';
export const recoveryEmailSchema = z.email().trim().toLowerCase();
export const newPasswordSchema = z.object({ password: z.string().min(12, 'Use at least 12 characters'), confirmation: z.string() }).refine(data => data.password === data.confirmation, { message: 'Passwords do not match', path: ['confirmation'] });
export function recoveryTokens(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'dcrustverse:' || parsed.hostname !== 'auth' || parsed.pathname !== '/recovery') throw new Error('Use the password recovery link for DCRUSTVerse.');
  const values = new URLSearchParams(parsed.hash.slice(1));
  if (values.get('type') !== 'recovery' || !values.get('access_token') || !values.get('refresh_token')) throw new Error('This recovery link is invalid or expired. Request a new one.');
  return { access_token: values.get('access_token')!, refresh_token: values.get('refresh_token')! };
}
