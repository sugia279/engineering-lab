import { siteConfig } from '../../src/config/site';
const BASE = siteConfig.base;
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const title = 'Nhà có tiên thê bất thường, cô ấy cũng là người xuyên không';
const source = resolve('src/content/articles', title);
const chapters = readdirSync(source).filter((file) => file.endsWith('.mdx')).sort();
const folderRoute = 'novels/nha-co-tien-the-bat-thuong-co-ay-cung-la-nguoi-xuyen-khong/';
const folderUrl = `${BASE}${folderRoute}`;
const html = (path: string) => readFileSync(resolve('dist', path), 'utf8');

describe('published imported novel', () => {
  it('shows a nested menu item and a folder card in Articles', () => {
    const listing = html('novels/index.html');
    expect(listing).toMatch(new RegExp(`class="nav-children"[^>]*>[\\s\\S]*?href="${folderUrl}"`));
    expect(listing).toContain(title);
    expect(listing).toContain(`${chapters.length} chương`);
    expect(html('articles/index.html')).toContain('Verification-Gated Knowledge Promotion');
    expect(listing).not.toContain('Chương 1 Người đồng hương');
  });

  it('links every source chapter once, in order, to a real built page', () => {
    const listing = html(`${folderRoute}index.html`);
    const main = listing.split('<main')[1]!.split('</main>')[0]!;
    const links = [...main.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!)
      .filter((href) => href.includes('/articles/') && href.endsWith('.mdx/'));
    expect(links).toHaveLength(chapters.length);
    expect(new Set(links).size).toBe(chapters.length);
    chapters.forEach((file, index) => {
      expect(decodeURI(links[index]!)).toBe(`${BASE}articles/${title}/${file}/`);
      expect(existsSync(resolve('dist/articles', title, file, 'index.html'))).toBe(true);
    });
  });

  it('renders translated content and previous/next links with a return to the folder', () => {
    const first = html(`articles/${title}/${chapters[0]}/index.html`);
    const middle = html(`articles/${title}/${chapters[1]}/index.html`);
    const last = html(`articles/${title}/${chapters[chapters.length - 1]}/index.html`);
    expect(first).toContain('Lâm Hạc');
    expect(first).toContain(`href="${folderUrl}"`);
    expect(first).toContain('rel="next"');
    expect(first).not.toContain('rel="prev"');
    expect(middle).toContain('rel="prev"');
    expect(middle).toContain('rel="next"');
    expect(last).toContain('rel="prev"');
    expect(last).not.toContain('rel="next"');
  });

  it('shows previous, story home, and next controls above and below every novel chapter', () => {
    for (const prefix of ['', 'en/']) {
      const first = html(`${prefix}articles/${title}/${chapters[0]}/index.html`);
      const middle = html(`${prefix}articles/${title}/${chapters[1]}/index.html`);
      const last = html(`${prefix}articles/${title}/${chapters[chapters.length - 1]}/index.html`);
      for (const chapter of [first, middle, last]) {
        expect(chapter.match(/data-chapter-nav="(?:top|bottom)"/g)).toEqual(['data-chapter-nav="top"', 'data-chapter-nav="bottom"']);
        expect(chapter).toContain(`href="${BASE}${prefix}${folderRoute}"`);
      }
      expect(first.match(/rel="next"/g)).toHaveLength(2);
      expect(first).not.toContain('rel="prev"');
      expect(middle.match(/rel="prev"/g)).toHaveLength(2);
      expect(middle.match(/rel="next"/g)).toHaveLength(2);
      expect(last.match(/rel="prev"/g)).toHaveLength(2);
      expect(last).not.toContain('rel="next"');
    }
  });
});
