import { describe, it, expect } from 'vitest';
import {
  formatDate,
  isoDate,
  isoDateTime,
  compareNewestFirst,
  compareOldestFirst,
  mostRecent,
  validateDateOrder,
  formatPeriod,
} from '../../src/utils/date';

describe('date utility', () => {
  const jan1 = new Date('2026-01-01T00:00:00Z');
  const jul23 = new Date('2026-07-23T00:00:00Z');

  describe('formatDate', () => {
    it('formats in en-US long date', () => {
      const result = formatDate(jan1, 'en-US');
      expect(result).toContain('January');
      expect(result).toContain('2026');
    });
  });

  describe('isoDate', () => {
    it('returns YYYY-MM-DD', () => {
      expect(isoDate(jan1)).toBe('2026-01-01');
    });
  });

  describe('isoDateTime', () => {
    it('returns full ISO string', () => {
      expect(isoDateTime(jan1)).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  describe('compareNewestFirst', () => {
    it('returns negative when a is newer', () => {
      expect(compareNewestFirst(jul23, jan1)).toBeLessThan(0);
    });

    it('returns positive when a is older', () => {
      expect(compareNewestFirst(jan1, jul23)).toBeGreaterThan(0);
    });

    it('returns zero for equal dates', () => {
      expect(compareNewestFirst(jan1, jan1)).toBe(0);
    });
  });

  describe('compareOldestFirst', () => {
    it('returns negative when a is older', () => {
      expect(compareOldestFirst(jan1, jul23)).toBeLessThan(0);
    });
  });

  describe('mostRecent', () => {
    it('returns the newer date', () => {
      expect(mostRecent(jan1, jul23)).toBe(jul23);
    });

    it('returns defined date when other is undefined', () => {
      expect(mostRecent(undefined, jul23)).toBe(jul23);
      expect(mostRecent(jan1, undefined)).toBe(jan1);
    });

    it('returns undefined when both are undefined', () => {
      expect(mostRecent(undefined, undefined)).toBeUndefined();
    });
  });

  describe('validateDateOrder', () => {
    it('returns true when updatedAt >= publishedAt', () => {
      expect(validateDateOrder(jan1, jul23)).toBe(true);
    });

    it('returns true when updatedAt is undefined', () => {
      expect(validateDateOrder(jan1, undefined)).toBe(true);
    });

    it('returns false when updatedAt < publishedAt', () => {
      expect(validateDateOrder(jul23, jan1)).toBe(false);
    });
  });

  describe('formatPeriod', () => {
    it('formats start and end', () => {
      const result = formatPeriod('2022-05', '2024-12');
      expect(result).toContain('2022');
      expect(result).toContain('2024');
      expect(result).toContain('–');
    });

    it('shows Present for ongoing', () => {
      const result = formatPeriod('2022-05', undefined);
      expect(result).toContain('Present');
    });
  });
});
