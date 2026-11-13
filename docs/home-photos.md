# Add a homepage photo through GitHub

The home page uses `homePhotos` in `src/lib/photos.ts`. It reads metadata from `src/data/photos/*.json`, resolves each referenced asset, and selects records with a positive `featuredOrder`. Uploading an image alone does not publish a new gallery entry.

1. Upload the image under `src/assets/home/` (JPG, JPEG, PNG or WebP; filename may contain letters, digits and hyphens).
2. Create a matching metadata record under `src/data/photos/`, with a lowercase ID and matching JSON filename.
3. Set `image` to the exact path, including uppercase/lowercase spelling. Set `album` to `family`, `scenery` or `moments`.
4. Set `featuredOrder` to a positive number to show it on Home. Omit this field for gallery-only photos.
5. Commit both files and wait for a successful Pages deployment.

Example: `src/data/photos/bill-va-boi.json` references `src/assets/home/Bill-va-Boi.jpg` with `featuredOrder: 4`. The photo appears in Home and the Family album, with the existing full-size image dialog.

The website's Photos → Add photo form creates the asset and metadata together for gallery uploads; homepage placement is controlled by `featuredOrder` in the metadata.

## Responsive homepage layout

The photo grid uses the available width inside `.house-hero`, including the space left after the sidebar. At 50rem (800px with the default font) or wider it has four columns; below that, two; at 17.5rem (280px) or narrower, one. The hero takes the existing room width; its text stays capped at 42rem, and the site-wide room maximum stays 64rem. Container queries also respond when the sidebar opens/closes, rather than relying only on viewport width.

Images retain their natural aspect ratios and the existing original-size dialog. Homepage thumbnail `sizes` hints are passed to PhotoLink separately from its gallery defaults; image ordering, metadata, and full-size source URLs are unchanged. Adding more featured photos automatically adds rows.
