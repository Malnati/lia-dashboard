const rawApiUrl = import.meta.env.VITE_API_URL ?? 'https://api.aneety.com';
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://mqxwdyhtsvzzehmdfhtj.supabase.co';
const rawPublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const apiBaseUrl = normalizeUrl(rawApiUrl);
export const supabaseUrl = normalizeUrl(rawSupabaseUrl);
export const supabasePublishableKey = rawPublishableKey.trim();
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/$/, '');
}
