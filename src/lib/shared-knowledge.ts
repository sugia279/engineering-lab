import { validateKnowledge } from './knowledge-submissions.mjs';
interface Archive { version: number; number: number; approved: boolean; deleted: boolean; knowledge: unknown; }
export function publishedKnowledge(archives: Archive[]) {
  return archives.filter(item => item.version === 1 && item.approved === true && !item.deleted).flatMap(item => {
    const knowledge = validateKnowledge(item.knowledge);
    return knowledge ? [{ ...knowledge, number: item.number }] : [];
  }).sort((a, b) => a.order - b.order || a.number - b.number);
}
export const sharedKnowledge = publishedKnowledge(Object.values(import.meta.glob<Archive>('../../data/knowledge/*.json', { eager: true, import: 'default' })));
