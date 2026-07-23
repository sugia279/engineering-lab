/**
 * Controlled knowledge domain configuration.
 * Values match the approved five initial domains.
 */

import type { KnowledgeDomain } from '../types/graph';

export interface DomainDefinition {
  readonly slug: KnowledgeDomain;
  readonly label: string;
}

/** Approved initial domains — order determines default display sequence. */
export const DOMAINS: readonly DomainDefinition[] = [
  { slug: 'engineering', label: 'Engineering' },
  { slug: 'artificial-intelligence', label: 'Artificial Intelligence' },
  { slug: 'music', label: 'Music' },
  { slug: 'reading-literature', label: 'Reading & Literature' },
  { slug: 'philosophy-life', label: 'Philosophy & Life' },
] as const;

/** All approved domain slugs for validation. */
export const DOMAIN_SLUGS: readonly KnowledgeDomain[] = DOMAINS.map(
  (d) => d.slug,
);

/** Lookup domain label by slug. */
export function getDomainLabel(slug: KnowledgeDomain): string {
  const domain = DOMAINS.find((d) => d.slug === slug);
  return domain?.label ?? slug;
}
