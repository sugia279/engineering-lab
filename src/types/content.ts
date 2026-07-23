/**
 * Shared content contracts consumed across domain modules, components, layouts, and routes.
 * Raw collection field types are inferred from content.config.ts — never duplicated here.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Discriminated value limited to the four approved collections. */
export type ContentCollectionName = 'articles' | 'notes' | 'projects' | 'series';

/** Canonical tag with derived human-readable label. */
export interface Tag {
  readonly slug: string;
  readonly label: string;
  readonly count?: number;
}

/** Build-resolved content image. */
export interface ContentImage {
  readonly src: string;
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
  readonly caption?: string;
}

/** Stable cross-collection reference. */
export interface ContentReference {
  readonly collection: ContentCollectionName;
  readonly id: string;
}

// ---------------------------------------------------------------------------
// Note maturity
// ---------------------------------------------------------------------------

export type NoteMaturity = 'seed' | 'growing' | 'evergreen';

// ---------------------------------------------------------------------------
// Project value objects
// ---------------------------------------------------------------------------

export type ProjectStatus = 'active' | 'maintained' | 'completed' | 'archived';

export interface ProjectPeriod {
  readonly start: string;
  readonly end?: string;
}

export interface ProjectFacts {
  readonly status: ProjectStatus;
  readonly role: string;
  readonly period: ProjectPeriod;
  readonly skills: readonly string[];
  readonly tools: readonly string[];
  readonly repositoryUrl?: string;
  readonly liveUrl?: string;
}

// ---------------------------------------------------------------------------
// Series value objects
// ---------------------------------------------------------------------------

/** Ordered reference inside a series — articles and notes only. */
export interface SeriesEntryReference {
  readonly collection: 'articles' | 'notes';
  readonly id: string;
}

/** Resolved entry for rendering. */
export interface ResolvedSeriesEntry {
  readonly position: number;
  readonly collection: 'articles' | 'notes';
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly url: string;
}

/** Navigation context for the current entry within its series. */
export interface SeriesContext {
  readonly seriesId: string;
  readonly seriesTitle: string;
  readonly seriesUrl: string;
  readonly totalEntries: number;
  readonly currentPosition: number;
  readonly previous?: ResolvedSeriesEntry;
  readonly next?: ResolvedSeriesEntry;
}

// ---------------------------------------------------------------------------
// View models
// ---------------------------------------------------------------------------

export interface BaseContentViewModel {
  readonly id: string;
  readonly graphNodeId: string;
  readonly collection: ContentCollectionName;
  readonly title: string;
  readonly description: string;
  readonly slug: string;
  readonly url: string;
  readonly publishedAt: Date;
  readonly updatedAt?: Date;
  readonly domains: readonly string[];
  readonly tags: readonly Tag[];
  readonly image?: ContentImage;
  readonly canonicalUrl?: string;
  readonly draft: boolean;
}

export interface ArticleViewModel extends BaseContentViewModel {
  readonly collection: 'articles';
  readonly featured: boolean;
  readonly showTableOfContents: boolean;
  readonly readingTime: number;
  readonly seriesContext?: SeriesContext;
}

export interface NoteViewModel extends BaseContentViewModel {
  readonly collection: 'notes';
  readonly maturity: NoteMaturity;
  readonly readingTime: number;
  readonly seriesContext?: SeriesContext;
}

export interface ProjectViewModel extends BaseContentViewModel {
  readonly collection: 'projects';
  readonly facts: ProjectFacts;
  readonly featured: boolean;
}

export interface SeriesViewModel extends BaseContentViewModel {
  readonly collection: 'series';
  readonly entries: readonly ResolvedSeriesEntry[];
}

// ---------------------------------------------------------------------------
// Content summary (discriminated union for cards/listings)
// ---------------------------------------------------------------------------

export interface ArticleSummary {
  readonly kind: 'article';
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly publishedAt: Date;
  readonly updatedAt?: Date;
  readonly tags: readonly Tag[];
  readonly readingTime: number;
  readonly featured: boolean;
}

export interface NoteSummary {
  readonly kind: 'note';
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly publishedAt: Date;
  readonly updatedAt?: Date;
  readonly tags: readonly Tag[];
  readonly maturity: NoteMaturity;
  readonly readingTime: number;
}

export interface ProjectSummary {
  readonly kind: 'project';
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly publishedAt: Date;
  readonly status: ProjectStatus;
  readonly skills: readonly string[];
}

export interface SeriesSummary {
  readonly kind: 'series';
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly publishedAt: Date;
  readonly tags: readonly Tag[];
  readonly entryCount: number;
}

export type ContentSummary =
  | ArticleSummary
  | NoteSummary
  | ProjectSummary
  | SeriesSummary;
