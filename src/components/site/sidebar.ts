export const PHONE_QUERY = '(max-width: 767px)';

/** Close only a normal in-page/same-tab navigation; expanding branches is separate. */
export function shouldClosePhoneNavigation(phone: boolean, event: Pick<MouseEvent, 'button' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey' | 'defaultPrevented'>, link: Pick<HTMLAnchorElement, 'href' | 'target' | 'download'>, origin: string): boolean {
  if (!phone || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.download || (link.target && link.target !== '_self')) return false;
  try { const url = new URL(link.href); return url.origin === origin && ['http:', 'https:'].includes(url.protocol); } catch { return false; }
}

export function initSidebar(): void {
  const shell = document.querySelector<HTMLElement>('.app-shell');
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (!shell || !toggle || !sidebar) return;
  const phone = window.matchMedia(PHONE_QUERY);
  const key = () => phone.matches ? 'sidebar-collapsed-phone' : 'sidebar-collapsed';
  const readPreference = () => { try { return localStorage.getItem(key()); } catch { return null; } };
  function setCollapsed(collapsed: boolean, remember = true): void {
    shell!.classList.toggle('is-collapsed', collapsed);
    toggle!.setAttribute('aria-expanded', String(!collapsed));
    if (remember) { try { localStorage.setItem(key(), String(collapsed)); } catch { /* Navigation still works when storage is unavailable. */ } }
  }
  function restorePreference(): void { const saved = readPreference(); setCollapsed(saved === null ? phone.matches : saved === 'true', false); }
  restorePreference();
  phone.addEventListener('change', restorePreference);
  toggle.addEventListener('click', () => setCollapsed(!shell.classList.contains('is-collapsed')));
  sidebar.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (link && !link.hasAttribute('download') && shouldClosePhoneNavigation(phone.matches, event, link, window.location.origin)) setCollapsed(true);
  });
}
