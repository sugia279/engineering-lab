/**
 * Internal link checker — validates internal links in the built artifact.
 * Run via: npm run check:links
 * Must be run AFTER npm run build.
 * Exits with code 1 if any internal links are broken.
 */

import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(import.meta.dirname, '..', 'dist');
import { base as BASE } from '../site-settings.mjs';
const escapedBase = BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const errors: string[] = [];
let checkedCount = 0;

if (!fs.existsSync(DIST)) {
  console.error('dist/ does not exist — run npm run build first');
  process.exit(1);
}

/** Find all HTML files in dist/ recursively */
function findHtmlFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { recursive: true }) as string[]) {
    if (entry.endsWith('.html')) {
      files.push(path.join(dir, entry));
    }
  }
  return files;
}

/** Extract internal link hrefs from HTML content */
function extractInternalHrefs(html: string): string[] {
  const hrefs: string[] = [];
  const matches = html.matchAll(new RegExp('href="(' + escapedBase + '[^"#?]*)"', 'g'));
  for (const m of matches) {
    if (m[1]) hrefs.push(m[1]);
  }
  return hrefs;
}

/** Extract internal asset src attributes */
function extractInternalSrcs(html: string): string[] {
  const srcs: string[] = [];
  const matches = html.matchAll(new RegExp('src="(' + escapedBase + '[^"]+)"', 'g'));
  for (const m of matches) {
    if (m[1]) srcs.push(m[1]);
  }
  return srcs;
}

/** Resolve an internal URL to a dist/ file path */
function urlToFilePath(internalUrl: string): string {
  const rel = decodeURIComponent(internalUrl.replace(BASE, '')).replace(/&amp;/g, '&');
  // Check index.html for directory URLs
  if (rel.endsWith('/') || !rel.includes('.')) {
    return path.join(DIST, rel, 'index.html');
  }
  return path.join(DIST, rel);
}

const htmlFiles = findHtmlFiles(DIST);
console.log(`Checking links in ${htmlFiles.length} HTML files…\n`);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf-8');
  const relFile = path.relative(DIST, file);
  const hrefs = extractInternalHrefs(html);
  const srcs = extractInternalSrcs(html);

  for (const href of hrefs) {
    checkedCount++;
    const target = urlToFilePath(href);
    if (!fs.existsSync(target)) {
      errors.push(`[broken-href] ${relFile} → ${href}`);
    }
  }

  for (const src of srcs) {
    checkedCount++;
    const target = urlToFilePath(src);
    if (!fs.existsSync(target)) {
      errors.push(`[broken-src] ${relFile} → ${src}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Link check FAILED: ${errors.length} broken link(s) found (${checkedCount} checked).\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(`Link check passed: 0 broken links (${checkedCount} checked).`);
