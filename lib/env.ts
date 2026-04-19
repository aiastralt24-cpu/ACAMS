export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseEnv() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function requireSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables are missing.");
  }

  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  };
}
