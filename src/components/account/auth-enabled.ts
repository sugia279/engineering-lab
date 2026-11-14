import { publicBackendConfig } from '../../lib/api/config';
import { createAuth, oauthCode } from '../../lib/auth/session';
import { createApiClient } from '../../lib/api/client';
import { buildUrl } from '../../utils/url';
import { localeUrl } from '../../lib/i18n';

const panel = document.querySelector<HTMLElement>('[data-backend-panel]');
if (panel) {
  const status = panel.querySelector<HTMLElement>('[data-auth-status]')!;
  const login = panel.querySelector<HTMLButtonElement>('[data-sign-in]')!;
  const logout = panel.querySelector<HTMLButtonElement>('[data-sign-out]')!;
  const refresh = panel.querySelector<HTMLButtonElement>('[data-refresh]')!;
  const vi = panel.dataset.locale === 'vi';
  const say = (textVI: string, textEN: string) => { status.textContent = vi ? textVI : textEN; };
  try {
    const config = publicBackendConfig(import.meta.env);
    if (config) {
      const auth = createAuth(config);
      const api = createApiClient(config, async () => (await auth.auth.getSession()).data.session?.access_token ?? null);
      let popup: Window | null = null;
      let popupTimer: ReturnType<typeof setInterval> | null = null;
      let exchange = false;
      const finishPopup = () => { if (popupTimer) clearInterval(popupTimer); popupTimer = null; popup?.close(); popup = null; login.disabled = false; };
      const check = async () => {
        try {
          const me = await api.me(); login.hidden = true; logout.hidden = false; refresh.hidden = false;
          if (panel.dataset.admin === 'true') {
            if (me.role !== 'owner') { say('Tài khoản này không có quyền quản trị.', 'This account has no admin access.'); return; }
            say('Đã xác minh chủ nhà. Chức năng duyệt nội dung chưa được bật.', 'Owner verified. Content moderation is not enabled yet.');
          } else say('Đã đăng nhập. Chức năng quản lý nội dung cá nhân chưa được bật.', 'Signed in. Personal content management is not enabled yet.');
        } catch {
          say('Chưa xác minh được phiên. Đăng nhập lại hoặc thử kiểm tra lại.', 'Session could not be verified. Sign in or try checking again.');
          login.hidden = false; logout.hidden = false; refresh.hidden = false;
        }
      };
      login.hidden = false;
      say('Có thể đăng nhập bằng GitHub.', 'Sign in with GitHub to continue.');
      login.addEventListener('click', async () => {
        // Open synchronously within the gesture; verifier/session remain in opener memory.
        popup = window.open('about:blank', 'hiens-auth', 'popup,width=600,height=720');
        if (!popup) { say('Trình duyệt đã chặn cửa sổ đăng nhập. Cho phép popup rồi thử lại.', 'The browser blocked the sign-in window. Allow popups and retry.'); return; }
        login.disabled = true;
        const started = Date.now();
        popupTimer = setInterval(() => {
          if (!exchange && (popup?.closed || Date.now() - started > 300000)) { finishPopup(); say('Đăng nhập đã dừng. Anh/chị có thể thử lại.', 'Sign-in stopped. You can try again.'); }
        }, 500);
        try {
          const redirectTo = new URL(localeUrl(buildUrl('account/callback/'), vi ? 'vi' : 'en'), location.origin).href;
          const { data, error } = await auth.auth.signInWithOAuth({ provider: 'github', options: { redirectTo, skipBrowserRedirect: true } });
          if (error || !data.url) throw error;
          if (popup && !popup.closed) popup.location.href = data.url;
        } catch { finishPopup(); say('Không mở được đăng nhập. Kiểm tra cấu hình OAuth rồi thử lại.', 'Sign-in could not start. Check OAuth configuration and retry.'); }
      });
      window.addEventListener('message', async event => {
        if (event.origin === location.origin && event.source === popup && event.data?.type === 'hiens-oauth-error') {
          finishPopup(); say('Đăng nhập không hoàn tất. Anh/chị có thể thử lại.', 'Sign-in did not complete. You can try again.'); return;
        }
        const code = oauthCode(event, popup, location.origin); if (!code || exchange) return;
        exchange = true;
        try {
          const { error } = await auth.auth.exchangeCodeForSession(code);
          if (error) throw error;
          finishPopup(); await check();
        } catch { finishPopup(); say('Không xác minh được đăng nhập. Vui lòng thử lại.', 'Sign-in could not be verified. Please retry.'); }
        finally { exchange = false; }
      });
      logout.addEventListener('click', async () => {
        logout.disabled = true;
        try {
          const { error } = await auth.auth.signOut({ scope: 'local' }); if (error) throw error;
          login.hidden = false; logout.hidden = true; refresh.hidden = true;
          say('Đã đăng xuất khỏi phiên này.', 'Signed out of this session.');
        } catch { say('Chưa đăng xuất được. Vui lòng thử lại.', 'Sign-out failed. Please retry.'); }
        finally { logout.disabled = false; }
      });
      refresh.addEventListener('click', check);
      auth.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') { login.hidden = false; logout.hidden = true; refresh.hidden = true; say('Phiên đã kết thúc. Vui lòng đăng nhập lại.', 'Session ended. Please sign in again.'); }
      });
      window.addEventListener('pagehide', () => { finishPopup(); auth.auth.stopAutoRefresh(); });
    }
  } catch { say('Đăng nhập chưa sẵn sàng. Cần kiểm tra cấu hình kết nối.', 'Sign-in is unavailable. Connection configuration needs checking.'); }
}
