import { describe, it, expect } from 'vitest';
import { GitHubPhotoUpload } from '../../src/lib/photo-upload';
import { imageExtension, photoRecordSchema } from '../../src/lib/photo-record';
const record = { id: 'photo-test', title: 'A photo', description: '<script>kept as text</script>', album: 'family' as const, image: 'src/assets/gallery/photo-test.jpg', publishedAt: '2026-11-13T00:00:00.000Z' };
const bytes = new Uint8Array([255,216,255,0]);
const repository = 'owner/home';
type Call = { url: string; method: string; body: any; headers: HeadersInit | undefined };
function fakeApi(options: { user?: string; push?: boolean; race?: boolean; protected?: boolean; lostResponse?: boolean } = {}) {
 const calls: Call[] = []; let refReads = 0; let patches = 0;
 const send: typeof fetch = async (input, init) => {
  const url = String(input); const method = init?.method ?? 'GET'; const body = init?.body ? JSON.parse(String(init.body)) : undefined;
  calls.push({ url, method, body, headers: init?.headers });
  let response: unknown; let status = 200;
  if (url.endsWith('/user')) response = { login: options.user ?? 'owner' };
  else if (url.endsWith('/repos/owner/home')) response = { full_name: repository, default_branch: 'main', permissions: { push: options.push ?? true } };
  else if (url.endsWith('/blobs')) response = { sha: 'photo-blob' };
  else if (url.endsWith('/ref/heads/main')) { refReads++; response = { object: { sha: options.lostResponse && patches ? 'new-commit' : options.race && refReads > 1 ? 'concurrent-head' : 'old-head' } }; }
  else if (method === 'GET' && /\/commits\//.test(url)) response = { tree: { sha: 'base-tree' } };
  else if (url.endsWith('/trees')) response = { sha: 'new-tree' };
  else if (url.endsWith('/commits')) response = { sha: 'new-commit' };
  else if (url.endsWith('/refs/heads/main')) { patches++; if (options.lostResponse) throw new TypeError('Network response lost'); if (options.protected || (options.race && patches === 1)) status = 422; response = {}; }
  else throw Error(`Unexpected request: ${url}`);
  return new Response(JSON.stringify(response), { status, headers: { 'Content-Type': 'application/json' } });
 };
 return { calls, send };
}

describe('photo metadata and file admission', () => {
 it('admits supported image headers and rejects SVG/HTML disguises', () => {
  expect(imageExtension(bytes)).toBe('jpg');
  expect(imageExtension(new Uint8Array([137,80,78,71,13,10,26,10]))).toBe('png');
  expect(imageExtension(new TextEncoder().encode('RIFF1234WEBP'))).toBe('webp');
  expect(imageExtension(new TextEncoder().encode('<svg onload="alert(1)">'))).toBeUndefined();
 });
 it('rejects path traversal, arbitrary paths and unknown albums', () => {
  expect(photoRecordSchema.safeParse(record).success).toBe(true);
  for (const image of ['src/assets/gallery/../../config/site.ts', 'https://evil.example/image.jpg', 'src/pages/index.astro']) expect(photoRecordSchema.safeParse({ ...record, image }).success).toBe(false);
  expect(photoRecordSchema.safeParse({ ...record, album: 'private' }).success).toBe(false);
 });
});

describe('owner photo publication', () => {
 it('rejects other users before making any repository mutation', async () => {
  const api = fakeApi({ user: 'someone-else' }); const client = new GitHubPhotoUpload(repository, 'test-owner-token', api.send);
  await expect(client.connect()).rejects.toMatchObject({ code: 'owner' });
  expect(api.calls).toHaveLength(1); expect(api.calls.every((call) => call.method === 'GET')).toBe(true);
 });
 it('requires write permission and a connected session', async () => {
  const api = fakeApi({ push: false }); const client = new GitHubPhotoUpload(repository, 'test-owner-token', api.send);
  await expect(client.connect()).rejects.toMatchObject({ code: 'permission' });
  await expect(client.publish(bytes, record)).rejects.toMatchObject({ code: 'authentication' });
 });
 it('publishes an image and its escaped-data metadata in one non-forced commit', async () => {
  const api = fakeApi(); const client = new GitHubPhotoUpload(repository, 'test-owner-token', api.send); await client.connect();
  const saved = await client.publish(bytes, record);
  expect(saved.url).toBe('https://github.com/owner/home/commit/new-commit');
  const tree = api.calls.find((call) => call.url.endsWith('/trees'))!.body;
  expect(tree.tree).toHaveLength(2); expect(tree.tree[0]).toMatchObject({ path: record.image, sha: 'photo-blob' });
  expect(JSON.parse(tree.tree[1].content)).toEqual(record);
  const serializedBodies = JSON.stringify(api.calls.map((call) => call.body)); expect(serializedBodies).not.toContain('test-owner-token');
  expect(api.calls.filter((call) => call.method === 'PATCH').map((call) => call.body.force)).toEqual([false]);
  expect(api.calls.every((call) => call.url.startsWith('https://api.github.com/'))).toBe(true);
 });
 it('retries concurrent ref changes on the latest parent, preserving the other write', async () => {
  const api = fakeApi({ race: true }); const client = new GitHubPhotoUpload(repository, 'test-owner-token', api.send); await client.connect(); await client.publish(bytes, record);
  expect(api.calls.filter((call) => call.url.endsWith('/blobs'))).toHaveLength(1);
  expect(api.calls.filter((call) => call.url.endsWith('/commits') && call.method === 'POST').map((call) => call.body.parents)).toEqual([['old-head'], ['concurrent-head']]);
  expect(api.calls.filter((call) => call.method === 'PATCH').every((call) => call.body.force === false)).toBe(true);
 });
 it('does not loop or bypass a protected branch', async () => {
  const api = fakeApi({ protected: true }); const client = new GitHubPhotoUpload(repository, 'test-owner-token', api.send); await client.connect();
  await expect(client.publish(bytes, record)).rejects.toMatchObject({ status: 422 });
  expect(api.calls.filter((call) => call.method === 'PATCH')).toHaveLength(1);
 });
 it('recognizes a successful write whose response was lost', async () => {
  const api = fakeApi({ lostResponse: true }); const client = new GitHubPhotoUpload(repository, 'test-owner-token', api.send); await client.connect();
  await expect(client.publish(bytes, record)).resolves.toMatchObject({ sha: 'new-commit' });
 });
 it('rejects unsafe image destinations and disguised input before any write', async () => {
  const api = fakeApi(); const client = new GitHubPhotoUpload(repository, 'test-owner-token', api.send); await client.connect();
  await expect(client.publish(bytes, { ...record, image: 'src/assets/home/photo-test.jpg' })).rejects.toMatchObject({ code: 'file' });
  await expect(client.publish(new TextEncoder().encode('<script>'), record)).rejects.toMatchObject({ code: 'file' });
  expect(api.calls.every((call) => call.method === 'GET')).toBe(true);
 });
});
