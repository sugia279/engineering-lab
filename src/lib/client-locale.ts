/** Browser-only helpers; do not import server configuration into the client. */
export const clientCopy = (english: string, vietnamese: string): string => document.documentElement.lang === 'vi' ? vietnamese : english;
export const collectionLabel = (collection: string): string => {
  const labels: Record<string, string> = { articles: 'Bài viết', notes: 'Ghi chú', projects: 'Dự án', series: 'Chuỗi bài' };
  return document.documentElement.lang === 'vi' ? labels[collection] ?? collection : collection;
};
export function clientUrl(url: string): string {
  const base = import.meta.env.BASE_URL;
  if (document.documentElement.lang !== 'en' || !url.startsWith(base) || url.startsWith(`${base}en/`)) return url;
  return `${base}en/${url.slice(base.length)}`;
}
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
