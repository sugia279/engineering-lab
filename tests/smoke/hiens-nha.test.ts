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
      expect(en).toContain('data-context-title=');
      expect(en).toMatch(/class="knowledge-layout__collection"[^>]*>\s*Chapter/);
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

  it('does not ship unresolved Vite preload markers in search or client modules', () => {
    expect(html('search/index.html')).not.toContain('__VITE_PRELOAD__');
    const scripts = readdirSync(resolve('dist/_astro')).filter((file) => file.endsWith('.js'));
    for (const file of scripts) expect(html(`_astro/${file}`)).not.toContain('__VITE_PRELOAD__');
  });
});

describe('navigation tree and embedded content', () => {
  it('renders nested genre branches closed by default in both languages', () => {
    for (const prefix of ['', 'en/']) {
      const page = html(`${prefix}index.html`);
      expect(page).toMatch(/<details class="nav-branch"[^>]*>/);
      expect(page).not.toMatch(/<details[^>]*\bopen(?:[ =>])/);
      for (const genre of ['xianxia', 'manga', 'fantasy', 'mystery']) {
        expect(page).toContain(`href="${base}${prefix}novels/genres/${genre}/"`);
        expect(html(`${prefix}novels/genres/${genre}/index.html`)).toContain('lang=');
      }
    }
    expect(html('novels/genres/xianxia/index.html')).toContain('84');
    expect(html('novels/genres/manga/index.html')).toContain('Chưa có truyện thuộc mục này.');
  });
  it('embeds the supplied recording in both interfaces', () => {
    for (const prefix of ['', 'en/']) expect(html(`${prefix}music/index.html`)).toContain('https://www.youtube-nocookie.com/embed/l5WuCFObGGQ');
  });
  it('provides an inline comment form tied to the canonical page across languages', () => {
    for (const prefix of ['', 'en/']) {
      const page = html(`${prefix}music/index.html`);
      expect(page).toContain('id="page-comments-heading"');
      expect(page).toContain(`data-context="${base}music/"`);
      expect(page.match(/id="guestbook-form"/g)).toHaveLength(1);
      expect(page).toContain('data-pagefind-ignore');
    }
    expect(html('guestbook/index.html').match(/id="guestbook-form"/g)).toHaveLength(1);
  });
});
