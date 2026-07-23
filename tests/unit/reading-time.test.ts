import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from '../../src/utils/reading-time';

describe('reading-time utility', () => {
  it('returns zero for empty text', () => {
    const result = calculateReadingTime('');
    expect(result.minutes).toBe(0);
    expect(result.words).toBe(0);
    expect(result.label).toBe('0 min read');
  });

  it('returns zero for whitespace-only text', () => {
    const result = calculateReadingTime('   \n  \t  ');
    expect(result.minutes).toBe(0);
    expect(result.words).toBe(0);
  });

  it('returns minimum 1 minute for non-empty text', () => {
    const result = calculateReadingTime('Hello world');
    expect(result.minutes).toBe(1);
    expect(result.words).toBe(2);
  });

  it('calculates correctly for longer text', () => {
    const words = Array.from({ length: 450 }, (_, i) => `word${i}`).join(' ');
    const result = calculateReadingTime(words, 200);
    expect(result.minutes).toBe(3); // ceil(450/200) = 3
    expect(result.words).toBe(450);
    expect(result.label).toBe('3 min read');
  });

  it('uses custom words-per-minute', () => {
    const words = Array.from({ length: 100 }, () => 'word').join(' ');
    const result = calculateReadingTime(words, 50);
    expect(result.minutes).toBe(2); // ceil(100/50) = 2
  });

  it('rounds up to next minute', () => {
    const words = Array.from({ length: 201 }, () => 'word').join(' ');
    const result = calculateReadingTime(words, 200);
    expect(result.minutes).toBe(2); // ceil(201/200) = 2
  });
});
