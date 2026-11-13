/**
 * Primary navigation configuration.
 * Destinations use logical paths — URL utility applies the base at render time.
 */

import type { NavigationItem } from '../types/navigation';

/** Ordered primary navigation items. */
export const primaryNavigation: readonly NavigationItem[] = [
  { label: 'Home', href: '/', matchPattern: '/__home__' },
  { label: 'Music & Video', href: '/music/', matchPattern: '/music', children: [
    { label: 'Music knowledge', href: '/music/#music-knowledge' },
    { label: 'Performances', href: '/music/#music-performances' },
    { label: 'Favorite music', href: '/music/#favorite-music' },
    { label: 'Favorite videos', href: '/music/#favorite-videos' },
    { label: 'Share a link', href: '/music/#share-link' },
  ] },
  { label: 'Photos', href: '/photos/', matchPattern: '/photos', children: [
    { label: 'Family', href: '/photos/#family' },
    { label: 'Scenery', href: '/photos/#scenery' },
    { label: 'Moments', href: '/photos/#moments' },
    { label: 'Add photo', href: '/photos/upload/' },
  ] },
  { label: 'Projects', href: '/projects/', matchPattern: '/projects' },
  { label: 'Guestbook', href: '/guestbook/', matchPattern: '/guestbook' },
  { label: 'Help shop', href: '/requests/', matchPattern: '/requests', children: [
    { label: 'Request board', href: '/requests/#request-board' },
    { label: 'Send request', href: '/requests/#send-request' },
  ] },
  { label: 'Knowledge', href: '/knowledge/', matchPattern: '/knowledge', children: [
    { label: 'Articles', href: '/articles/', matchPattern: '/articles' },
    { label: 'Notes', href: '/notes/', matchPattern: '/notes' },
    { label: 'Series', href: '/series/', matchPattern: '/series' },
    { label: 'Topics', href: '/topics/', matchPattern: '/topics' },
    { label: 'Graph', href: '/graph/', matchPattern: '/graph' },
    { label: 'Shared writing', href: '/knowledge/#shared-knowledge' },
    { label: 'Add Knowledge', href: '/knowledge/#add-knowledge' },
  ] },
  { label: 'Novels', href: '/novels/', matchPattern: '/novels' },
  { label: 'About', href: '/about/', matchPattern: '/about', children: [
    { label: 'Resume', href: '/resume/', matchPattern: '/resume' },
  ] },
];

export const collectionNavigation: NavigationItem[] = [
  { label: 'Articles', href: '/articles/', matchPattern: '/articles' },
  { label: 'Notes', href: '/notes/', matchPattern: '/notes' },
  { label: 'Series', href: '/series/', matchPattern: '/series' },
  { label: 'Projects', href: '/projects/', matchPattern: '/projects' },
];
