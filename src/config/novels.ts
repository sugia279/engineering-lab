/** Stable genre routes; assign each imported novel by its existing folder slug. */
export const novelGenres = [
  { id: 'xianxia', label: 'Xianxia', description: 'Cultivation and immortal adventures.' },
  { id: 'manga', label: 'Manga', description: 'Comics and graphic stories.' },
  { id: 'fantasy', label: 'Fantasy', description: 'Stories of imaginary worlds and magic.' },
  { id: 'mystery', label: 'Mystery', description: 'Mysteries and detective stories.' },
] as const;
export type NovelGenreId = typeof novelGenres[number]['id'];
export const novelGenreByFolder: Record<string, NovelGenreId> = {
  'nha-co-tien-the-bat-thuong-co-ay-cung-la-nguoi-xuyen-khong': 'xianxia',
};
export function genreForNovel(folderId: string): NovelGenreId | undefined { return novelGenreByFolder[folderId]; }
