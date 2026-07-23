/**
 * SEO contracts for metadata generation, Open Graph, Twitter Cards, and structured data.
 */

/** Open Graph metadata. */
export interface OpenGraphData {
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly image?: string;
  readonly publishedTime?: string;
  readonly modifiedTime?: string;
  readonly tags?: readonly string[];
}

/** Twitter Card metadata. */
export interface TwitterCardData {
  readonly card: 'summary' | 'summary_large_image';
  readonly title: string;
  readonly description: string;
  readonly image?: string;
}

/** Constrained structured data input for JSON-LD serialization. */
export interface StructuredDataInput {
  readonly '@type': string;
  readonly [key: string]: unknown;
}

/** Complete SEO data assembled by the SEO utility for a single page. */
export interface SEOData {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly robots?: string;
  readonly openGraph: OpenGraphData;
  readonly twitter: TwitterCardData;
  readonly structuredData?: StructuredDataInput;
}
