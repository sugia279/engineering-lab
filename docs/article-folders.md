# Article folders and ContentForge imports

MD/MDX entries in a subdirectory of `src/content/articles/` are grouped into an
Articles folder. Published folders appear beneath Articles in both desktop and
mobile navigation and as cards on the Articles index. Opening a folder lists its
entries; chapter pages link to the previous/next chapter and back to the folder.
Root-level articles remain on the Articles index. Drafts are excluded.

The folder label comes from its source directory name. Folder index URLs use
accent-free, lowercase path segments under `/articles/folders/`. Chapter URLs keep
the site's existing article-ID convention. Conflicting folder slugs fail the build
instead of silently replacing one another.

## ContentForge translation exports

Exports with `kind: translation.vi` and `mediaType: text/markdown` are adapted at
build time. The original MDX body, metadata, and provenance stay in source control.
Native articles still require the normal website frontmatter.

| Website field | Export source / default |
| --- | --- |
| `title` | `metadata.title` |
| `publishedAt` | `createdAt` (export creation date) |
| `description` | Chapter title followed by “Bản dịch tiếng Việt.” |
| `tags` | `translated-fiction`, `tien-hiep` |
| `domains` | `reading-literature` |
| `chapterOrder` | `metadata.sequence` |
| `showTableOfContents` | `false` |

Explicit website fields override these defaults. Both Astro and the standalone
content validator use the same adapter. Missing titles, invalid dates, and invalid
chapter numbers still fail validation. Chapter order uses `chapterOrder`, then
natural filename ordering. Keep one copy of each chapter inside its novel folder.

## Validate and publish

Run the quality gates in `.github/workflows/deploy-pages.yml` before merging.
Merging to `main` runs that workflow and publishes the site only if every gate
passes. A committed file is not live until deployment succeeds. Failed checks leave
the previous published site in place; inspect the failing job before retrying.

The regression smoke tests verify the imported novel's menu, folder index, chapter
pages, numeric order, and previous/next navigation against the actual built output.
