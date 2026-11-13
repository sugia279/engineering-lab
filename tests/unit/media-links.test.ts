import { describe, expect, it } from 'vitest';
import { mediaMarker, mediaEmbed, normalizeMediaUrl, parseMediaBody } from '../../src/lib/media-links.mjs';
import { createMediaArchive } from '../../scripts/archive-media.mjs';
import { publishedMedia } from '../../src/lib/media';
const payload = { title: 'A favorite song', description: '<script>plain text</script>', category: 'music', url: 'https://youtu.be/l5WuCFObGGQ?si=tracking' };
const issue = { number: 12, body: `${mediaMarker}\n${JSON.stringify(payload)}`, labels: [{ name: 'media-approved' }] };

describe('community media links', () => {
  it.each(['https://youtu.be/l5WuCFObGGQ?si=tracking', 'https://www.youtube.com/watch?v=l5WuCFObGGQ&t=3', 'https://www.youtube.com/shorts/l5WuCFObGGQ', 'https://music.youtube.com/watch?v=l5WuCFObGGQ'])('normalizes YouTube %s', (url) => {
    expect(normalizeMediaUrl(url)).toEqual({ platform: 'YouTube', url: 'https://www.youtube.com/watch?v=l5WuCFObGGQ' });
  });
  it.each(['https://www.facebook.com/watch/?v=12345&tracking=x', 'https://m.facebook.com/page/videos/12345/', 'https://facebook.com/reel/12345/', 'https://www.facebook.com/share/v/abc123/', 'https://fb.watch/abc123/?tracking=x'])('accepts Facebook video %s without tracking', (url) => {
    expect(normalizeMediaUrl(url)?.platform).toBe('Facebook');
    expect(normalizeMediaUrl(url)?.url).not.toContain('tracking');
  });
  it.each(['http://youtube.com/watch?v=l5WuCFObGGQ', 'https://youtube.com.evil.test/watch?v=l5WuCFObGGQ', 'https://www.youtube.com@evil.test/watch?v=l5WuCFObGGQ', 'javascript:alert(1)', 'https://www.facebook.com/profile.php?id=123', 'https://facebook.com/', 'https://fb.watch/', 'https://youtube.com/watch?v=no', 'https://youtube.com:444/watch?v=l5WuCFObGGQ'])('rejects invalid or unrelated link %s', (url) => expect(normalizeMediaUrl(url)).toBeNull());
  it('parses structured descriptions as data without allowing heading injection', () => {
    expect(parseMediaBody(issue.body)?.description).toBe(payload.description);
    expect(parseMediaBody('prefix' + issue.body)).toBeNull();
    expect(parseMediaBody(mediaMarker + '\ninvalid json')).toBeNull();
    expect(parseMediaBody(mediaMarker + JSON.stringify({ ...payload, category: 'other' }))).toBeNull();
  });
  it('publishes only valid approved links and retracts unapproved, invalid, or deleted records', () => {
    const approved = createMediaArchive(issue);
    expect(publishedMedia([approved])).toMatchObject([{ number: 12, title: payload.title, category: 'music' }]);
    for (const archive of [createMediaArchive({ ...issue, labels: [] }), createMediaArchive({ ...issue, body: 'marker removed' }), createMediaArchive({ ...issue, body: mediaMarker + JSON.stringify({ ...payload, url: 'https://evil.test' }) }), createMediaArchive(issue, true)]) {
      expect(archive.approved).toBe(false);
      expect(publishedMedia([archive])).toEqual([]);
    }
  });
});

it('matches the supplied Facebook player options without changing the shared video URL', () => {
 const url = new URL(mediaEmbed('https://www.facebook.com/share/v/1J6iFA7d3k/')!);
 expect(url.origin + url.pathname).toBe('https://www.facebook.com/plugins/video.php');
 expect(url.searchParams.get('href')).toBe('https://www.facebook.com/share/v/1J6iFA7d3k/');
 expect(url.searchParams.get('show_text')).toBe('true');
 expect(url.searchParams.get('width')).toBe('560');
});
