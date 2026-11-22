import { supabase } from '../api/supabase';
import { registrationSchema } from '../schemas/auth';

export async function registerAccount(email: string, password: string) {
  const parsed = registrationSchema.safeParse({ email: email.trim(), password });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Check your email and password');
  const { error } = await supabase.auth.signUp(parsed.data);
  if (error) throw new Error(error.message);
}
