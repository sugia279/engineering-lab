/**
 * Graph manifest endpoint — deterministic static JSON output.
 * Served as /graph/graph.json at build time.
 * No HTML; no layout; no draft/private nodes.
 */
import type { APIRoute } from 'astro';
import { getAllPublishedEntries } from '../../lib/content/queries';
import { buildGraphManifest } from '../../lib/content/graph';

export const GET: APIRoute = async () => {
  const entries = await getAllPublishedEntries();
  const manifest = buildGraphManifest(entries);
  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
