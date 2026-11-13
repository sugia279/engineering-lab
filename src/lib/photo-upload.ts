import { MAX_PHOTO_BYTES, imageExtension, photoRecordSchema, type PhotoRecord } from './photo-record';
export class PhotoUploadError extends Error {
  constructor(public readonly code: string, public readonly status?: number) { super(code); }
}
type Fetch = typeof fetch;
type Ref = { object: { sha: string } };
/** A short-lived owner session. Never persist this instance or its token. */
export class GitHubPhotoUpload {
  private authorized = false;
  private branch = '';
  private author: { name: string; email: string } | undefined;
  constructor(private readonly repository: string, private readonly token: string, private readonly send: Fetch = fetch) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new PhotoUploadError('repository');
  }
  private async request<T>(resource: string, method = 'GET', body?: unknown): Promise<T> {
    const response = await this.send(`https://api.github.com${resource}`, {
      method, redirect: 'error', cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${this.token}`, 'X-GitHub-Api-Version': '2022-11-28', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw new PhotoUploadError(response.status === 401 ? 'authentication' : response.status === 403 ? 'permission' : 'github', response.status);
    return response.json() as Promise<T>;
  }
  async connect(): Promise<string> {
    const user = await this.request<{ login: string; id: number }>('/user');
    const owner = this.repository.split('/')[0]!;
    if (user.login.toLowerCase() !== owner.toLowerCase()) throw new PhotoUploadError('owner');
    const repo = await this.request<{ full_name: string; default_branch: string; permissions?: { push?: boolean } }>(`/repos/${this.repository}`);
    if (repo.full_name.toLowerCase() !== this.repository.toLowerCase() || !repo.permissions?.push || !repo.default_branch) throw new PhotoUploadError('permission');
    if (!Number.isSafeInteger(user.id) || user.id < 1) throw new PhotoUploadError('owner');
    this.author = { name: user.login, email: `${user.id}+${user.login}@users.noreply.github.com` };
    this.branch = repo.default_branch;
    this.authorized = true;
    return user.login;
  }
  async publish(bytes: Uint8Array, input: PhotoRecord): Promise<{ sha: string; url: string }> {
    if (!this.authorized) throw new PhotoUploadError('authentication');
    const parsed = photoRecordSchema.safeParse(input);
    if (!parsed.success) throw new PhotoUploadError('metadata');
    const record = parsed.data;
    const extension = imageExtension(bytes);
    if (!bytes.length || bytes.length > MAX_PHOTO_BYTES || !extension || record.image !== `src/assets/gallery/${record.id}.${extension}` || !record.publishedAt || record.featuredOrder !== undefined) throw new PhotoUploadError('file');
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 16384) binary += String.fromCharCode(...bytes.subarray(offset, offset + 16384));
    const root = `/repos/${this.repository}/git`;
    const image = await this.request<{ sha: string }>(`${root}/blobs`, 'POST', { content: btoa(binary), encoding: 'base64' });
    const metadata = JSON.stringify(record, null, 2) + '\n';
    const refPath = `${root}/ref/heads/${encodeURIComponent(this.branch)}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      const head = await this.request<Ref>(refPath);
      const parent = head.object.sha;
      const base = await this.request<{ tree: { sha: string } }>(`${root}/commits/${parent}`);
      const tree = await this.request<{ sha: string }>(`${root}/trees`, 'POST', { base_tree: base.tree.sha, tree: [
        { path: record.image, mode: '100644', type: 'blob', sha: image.sha },
        { path: `src/data/photos/${record.id}.json`, mode: '100644', type: 'blob', content: metadata },
      ] });
      const commit = await this.request<{ sha: string }>(`${root}/commits`, 'POST', { message: `photos: add ${record.id}`, tree: tree.sha, parents: [parent], author: this.author, committer: this.author });
      try {
        await this.request(`${root}/refs/heads/${encodeURIComponent(this.branch)}`, 'PATCH', { sha: commit.sha, force: false });
        return { sha: commit.sha, url: `https://github.com/${this.repository}/commit/${commit.sha}` };
      } catch (error) {
        // A concurrent guestbook/archive write must survive. Never force-push.
        const fresh = await this.request<Ref>(refPath);
        if (fresh.object.sha === commit.sha) return { sha: commit.sha, url: `https://github.com/${this.repository}/commit/${commit.sha}` };
        if (fresh.object.sha === parent || (error instanceof PhotoUploadError && ![409,422].includes(error.status ?? 0))) throw error;
      }
    }
    throw new PhotoUploadError('conflict');
  }
}
