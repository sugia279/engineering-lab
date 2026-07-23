/**
 * Slug normalization for collection identifiers and topic values.
 * No file/collection access; rejects empty, unsafe, or noncanonical values.
 */

/** Normalize a raw string into a canonical slug. */
export function normalizeSlug(value: string): string {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    throw new Error('Slug cannot be empty');
  }

  const slug = trimmed
    .replace(/[^a-z0-9\-/]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/\/-|-\//g, '/');

  if (!slug) {
    throw new Error(`Cannot normalize slug from: "${value}"`);
  }

  return slug;
}

/** Validate that a slug is already in canonical form. */
export function isCanonicalSlug(slug: string): boolean {
  return slug === normalizeSlug(slug);
}

/** Extract the terminal segment from a potentially nested slug. */
export function slugTerminalSegment(slug: string): string {
  const segments = slug.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? '';
}

/** Check for potential slug collisions between two values. */
export function slugsCollide(a: string, b: string): boolean {
  return normalizeSlug(a) === normalizeSlug(b);
}
