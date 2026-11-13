import { describe, expect, it } from 'vitest';
import { shouldClosePhoneNavigation } from '../../src/components/site/sidebar';

const event = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, defaultPrevented: false };
const link = { href: 'https://sugia279.github.io/hiens-nha/music/', target: '', download: '' };
const origin = 'https://sugia279.github.io';

describe('phone navigation dismissal', () => {
  it('closes after ordinary same-tab navigation on a phone', () => {
    expect(shouldClosePhoneNavigation(true, event, link, origin)).toBe(true);
    expect(shouldClosePhoneNavigation(true, event, { ...link, href: link.href + '#music-performances' }, origin)).toBe(true);
  });
  it('keeps laptop and tablet navigation open', () => {
    expect(shouldClosePhoneNavigation(false, event, link, origin)).toBe(false);
  });
  it.each(['ctrlKey', 'metaKey', 'shiftKey', 'altKey', 'defaultPrevented'] as const)('keeps the menu open when %s changes the navigation action', (key) => {
    expect(shouldClosePhoneNavigation(true, { ...event, [key]: true }, link, origin)).toBe(false);
  });
  it('ignores new tabs, downloads, non-primary clicks and external destinations', () => {
    expect(shouldClosePhoneNavigation(true, event, { ...link, target: '_blank' }, origin)).toBe(false);
    expect(shouldClosePhoneNavigation(true, event, { ...link, download: 'file' }, origin)).toBe(false);
    expect(shouldClosePhoneNavigation(true, { ...event, button: 1 }, link, origin)).toBe(false);
    expect(shouldClosePhoneNavigation(true, event, { ...link, href: 'https://github.com/sugia279' }, origin)).toBe(false);
    expect(shouldClosePhoneNavigation(true, event, { ...link, href: 'javascript:alert(1)' }, origin)).toBe(false);
  });
});

import { initNavigationBranches } from '../../src/components/site/sidebar';
class Branch extends EventTarget {
  open = false;
  constructor(public dataset: { navBranch: string }) { super(); }
  toggle(open: boolean) { this.open = open; this.dispatchEvent(new Event('toggle')); }
}
const rootFor = (branches: Branch[]) => ({ querySelectorAll: () => branches }) as unknown as Pick<ParentNode, 'querySelectorAll'>;
describe('navigation branch persistence across documents', () => {
  it('defaults to collapsed, mirrors phone/desktop, restores nested paths after navigation, and remembers closing', () => {
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
    const first = [new Branch({ navBranch: '/novels/' }), new Branch({ navBranch: '/novels/' }), new Branch({ navBranch: '/novels/genres/xianxia/' })];
    initNavigationBranches(rootFor(first), storage, '/hiens-nha/');
    expect(first.every((branch) => !branch.open)).toBe(true);
    first[0]!.toggle(true); first[2]!.toggle(true);
    expect(first[1]!.open).toBe(true);
    const nextPage = first.map((branch) => new Branch(branch.dataset));
    initNavigationBranches(rootFor(nextPage), storage, '/hiens-nha/');
    expect(nextPage.every((branch) => branch.open)).toBe(true);
    nextPage[1]!.toggle(false);
    expect(nextPage[0]!.open).toBe(false);
    const thirdPage = nextPage.map((branch) => new Branch(branch.dataset));
    initNavigationBranches(rootFor(thirdPage), storage, '/hiens-nha/');
    expect(thirdPage.map((branch) => branch.open)).toEqual([false, false, true]);
  });
  it('handles malformed or unavailable storage and isolates site bases', () => {
    const branches = [new Branch({ navBranch: '/music/' })];
    initNavigationBranches(rootFor(branches), { getItem: () => '{}', setItem: () => {} }, '/');
    expect(branches[0]!.open).toBe(false);
    initNavigationBranches(rootFor(branches), { getItem: () => { throw new Error('disabled'); }, setItem: () => { throw new Error('disabled'); } }, '/');
    expect(() => branches[0]!.toggle(true)).not.toThrow();
  });
});
