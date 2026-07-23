/**
 * Search contracts for Pagefind integration and search UI state.
 */

import type { ContentCollectionName, Tag } from './content';

/** Metadata encoded into Pagefind-indexed HTML attributes. */
export interface SearchDocumentMetadata {
  readonly collection: ContentCollectionName;
  readonly tags: readonly string[];
  readonly title: string;
  readonly description: string;
  readonly publishedAt?: string;
}

/** A single mapped search result for rendering. */
export interface SearchResult {
  readonly url: string;
  readonly title: string;
  readonly excerpt: string;
  readonly collection: ContentCollectionName;
  readonly tags: readonly Tag[];
  readonly publishedAt?: Date;
  readonly score: number;
}

/** Search route query state. */
export type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface SearchQueryState {
  readonly query: string;
  readonly collectionFilter?: ContentCollectionName;
  readonly tagFilter?: string;
  readonly status: SearchStatus;
  readonly resultCount: number;
  readonly results: readonly SearchResult[];
}
