/**
 * SEO input construction and safe structured-data serialization support.
 * Combines validated content/site values into normalized SEO outputs.
 * No rendering or collection queries.
 */

import type { SEOData, OpenGraphData, TwitterCardData, StructuredDataInput } from '../types/seo';
import type { Breadcrumb } from '../types/navigation';
import { siteConfig } from '../config/site';
import { canonicalUrl } from './url';

export type PageKind = 'home' | 'article' | 'note' | 'project' | 'series' | 'listing' | 'topic' | 'search' | 'graph' | 'about' | 'error';

export interface SEOInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly kind: PageKind;
  readonly publishedAt?: Date;
  readonly updatedAt?: Date;
  readonly tags?: readonly string[];
  readonly image?: string;
  readonly noIndex?: boolean;
  readonly breadcrumbs?: readonly Breadcrumb[];
}

/** Build complete SEO data from content and site configuration. */
export function buildSEOData(input: SEOInput): SEOData {
  const canonical = canonicalUrl(input.path);
  const fullTitle =
    input.kind === 'home'
      ? `${siteConfig.name} — ${siteConfig.description.split('—')[0]?.trim()}`
      : `${input.title} | ${siteConfig.name}`;

  const openGraph: OpenGraphData = {
    type: input.kind === 'article' || input.kind === 'note' ? 'article' : 'website',
    title: input.title,
    description: input.description,
    url: canonical,
    image: input.image ?? siteConfig.defaultImage,
    ...(input.publishedAt && {
      publishedTime: input.publishedAt.toISOString(),
    }),
    ...(input.updatedAt && {
      modifiedTime: input.updatedAt.toISOString(),
    }),
    ...(input.tags?.length && { tags: input.tags }),
  };

  const twitter: TwitterCardData = {
    card: input.image ? 'summary_large_image' : 'summary',
    title: input.title,
    description: input.description,
    image: input.image ?? siteConfig.defaultImage,
  };

  const robots = input.noIndex ? 'noindex, nofollow' : undefined;

  const structuredData = buildStructuredData(input, canonical);

  return {
    title: fullTitle,
    description: input.description,
    canonical,
    robots,
    openGraph,
    twitter,
    structuredData,
  };
}

/** Build structured data (JSON-LD) for the page. */
function buildStructuredData(
  input: SEOInput,
  canonical: string,
): StructuredDataInput | undefined {
  if (input.kind === 'error' || input.kind === 'search') {
    return undefined;
  }

  if (input.kind === 'article' || input.kind === 'note') {
    return {
      '@type': 'Article',
      headline: input.title,
      description: input.description,
      url: canonical,
      datePublished: input.publishedAt?.toISOString(),
      ...(input.updatedAt && { dateModified: input.updatedAt.toISOString() }),
      author: { '@type': 'Person', name: siteConfig.author },
    };
  }

  if (input.kind === 'project') {
    return {
      '@type': 'CreativeWork',
      name: input.title,
      description: input.description,
      url: canonical,
      author: { '@type': 'Person', name: siteConfig.author },
    };
  }

  return {
    '@type': 'WebPage',
    name: input.title,
    description: input.description,
    url: canonical,
  };
}

/** Safely serialize structured data for embedding in a script tag. */
export function serializeStructuredData(data: StructuredDataInput): string {
  const wrapped = {
    '@context': 'https://schema.org',
    ...data,
  };

  return JSON.stringify(wrapped)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/** Build breadcrumb structured data. */
export function buildBreadcrumbStructuredData(
  breadcrumbs: readonly Breadcrumb[],
): StructuredDataInput {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      ...(crumb.href && { item: crumb.href }),
    })),
  };
}
