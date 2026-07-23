/**
 * Reading-time estimation from renderable text.
 * Pure calculation — empty text returns zero.
 */

const DEFAULT_WORDS_PER_MINUTE = 200;

export interface ReadingTimeResult {
  /** Estimated minutes (rounded up, minimum 1 for non-empty). */
  readonly minutes: number;
  /** Accessible label for display. */
  readonly label: string;
  /** Raw word count. */
  readonly words: number;
}

/** Estimate reading time from plain content text. */
export function calculateReadingTime(
  text: string,
  wordsPerMinute: number = DEFAULT_WORDS_PER_MINUTE,
): ReadingTimeResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return { minutes: 0, label: '0 min read', words: 0 };
  }

  const words = trimmed.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  const label = `${minutes} min read`;

  return { minutes, label, words };
}
