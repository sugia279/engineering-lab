import { z } from 'zod';
import performances from '../data/music-performances.json';

export function youtubeEmbed(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return undefined;
    let id: string | null = null;
    if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
    if (['youtube.com', 'www.youtube.com'].includes(url.hostname)) {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)$/)?.[1] ?? null;
    }
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : undefined;
  } catch { return undefined; }
}

export const performanceSchema = z.object({
  title: z.string().min(1), description: z.string().min(1),
  publishedAt: z.string().refine((date) => Number.isFinite(Date.parse(date)), 'Invalid performance date'),
  youtubeUrl: z.string().refine((url) => Boolean(youtubeEmbed(url)), 'Use an HTTPS YouTube watch, share or Shorts URL'),
  instrument: z.enum(['guitar', 'piano', 'other']),
});
export const musicPerformances = z.array(performanceSchema).parse(performances);
