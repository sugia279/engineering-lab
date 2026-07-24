/**
 * Content collection queries.
 * Production-visible entries only (draft: false).
 * Uses Astro's getCollection API at build time.
 */

import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type {
  ContentSummary, ArticleSummary, NoteSummary, ProjectSummary, SeriesSummary, Tag,
  ArticleViewModel, NoteViewModel, ProjectViewModel, SeriesContext, ProjectFacts,
} from '../../types/content';
import { createTag, deduplicateTags, sortTags } from '../../utils/tag';
import { entryUrl } from '../../utils/url';
import { calculateReadingTime } from '../../utils/reading-time';

export type ArticleEntry = CollectionEntry<'articles'>;
export type NoteEntry = CollectionEntry<'notes'>;
export type ProjectEntry = CollectionEntry<'projects'>;
export type SeriesEntry = CollectionEntry<'series'>;
export type AnyEntry = ArticleEntry | NoteEntry | ProjectEntry | SeriesEntry;

/** Return all published articles. */
export async function getPublishedArticles(): Promise<ArticleEntry[]> {
  return getCollection('articles', (e: ArticleEntry) => !e.data.draft);
}

/** Return all published notes. */
export async function getPublishedNotes(): Promise<NoteEntry[]> {
  return getCollection('notes', (e: NoteEntry) => !e.data.draft);
}

/** Return all published projects. */
export async function getPublishedProjects(): Promise<ProjectEntry[]> {
  return getCollection('projects', (e: ProjectEntry) => !e.data.draft);
}

/** Return all published series. */
export async function getPublishedSeries(): Promise<SeriesEntry[]> {
  return getCollection('series', (e: SeriesEntry) => !e.data.draft);
}

/** Return all published entries across every collection. */
export async function getAllPublishedEntries(): Promise<AnyEntry[]> {
  const [articles, notes, projects, series] = await Promise.all([
    getPublishedArticles(),
    getPublishedNotes(),
    getPublishedProjects(),
    getPublishedSeries(),
  ]);
  return [...articles, ...notes, ...projects, ...series];
}

/** Return featured articles (max N). */
export async function getFeaturedArticles(max = 3): Promise<ArticleEntry[]> {
  const all = await getPublishedArticles();
  return all.filter((e) => e.data.featured).slice(0, max);
}

/** Return featured projects (max N). */
export async function getFeaturedProjects(max = 3): Promise<ProjectEntry[]> {
  const all = await getPublishedProjects();
  return all.filter((e) => e.data.featured).slice(0, max);
}

/** Return all published entries that carry a given tag slug. */
export async function getEntriesByTag(tagSlug: string): Promise<AnyEntry[]> {
  const all = await getAllPublishedEntries();
  return all.filter((e) => e.data.tags.some((t: string) => t === tagSlug));
}

/** Collect all unique tags across published entries with per-tag counts. */
export async function getAllTags(): Promise<Tag[]> {
  const all = await getAllPublishedEntries();
  const counts = new Map<string, number>();
  for (const entry of all) {
    for (const raw of entry.data.tags) {
      counts.set(raw, (counts.get(raw) ?? 0) + 1);
    }
  }
  const tags = [...counts.entries()].map(([slug, count]) =>
    createTag(slug, count),
  );
  return sortTags(deduplicateTags(tags));
}

// ---------------------------------------------------------------------------
// Summary derivation helpers
// ---------------------------------------------------------------------------

export function toArticleSummary(entry: ArticleEntry): ArticleSummary {
  const tags: Tag[] = entry.data.tags.map((t: string) => createTag(t));
  return {
    kind: 'article',
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    url: entryUrl('articles', entry.id),
    publishedAt: entry.data.publishedAt,
    updatedAt: entry.data.updatedAt,
    tags,
    readingTime: calculateReadingTime(entry.body ?? '').minutes,
    featured: entry.data.featured,
  };
}

export function toNoteSummary(entry: NoteEntry): NoteSummary {
  const tags: Tag[] = entry.data.tags.map((t: string) => createTag(t));
  return {
    kind: 'note',
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    url: entryUrl('notes', entry.id),
    publishedAt: entry.data.publishedAt,
    updatedAt: entry.data.updatedAt,
    tags,
    maturity: entry.data.maturity,
    readingTime: calculateReadingTime(entry.body ?? '').minutes,
  };
}

