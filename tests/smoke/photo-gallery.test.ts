import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { siteConfig } from '../../src/config/site';
const photoRecords = readdirSync('src/data/photos').filter(name => name.endsWith('.json')).map(name => JSON.parse(readFileSync(resolve('src/data/photos', name), 'utf8')));
const featuredCount = photoRecords.filter(photo => photo.featuredOrder).length;
const html = (path: string) => readFileSync(resolve('dist', path), 'utf8');
describe('photo gallery and owner uploader', () => {
 for (const prefix of ['', 'en/']) {
  it(`builds ${prefix || 'Vietnamese '}gallery and upload routes with the existing photos`, () => {
   const page = html(`${prefix}photos/index.html`);
   expect(page).toContain(`href="${siteConfig.base}${prefix}photos/upload/"`);
   expect(page.match(/data-photo-full=/g)).toHaveLength(photoRecords.length);
   for (const id of ['family','scenery','moments']) expect(page).toContain(`id="${id}"`);
   for (const name of ['hien-at-cafe','hien-and-wife','hien-family','Bill-va-Boi']) expect(page).toContain(name);
   expect(page).toContain('id="photo-viewer"'); expect(page).toContain('method="dialog"'); expect(page).toContain('aria-pressed="false"');
   expect(html(`${prefix}photos/upload/index.html`)).toContain('id="photo-public-consent"');
   expect(html(`${prefix}photos/upload/index.html`)).toContain('id="photo-content-fields" disabled');
   expect(html(`${prefix}photos/upload/index.html`)).toContain('type="password"');
   expect(html(`${prefix}photos/upload/index.html`)).toContain('noindex, nofollow');
   expect(html(`${prefix}photos/upload/index.html`)).not.toContain('id="guestbook-form"');
  });
  it(`keeps full-resolution image links available without JavaScript on ${prefix || 'Vietnamese '}home`, () => {
   const page = html(`${prefix}index.html`);
   expect(page.match(/data-photo-full=/g)).toHaveLength(featuredCount);
   const sources = [...page.matchAll(/data-photo-full="([^"]+)"/g)].map((match) => match[1]!);
   for (const source of sources) { expect(source).toMatch(/\.(?:jpg|jpeg|png|webp)$/); expect(existsSync(resolve('dist',source.slice(siteConfig.base.length)))).toBe(true); }
  });
 }
 it('preserves independently authored descriptions and excludes the viewer from search', () => {
  expect(html('photos/index.html')).toContain('data-original-content');
  expect(html('photos/index.html')).toMatch(/id="photo-viewer"[^>]*data-pagefind-ignore/);
 });
});
