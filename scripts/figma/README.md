# Figma Asset Sync

Pulls SVG/PNG assets from Figma via the REST API and drops them into the
repo. No MCP, no manual export — config-driven and reproducible.

## Setup

1. Generate a Figma personal access token: https://www.figma.com/settings → Security → Generate new token. Scope `file_content:read` (read-only) is enough.
2. Add to `.env.local` (gitignored):
   ```
   FIGMA_TOKEN=figd_xxx
   ```

## Configure assets

Edit [`figma.assets.json`](../../figma.assets.json) at the repo root:

```json
{
  "fileKey": "EoBH3U1mU3oQBMTnpOO2r8",
  "defaults": { "format": "svg", "scale": 1 },
  "assets": [
    { "name": "logo", "id": "6163:44098", "out": "public/logo.svg" },
    { "name": "icon-bell", "id": "1:42", "out": "public/icons/bell.svg" },
    { "name": "hero", "id": "9:9", "format": "png", "scale": 2,
      "out": "public/hero@2x.png" }
  ]
}
```

- `id` is a Figma node id with `:` (not `-`). Use `figma:find` / `figma:inspect` to discover ids.
- `format` is `svg` | `png` | `jpg` | `pdf`. Defaults from `defaults.format`.
- `scale` 0.01–4. Only meaningful for raster formats.
- `out` is repo-relative.

## Commands

```bash
npm run figma:sync              # pull every asset in figma.assets.json
npm run figma:sync -- logo      # pull only assets whose name includes 'logo'

npm run figma:find -- 'pattern' # find nodes by name regex (case-insensitive)
npm run figma:inspect -- '<figma-url>' [maxDepth]
```

`figma:find` falls back to `fileKey` from `figma.assets.json` if you don't pass one.

## Workflow for adding a new asset

1. In Figma, right-click the layer → "Copy link" (gives you a URL with `?node-id=...`).
2. (Optional) Run `npm run figma:inspect -- '<url>' 3` to see the node and its children, in case you need a child node instead.
3. Convert the URL's `node-id=A-B` to the API form `A:B`, add an entry to `figma.assets.json`.
4. `npm run figma:sync -- <name>` to pull it.
5. Reference the file via the static path (e.g. `${process.env.PUBLIC_URL}/logo.svg`).

## Why public/ instead of bundling

- Served as a plain HTTP static file → no JS bundling cost, browser/CDN cacheable.
- Replaceable without a code change (re-run `figma:sync`).
- Same path works in dev server and production build (`react-scripts` serves `public/` at root).

## Gotchas

- Image URLs returned by `/v1/images` expire in 30 days — always download the bytes immediately, never store the URL.
- Picking a CANVAS or huge frame as `id` will hit a render timeout. Pick the smallest meaningful subtree (the actual logo `INSTANCE`, not the page).
- Hyphen vs colon: URL has `node-id=6163-44098`, the API needs `6163:44098`.