export function toProjectSummary(entry: ProjectEntry): ProjectSummary {
  return {
    kind: 'project',
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    url: entryUrl('projects', entry.id),
    publishedAt: entry.data.publishedAt,
    status: entry.data.status,
    skills: entry.data.skills,
  };
}

export function toSeriesSummary(entry: SeriesEntry): SeriesSummary {
  const tags: Tag[] = entry.data.tags.map((t: string) => createTag(t));
  return {
    kind: 'series',
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    url: entryUrl('series', entry.id),
    publishedAt: entry.data.publishedAt,
    tags,
    entryCount: entry.data.entries.length,
  };
}

export function toContentSummary(entry: AnyEntry): ContentSummary {
  if (entry.collection === 'articles') return toArticleSummary(entry);
  if (entry.collection === 'notes') return toNoteSummary(entry);
  if (entry.collection === 'projects') return toProjectSummary(entry);
  return toSeriesSummary(entry as SeriesEntry);
}

// ---------------------------------------------------------------------------
// Full view model derivation helpers (consumed by detail routes)
// ---------------------------------------------------------------------------

export function toArticleViewModel(
  entry: ArticleEntry,
  seriesContext?: SeriesContext,
): ArticleViewModel {
  const tags: Tag[] = entry.data.tags.map((t: string) => createTag(t));
  return {
    id: entry.id,
    graphNodeId: `articles:${entry.id}`,
    collection: 'articles',
    title: entry.data.title,
    description: entry.data.description,
    slug: entry.id,
    url: entryUrl('articles', entry.id),
    publishedAt: entry.data.publishedAt,
    updatedAt: entry.data.updatedAt,
    domains: entry.data.domains as readonly string[],
    tags,
    image: entry.data.image,
    canonicalUrl: entry.data.canonicalUrl,
    draft: entry.data.draft,
    featured: entry.data.featured,
    showTableOfContents: entry.data.showTableOfContents,
    readingTime: calculateReadingTime(entry.body ?? '').minutes,
    seriesContext,
  };
}

export function toNoteViewModel(
  entry: NoteEntry,
  seriesContext?: SeriesContext,
): NoteViewModel {
  const tags: Tag[] = entry.data.tags.map((t: string) => createTag(t));
  return {
    id: entry.id,
    graphNodeId: `notes:${entry.id}`,
    collection: 'notes',
    title: entry.data.title,
    description: entry.data.description,
    slug: entry.id,
    url: entryUrl('notes', entry.id),
    publishedAt: entry.data.publishedAt,
    updatedAt: entry.data.updatedAt,
    domains: entry.data.domains as readonly string[],
    tags,
    image: entry.data.image,
    canonicalUrl: entry.data.canonicalUrl,
    draft: entry.data.draft,
    maturity: entry.data.maturity,
    readingTime: calculateReadingTime(entry.body ?? '').minutes,
    seriesContext,
  };
}

export function toProjectViewModel(entry: ProjectEntry): ProjectViewModel {
  const tags: Tag[] = entry.data.tags.map((t: string) => createTag(t));
  const facts: ProjectFacts = {
    status: entry.data.status,
    role: entry.data.role,
    period: entry.data.period,
    skills: entry.data.skills,
    tools: entry.data.tools,
    repositoryUrl: entry.data.repositoryUrl,
    liveUrl: entry.data.liveUrl,
  };
  return {
    id: entry.id,
    graphNodeId: `projects:${entry.id}`,
    collection: 'projects',
    title: entry.data.title,
    description: entry.data.description,
    slug: entry.id,
    url: entryUrl('projects', entry.id),
    publishedAt: entry.data.publishedAt,
    updatedAt: entry.data.updatedAt,
    domains: entry.data.domains as readonly string[],
    tags,
    image: entry.data.image,
    canonicalUrl: entry.data.canonicalUrl,
    draft: entry.data.draft,
    featured: entry.data.featured,
    facts,
  };
}
