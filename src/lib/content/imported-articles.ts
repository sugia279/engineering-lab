/** Project ContentForge translation metadata onto the site's article contract.
 * Keep the source MDX/provenance intact; ordinary articles still require all fields.
 */
export function normalizeImportedArticle(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;
  const data = input as Record<string, unknown>;
  if (data.kind !== 'translation.vi' || data.mediaType !== 'text/markdown') return input;
  const metadata = data.metadata as Record<string, unknown> | undefined;
  return {
    ...data,
    title: data.title ?? metadata?.title,
    description: data.description ?? `${metadata?.title ?? 'Chương truyện'} — Bản dịch tiếng Việt.`,
    publishedAt: data.publishedAt ?? data.createdAt,
    tags: data.tags ?? ['translated-fiction', 'tien-hiep'],
    domains: data.domains ?? ['reading-literature'],
    showTableOfContents: data.showTableOfContents ?? false,
    chapterOrder: data.chapterOrder ?? metadata?.sequence,
  };
}
