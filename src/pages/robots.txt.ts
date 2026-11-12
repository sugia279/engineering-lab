import { siteConfig } from '../config/site';
export function GET(): Response {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${siteConfig.origin}${siteConfig.base}sitemap-index.xml\n`, { headers: { 'Content-Type': 'text/plain' } });
}
