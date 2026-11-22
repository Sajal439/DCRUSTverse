import { createClient } from '@supabase/supabase-js';
import type { Config } from '../types/config.ts';

export function createSupabase(config: Config) {
  if (!config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY) return undefined;
  return createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5000) }),
    },
  });
}
