# Knowledge submissions

Open Knowledge → Add Knowledge. Choose Article, Note or Poem, enter a category and comma-separated tags, and optionally select an existing series or enter a new name. Set the order within that series. Text and line breaks are preserved; submitted HTML/MDX is never executed.

Continue on GitHub and create the prefilled issue (requires a GitHub account). The issue is public before approval. Long text may exceed browser transfer URL limits; the form retains it and asks the author to split it into posts in the same series.

Approve through repository Issues → the `[Knowledge]` issue → Labels → `knowledge-approved`. The archive workflow creates that label when the first submission arrives; it can also be created manually through Issues → Labels. After successful archiving and Pages deployment, posts appear in the shared writing library inside Knowledge. The library filters by type, category, tag, and series. The Series listing also links to shared series. These text submissions live in `data/knowledge`; existing authored MDX collections continue to use their existing editor workflow.

Removing the approval label, deleting the issue, or removing its structured marker retracts the post after archiving and deployment. Closing alone does not retract it. An approved issue's edits update the published post; remove approval before revising if it needs review again. Preserve the marker and JSON body. Use Actions → Archive guestbook → Run workflow with the issue number to retry synchronization.

The initial “Thơ ngẫu hứng” series contains the four lines supplied by Hiển, titled “Tích tịch tình tang”. New posts with that exact series name join it in numeric order.
