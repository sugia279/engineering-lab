import { parse, serialize, type DefaultTreeAdapterMap } from 'parse5';
import { localeUrl, ui, type Locale } from './i18n';
import { siteConfig } from '../config/site';

type Node = DefaultTreeAdapterMap['node'];

/** Prerender both languages into real HTML, including localized internal links.
 * A DOM transform avoids changing scripts, source MDX, guest messages or raw HTML.
 */
export function localizeHtml(html: string, locale: Locale): string {
  const document = parse(html);
  const base = siteConfig.base;
  function pageUrl(value: string): string {
    const absolute = value.startsWith(siteConfig.origin + base);
    const path = absolute ? value.slice(siteConfig.origin.length) : value;
    if (!path.startsWith(base)) return value;
    const pathname = path.split(/[?#]/)[0]!;
    // Public assets, feeds, graph data and the embedded CV are shared.
    if (!pathname.endsWith('/')) return value;
    return (absolute ? siteConfig.origin : '') + localeUrl(path, locale);
  }
  function walk(node: Node, original = false): void {
    if ('tagName' in node) {
      if (node.tagName === 'script' || node.tagName === 'style') return;
      original ||= node.attrs.some((a) => a.name === 'data-original-content');
      for (const attr of node.attrs) {
        if (node.tagName === 'html' && attr.name === 'lang') attr.value = locale;
        const localeLink = node.attrs.some((a) => a.name === 'data-locale-link');
        if ((attr.name === 'href' && !localeLink) || attr.name === 'action') attr.value = pageUrl(attr.value);
        if (!original && ['title', 'aria-label', 'placeholder', 'alt', 'content'].includes(attr.name)) {
          attr.value = ui(attr.value, locale);
          if (attr.name === 'content') attr.value = pageUrl(attr.value);
        }
      }
    }
    if ('nodeName' in node && node.nodeName === '#text' && 'value' in node && !original) {
      node.value = ui(node.value, locale);
    }
    if ('childNodes' in node) node.childNodes.forEach((child) => walk(child, original));
  }
  walk(document);
  return serialize(document);
}
