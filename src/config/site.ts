/**
 * Site identity, metadata defaults, and social links configuration.
 * No secrets. No browser/runtime dependencies. Consumed by SEO, RSS, layouts, and components.
 */

import type { SiteConfig } from '../types/site';

export const siteConfig: SiteConfig = {
  name: 'Engineering Lab',
  description:
    'Public Personal Knowledge Garden and Living Portfolio — exploring engineering, AI, music, reading, and philosophy.',
  author: 'Su Duy Hien',
  language: 'en',
  origin: 'https://sugia279.github.io',
  base: '/engineering-lab/',
  socialLinks: [
    {
      service: 'GitHub',
      url: 'https://github.com/sugia279',
      label: 'GitHub profile',
    },
    {
      service: 'Medium',
      url: 'https://medium.com/@hiensu304',
      label: 'Technical articles on Medium',
    },
  ],
};
