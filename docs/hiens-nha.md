# Hien's Nha

Hien's Nha (Nhà của Hiển) is a personal home for knowledge, projects, novels,
music, and visitors. The repository slug is `hiens-nha`. The build derives the
GitHub Pages base from `GITHUB_REPOSITORY`, keeping both the old and new repository
names operational during the rename. Local development defaults to `/hiens-nha/`.

## Navigation and content model

The main menu describes rooms a visitor can explore. File formats and collections
remain an authoring concern; a source directory does not have to mirror the menu.

| Room / concept | Definition | Examples / storage |
| --- | --- | --- |
| Home | A welcome and overview of Hien's interests | `/` |
| Knowledge | Writing and learning hub | `/knowledge/` |
| Articles | Complete, structured writing | Tutorials, analysis; `src/content/articles/` |
| Notes | Short, evolving ideas and references | A debugging tip; `src/content/notes/` |
| Series | Ordered curated articles or notes | Playwright learning path; `src/content/series/` |
| Topics | Labels connecting related content across formats | AI, guitar, test automation |
| Graph | An optional deeper view of authored relationships | Prerequisites, related ideas |
| Novels | A reading library, with a chapter index for each novel | `/novels/`; imported chapter folders |
| Music | Music knowledge and Hien's own performances | Content tagged with the `music` domain; `src/data/music-performances.json` |
| Projects | Products, tools, experiments and case studies | ContentForge, an app or automation tool; `src/content/projects/` |
| Guestbook | Visitor messages, comments, requests and notes about Hien | GitHub Issues → `data/guestbook/issue-N.json` |
| About | Personal introduction and links | `/about/` |
| Resume | Professional background, under About | `/resume/`; existing CV remains available |

A novel is a sequence of narrative chapters, so conceptually it is a kind of
series. It has its own visitor-facing room rather than sharing the technical
learning-path index. A novel is not a project case study. ContentForge is the
project; a translated novel is one of its outputs.

The existing 84 chapters remain unchanged in their original source folder inside
the Articles collection for compatibility with the ContentForge import adapter.
They appear under **Novels**, not on the Articles index. The previous chapter and
folder URLs still work, and the folder's canonical URL points to `/novels/.../`.
An ordinary nested article folder still uses `/articles/folders/.../`.

## Vietnamese and English

- Vietnamese is the default: `/hiens-nha/...`.
- English uses `/hiens-nha/en/...`.
- VI / EN links keep the reader on the same logical page.
- Both versions are real prerendered pages, usable without a client translation
  script. Both are indexed by Pagefind.
- A shared view/data tree prevents two separate copies of every chapter.
- UI copy, controls, metadata, labels and dates are localized. Original writing,
  guest messages, chapter text and the embedded CV retain their original language;
  this feature does not automatically translate authored content.
- `src/lib/i18n.ts` contains UI copy. The prerender middleware applies it to DOM
  text/attributes while excluding scripts and `data-original-content` regions.

## Add music

Knowledge entries use `domains: [music]`. The Music page discovers them automatically.
Videos live on YouTube; the site keeps metadata instead of committing large video
files to Git. Add a record to `src/data/music-performances.json`:

```json
{
  "title": "Name of the piece",
  "description": "A short introduction to this recording.",
  "publishedAt": "2026-11-12",
  "youtubeUrl": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
  "instrument": "piano"
}
```

Use an actual 11-character YouTube video ID, a real recording and a matching date.
The site validates the URL and uses a privacy-enhanced embed. The supplied recording `l5WuCFObGGQ` is included. Its title is descriptive; its recording date and instrument are left unspecified until confirmed. `publishedAt` is optional.

## Guestbook and moderation

1. A visitor fills the website form and chooses a message, content comment or request.
2. Continue opens a prefilled GitHub Issue. The visitor signs in and explicitly
   submits on GitHub. No message is saved by merely filling the website form.
3. The **Archive guestbook** workflow fetches the latest issue and all its comments,
   then commits a JSON archive. It supports edits and deleted comments; deleted
   issues leave an unpublished tombstone. Existing Git history is retained.
4. Add the **guestbook-approved** issue label to publish the message on the site.
   The workflow creates this label on its first run. Removing the label withdraws
   the message from the website. Issue threads and repository files are public
   regardless of website approval.
5. Only maintainer replies are copied onto the website automatically. Visitor
   replies are archived and available through the linked GitHub conversation.
6. Completion of the archive workflow triggers a fresh Pages deployment. Token
   commits do not otherwise cause a push-triggered build.

