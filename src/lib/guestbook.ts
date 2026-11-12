export interface GuestMessage {
  version: number; number: number; title: string; body: string; message: string;
  htmlUrl: string; createdAt: string; updatedAt: string; approved: boolean; deleted?: boolean;
  author: { login: string; htmlUrl: string };
  comments: Array<{ id: number; body: string; htmlUrl: string; createdAt: string; trusted: boolean; author: { login: string; htmlUrl: string } }>;
}

/** JSON is data, never compiled as MDX or inserted as HTML. */
export function approvedMessages(messages: readonly GuestMessage[]): GuestMessage[] {
  return messages.filter((message) => message.version === 1 && message.approved && !message.deleted)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const archives = import.meta.glob('../../data/guestbook/*.json', { eager: true, import: 'default' });
export const guestMessages = approvedMessages(Object.values(archives) as GuestMessage[]);
