export interface BackendConfig { supabaseUrl: string; publishableKey: string; apiBase: string }
export function publicBackendConfig(env: Record<string, unknown>): BackendConfig | null {
  if (env.PUBLIC_BACKEND_ENABLED !== 'true') return null;
  const supabase = new URL(String(env.PUBLIC_SUPABASE_URL));
  const api = new URL(String(env.PUBLIC_API_BASE));
  for (const url of [supabase, api]) {
    if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) throw new Error('Invalid backend URL');
  }
  if (api.origin !== supabase.origin || api.pathname.replace(/\/$/, '') !== '/functions/v1/api/v1' || supabase.pathname !== '/') throw new Error('API must belong to the configured Supabase project');
  const key = String(env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '');
  let legacyAnon = false;
  try { const payload = key.split('.')[1]!; legacyAnon = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon'; } catch { /* not a legacy key */ }
  if (!key.startsWith('sb_publishable_') && !legacyAnon) throw new Error('A public publishable/anon key is required');
  return { supabaseUrl: supabase.origin, apiBase: api.href.replace(/\/$/, ''), publishableKey: key };
}
