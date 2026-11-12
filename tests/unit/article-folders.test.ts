import { describe, expect, it } from 'vitest';
import { normalizeImportedArticle } from '../../src/lib/content/imported-articles';
import { articleFolderContext, getArticleFolders } from '../../src/lib/content/article-folders';
import type { ArticleEntry } from '../../src/lib/content/queries';

const title = 'Nhà có tiên thê bất thường, cô ấy cũng là người xuyên không';
function chapter(number: number, directory = title, draft = false): ArticleEntry {
  return {
    id: `${directory}/${number}.mdx`,
    filePath: `src/content/articles/${directory}/${number}.mdx`,
    data: { title: `Chương ${number}`, description: 'Bản dịch.', chapterOrder: number, draft },
  } as ArticleEntry;
}

describe('ContentForge article projection', () => {
  const exported = {
    kind: 'translation.vi', mediaType: 'text/markdown',
    createdAt: '2026-11-09T16:15:48.021Z',
    metadata: { title: 'Chương 1', sequence: 1 },
    provenance: { sourceUri: 'https://example.com/chapter-1' },
  };

  it('maps nested metadata to required website fields and keeps provenance', () => {
    expect(normalizeImportedArticle(exported)).toMatchObject({
      title: 'Chương 1', publishedAt: exported.createdAt,
      description: 'Chương 1 — Bản dịch tiếng Việt.', chapterOrder: 1,
      domains: ['reading-literature'], tags: ['translated-fiction', 'tien-hiep'],
      provenance: exported.provenance,
    });
    expect(exported).not.toHaveProperty('title');
  });

  it('preserves explicit author choices, including drafts', () => {
    expect(normalizeImportedArticle({ ...exported, title: 'Custom', draft: true,
      publishedAt: '2026-11-12', domains: ['philosophy-life'], tags: ['custom'], chapterOrder: 9,
    })).toMatchObject({ title: 'Custom', draft: true, publishedAt: '2026-11-12',
      domains: ['philosophy-life'], tags: ['custom'], chapterOrder: 9 });
  });

  it('leaves native and unrecognized articles for strict schema validation', () => {
    const native = { title: 'Engineering' };
    expect(normalizeImportedArticle(native)).toBe(native);
    const other = { ...exported, kind: 'unrecognized' };
    expect(normalizeImportedArticle(other)).toBe(other);
  });
});

describe('article directory discovery', () => {
  it('uses the source title, stable ASCII folder route, and numeric chapter order', () => {
    const [folder] = getArticleFolders([chapter(10), chapter(2), chapter(1)]);
    expect(folder?.title).toBe(title);
    expect(folder?.url).toBe('/engineering-lab/articles/folders/nha-co-tien-the-bat-thuong-co-ay-cung-la-nguoi-xuyen-khong/');
    expect(folder?.articles.map((entry) => entry.data.chapterOrder)).toEqual([1, 2, 10]);
  });

  it('ignores drafts and root-level articles, supporting Windows source paths', () => {
    const entry = chapter(1);
    entry.filePath = entry.filePath!.replace(/\//g, '\\');
    const root = { ...chapter(2), id: 'ordinary.mdx', filePath: 'src/content/articles/ordinary.mdx' };
    expect(getArticleFolders([entry, root, chapter(3, 'Draft only', true)]).map((f) => f.title)).toEqual([title]);
  });

  it('sorts native folder entries naturally without chapter metadata', () => {
    const entries = [chapter(10), chapter(2), chapter(1)].map((entry) => ({
      ...entry, data: { ...entry.data, chapterOrder: undefined },
    }));
    expect(getArticleFolders(entries)[0]?.articles.map((entry) => entry.data.title)).toEqual(['Chương 1', 'Chương 2', 'Chương 10']);
  });

  it('fails explicitly when two directory names produce the same URL', () => {
    expect(() => getArticleFolders([chapter(1, 'Đời'), chapter(2, 'Doi')])).toThrow('URL collision');
  });

  it('provides previous/next chapters and the folder index, with boundary handling', () => {
    const folder = getArticleFolders([chapter(3), chapter(1), chapter(2)])[0]!;
    const middle = articleFolderContext(folder, chapter(2).id)!;
    expect(middle.previous?.title).toBe('Chương 1');
    expect(middle.next?.title).toBe('Chương 3');
    expect(middle.seriesUrl).toBe(folder.url);
    expect(articleFolderContext(folder, chapter(1).id)?.previous).toBeUndefined();
    expect(articleFolderContext(folder, chapter(3).id)?.next).toBeUndefined();
    expect(articleFolderContext(folder, 'missing')).toBeUndefined();
  });
});
