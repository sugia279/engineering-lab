/**
 * Primary navigation configuration.
 * Destinations use logical paths — URL utility applies the base at render time.
 */

import type { NavigationItem } from '../types/navigation';

/** Ordered primary navigation items. */
export const primaryNavigation: readonly NavigationItem[] = [
  { label: 'Resume', href: '/', matchPattern: '/__home__' },
  { label: 'Articles', href: '/articles/', matchPattern: '/articles' },
  { label: 'Notes', href: '/notes/', matchPattern: '/notes' },
  { label: 'Projects', href: '/projects/', matchPattern: '/projects' },
  { label: 'Series', href: '/series/', matchPattern: '/series' },
  { label: 'Topics', href: '/topics/', matchPattern: '/topics' },
  { label: 'Graph', href: '/graph/', matchPattern: '/graph' },
  { label: 'About', href: '/about/', matchPattern: '/about' },
];