The form has a direct GitHub-template fallback for long messages or disabled
JavaScript. Content is escaped as text, never compiled as MDX or executed. No token
is shipped to the browser. Actions only execute trusted code from `main`; event
text is read as JSON rather than interpolated into shell commands. Separate issue
updates can rebase and retry their file commits without overwriting another issue.

Use **Actions → Archive guestbook → Run workflow** with an issue number to repair
or re-sync a missed event. Branch rules must permit the archive workflow's scoped
bot commits. Changes become public only after the normal build/deploy gates pass.

This version requires a GitHub account. Anonymous submissions, private messages,
real-time notifications or more sophisticated moderation require a server/API or
external form service; they are intentionally not simulated with localStorage.

## Files or a relational database?

Keep MDX/JSON + Git + Pagefind for the current personal website. Files provide
history, portability and review. Search uses a generated full-text index, so it
does not need a SQL server or a directory scan per visitor request.

GitHub Pages hosts static files; it does not provide an application RDBMS endpoint.
A SQLite file committed to Git is a versioned file, not a shared concurrent write
database. Likewise, a database started in a CI job is temporary infrastructure,
not a persistent production backend for visitors.

Move visitor interactions to a backend and a relational database (for example,
PostgreSQL) when anonymous accounts, authentication roles, private data, frequent
concurrent writes, real-time workflows or complex transactional queries become
requirements. Authored content can remain in MDX after that migration.

## Rename and release

1. Merge the reviewed implementation and let Pages deploy with the current name.
2. Repository Settings → General → Repository name → `hiens-nha` → Rename.
3. Re-run **Deploy to GitHub Pages** on `main`. Its environment derives the new
   repository name automatically; no hard-coded base-path edit is required.
4. Update local clones: `git remote set-url origin https://github.com/sugia279/hiens-nha.git`.

GitHub redirects repository URLs after a rename, but not the old project Pages URL.
The new default site URL is `https://sugia279.github.io/hiens-nha/`. A custom domain
can avoid future website URL changes. These decisions supersede the original
engineering-only menu in the historical architecture documents.

## Collapsible navigation and story genres

Every branch is a native HTML disclosure, closed on each page load. Click the
branch name (or press Enter/Space when focused) to expand it; choose **View all**
inside to visit the parent page. Leaf links open their pages. Desktop and mobile
share the same recursive component. The sidebar width toggle is independent.

Story genres are defined in `src/config/novels.ts`: Xianxia / Tiên Hiệp, Manga,
Fantasy / Kỳ ảo, and Mystery / Trinh thám. Assign new imported novels in
`novelGenreByFolder` using their existing ASCII folder slug. Unassigned novels
stay visible directly under Novels. Genre pages show an honest empty state.
Chapter source files and existing URLs do not move. Music branches link to the
knowledge and performance sections.

## Approving a message and comments on the original page

1. Open https://github.com/sugia279/hiens-nha/issues and select the message.
2. In the **right sidebar → Labels**, select **guestbook-approved**. Adding this
   text to the issue body (including its Page field) does **not** approve it.
3. If missing, create it under **Issues → Labels → New label** using that exact name.
4. Wait for **Archive guestbook**, then **Deploy to GitHub Pages** to succeed;
   refresh the website. Removing the label withdraws the message after the same cycle.

Every normal page now has its own comment list and inline form below the content.
Messages whose Page field matches that page appear there and in the guestbook.
Vietnamese/English URLs, Unicode encoding and trailing slashes share one page
identity. Other-page and general guestbook messages do not appear in that list.
Legacy JSON files are supported by reading their original Page field. Only approved
issues and maintainer replies are rendered; visitor replies remain on GitHub.
The visitor still confirms submission on GitHub, and publication waits for review
and deployment. This is not an instant or anonymous comment backend.

## Optional hosted backend later

For the present interaction scope, keep the static frontend and MDX on GitHub
Pages. A small future API can run on **Cloudflare Workers**, with **Cloudflare D1**
providing a managed SQL database using SQLite semantics. Alternatively, a
**Supabase** project can host PostgreSQL, Auth and Edge Functions together.
These are proposals; no cloud project or paid resource has been created.

Browser → HTTPS API → comments table. Public reads return only approved comments;
writes create pending comments, moderation requires owner authentication. A
stable content/page key independent of language connects each comment to its
page. The API handles validation, abuse limits and permissions; database admin
credentials never go in the static frontend. Dynamic comments are fetched by the
browser, so approving them does not require rebuilding article pages. MDX remains
the source of truth for authored content; interactions move to the database,
with optional JSON exports for backup rather than two competing writable stores.
