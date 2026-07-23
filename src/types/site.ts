/**
 * Site identity and configuration contracts.
 */

/** An external social/profile link. */
export interface SocialLink {
  readonly service: string;
  readonly url: string;
  readonly label: string;
}

/** Global site configuration — no secrets, no browser/runtime dependencies. */
export interface SiteConfig {
  readonly name: string;
  readonly description: string;
  readonly author: string;
  readonly language: string;
  readonly origin: string;
  readonly base: string;
  readonly defaultImage?: string;
  readonly socialLinks: readonly SocialLink[];
}
