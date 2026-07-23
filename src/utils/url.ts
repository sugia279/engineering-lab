/**
 * Base-path-safe URL construction.
 * Prevents traversal, duplicate slashes, and accidental loss of /engineering-lab/.
 * No browser globals.
 */

import { siteConfig } from '../config/site';

const BASE = siteConfig.base;
const ORIGIN = siteConfig.origin;

/** Remove duplicate slashes and ensure single leading slash. */
function normalizePath(path: string): string {
  return ('/' + path).replace(/\/+/g, '/');
}

/** Construct an internal site URL with the configured base path. */
export function buildUrl(...segments: string[]): string {
  const joined = segments.join('/');

  if (joined.includes('..')) {
    throw new Error(`Path traversal is not allowed: ${joined}`);
  }

  const normalized = normalizePath(joined);
  const withBase = normalizePath(BASE + normalized);

  return withBase;
}

/** Construct an absolute canonical URL with origin and base. */
export function canonicalUrl(path: string): string {
  const relative = buildUrl(path);
  return ORIGIN + relative;
}

/** Construct a collection entry URL. */
export function entryUrl(
  collection: string,
  slug: string,
): string {
  return buildUrl(collection, slug, '/');
}

/** Construct a topic/tag URL. */
export function topicUrl(tagSlug: string): string {
  return buildUrl('topics', tagSlug, '/');
}

/** Construct a paginated URL (page 1 = index, page 2+ = /page/N/). */
export function paginatedUrl(basePath: string, page: number): string {
  if (page <= 1) {
    return buildUrl(basePath);
  }
  return buildUrl(basePath, 'page', String(page), '/');
}

/** Return the configured base path. */
export function getBase(): string {
  return BASE;
}

/** Return the configured origin. */
export function getOrigin(): string {
  return ORIGIN;
}
