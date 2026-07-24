/**
 * RSS feed — articles and notes, newest first, drafts excluded.
 * Served as /engineering-lab/rss.xml
 */
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPublishedArticles, getPublishedNotes } from '../lib/content/queries';
import { sortEntries } from '../lib/content/sort';
import { siteConfig } from '../config/site';

export const GET: APIRoute = async (context) => {
  const [articles, notes] = await Promise.all([
    getPublishedArticles(),
    getPublishedNotes(),
  ]);

  const entries = sortEntries([...articles, ...notes], 'newest').slice(0, 20);

  const siteUrl = (context.site ?? siteConfig.origin).toString();

  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: siteUrl,
    trailingSlash: true,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      link: `${siteUrl.replace(/\/$/, '')}/${entry.collection}/${entry.id}/`,
      pubDate: entry.data.publishedAt,
    })),
  });
};
