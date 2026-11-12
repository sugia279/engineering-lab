import type { ArticleEntry } from './queries';
import type { SeriesContext } from '../../types/content';
import { buildUrl, entryUrl } from '../../utils/url';

export interface ArticleFolder {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly articles: ArticleEntry[];
}

/** ASCII route segments; retain the original directory name as the display title. */
function folderSlug(directory: string): string {
  return directory.split('/').map((segment) => segment.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).join('/');
}

/** Group published entries by source directory, independent of Astro's generated IDs. */
export function getArticleFolders(articles: readonly ArticleEntry[]): ArticleFolder[] {
  const folders = new Map<string, { title: string; articles: ArticleEntry[] }>();
  const slugOwners = new Map<string, string>();
  for (const article of articles) {
    if (article.data.draft) continue;
    const sourcePath = (article.filePath ?? article.id).replace(/\\/g, '/')
      .replace(/^.*?src\/content\/articles\//, '');
    const parts = sourcePath.split('/');
    if (parts.length < 2) continue;
    const directory = parts.slice(0, -1).join('/');
    const folder = folders.get(directory) ?? { title: parts[parts.length - 2]!, articles: [] as ArticleEntry[] };
    folder.articles.push(article);
    folders.set(directory, folder);
  }
  return [...folders].map(([directory, folder]) => {
    const id = folderSlug(directory);
    if (!id || id.split('/').some((part) => !part)) {
      throw new Error(`Article directory needs a Latin-letter route name: ${directory}`);
    }
    const owner = slugOwners.get(id);
    if (owner && owner !== directory) throw new Error(`Article folder URL collision: ${owner} / ${directory}`);
    slugOwners.set(id, directory);
    return {
      id,
      title: folder.title,
      url: buildUrl('articles/folders', id, '/'),
      articles: folder.articles.sort((a, b) =>
        (a.data.chapterOrder ?? Number.MAX_SAFE_INTEGER) - (b.data.chapterOrder ?? Number.MAX_SAFE_INTEGER)
        || a.id.localeCompare(b.id, 'vi', { numeric: true })),
    };
  }).sort((a, b) => a.title.localeCompare(b.title, 'vi'));
}

/** Reuse the existing previous/next reader UI for chapters in a directory. */
export function articleFolderContext(folder: ArticleFolder, currentId: string): SeriesContext | undefined {
  const index = folder.articles.findIndex((entry) => entry.id === currentId);
  if (index < 0) return undefined;
  const ref = (position: number) => {
    const entry = folder.articles[position];
    return entry ? {
      position: position + 1, collection: 'articles' as const, id: entry.id,
      title: entry.data.title, description: entry.data.description,
      url: entryUrl('articles', entry.id),
    } : undefined;
  };
  return {
    seriesId: folder.id, seriesTitle: folder.title, seriesUrl: folder.url,
    totalEntries: folder.articles.length, currentPosition: index + 1,
    previous: ref(index - 1), next: ref(index + 1),
  };
}
