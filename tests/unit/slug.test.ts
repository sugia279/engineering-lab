import { describe, it, expect } from 'vitest';
import {
  normalizeSlug,
  isCanonicalSlug,
  slugTerminalSegment,
  slugsCollide,
} from '../../src/utils/slug';

describe('slug utility', () => {
  describe('normalizeSlug', () => {
    it('lowercases and trims', () => {
      expect(normalizeSlug('  My Post  ')).toBe('my-post');
    });

    it('replaces non-alphanumeric with hyphens', () => {
      expect(normalizeSlug('Hello World!')).toBe('hello-world');
    });

    it('collapses multiple hyphens', () => {
      expect(normalizeSlug('a---b')).toBe('a-b');
    });

    it('preserves path separators', () => {
      expect(normalizeSlug('astro/base-paths')).toBe('astro/base-paths');
    });

    it('rejects empty string', () => {
      expect(() => normalizeSlug('')).toThrow('empty');
    });

    it('rejects whitespace-only string', () => {
      expect(() => normalizeSlug('   ')).toThrow('empty');
    });

    it('rejects string that normalizes to nothing', () => {
      expect(() => normalizeSlug('!!!')).toThrow('Cannot normalize');
    });

    it('strips leading/trailing hyphens', () => {
      expect(normalizeSlug('-leading-')).toBe('leading');
    });
  });

  describe('isCanonicalSlug', () => {
    it('returns true for canonical slug', () => {
      expect(isCanonicalSlug('my-post')).toBe(true);
    });

    it('returns false for non-canonical slug', () => {
      expect(isCanonicalSlug('My Post')).toBe(false);
    });

    it('returns true for nested canonical slug', () => {
      expect(isCanonicalSlug('astro/base-paths')).toBe(true);
    });
  });

  describe('slugTerminalSegment', () => {
    it('returns last segment', () => {
      expect(slugTerminalSegment('astro/base-paths')).toBe('base-paths');
    });

    it('returns the slug itself for flat', () => {
      expect(slugTerminalSegment('my-post')).toBe('my-post');
    });
  });

  describe('slugsCollide', () => {
    it('detects collision', () => {
      expect(slugsCollide('My Post', 'my-post')).toBe(true);
    });

    it('returns false for different slugs', () => {
      expect(slugsCollide('post-a', 'post-b')).toBe(false);
    });
  });
});
