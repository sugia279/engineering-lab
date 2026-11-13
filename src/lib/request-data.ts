import { validateRequest, requestStatuses } from './requests.mjs';
interface RequestArchive {
 version: number; number: number; approved: boolean; deleted: boolean; request: unknown;
 scopeChangedAt?: string; status: string; result: string; author: string; createdAt: string; updatedAt: string;
 timeline: Array<{ id: number; scopeChangedAt?: string; status: string; message: string; result: string; createdAt: string; updatedAt: string }>;
}
export function publishedRequests(archives: RequestArchive[]) {
 return archives.filter(item => item.version === 1 && item.approved === true && !item.deleted && Number.isSafeInteger(item.number) && item.number > 0 && requestStatuses.includes(item.status) && (item.status !== 'completed' || (typeof item.result === 'string' && item.result.trim()))).flatMap(item => {
  const request = validateRequest(item.request);
  return request ? [{ ...item, request }] : [];
 }).sort((a,b) => b.number - a.number);
}
export const requests = publishedRequests(Object.values(import.meta.glob<RequestArchive>('../../data/requests/*.json', { eager: true, import: 'default' })));
export type PublishedRequest = (typeof requests)[number];
