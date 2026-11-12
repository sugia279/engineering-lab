import { defineMiddleware } from 'astro:middleware';
import { localizeHtml } from './lib/localize-html';
import { localeFromPath } from './lib/i18n';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  const html = localizeHtml(await response.text(), localeFromPath(context.url.pathname));
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
});
