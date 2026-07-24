/**
 * Cross-content reference resolution and relationship integrity validation.
 * Never drops missing targets silently; reports source, field, and target.
 */

import type { ContentReference } from '../../types/content';
import type { AnyEntry, ArticleEntry, NoteEntry, ProjectEntry, SeriesEntry } from './queries';

export interface ReferenceError {
  readonly source: string;
  readonly field: string;
  readonly target: string;
  readonly reason: 'missing' | 'draft' | 'self' | 'wrong-collection';
}

export type EntryMap = {
  articles: Map<string, ArticleEntry>;
  notes: Map<string, NoteEntry>;
  projects: Map<string, ProjectEntry>;
  series: Map<string, SeriesEntry>;
};

/** Build lookup maps from published entry arrays. */
export function buildEntryMaps(
  articles: ArticleEntry[],
  notes: NoteEntry[],
  projects: ProjectEntry[],
  series: SeriesEntry[],
): EntryMap {
  return {
    articles: new Map(articles.map((e) => [e.id, e])),
    notes: new Map(notes.map((e) => [e.id, e])),
    projects: new Map(projects.map((e) => [e.id, e])),
    series: new Map(series.map((e) => [e.id, e])),
  };
}

/** Resolve a single content reference. Returns null if target is not found/valid. */
export function resolveReference(
  ref: ContentReference,
  maps: EntryMap,
  sourceId: string,
  field: string,
  allEntries: Map<string, AnyEntry>,
): { entry: AnyEntry } | { error: ReferenceError } {
  if (ref.id === sourceId) {
    return { error: { source: sourceId, field, target: ref.id, reason: 'self' } };
  }

  const map = maps[ref.collection] as Map<string, AnyEntry> | undefined;
  if (!map) {
    return { error: { source: sourceId, field, target: `${ref.collection}:${ref.id}`, reason: 'wrong-collection' } };
  }

  // Check in published map first
  const published = map.get(ref.id);
  if (published) {
    return { entry: published };
  }

  // Check in all entries (including drafts) for a draft-target error
  const draftsKey = `${ref.collection}:${ref.id}`;
  if (allEntries.has(draftsKey)) {
    return { error: { source: sourceId, field, target: draftsKey, reason: 'draft' } };
  }

  return { error: { source: sourceId, field, target: `${ref.collection}:${ref.id}`, reason: 'missing' } };
}

/** Validate all connections on a single entry. */
export function validateConnections(
  entry: AnyEntry,
  maps: EntryMap,
  allEntries: Map<string, AnyEntry>,
): ReferenceError[] {
  const errors: ReferenceError[] = [];
  const connections = entry.data.connections ?? [];

  const seen = new Set<string>();
  for (const conn of connections) {
    const key = `${conn.type}:${conn.target.collection}:${conn.target.id}`;
    if (seen.has(key)) {
      errors.push({
        source: entry.id,
        field: 'connections',
        target: `${conn.target.collection}:${conn.target.id}`,
        reason: 'missing', // overloaded for duplicate
      });
      continue;
    }
    seen.add(key);

    const result = resolveReference(
      conn.target,
      maps,
      entry.id,
      'connections',
      allEntries,
    );
    if ('error' in result) errors.push(result.error);
  }

  return errors;
}

/** Build a map of all entries (including drafts) keyed by collection:id. */
export function buildAllEntriesMap(
  articles: ArticleEntry[],
  notes: NoteEntry[],
  projects: ProjectEntry[],
  series: SeriesEntry[],
  draftArticles: ArticleEntry[] = [],
  draftNotes: NoteEntry[] = [],
): Map<string, AnyEntry> {
  const map = new Map<string, AnyEntry>();
  for (const e of [...articles, ...draftArticles]) map.set(`articles:${e.id}`, e);
  for (const e of [...notes, ...draftNotes]) map.set(`notes:${e.id}`, e);
  for (const e of projects) map.set(`projects:${e.id}`, e);
  for (const e of series) map.set(`series:${e.id}`, e);
  return map;
}
