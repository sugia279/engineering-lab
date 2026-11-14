import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const fixture=JSON.parse(readFileSync('backend-test-results/sessions.json','utf8'));
async function provider(context:BrowserContext, role:'A'|'B'|'owner') {
  // Only provider/code exchange is mocked. Sessions are real local Auth-issued tokens;
  // every comments/role/moderation request goes through real Edge + Auth + PostgREST + PostgreSQL.
  await context.route('**/auth/v1/authorize?**',async route=>{
    const url=new URL(route.request().url());expect(!!url.searchParams.get('code_challenge')).toBe(true);
    const callback=new URL(url.searchParams.get('redirect_to')!);callback.searchParams.set('code','local-test-provider-code');
    await route.fulfill({status:302,headers:{location:callback.href}});
  });
  await context.route('**/auth/v1/token?grant_type=pkce',async route=>{
    if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:{'access-control-allow-origin':'http://127.0.0.1:4321','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'authorization,apikey,content-type,x-client-info,x-supabase-api-version'}});return;}
    expect(!!route.request().postDataJSON().code_verifier).toBe(true);
    await route.fulfill({json:fixture.sessions[role],headers:{'access-control-allow-origin':'http://127.0.0.1:4321'}});
  });
}
async function login(page:Page){await page.getByRole('button',{name:/Đăng nhập bằng GitHub|Sign in with GitHub/}).click();await expect(page.locator('[data-auth-status]')).toContainText(/Đã đăng nhập|Đã xác minh|Signed in|Owner verified/);}
const comments=(page:Page)=>page.locator('[data-api-comments]');
const reload=(page:Page)=>page.locator('[data-comments-refresh]').click();
test('comments pilot: pending, own edits/replies, owner moderation, locale identity, logout',async({browser})=>{
  const aContext=await browser.newContext(),bContext=await browser.newContext(),oContext=await browser.newContext(),publicContext=await browser.newContext();
  await provider(aContext,'A');await provider(bContext,'B');await provider(oContext,'owner');
  const a=await aContext.newPage(),b=await bContext.newPage(),owner=await oContext.newPage(),visitor=await publicContext.newPage();
  await a.goto('/hiens-nha/music/');await login(a);
  const text='Pilot <img src=x onerror=alert(1)> '+Date.now();
  await a.locator('#comment-body').fill(text);await a.locator('[data-comment-save]').click();
  await expect(a.locator('[data-comments-status]')).toContainText('đang chờ');
  await expect(comments(a).locator('.comment-text').filter({hasText:text})).toHaveCount(1);
  await expect(comments(a).locator('.comment-text img')).toHaveCount(0);
  await visitor.goto('/hiens-nha/music/');await expect(visitor.locator('[data-comments-status]')).toContainText(/Đã tải|Chưa có/);await expect(comments(visitor)).not.toContainText(text);
  await b.goto('/hiens-nha/music/');await login(b);await expect(comments(b)).not.toContainText(text);
  await owner.goto('/hiens-nha/admin/');await login(owner);
  const pending=owner.locator('.queue-item').filter({hasText:text});await expect(pending).toBeVisible();
  await pending.getByRole('textbox',{name:'Lý do duyệt/ẩn'}).fill('Reviewed local fixture');await pending.getByRole('button',{name:'Duyệt',exact:true}).click();await expect(pending).toHaveCount(0);
  await reload(visitor);await expect(comments(visitor)).toContainText(text);
  await reload(a);const root=comments(a).locator('.api-comment').filter({has: a.locator('.comment-text').filter({hasText:text})}).first();
  await root.getByRole('button',{name:'Trả lời',exact:true}).click();await a.locator('#comment-body').fill('One-level reply fixture');await a.locator('[data-comment-save]').click();await expect(comments(a)).toContainText('One-level reply fixture');
  await owner.locator('[data-queue-refresh]').click();const reply=owner.locator('.queue-item').filter({hasText:'One-level reply fixture'});await expect(reply).toBeVisible();await reply.getByRole('textbox').fill('Reply reviewed');await reply.getByRole('button',{name:'Duyệt',exact:true}).click();await expect(reply).toHaveCount(0);
  await visitor.goto('/hiens-nha/en/music/');await visitor.getByRole('button',{name:'Show replies',exact:true}).first().click();await expect(comments(visitor)).toContainText('One-level reply fixture');
  await root.getByRole('button',{name:'Sửa',exact:true}).first().click();await a.locator('#comment-body').fill('Edited pending fixture');await a.locator('[data-comment-save]').click();await expect(a.locator('[data-comments-status]')).toContainText('đang chờ');
  await reload(visitor);await expect(comments(visitor)).not.toContainText('Edited pending fixture');await expect(comments(visitor)).not.toContainText('One-level reply fixture');
  await a.locator('[data-comments-mine]').click();await expect(comments(a)).toContainText('Edited pending fixture');
  await a.locator('#comment-body').fill('unsaved private draft');await a.getByRole('button',{name:'Đăng xuất',exact:true}).click();
  await expect(a.locator('[data-sign-in]')).toBeVisible();await expect(comments(a)).not.toContainText('Edited pending fixture');await expect(a.locator('#comment-body')).toHaveValue('');
  expect(await a.evaluate(()=>[...Object.values(localStorage),...Object.values(sessionStorage)].some(v=>v.includes('access_token')||v.includes('refresh_token')))).toBe(false);
  await Promise.all([aContext.close(),bContext.close(),oContext.close(),publicContext.close()]);
});
