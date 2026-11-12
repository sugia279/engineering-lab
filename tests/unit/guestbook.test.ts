import { describe, expect, it } from 'vitest';
import { createArchive, marker } from '../../scripts/archive-guestbook.mjs';
import { approvedMessages, type GuestMessage } from '../../src/lib/guestbook';

const issue = {
  number: 123, title: "[Hien's Nha] Hello", html_url: 'https://github.com/example/repo/issues/123',
  body: `${marker}\n### Type\nmessage\n### Message\nChào Hiển! <script>alert(1)</script>\n### Page\n(general)`,
  created_at: '2026-11-12T00:00:00Z', updated_at: '2026-11-12T01:00:00Z',
  labels: [] as Array<{ name: string }>, user: { login: 'visitor', html_url: 'https://github.com/visitor' },
};
const comment = { id: 1, body: 'A reply', html_url: 'https://github.com/example/repo/issues/123#issuecomment-1', created_at: issue.created_at, updated_at: issue.updated_at, user: issue.user, author_association: 'NONE' };

describe('file-backed guestbook moderation', () => {
  it('archives full text as data without publishing an unapproved message', () => {
    const result = createArchive(issue, [comment]) as GuestMessage;
    expect(result.body).toBe(issue.body);
    expect(result.message).toBe('Chào Hiển! <script>alert(1)</script>');
    expect(JSON.parse(JSON.stringify(result)).body).toBe(issue.body);
    expect(approvedMessages([result])).toEqual([]);
  });
  it('publishes only approved messages and marks maintainer replies separately', () => {
    const result = createArchive({ ...issue, labels: [{ name: 'guestbook-approved' }] }, [comment, { ...comment, id: 2, author_association: 'OWNER' }]) as GuestMessage;
    expect(approvedMessages([result])).toHaveLength(1);
    expect(result.comments.map((entry) => entry.trusted)).toEqual([false, true]);
  });
  it('withdraws deleted messages and messages whose guestbook marker is removed', () => {
    const approved = { ...issue, labels: [{ name: 'guestbook-approved' }] };
    const deleted = createArchive(approved, [comment], true) as GuestMessage;
    expect(deleted.body).toBe('');
    expect(deleted.comments).toEqual([]);
    expect(approvedMessages([deleted])).toEqual([]);
    expect(createArchive({ ...approved, body: 'withdrawn' }, []).approved).toBe(false);
  });
});
