import { expect, it } from 'vitest';
import { knowledgeMarker, parseKnowledgeBody, validateKnowledge } from '../../src/lib/knowledge-submissions.mjs';
import { createKnowledgeArchive } from '../../scripts/archive-knowledge.mjs';
import { publishedKnowledge } from '../../src/lib/shared-knowledge';
import { mediaEmbed, validateMedia } from '../../src/lib/media-links.mjs';
import { parseTags, submissionUrl } from '../../src/lib/submission-fields.mjs';
const content = { title: 'Thơ đêm trăng', body: 'Dòng một\nDòng hai\n<script>alert(1)</script>', kind: 'poem', category: 'Thơ', tags: ['thơ', 'đêm'], series: 'Thơ ngẫu hứng', order: 2 };
const issue = { number: 3, labels: [{ name: 'knowledge-approved' }], body: knowledgeMarker + '\n' + JSON.stringify(content) };
it('preserves lines and structured fields while validating taxonomy', () => {
 expect(parseKnowledgeBody(issue.body)).toEqual(content);
 expect(validateKnowledge({ ...content, kind: 'code' })).toBeNull();
 expect(validateKnowledge({ ...content, tags: ['a'.repeat(41)] })).toBeNull();
 expect(validateKnowledge({ ...content, order: -1 })).toBeNull();
 expect(validateKnowledge({ ...content, title: '   ' })).toBeNull();
 expect(parseKnowledgeBody(knowledgeMarker + 'invalid')).toBeNull();
});
it('publishes only approved records, retracts removed markers/deletion, sorts a series', () => {
 const archive = createKnowledgeArchive(issue);
 const first = createKnowledgeArchive({ ...issue, number: 4, body: knowledgeMarker + JSON.stringify({ ...content, order: 1 }) });
 expect(publishedKnowledge([archive, first]).map(item => item.order)).toEqual([1,2]);
 for (const record of [createKnowledgeArchive({ ...issue, labels: [] }), createKnowledgeArchive(issue, true), createKnowledgeArchive({ ...issue, body: 'removed' })]) expect(publishedKnowledge([record])).toEqual([]);
});
it('limits and encodes structured submission URLs without losing Unicode or line breaks', () => {
 const url = submissionUrl('[Knowledge] Thơ', knowledgeMarker, content, 'sugia279/hiens-nha')!;
 expect(parseKnowledgeBody(new URL(url).searchParams.get('body'))).toEqual(content);
 expect(submissionUrl('Title', knowledgeMarker, { body: 'x'.repeat(8000) }, 'sugia279/hiens-nha')).toBeNull();
 expect(parseTags('guitar, chill, guitar')).toEqual(['guitar','chill']);
});
it('builds only trusted player URLs and maintains old media archives without tags', () => {
 expect(mediaEmbed('https://youtu.be/l5WuCFObGGQ')).toBe('https://www.youtube-nocookie.com/embed/l5WuCFObGGQ');
 const fb = new URL(mediaEmbed('https://www.facebook.com/watch/?v=12345')!);
 expect(fb.origin + fb.pathname).toBe('https://www.facebook.com/plugins/video.php');
 expect(fb.searchParams.get('href')).toBe('https://www.facebook.com/watch/?v=12345');
 expect(mediaEmbed('https://evil.test')).toBeNull();
 expect(validateMedia({ title: 'Old song', description: '', category: 'music', url: 'https://youtu.be/l5WuCFObGGQ' })?.tags).toEqual([]);
});
