import { localeUrl } from './i18n';
import { siteConfig } from '../config/site';

export interface GuestMessage {
  contextPath?: string;
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

/** Locale, percent-encoding and trailing slash differences share one discussion.
 * Only site-local paths can link archived messages to a page. */
export function normalizePageContext(value: string): string | undefined {
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return undefined;
  try {
    const url = new URL(value, siteConfig.origin);
    if (url.origin !== siteConfig.origin || !url.pathname.startsWith(siteConfig.base)) return undefined;
    const path = decodeURIComponent(localeUrl(url.pathname, 'vi')).normalize('NFC');
    if (/[?#\\\r\n]/.test(path) || path.includes('//')) return undefined;
    return path.replace(/\/+$/, '') + '/';
  } catch { return undefined; }
}
export function messageContext(message: GuestMessage): string | undefined {
  const page = message.contextPath ?? message.body.match(/(?:^|\r?\n)### Page\r?\n([^\r\n]*)/)?.[1]?.trim();
  return page ? normalizePageContext(page) : undefined;
}
export function messagesForPage(messages: readonly GuestMessage[], page: string): GuestMessage[] {
  const context = normalizePageContext(page);
  return context ? approvedMessages(messages).filter((message) => messageContext(message) === context) : [];
}
