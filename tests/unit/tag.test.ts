import { describe, it, expect } from 'vitest';
import {
  normalizeTag,
  tagLabel,
  createTag,
  deduplicateTags,
  sortTags,
  groupTagsByLetter,
  findTagCollisions,
} from '../../src/utils/tag';

describe('tag utility', () => {
  describe('normalizeTag', () => {
    it('lowercases and trims', () => {
      expect(normalizeTag(' TypeScript ')).toBe('typescript');
    });

    it('replaces spaces and special chars', () => {
      expect(normalizeTag('Test Automation')).toBe('test-automation');
    });

    it('collapses hyphens', () => {
      expect(normalizeTag('a--b')).toBe('a-b');
    });

    it('rejects empty result', () => {
      expect(() => normalizeTag('')).toThrow();
    });
  });

  describe('tagLabel', () => {
    it('capitalizes each word', () => {
      expect(tagLabel('test-automation')).toBe('Test Automation');
    });

    it('handles single word', () => {
      expect(tagLabel('typescript')).toBe('Typescript');
    });
  });

  describe('createTag', () => {
    it('creates tag with slug and label', () => {
      const tag = createTag('TypeScript');
      expect(tag.slug).toBe('typescript');
      expect(tag.label).toBe('Typescript');
    });

    it('includes count when provided', () => {
      const tag = createTag('astro', 5);
      expect(tag.count).toBe(5);
    });
  });

  describe('deduplicateTags', () => {
    it('removes duplicates by slug', () => {
      const tags = [
        { slug: 'ts', label: 'Ts' },
        { slug: 'ts', label: 'TS' },
        { slug: 'astro', label: 'Astro' },
      ];
      expect(deduplicateTags(tags)).toHaveLength(2);
      expect(deduplicateTags(tags)[0]!.label).toBe('Ts');
    });
  });

  describe('sortTags', () => {
    it('sorts alphabetically by slug', () => {
      const tags = [
        { slug: 'zod', label: 'Zod' },
        { slug: 'astro', label: 'Astro' },
        { slug: 'mdx', label: 'Mdx' },
      ];
      const sorted = sortTags(tags);
      expect(sorted.map((t) => t.slug)).toEqual(['astro', 'mdx', 'zod']);
    });

    it('does not mutate input', () => {
      const tags = [
        { slug: 'b', label: 'B' },
        { slug: 'a', label: 'A' },
      ];
      sortTags(tags);
      expect(tags[0]!.slug).toBe('b');
    });
  });

  describe('groupTagsByLetter', () => {
    it('groups by first character uppercase', () => {
      const tags = [
        { slug: 'astro', label: 'Astro' },
        { slug: 'automation', label: 'Automation' },
        { slug: 'typescript', label: 'Typescript' },
      ];
      const groups = groupTagsByLetter(tags);
      expect(groups.get('A')).toHaveLength(2);
      expect(groups.get('T')).toHaveLength(1);
    });
  });

  describe('findTagCollisions', () => {
    it('detects colliding raw values', () => {
      const collisions = findTagCollisions(['Test Automation', 'test-automation', 'TypeScript']);
      expect(collisions).toHaveLength(1);
      expect(collisions[0]).toContain('Test Automation');
      expect(collisions[0]).toContain('test-automation');
    });

    it('returns empty for no collisions', () => {
      expect(findTagCollisions(['astro', 'typescript'])).toHaveLength(0);
    });
  });
});
