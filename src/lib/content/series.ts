/**
 * Series resolution: ordered entries, per-entry navigation context.
 * Rejects duplicates, unresolved targets, drafts in published series.
 */

import type { SeriesEntry, ArticleEntry, NoteEntry } from './queries';
import type { SeriesViewModel, ResolvedSeriesEntry, SeriesContext } from '../../types/content';
import { entryUrl } from '../../utils/url';
import { createTag } from '../../utils/tag';

export interface SeriesResolutionError {
  readonly seriesId: string;
  readonly reason: string;
}

/** Resolve a series into a full view model with ordered entries. */
export function resolveSeries(
  series: SeriesEntry,
  articles: Map<string, ArticleEntry>,
  notes: Map<string, NoteEntry>,
): { viewModel: SeriesViewModel } | { errors: SeriesResolutionError[] } {
  const errors: SeriesResolutionError[] = [];
  const resolved: ResolvedSeriesEntry[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < series.data.entries.length; i++) {
    const ref = series.data.entries[i]!;
    const key = `${ref.collection}:${ref.id}`;

    if (seen.has(key)) {
      errors.push({ seriesId: series.id, reason: `Duplicate entry ${key} at position ${i + 1}` });
      continue;
    }
    seen.add(key);

    const entry =
      ref.collection === 'articles' ? articles.get(ref.id) : notes.get(ref.id);

    if (!entry) {
      errors.push({ seriesId: series.id, reason: `Unresolved entry ${key} at position ${i + 1}` });
      continue;
    }

    if (entry.data.draft) {
      errors.push({
        seriesId: series.id,
        reason: `Draft entry ${key} referenced in published series`,
      });
      continue;
    }

    resolved.push({
      position: i + 1,
      collection: ref.collection,
      id: ref.id,
      title: entry.data.title,
      description: entry.data.description,
      url: entryUrl(ref.collection, ref.id),
    });
  }

  if (errors.length > 0) return { errors };

  const tags = series.data.tags.map((t: string) => createTag(t));
  const viewModel: SeriesViewModel = {
    id: series.id,
    graphNodeId: `series:${series.id}`,
    collection: 'series',
    title: series.data.title,
    description: series.data.description,
    slug: series.id,
    url: entryUrl('series', series.id),
    publishedAt: series.data.publishedAt,
    updatedAt: series.data.updatedAt,
    domains: series.data.domains,
    tags,
    draft: series.data.draft,
    entries: resolved,
  };

  return { viewModel };
}

/** Derive navigation context for a specific entry within a resolved series. */
export function deriveSeriesContext(
  seriesId: string,
  seriesTitle: string,
  entries: readonly ResolvedSeriesEntry[],
  currentId: string,
): SeriesContext | undefined {
  const currentIndex = entries.findIndex((e) => e.id === currentId);
  if (currentIndex === -1) return undefined;

  return {
    seriesId,
    seriesTitle,
    seriesUrl: entryUrl('series', seriesId),
    totalEntries: entries.length,
    currentPosition: currentIndex + 1,
    previous: currentIndex > 0 ? entries[currentIndex - 1] : undefined,
    next: currentIndex < entries.length - 1 ? entries[currentIndex + 1] : undefined,
  };
}
