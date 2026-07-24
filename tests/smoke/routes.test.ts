/**
 * Smoke tests — verify built artifact has all expected routes.
 * Requires a prior `npm run build` to populate dist/.
 * Run with: npm run test:smoke
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve(process.cwd(), 'dist');

function exists(relativePath: string): boolean {
  return existsSync(resolve(DIST, relativePath));
}

function html(relativePath: string): string {
  try {
    return readFileSync(resolve(DIST, relativePath), 'utf-8');
  } catch {
    return '';
  }
}

function hasBasePath(content: string): boolean {
  // Every internal link/asset should reference /engineering-lab/
  return content.includes('/engineering-lab/');
}

describe('dist/ artifact smoke tests (requires prior npm run build)', () => {
  it('dist/ directory exists', () => {
    expect(existsSync(DIST), 'Run npm run build before npm run test:smoke').toBe(true);
  });

  describe('static routes', () => {
    it('home page exists', () => {
      expect(exists('index.html')).toBe(true);
    });

    it('about page exists', () => {
      expect(exists('about/index.html')).toBe(true);
    });

    it('404 page exists as 404.html', () => {
      expect(exists('404.html')).toBe(true);
    });

    it('articles index exists', () => {
      expect(exists('articles/index.html')).toBe(true);
    });

    it('notes index exists', () => {
      expect(exists('notes/index.html')).toBe(true);
    });

    it('projects index exists', () => {
      expect(exists('projects/index.html')).toBe(true);
    });

    it('series index exists', () => {
      expect(exists('series/index.html')).toBe(true);
    });

    it('topics index exists', () => {
      expect(exists('topics/index.html')).toBe(true);
    });

    it('search page exists', () => {
      expect(exists('search/index.html')).toBe(true);
    });

    it('graph page exists', () => {
      expect(exists('graph/index.html')).toBe(true);
    });

    it('graph manifest exists', () => {
      expect(exists('graph/graph.json')).toBe(true);
    });

    it('resume is served', () => {
      expect(exists('resume/SuDuyHien_Resume_Updated.html')).toBe(true);
    });
  });

  describe('graph manifest validity', () => {
    it('graph.json is valid JSON', () => {
      const content = html('graph/graph.json');
      expect(content).not.toBe('');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('graph manifest has schemaVersion', () => {
      const manifest = JSON.parse(html('graph/graph.json'));
      expect(manifest).toHaveProperty('schemaVersion');
      expect(typeof manifest.schemaVersion).toBe('number');
    });

    it('graph manifest has nodes and edges arrays', () => {
      const manifest = JSON.parse(html('graph/graph.json'));
      expect(Array.isArray(manifest.nodes)).toBe(true);
      expect(Array.isArray(manifest.edges)).toBe(true);
    });
  });

  describe('base path', () => {
    it('home page contains base path', () => {
      expect(hasBasePath(html('index.html'))).toBe(true);
    });

    it('graph page contains base path', () => {
      expect(hasBasePath(html('graph/index.html'))).toBe(true);
    });
  });

  describe('draft exclusion', () => {
    it('graph manifest contains no draft marker', () => {
      const content = html('graph/graph.json');
      // draft entries should not appear in manifest nodes
      expect(content).not.toContain('"draft-article"');
    });
  });
});
