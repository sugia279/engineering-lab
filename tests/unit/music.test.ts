import { describe, expect, it } from 'vitest';
import { youtubeEmbed, performanceSchema } from '../../src/lib/music';
describe('music performances', () => {
  it('accepts supported YouTube URLs with a privacy-enhanced embed URL', () => {
    const expected = 'https://www.youtube-nocookie.com/embed/abcdefghijk';
    expect(youtubeEmbed('https://youtu.be/abcdefghijk')).toBe(expected);
    expect(youtubeEmbed('https://www.youtube.com/watch?v=abcdefghijk')).toBe(expected);
  });
  it('rejects unsafe URLs, invalid IDs and malformed performance records', () => {
    expect(youtubeEmbed('javascript:alert(1)')).toBeUndefined();
    expect(youtubeEmbed('https://youtube.com.evil.example/watch?v=abcdefghijk')).toBeUndefined();
    expect(youtubeEmbed('https://youtu.be/not-valid')).toBeUndefined();
    expect(performanceSchema.safeParse({ title: 'Piano', youtubeUrl: 'javascript:alert(1)' }).success).toBe(false);
  });
});
