import assert from 'node:assert/strict';
const env = process.env;
const base = env.LOCAL_SUPABASE_URL;
if (!base || !['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname)) throw new Error('A loopback-only local Supabase URL is required');
for (const name of ['LOCAL_PUBLISHABLE_KEY', 'LOCAL_ENTITY_ID', 'LOCAL_MEMBER_A_JWT', 'LOCAL_MEMBER_B_JWT', 'LOCAL_OWNER_JWT']) if (!env[name]) throw new Error(`Missing ${name}`);
const A = env.LOCAL_MEMBER_A_JWT, B = env.LOCAL_MEMBER_B_JWT, O = env.LOCAL_OWNER_JWT;
const entity = env.LOCAL_ENTITY_ID;
async function call(path, token, method = 'GET', body, extra = {}) {
  const r = await fetch(base + path, { method, headers: { apikey: env.LOCAL_PUBLISHABLE_KEY, ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}), ...extra }, body: body ? JSON.stringify(body) : undefined, redirect: 'error' });
  return { status: r.status, data: await r.json() };
}
const api = '/functions/v1/api/v1';
assert.equal((await call(api + '/me', A)).data.role, 'member');
assert.equal((await call(api + '/me', B)).data.role, 'member');
assert.equal((await call(api + '/me', O)).data.role, 'owner');
assert.equal((await call(api + '/me')).status, 401);
assert.equal((await call(api + '/me', 'invalid')).status, 401);
const key = crypto.randomUUID(); const payload = { body: 'Isolated local permission fixture' };
const created = await call(`${api}/entities/${entity}/comments`, A, 'POST', payload, { 'idempotency-key': key });
assert.equal(created.status, 200); assert.equal(created.data.status, 'pending'); const id = created.data.id; assert.ok(id);
assert.equal((await call(`${api}/entities/${entity}/comments`, A, 'POST', payload, { 'idempotency-key': key })).data.id, id);
for (const token of [undefined, B]) {
  const read = await call(`/rest/v1/comments?id=eq.${id}`, token);
  assert.equal(read.status, 200); assert.deepEqual(read.data, []);
}
assert.equal((await call(`/rest/v1/comments?id=eq.${id}`, A, 'PATCH', { status: 'approved' })).status, 403);
assert.equal((await call('/rest/v1/role_assignments', A, 'POST', { user_id: id, role: 'owner' })).status, 403);
assert.equal((await call('/rest/v1/rpc/moderate_comment', A, 'POST', { p_id: id, p_status: 'approved', p_expected_version: 1, p_reason: 'forged' })).status, 403);
assert.equal((await call(`${api}/comments/${id}`, B, 'PATCH', { body: 'forged', expectedVersion: 1 })).status, 403);
const approved = await call(`${api}/comments/${id}/moderate`, O, 'POST', { status: 'approved', expectedVersion: 1, reason: 'local test' });
assert.equal(approved.status, 200); assert.equal(approved.data.version, 2);
assert.equal((await call(`/rest/v1/comments?id=eq.${id}`)).data.length, 1);
const edited = await call(`${api}/comments/${id}`, A, 'PATCH', { body: 'Changed text', expectedVersion: 2 });
assert.equal(edited.status, 200); assert.equal(edited.data.status, 'pending');
assert.deepEqual((await call(`/rest/v1/comments?id=eq.${id}`)).data, []);
assert.equal((await call(`${api}/comments/${id}/moderate`, O, 'POST', { status: 'approved', expectedVersion: 2, reason: 'stale' })).status, 409);
assert.equal((await call(`${api}/comments/${id}`, A, 'DELETE', { expectedVersion: 3 })).status, 200);
console.log('Local Supabase JWT / Edge / PostgREST permission assertions passed; fixture soft-deleted.');
