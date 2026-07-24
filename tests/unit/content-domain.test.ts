/**
 * Unit tests for M4 content domain modules (sort, references, series, graph).
 * Uses plain TypeScript objects — no Astro collection runtime.
 */

import { describe, it, expect } from 'vitest';
import { sortEntries, sortSummaries } from '../../src/lib/content/sort';
import {
  buildEntryMaps,
  validateConnections,
  buildAllEntriesMap,
} from '../../src/lib/content/references';
import { resolveSeries, deriveSeriesContext } from '../../src/lib/content/series';
import {
  validateGraphConnections,
  detectPrerequisiteCycles,
  buildGraphManifest,
  resolveEntryConnections,
  graphNodeId,
} from '../../src/lib/content/graph';

// ---------------------------------------------------------------------------
// Test fixture helpers — minimal AnyEntry shape
// ---------------------------------------------------------------------------

function makeArticle(
  id: string,
  opts: {
    publishedAt?: string;
    draft?: boolean;
    featured?: boolean;
    connections?: Array<{ type: string; target: { collection: string; id: string }; context?: string }>;
    domains?: string[];
    series?: string;
    seriesOrder?: number;
  } = {},
) {
  return {
    collection: 'articles' as const,
    id,
    body: `# ${id}\n\nBody text.`,
    data: {
      title: `Article: ${id}`,
      description: `Desc for ${id}`,
      publishedAt: new Date(opts.publishedAt ?? '2026-01-01'),
      draft: opts.draft ?? false,
      featured: opts.featured ?? false,
      showTableOfContents: true,
      tags: ['test'],
      domains: (opts.domains ?? ['engineering']) as ['engineering'],
      connections: (opts.connections ?? []) as [],
      series: opts.series,
      seriesOrder: opts.seriesOrder,
    },
    slug: id,
    render: async () => ({ Content: () => null, headings: [], remarkPluginFrontmatter: {} }),
  } as unknown as import('../../src/lib/content/queries').ArticleEntry;
}

function makeNote(
  id: string,
  opts: {
    publishedAt?: string;
    draft?: boolean;
    maturity?: 'seed' | 'growing' | 'evergreen';
    connections?: Array<{ type: string; target: { collection: string; id: string } }>;
    domains?: string[];
  } = {},
) {
  return {
    collection: 'notes' as const,
    id,
    body: `Note body for ${id}.`,
    data: {
      title: `Note: ${id}`,
      description: `Note desc for ${id}`,
      publishedAt: new Date(opts.publishedAt ?? '2026-01-01'),
      draft: opts.draft ?? false,
      maturity: opts.maturity ?? 'growing',
      tags: ['test'],
      domains: (opts.domains ?? ['engineering']) as ['engineering'],
      connections: (opts.connections ?? []) as [],
    },
    slug: id,
    render: async () => ({ Content: () => null, headings: [], remarkPluginFrontmatter: {} }),
  } as unknown as import('../../src/lib/content/queries').NoteEntry;
}

function makeSeries(
  id: string,
  entries: Array<{ collection: 'articles' | 'notes'; id: string }>,
  opts: { draft?: boolean } = {},
) {
  return {
    collection: 'series' as const,
    id,
    body: `Series body.`,
    data: {
      title: `Series: ${id}`,
      description: `Series desc`,
      publishedAt: new Date('2026-01-01'),
      draft: opts.draft ?? false,
      tags: ['test'],
      domains: ['engineering'] as ['engineering'],
      connections: [] as [],
      entries,
    },
    slug: id,
    render: async () => ({ Content: () => null, headings: [], remarkPluginFrontmatter: {} }),
  } as unknown as import('../../src/lib/content/queries').SeriesEntry;
}

// ---------------------------------------------------------------------------
// sort.ts tests
// ---------------------------------------------------------------------------

