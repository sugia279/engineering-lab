import { validateMedia } from './media-links.mjs';
interface Archive { version: number; number: number; approved: boolean; deleted: boolean; media: unknown; }
export function publishedMedia(archives: Archive[]) {
  return archives.filter((entry) => entry.version === 1 && entry.approved === true && !entry.deleted)
    .sort((a, b) => b.number - a.number)
    .flatMap((entry) => { const media = validateMedia(entry.media); return media ? [{ ...media, number: entry.number }] : []; });
}
const archives = Object.values(import.meta.glob<Archive>('../../data/media/*.json', { eager: true, import: 'default' }));
export const favoriteMedia = publishedMedia(archives);
