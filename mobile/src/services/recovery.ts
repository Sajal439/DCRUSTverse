import { supabase } from '../api/supabase';
import { recoveryEmailSchema, newPasswordSchema, recoveryTokens } from '../schemas/recovery';
export async function requestRecovery(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmailSchema.parse(email), { redirectTo: 'dcrustverse://auth/recovery' });
  if (error) throw error;
}
export async function acceptRecovery(url: string) {
  const { error } = await supabase.auth.setSession(recoveryTokens(url));
  if (error) throw error;
}
export async function changeRecoveredPassword(password: string, confirmation: string) {
  const parsed = newPasswordSchema.parse({ password, confirmation });
  const { error } = await supabase.auth.updateUser({ password: parsed.password });
  if (error) throw error;
}
