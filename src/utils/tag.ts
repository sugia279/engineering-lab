/**
 * Tag normalization, labeling, deduplication, grouping, and deterministic ordering.
 * No content retrieval; rejects normalization collisions during validation.
 */

import type { Tag } from '../types/content';

/** Normalize a raw tag string into its canonical slug form. */
export function normalizeTag(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!slug) {
    throw new Error(`Cannot normalize tag: "${raw}"`);
  }

  return slug;
}

/** Derive a human-readable label from a tag slug. */
export function tagLabel(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Create a Tag object from a raw tag string. */
export function createTag(raw: string, count?: number): Tag {
  const slug = normalizeTag(raw);
  return { slug, label: tagLabel(slug), ...(count !== undefined && { count }) };
}

/** Deduplicate tags by slug, preserving first occurrence order. */
export function deduplicateTags(tags: readonly Tag[]): Tag[] {
  const seen = new Set<string>();
  const result: Tag[] = [];
  for (const tag of tags) {
    if (!seen.has(tag.slug)) {
      seen.add(tag.slug);
      result.push(tag);
    }
  }
  return result;
}

/** Sort tags deterministically by slug. */
export function sortTags(tags: readonly Tag[]): Tag[] {
  return [...tags].sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Group tags by first character of the slug. */
export function groupTagsByLetter(
  tags: readonly Tag[],
): Map<string, Tag[]> {
  const groups = new Map<string, Tag[]>();
  for (const tag of sortTags(tags)) {
    const letter = tag.slug.charAt(0).toUpperCase();
    const group = groups.get(letter) ?? [];
    group.push(tag);
    groups.set(letter, group);
  }
  return groups;
}

/** Detect slug collision among raw tag strings. */
export function findTagCollisions(rawTags: readonly string[]): string[][] {
  const slugMap = new Map<string, string[]>();
  for (const raw of rawTags) {
    const slug = normalizeTag(raw);
    const existing = slugMap.get(slug) ?? [];
    existing.push(raw);
    slugMap.set(slug, existing);
  }
  return [...slugMap.values()].filter((group) => group.length > 1);
}
