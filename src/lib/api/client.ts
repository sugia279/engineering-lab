import { ApiError, type Comment, type CommentPage, type CommentState, type ContentEntity } from '../../../supabase/functions/_shared/contracts';
import type { BackendConfig } from './config';
export interface CurrentUser { id: string; role: 'member' | 'owner' }
export function createApiClient(config: BackendConfig, getToken: (verifyIdentity?: boolean) => Promise<string | null>, fetcher: typeof fetch = fetch) {
  async function request<T>(path: string, method = 'GET', body?: unknown, idempotencyKey?: string): Promise<T> {
    const token = await getToken(path === '/me');
    const headers = new Headers({ apikey: config.publishableKey });
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (body !== undefined) headers.set('Content-Type', 'application/json');
    if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey);
    let response: Response;
    try { response = await fetcher(`${config.apiBase}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000), credentials: 'omit', redirect: 'error', cache: 'no-store' }); }
    catch { throw new ApiError(503, 'UNAVAILABLE', 'Không kết nối được API / API unavailable'); }
    let data;
    try { data = await response.json(); } catch { throw new ApiError(503, 'UNAVAILABLE', 'API returned an invalid response'); }
    if (!response.ok) throw new ApiError(response.status, data.code ?? 'API_ERROR', data.message ?? 'Request failed', data.fieldErrors ?? {});
    return data as T;
  }
  const query = (cursor?: string | null, parentId?: string, mine = false) => {
    const params = new URLSearchParams(); if (cursor) params.set('cursor', cursor); if (parentId) params.set('parentId', parentId); if (mine) params.set('view', 'mine');
    return params.size ? `?${params}` : '';
  };
  return {
    state: () => request<CommentState>('/state'),
    resolveEntity: (path: string) => request<ContentEntity>(`/entities/resolve?path=${encodeURIComponent(path)}`),
    me: () => request<CurrentUser>('/me'),
    comments: (entity: string, cursor?: string | null, parentId?: string, mine = false) => request<CommentPage>(`/entities/${encodeURIComponent(entity)}/comments${query(cursor, parentId, mine)}`),
    commentFeed: (cursor?: string | null, mine = false) => request<CommentPage>(`/comments${query(cursor, undefined, mine)}`),
    moderation: (cursor?: string | null) => request<CommentPage>(`/admin/moderation${query(cursor)}`),
    createComment: (entity: string, body: string, key: string, parentId?: string) => request<Comment>(`/entities/${encodeURIComponent(entity)}/comments`, 'POST', { body, parentId }, key),
    editComment: (id: string, body: string, expectedVersion: number) => request<Comment>(`/comments/${encodeURIComponent(id)}`, 'PATCH', { body, expectedVersion }),
    deleteComment: (id: string, expectedVersion: number) => request<Comment>(`/comments/${encodeURIComponent(id)}`, 'DELETE', { expectedVersion }),
    moderate: (id: string, status: string, expectedVersion: number, reason: string) => request<Comment>(`/comments/${encodeURIComponent(id)}/moderate`, 'POST', { status, expectedVersion, reason }),
  };
}
