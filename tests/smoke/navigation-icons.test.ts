import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const html = (path: string) => readFileSync(resolve('dist', path), 'utf8');

describe('navigation icons', () => {

  it('includes decorative icons on all first and second level items', () => {
    for (const prefix of ['', 'en/']) {
      const page = html(`${prefix}index.html`);
      for (const label of ['Home', 'Knowledge', 'Articles', 'Notes', 'Series', 'Topics', 'Graph', 'Novels', 'Xianxia', 'Manga', 'Fantasy', 'Mystery', 'Music', 'Music knowledge', 'Performances', 'Projects', 'Guestbook', 'About', 'Resume']) expect(page).toContain(`data-nav-icon="${label}"`);
      expect(page).toContain('aria-hidden="true"');
    }
  });
});