describe('sort', () => {
  it('sortEntries: newest first', () => {
    const a = makeArticle('a', { publishedAt: '2026-01-01' });
    const b = makeArticle('b', { publishedAt: '2026-06-01' });
    const sorted = sortEntries([a, b], 'newest');
    expect(sorted[0]!.id).toBe('b');
  });

  it('sortEntries: oldest first', () => {
    const a = makeArticle('a', { publishedAt: '2026-01-01' });
    const b = makeArticle('b', { publishedAt: '2026-06-01' });
    const sorted = sortEntries([a, b], 'oldest');
    expect(sorted[0]!.id).toBe('a');
  });

  it('sortEntries: alphabetical by title then id', () => {
    const a = makeArticle('z-entry');
    const b = makeArticle('a-entry');
    const sorted = sortEntries([a, b], 'alphabetical');
    expect(sorted[0]!.id).toBe('a-entry');
  });

  it('sortEntries: tie-breaks by ID', () => {
    const a = makeArticle('b-entry', { publishedAt: '2026-01-01' });
    const c = makeArticle('a-entry', { publishedAt: '2026-01-01' });
    const sorted = sortEntries([a, c], 'newest');
    expect(sorted[0]!.id).toBe('a-entry');
  });

  it('sortEntries: does not mutate input', () => {
    const a = makeArticle('a');
    const b = makeArticle('b');
    const input = [b, a];
    sortEntries(input, 'alphabetical');
    expect(input[0]!.id).toBe('b');
  });

  it('sortSummaries: newest first', () => {
    const summaries = [
      { kind: 'article' as const, id: 'a', title: 'A', description: '', url: '', publishedAt: new Date('2026-01-01'), tags: [], readingTime: 1, featured: false },
      { kind: 'article' as const, id: 'b', title: 'B', description: '', url: '', publishedAt: new Date('2026-06-01'), tags: [], readingTime: 1, featured: false },
    ];
    const sorted = sortSummaries(summaries, 'newest');
    expect(sorted[0]!.id).toBe('b');
  });
});

// ---------------------------------------------------------------------------
// references.ts tests
// ---------------------------------------------------------------------------

describe('references', () => {
  it('buildEntryMaps: creates maps per collection', () => {
    const a = makeArticle('art1');
    const n = makeNote('note1');
    const maps = buildEntryMaps([a], [n], [], []);
    expect(maps.articles.has('art1')).toBe(true);
    expect(maps.notes.has('note1')).toBe(true);
    expect(maps.projects.size).toBe(0);
  });

  it('validateConnections: passes for valid connection', () => {
    const target = makeArticle('target');
    const source = makeNote('source', {
      connections: [{ type: 'explains', target: { collection: 'articles', id: 'target' } }],
    });
    const maps = buildEntryMaps([target], [source], [], []);
    const allMap = buildAllEntriesMap([target], [source], [], []);
    const errors = validateConnections(source as unknown as Parameters<typeof validateConnections>[0], maps, allMap);
    expect(errors).toHaveLength(0);
  });

  it('validateConnections: reports missing target', () => {
    const source = makeNote('source', {
      connections: [{ type: 'explains', target: { collection: 'articles', id: 'ghost' } }],
    });
    const maps = buildEntryMaps([], [source], [], []);
    const allMap = buildAllEntriesMap([], [source], [], []);
    const errors = validateConnections(source as unknown as Parameters<typeof validateConnections>[0], maps, allMap);
    expect(errors[0]!.reason).toBe('missing');
  });

  it('validateConnections: reports self-reference', () => {
    const source = makeNote('source', {
      connections: [{ type: 'related', target: { collection: 'notes', id: 'source' } }],
    });
    const maps = buildEntryMaps([], [source], [], []);
    const allMap = buildAllEntriesMap([], [source], [], []);
    const errors = validateConnections(source as unknown as Parameters<typeof validateConnections>[0], maps, allMap);
    expect(errors[0]!.reason).toBe('self');
  });
});

// ---------------------------------------------------------------------------
// series.ts tests
// ---------------------------------------------------------------------------

