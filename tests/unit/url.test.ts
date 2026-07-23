import { describe, it, expect } from 'vitest';
import { buildUrl, canonicalUrl, entryUrl, topicUrl, paginatedUrl, getBase, getOrigin } from '../../src/utils/url';

describe('url utility', () => {
  describe('buildUrl', () => {
    it('prepends the configured base', () => {
      expect(buildUrl('articles')).toBe('/engineering-lab/articles');
    });

    it('handles trailing slashes', () => {
      expect(buildUrl('articles', '/')).toBe('/engineering-lab/articles/');
    });

    it('normalizes duplicate slashes', () => {
      expect(buildUrl('//articles//')).toBe('/engineering-lab/articles/');
    });

    it('handles nested segments', () => {
      expect(buildUrl('notes', 'astro/base-paths', '/')).toBe(
        '/engineering-lab/notes/astro/base-paths/',
      );
    });

    it('rejects path traversal', () => {
      expect(() => buildUrl('../etc/passwd')).toThrow('traversal');
    });

    it('handles empty string to produce base', () => {
      expect(buildUrl('')).toBe('/engineering-lab/');
    });

    it('handles root slash', () => {
      expect(buildUrl('/')).toBe('/engineering-lab/');
    });
  });

  describe('canonicalUrl', () => {
    it('produces absolute URL with origin', () => {
      expect(canonicalUrl('articles/my-post/')).toBe(
        'https://sugia279.github.io/engineering-lab/articles/my-post/',
      );
    });

    it('produces home canonical', () => {
      expect(canonicalUrl('/')).toBe(
        'https://sugia279.github.io/engineering-lab/',
      );
    });
  });

  describe('entryUrl', () => {
    it('builds collection entry URL', () => {
      expect(entryUrl('articles', 'my-post')).toBe(
        '/engineering-lab/articles/my-post/',
      );
    });

    it('handles nested slugs', () => {
      expect(entryUrl('notes', 'astro/base-paths')).toBe(
        '/engineering-lab/notes/astro/base-paths/',
      );
    });
  });

  describe('topicUrl', () => {
    it('builds topic URL', () => {
      expect(topicUrl('typescript')).toBe('/engineering-lab/topics/typescript/');
    });
  });

  describe('paginatedUrl', () => {
    it('returns base for page 1', () => {
      expect(paginatedUrl('articles/', 1)).toBe('/engineering-lab/articles/');
    });

    it('appends page segment for page 2+', () => {
      expect(paginatedUrl('articles/', 3)).toBe(
        '/engineering-lab/articles/page/3/',
      );
    });
  });

  describe('getBase and getOrigin', () => {
    it('returns configured base', () => {
      expect(getBase()).toBe('/engineering-lab/');
    });

    it('returns configured origin', () => {
      expect(getOrigin()).toBe('https://sugia279.github.io');
    });
  });
});
