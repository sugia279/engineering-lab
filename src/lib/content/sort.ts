/**
 * Deterministic sorting for collection entries and summaries.
 * Does not mutate input. Ties use stable IDs.
 */

import type { AnyEntry } from './queries';
import type { ContentSummary } from '../../types/content';
import { compareNewestFirst, compareOldestFirst } from '../../utils/date';

export type SortMode = 'newest' | 'oldest' | 'alphabetical';

/** Sort any collection entries by the given mode. Returns a new array. */
export function sortEntries(entries: AnyEntry[], mode: SortMode = 'newest'): AnyEntry[] {
  return [...entries].sort((a, b) => {
    if (mode === 'newest') {
      const diff = compareNewestFirst(a.data.publishedAt, b.data.publishedAt);
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    }
    if (mode === 'oldest') {
      const diff = compareOldestFirst(a.data.publishedAt, b.data.publishedAt);
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    }
    return a.data.title.localeCompare(b.data.title) || a.id.localeCompare(b.id);
  });
}

/** Sort content summaries by the given mode. Returns a new array. */
export function sortSummaries(
  summaries: ContentSummary[],
  mode: SortMode = 'newest',
): ContentSummary[] {
  return [...summaries].sort((a, b) => {
    if (mode === 'newest') {
      const diff = compareNewestFirst(a.publishedAt, b.publishedAt);
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    }
    if (mode === 'oldest') {
      const diff = compareOldestFirst(a.publishedAt, b.publishedAt);
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    }
    return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
  });
}
