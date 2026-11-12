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
