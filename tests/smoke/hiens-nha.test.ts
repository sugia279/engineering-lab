import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { siteConfig } from '../../src/config/site';

const base = siteConfig.base;
const html = (path: string) => readFileSync(resolve('dist', path), 'utf8');
const views = ['', 'about/', 'resume/', 'knowledge/', 'novels/', 'music/', 'guestbook/', 'articles/', 'notes/', 'projects/', 'series/', 'topics/', 'search/', 'graph/'];

describe('Hien’s Nha rooms and language parity', () => {
  for (const path of views) {
    it(`${path || 'home'} has Vietnamese default and a working English counterpart`, () => {
      const vi = html(`${path}index.html`);
      const en = html(`en/${path}index.html`);
      expect(vi).toContain('lang="vi"');
      expect(en).toContain('lang="en"');
      expect(vi).toContain("Hien's Nha");
      expect(en).toContain(`href="${base}en/${path}"`);
      expect(vi).toContain(`href="${base}${path}"`);
      expect(vi).toContain('Góc tri thức');
      expect(en).toContain('Knowledge');
      expect(en).not.toContain('/en/en/');
    });
  }

  it('keeps all 84 imported chapter pages available in both interfaces', () => {
    const directory = 'Nhà có tiên thê bất thường, cô ấy cũng là người xuyên không';
    const files = readdirSync(resolve('src/content/articles', directory)).filter((file) => file.endsWith('.mdx'));
    for (const file of files) {
      const vi = html(`articles/${directory}/${file}/index.html`);
      const en = html(`en/articles/${directory}/${file}/index.html`);
      expect(vi).toContain('lang="vi"');
      expect(en).toContain('lang="en"');
      expect(en).toContain('Content is kept in its original language.');
      expect(en).toContain(`href="${base}en/novels/`);
      expect(en).toContain('Comment / leave a message');
    }
  });

  it('makes guestbook submission honest and keeps all credentials out of the client', () => {
    const page = html('guestbook/index.html');
    expect(page).toContain('điền form này chưa lưu lời nhắn');
    expect(page).toContain('đăng nhập GitHub');
    expect(page).toContain('guestbook-form');
    expect(page).toContain('template=guestbook.md');
    expect(page).not.toContain('GITHUB_TOKEN');
    expect(page).not.toContain('ghp_');
  });
});
