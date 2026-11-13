# Music & Video

The existing `/music/` URL is retained. Favorite music and favorite videos are separate categories. Personal performances and music knowledge remain available.

## Send a link

Open Music & Video → Share a link. Choose music or video, enter a title, a YouTube/Facebook video URL, and an optional description. Continue on GitHub, sign in and create the prefilled issue. Submissions are public on GitHub even before moderation. No access token is required from visitors.

## Approve or remove

In `sugia279/hiens-nha` → Issues, open the `[Media]` submission. In the right sidebar, select **Labels** → `media-approved`. The archive workflow creates this label after the first media submission; if needed, create it manually through Issues → Labels → New label.

An approved, valid link is archived to `data/media/issue-N.json`. After the Archive guestbook workflow completes, the Pages workflow publishes the updated favorite list. Removing the label or deleting the issue removes the link after the same workflow cycle. Closing an issue alone does not remove an approved link. Editing an approved issue updates its published contents, so remove the approval label first if a revision needs another review.

The marker and JSON in the issue body must be preserved. Invalid URLs or malformed data are not published. Descriptions render as escaped text. Facebook private/deleted videos may still be unavailable on Facebook; the website does not bypass platform access controls.

To retry a failed synchronization, run **Actions → Archive guestbook → Run workflow**, supplying the issue number. Keep the existing workflow name because Pages deploys after its successful completion.

## Navigation state

Native tree branches default to closed for a new visitor. Their expanded state uses logical paths in browser storage, shared across VI/EN and phone/desktop trees. Page navigation restores those states. The phone overlay still closes after a normal internal link selection; tablet/laptop sidebars remain open. If storage is blocked, navigation works but state cannot survive a full page load.

## Embedded playback and tags

Approved links render a responsive YouTube privacy-enhanced player or Facebook video plugin in their category. The submission form accepts up to 12 comma-separated tags, each at most 40 characters. Older archives without tags still work. Player sources are constructed only from validated YouTube/Facebook URLs; user-provided iframe/HTML is never accepted. Private, restricted, removed or embedding-disabled videos may not play. The original source link remains available, and Facebook short/share links may require the original public video URL for reliable embedding.

Facebook players use the owner's supplied iframe settings: `show_text=true`, plugin width 560 and a responsive 560:429 frame, with fullscreen/media/share permissions. The Perfect entry retains its existing share URL and metadata. These presentation options do not resolve a share URL to a canonical video ID, and successful iframe rendering alone does not prove playback.