describe('series', () => {
  it('resolveSeries: resolves mixed entries', () => {
    const a1 = makeArticle('a1');
    const n1 = makeNote('n1');
    const s = makeSeries('s1', [
      { collection: 'articles', id: 'a1' },
      { collection: 'notes', id: 'n1' },
    ]);
    const result = resolveSeries(
      s,
      new Map([['a1', a1]]),
      new Map([['n1', n1]]),
    );
    expect('viewModel' in result).toBe(true);
    if ('viewModel' in result) {
      expect(result.viewModel.entries).toHaveLength(2);
      expect(result.viewModel.entries[0]!.position).toBe(1);
      expect(result.viewModel.entries[1]!.position).toBe(2);
    }
  });

  it('resolveSeries: rejects duplicate entry', () => {
    const a1 = makeArticle('a1');
    const s = makeSeries('s1', [
      { collection: 'articles', id: 'a1' },
      { collection: 'articles', id: 'a1' },
    ]);
    const result = resolveSeries(s, new Map([['a1', a1]]), new Map());
    expect('errors' in result).toBe(true);
    if ('errors' in result) expect(result.errors[0]!.reason).toContain('Duplicate');
  });

  it('resolveSeries: rejects missing entry', () => {
    const s = makeSeries('s1', [{ collection: 'articles', id: 'ghost' }]);
    const result = resolveSeries(s, new Map(), new Map());
    expect('errors' in result).toBe(true);
    if ('errors' in result) expect(result.errors[0]!.reason).toContain('Unresolved');
  });

  it('resolveSeries: rejects draft entry', () => {
    const draft = makeArticle('a1', { draft: true });
    const s = makeSeries('s1', [{ collection: 'articles', id: 'a1' }]);
    const result = resolveSeries(s, new Map([['a1', draft]]), new Map());
    expect('errors' in result).toBe(true);
  });

  it('deriveSeriesContext: returns correct previous/next', () => {
    const entries = [
      { position: 1, collection: 'articles' as const, id: 'a1', title: 'A1', description: '', url: '/a1/' },
      { position: 2, collection: 'notes' as const, id: 'n1', title: 'N1', description: '', url: '/n1/' },
      { position: 3, collection: 'articles' as const, id: 'a2', title: 'A2', description: '', url: '/a2/' },
    ];
    const ctx = deriveSeriesContext('s1', 'My Series', entries, 'n1');
    expect(ctx?.currentPosition).toBe(2);
    expect(ctx?.previous?.id).toBe('a1');
    expect(ctx?.next?.id).toBe('a2');
  });

  it('deriveSeriesContext: first entry has no previous', () => {
    const entries = [
      { position: 1, collection: 'articles' as const, id: 'a1', title: 'A1', description: '', url: '/a1/' },
    ];
    const ctx = deriveSeriesContext('s1', 'My Series', entries, 'a1');
    expect(ctx?.previous).toBeUndefined();
    expect(ctx?.next).toBeUndefined();
  });

  it('deriveSeriesContext: returns undefined for non-member', () => {
    const ctx = deriveSeriesContext('s1', 'My Series', [], 'ghost');
    expect(ctx).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// graph.ts tests
// ---------------------------------------------------------------------------

describe('graph', () => {
  it('graphNodeId: format is collection:id', () => {
    const a = makeArticle('my-post');
    expect(graphNodeId(a)).toBe('articles:my-post');
  });

  it('validateGraphConnections: passes valid connections', () => {
    const a = makeArticle('a1', {
      connections: [{ type: 'explains', target: { collection: 'notes', id: 'n1' } }],
    });
    const n = makeNote('n1');
    const errors = validateGraphConnections([a, n] as Parameters<typeof validateGraphConnections>[0]);
    expect(errors).toHaveLength(0);
  });

  it('validateGraphConnections: rejects unknown domain', () => {
    const a = makeArticle('a1', { domains: ['invalid-domain'] });
    const errors = validateGraphConnections([a] as Parameters<typeof validateGraphConnections>[0]);
    expect(errors.some((e) => e.reason.includes('Unknown domain'))).toBe(true);
  });

  it('validateGraphConnections: rejects self-reference', () => {
    const a = makeArticle('a1', {
      connections: [{ type: 'related', target: { collection: 'articles', id: 'a1' } }],
    });
    const errors = validateGraphConnections([a] as Parameters<typeof validateGraphConnections>[0]);
    expect(errors.some((e) => e.reason.includes('Self-reference'))).toBe(true);
  });

  it('validateGraphConnections: rejects missing target', () => {
    const a = makeArticle('a1', {
      connections: [{ type: 'explains', target: { collection: 'notes', id: 'ghost' } }],
    });
    const errors = validateGraphConnections([a] as Parameters<typeof validateGraphConnections>[0]);
    expect(errors.some((e) => e.reason.includes('not found'))).toBe(true);
  });

  it('validateGraphConnections: rejects reverse-duplicate related', () => {
    const a = makeArticle('a1', {
      connections: [{ type: 'related', target: { collection: 'notes', id: 'n1' } }],
    });
    const n = makeNote('n1', {
      connections: [{ type: 'related', target: { collection: 'articles', id: 'a1' } }],
    });
    const errors = validateGraphConnections([a, n] as Parameters<typeof validateGraphConnections>[0]);
    expect(errors.some((e) => e.reason.includes('Reverse-duplicate'))).toBe(true);
  });

  it('detectPrerequisiteCycles: passes a valid DAG', () => {
    const a = makeArticle('a', { connections: [{ type: 'prerequisite', target: { collection: 'notes', id: 'n' } }] });
    const n = makeNote('n');
    const cycles = detectPrerequisiteCycles([a, n] as Parameters<typeof detectPrerequisiteCycles>[0]);
    expect(cycles).toHaveLength(0);
  });

  it('detectPrerequisiteCycles: detects a direct cycle', () => {
    const a = makeArticle('a', {
      connections: [{ type: 'prerequisite', target: { collection: 'notes', id: 'n' } }],
    });
    const n = makeNote('n', {
      connections: [{ type: 'prerequisite', target: { collection: 'articles', id: 'a' } }],
    });
    const cycles = detectPrerequisiteCycles([a, n] as Parameters<typeof detectPrerequisiteCycles>[0]);
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0]!.join(' → ')).toContain('articles:a');
    expect(cycles[0]!.join(' → ')).toContain('notes:n');
  });

  it('detectPrerequisiteCycles: detects a three-node cycle', () => {
    const a = makeArticle('a', { connections: [{ type: 'prerequisite', target: { collection: 'notes', id: 'n' } }] });
    const n = makeNote('n', { connections: [{ type: 'prerequisite', target: { collection: 'articles', id: 'b' } }] });
    const b = makeArticle('b', { connections: [{ type: 'prerequisite', target: { collection: 'articles', id: 'a' } }] });
    const cycles = detectPrerequisiteCycles([a, n, b] as Parameters<typeof detectPrerequisiteCycles>[0]);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('buildGraphManifest: nodes sorted deterministically', () => {
    const a = makeArticle('z-post');
    const n = makeNote('a-note');
    const manifest = buildGraphManifest([a, n] as Parameters<typeof buildGraphManifest>[0]);
    expect(manifest.nodes[0]!.id).toBe('articles:z-post');
    expect(manifest.nodes[1]!.id).toBe('notes:a-note');
  });

  it('buildGraphManifest: includes edges', () => {
    const a = makeArticle('a1', {
      connections: [{ type: 'explains', target: { collection: 'notes', id: 'n1' } }],
    });
    const n = makeNote('n1');
    const manifest = buildGraphManifest([a, n] as Parameters<typeof buildGraphManifest>[0]);
    expect(manifest.edges).toHaveLength(1);
    expect(manifest.edges[0]!.type).toBe('explains');
  });

  it('buildGraphManifest: schemaVersion is present', () => {
    const manifest = buildGraphManifest([]);
    expect(manifest.schemaVersion).toBe(1);
  });

  it('buildGraphManifest: empty entries produces empty manifest', () => {
    const manifest = buildGraphManifest([]);
    expect(manifest.nodes).toHaveLength(0);
    expect(manifest.edges).toHaveLength(0);
  });

  it('resolveEntryConnections: includes outgoing connections', () => {
    const a = makeArticle('a1', {
      connections: [{ type: 'explains', target: { collection: 'notes', id: 'n1' } }],
    });
    const n = makeNote('n1');
    const conns = resolveEntryConnections(
      a as Parameters<typeof resolveEntryConnections>[0],
      [a, n] as Parameters<typeof resolveEntryConnections>[1],
    );
    expect(conns.some((c) => c.direction === 'outgoing' && c.type === 'explains')).toBe(true);
  });

  it('resolveEntryConnections: includes incoming connections', () => {
    const a = makeArticle('a1', {
      connections: [{ type: 'explains', target: { collection: 'notes', id: 'n1' } }],
    });
    const n = makeNote('n1');
    const conns = resolveEntryConnections(
      n as Parameters<typeof resolveEntryConnections>[0],
      [a, n] as Parameters<typeof resolveEntryConnections>[1],
    );
    expect(conns.some((c) => c.direction === 'incoming')).toBe(true);
  });

  it('resolveEntryConnections: related is marked symmetric', () => {
    const a = makeArticle('a1', {
      connections: [{ type: 'related', target: { collection: 'notes', id: 'n1' } }],
    });
    const n = makeNote('n1');
    const conns = resolveEntryConnections(
      a as Parameters<typeof resolveEntryConnections>[0],
      [a, n] as Parameters<typeof resolveEntryConnections>[1],
    );
    expect(conns.some((c) => c.type === 'related' && c.direction === 'symmetric')).toBe(true);
  });
});
