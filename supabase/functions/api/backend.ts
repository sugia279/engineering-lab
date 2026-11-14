import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError, type Comment, type Cursor } from '../_shared/contracts.ts';
import type { CallerBackend } from './handler.ts';

export function dbError(error: { code?: string } | null): void {
  if (!error) return;
  const codes: Record<string, [number, string, string]> = {
    PT401: [401, 'UNAUTHENTICATED', 'Sign in required'], PT403: [403, 'FORBIDDEN', 'Action not permitted'],
    '42501': [403, 'FORBIDDEN', 'Action not permitted'], PT404: [404, 'NOT_FOUND', 'Content not found'],
    PT409: [409, 'CONFLICT', 'Content changed or idempotency key reused; refresh before retrying'],
    PT422: [422, 'INVALID_INPUT', 'Invalid comment input'], PT429: [429, 'RATE_LIMITED', 'Too many writes; retry later'],
    PT503: [503, 'WRITES_DISABLED', 'Comment writes are disabled'],
  };
  const [status, code, message] = codes[error.code ?? ''] ?? [503, 'UNAVAILABLE', 'Service unavailable'];
  throw new ApiError(status, code, message);
}
export function callerBackend(client: SupabaseClient): CallerBackend {
  return {
    async verifyUser() {
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired session');
      return { id: data.user.id };
    },
    async isOwner() {
      const { data, error } = await client.from('role_assignments').select('role').eq('role', 'owner').maybeSingle();
      dbError(error); return !!data;
    },
    async entityExists(id) {
      const { data, error } = await client.from('content_entities').select('id').eq('id', id).maybeSingle();
      dbError(error); return !!data;
    },
    async listComments(entityId: string | null, cursor: Cursor | null, limit: number) {
      let query = client.from('comments').select('*').is('deleted_at', null).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limit);
      query = entityId ? query.eq('entity_id', entityId) : query.eq('status', 'pending');
      if (cursor) query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
      const { data, error } = await query; dbError(error); return data as Comment[];
    },
    async rpc(name, args) { const { data, error } = await client.rpc(name, args).single(); dbError(error); return data as Comment; },
  };
}
