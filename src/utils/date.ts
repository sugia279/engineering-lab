/**
 * Date comparison and formatting.
 * Never calls current time implicitly; invalid values throw boundary errors.
 */

/** Format a date for display (e.g., "July 23, 2026"). */
export function formatDate(date: Date, locale: string = 'en-US'): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Format a date as ISO string for machine consumption (YYYY-MM-DD). */
export function isoDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

/** Format a date as ISO datetime for structured data / feeds. */
export function isoDateTime(date: Date): string {
  return date.toISOString();
}

/** Compare two dates for sorting (newest first). Returns negative if a is newer. */
export function compareNewestFirst(a: Date, b: Date): number {
  return b.getTime() - a.getTime();
}

/** Compare two dates for sorting (oldest first). Returns negative if a is older. */
export function compareOldestFirst(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}

/** Return the more recent of two optional dates. */
export function mostRecent(
  a: Date | undefined,
  b: Date | undefined,
): Date | undefined {
  if (!a) return b;
  if (!b) return a;
  return a.getTime() >= b.getTime() ? a : b;
}

/** Validate that updatedAt is not before publishedAt. */
export function validateDateOrder(
  publishedAt: Date,
  updatedAt: Date | undefined,
): boolean {
  if (!updatedAt) return true;
  return updatedAt.getTime() >= publishedAt.getTime();
}

/** Format a project period (YYYY-MM) for display. */
export function formatPeriod(
  start: string,
  end: string | undefined,
): string {
  const startLabel = formatMonthYear(start);
  if (!end) return `${startLabel} – Present`;
  return `${startLabel} – ${formatMonthYear(end)}`;
}

/** Parse YYYY-MM to a display month/year string. */
function formatMonthYear(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}
