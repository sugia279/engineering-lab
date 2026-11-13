import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { requestMarker, updateMarker, createRequestArchive, validateRequest, parseRequestUpdate } from '../../src/lib/requests.mjs';
import { publishedRequests } from '../../src/lib/request-data';
import { archiveRequestEvent } from '../../scripts/archive-requests.mjs';
const payload = { title: 'Nhờ kiểm tra website', description: 'Website cần hỗ trợ kiểm tra responsive.', expectedResult: 'Một danh sách lỗi và hướng sửa.', category: 'technology', priority: 'normal', tags: ['web'] };
const issue = { number: 42, title: 'unused title', body: requestMarker + '\n' + JSON.stringify(payload), labels: ['request-approved'], user: { login: 'visitor' }, created_at: '2026-11-13T00:00:00Z', updated_at: '2026-11-13T01:00:00Z' };
const comment = (id: number, status: string, result = '', login = 'sugia279') => ({ id, user: { login }, author_association: 'OWNER', body: updateMarker + '\n' + JSON.stringify({ status, message: 'Đã cập nhật tiến độ', result }), created_at: issue.created_at, updated_at: issue.updated_at });
const archive = (comments = [] as ReturnType<typeof comment>[]) => createRequestArchive(issue, comments, 'sugia279');
describe('Tiệm Nhờ Vả domain contracts', () => {
 it('starts as new: publication is not acceptance', () => { const a = archive(); expect(a.approved).toBe(true); expect(a.status).toBe('new'); expect(publishedRequests([a])).toHaveLength(1); });
 it.each([{title:' '},{description:'short'},{expectedResult:''},{priority:'urgent-admin'},{category:'secret'},{tags:['x'.repeat(41)]}])('rejects invalid payload %o', patch => expect(validateRequest({...payload,...patch})).toBeNull());
 it('ignores forged visitor operational updates even with OWNER association', () => { const a=archive([comment(1,'accepted','','visitor'),comment(2,'completed','fake result','visitor')]); expect(a.status).toBe('new'); expect(a.timeline).toEqual([]); });
 it('replays sorted valid steps, waits, completes with result, and can reopen', () => {
  const steps=[comment(1,'accepted'),comment(2,'in-progress'),comment(3,'waiting'),comment(4,'in-progress'),comment(5,'completed','Đã sửa các lỗi')];
  expect(archive(steps.reverse())).toMatchObject({status:'completed',result:'Đã sửa các lỗi',rejectedUpdates:[]});
  const reopened=archive([...steps,comment(6,'in-progress')]); expect(reopened.result).toBe(''); expect(reopened.timeline).toHaveLength(6);
 });
 it('does not accept invalid jumps or completion without results', () => { const a=archive([comment(1,'completed','skip acceptance'),comment(2,'accepted'),comment(3,'completed')]); expect(a.status).toBe('accepted'); expect(a.rejectedUpdates).toEqual([1,3]); expect(parseRequestUpdate(comment(3,'completed').body)).toBeNull(); });
 it('supports same-state progress and reconsidering decline/cancellation', () => { const a=archive([comment(1,'declined'),comment(2,'accepted'),comment(3,'accepted'),comment(4,'cancelled'),comment(5,'accepted'),comment(6,'completed','Kết quả')]); expect(a.status).toBe('completed'); expect(a.timeline).toHaveLength(6); });
 it('recomputes after comment deletion/edit and preserves text without executing it', () => { const a=archive([comment(2,'in-progress'),comment(3,'completed','<script>not code</script>')]); expect(a.status).toBe('new'); const done=archive([comment(1,'accepted'),comment(2,'completed','<script>not code</script>')]); expect(done.result).toBe('<script>not code</script>'); expect(archive([comment(1,'accepted'),comment(2,'unknown')]).status).toBe('accepted'); });
 it('withdraws missing marker, removed approval and deletion; close alone is not completion', () => {
  for(const a of [createRequestArchive({...issue,labels:[]},[],'sugia279'),createRequestArchive({...issue,body:'marker removed'},[],'sugia279'),createRequestArchive(issue,[comment(1,'accepted')],'sugia279',true)]) expect(publishedRequests([a])).toEqual([]);
  expect(createRequestArchive({...issue,state:'closed'},[],'sugia279').status).toBe('new');
  expect(createRequestArchive(issue,[],'sugia279',true)).toMatchObject({deleted:true,request:null,timeline:[]});
 });
 it('resets acceptance and old results when the request scope changes, requiring fresh owner updates', () => {
  const old=archive([comment(1,'accepted'),comment(2,'completed','Old result')]);
  const changed={...issue,body:requestMarker+JSON.stringify({...payload,description:'Phạm vi mới cần xử lý khác trước.'})};
  const now='2026-11-14T00:00:00Z';
  const reset=createRequestArchive(changed,[comment(1,'accepted'),comment(2,'completed','Old result')],'sugia279',false,{previous:old,synchronizedAt:now});
  expect(reset).toMatchObject({status:'new',result:'',scopeChangedAt:now,timeline:[]});
  const fresh={...comment(3,'accepted'),created_at:'2026-11-15T00:00:00Z'};
  expect(createRequestArchive(changed,[comment(1,'accepted'),fresh],'sugia279',false,{previous:reset,synchronizedAt:'2026-11-16T00:00:00Z'}).status).toBe('accepted');
 });
 it('is deterministic and never publishes a completed archive without result', () => { const steps=[comment(1,'accepted'),comment(2,'completed','Done')]; expect(archive(steps)).toEqual(archive(steps)); expect(publishedRequests([{...archive(steps),result:''}])).toEqual([]); });
});
describe('request archive GitHub boundary', () => {
 it('fetches all comment pages, fails without overwriting on API errors, then tombstones deletion', async () => {
  const directory=await mkdtemp(join(tmpdir(),'request-archive-'));
  const urls:string[]=[];
  const request=(async(input: RequestInfo|URL) => { const url=String(input); urls.push(url); const value=url.includes('/labels/') ? {} : url.includes('&page=1') ? Array.from({length:100},(_,i)=>comment(i+1,'accepted')) : url.includes('&page=2') ? [comment(101,'completed','Finished')] : issue; return new Response(JSON.stringify(value)); }) as typeof fetch;
  try {
   const a=await archiveRequestEvent({issue},{repo:'sugia279/hiens-nha',eventName:'issues',token:'test-only',request,directory});
   expect(a?.status).toBe('completed'); expect(urls.some(url=>url.includes('&page=2'))).toBe(true);
   const before=await readFile(join(directory,'issue-42.json'),'utf8');
   await expect(archiveRequestEvent({issue},{repo:'sugia279/hiens-nha',eventName:'issues',token:'test-only',request:async()=>new Response('',{status:503}),directory})).rejects.toThrow();
   expect(await readFile(join(directory,'issue-42.json'),'utf8')).toBe(before);
   await archiveRequestEvent({issue,action:'deleted'},{repo:'sugia279/hiens-nha',eventName:'issues',token:'test-only',request,directory});
   expect(JSON.parse(await readFile(join(directory,'issue-42.json'),'utf8'))).toMatchObject({deleted:true,approved:false,request:null});
  } finally { await rm(directory,{recursive:true,force:true}); }
 });
 it('ignores unrelated issues without API calls or file writes', async()=>{
  const directory=await mkdtemp(join(tmpdir(),'request-unrelated-')); let called=false;
  try { await archiveRequestEvent({issue:{...issue,body:'ordinary issue'}},{repo:'sugia279/hiens-nha',eventName:'issues',token:'test-only',request:async()=>{called=true;throw new Error('unexpected');},directory}); expect(called).toBe(false);expect(await readdir(directory)).toEqual([]); } finally {await rm(directory,{recursive:true,force:true});}
 });
});
