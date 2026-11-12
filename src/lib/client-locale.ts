/** Browser-only helpers; do not import server configuration into the client. */
export const clientCopy = (english: string, vietnamese: string): string => document.documentElement.lang === 'vi' ? vietnamese : english;
export function clientUrl(url: string): string {
  const base = import.meta.env.BASE_URL;
  if (document.documentElement.lang !== 'en' || !url.startsWith(base) || url.startsWith(`${base}en/`)) return url;
  return `${base}en/${url.slice(base.length)}`;
}
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
