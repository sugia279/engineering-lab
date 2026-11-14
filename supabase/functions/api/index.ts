import { createClient } from '@supabase/supabase-js';
import { createHandler } from './handler.ts';
import { callerBackend } from './backend.ts';

const url = Deno.env.get('SUPABASE_URL')!;
// Never use a service-role/secret key: every query carries caller identity to RLS.
const key = Deno.env.get('SUPABASE_ANON_KEY')!;
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean);
Deno.serve(createHandler({ allowedOrigins, backend: (token) => callerBackend(createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
})), log: event => console.info(JSON.stringify(event)) }));
