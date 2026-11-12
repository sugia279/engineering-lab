import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const html = (path: string) => readFileSync(resolve('dist', path), 'utf8');

describe('home photographs', () => {
  it('places three responsive photos immediately after the share introduction in both languages', () => {
    for (const prefix of ['', 'en/']) {
      const page = html(`${prefix}index.html`);
      const gallery = page.match(/<div class="home-photos"[\s\S]*?<\/div>/)?.[0] ?? '';
      expect(gallery.match(/<img /g)).toHaveLength(3);
      for (const name of ['hien-at-cafe', 'hien-and-wife', 'hien-family']) expect(gallery).toContain(name);
      expect(gallery).toContain('srcset=');
      expect(gallery).toContain('.webp');
      expect(page.indexOf('class="house-lead"')).toBeLessThan(page.indexOf('class="home-photos"'));
      expect(page.indexOf('class="home-photos"')).toBeLessThan(page.indexOf('class="house-actions"'));
    }
  });
});
