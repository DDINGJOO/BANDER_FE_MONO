#!/usr/bin/env node
/**
 * Sync Figma assets to local files based on figma.assets.json.
 *
 * Config shape:
 *   {
 *     "fileKey": "EoBH3U1mU3oQBMTnpOO2r8",
 *     "defaults": { "format": "svg", "scale": 1 },
 *     "assets": [
 *       { "name": "logo", "id": "6163:44098", "out": "public/logo.svg" },
 *       { "name": "icon-foo", "id": "1:23", "out": "public/icons/foo.svg" },
 *       { "name": "hero", "id": "9:9", "format": "png", "scale": 2,
 *         "out": "public/hero@2x.png" }
 *     ]
 *   }
 *
 * Run: npm run figma:sync          (sync everything)
 *      npm run figma:sync -- logo  (sync only assets whose name matches)
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadEnvLocal, repoRoot, requireToken, figmaJson } from './_shared.mjs';

const CONFIG_PATH = resolve(repoRoot, 'figma.assets.json');

async function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error(`Missing config: ${CONFIG_PATH}`);
  }
  const cfg = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  if (!cfg.fileKey) throw new Error('config.fileKey is required');
  if (!Array.isArray(cfg.assets) || cfg.assets.length === 0) {
    throw new Error('config.assets must be a non-empty array');
  }
  const defaults = { format: 'svg', scale: 1, ...(cfg.defaults ?? {}) };
  return { ...cfg, defaults };
}

function applyDefaults(asset, defaults) {
  return { format: defaults.format, scale: defaults.scale, ...asset };
}

function filterAssets(assets, filters) {
  if (filters.length === 0) return assets;
  return assets.filter((a) => filters.some((f) => a.name?.includes(f)));
}

function groupByExportParams(assets) {
  // Figma /v1/images batches by file + format + scale.
  const groups = new Map();
  for (const a of assets) {
    const key = `${a.format}|${a.scale}`;
    if (!groups.has(key)) groups.set(key, { format: a.format, scale: a.scale, items: [] });
    groups.get(key).items.push(a);
  }
  return [...groups.values()];
}

const CHUNK_SIZE = 50;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchGroup(token, fileKey, group) {
  const merged = {};
  for (const slice of chunk(group.items, CHUNK_SIZE)) {
    const ids = slice.map((i) => i.id).join(',');
    const params = new URLSearchParams({
      ids,
      format: group.format,
      scale: String(group.scale),
    });
    if (group.format === 'svg') params.set('svg_outline_text', 'false');
    const json = await figmaJson(`/v1/images/${fileKey}?${params}`, token);
    Object.assign(merged, json.images ?? {});
  }
  return merged;
}

function applyCurrentColor(svg) {
  // Replace explicit black fill/stroke with currentColor so the SVG inherits
  // CSS `color`. Keeps non-black colors (e.g., accent dots) untouched.
  return svg
    .replace(/(fill|stroke)="(?:black|#000000|#000)"/gi, '$1="currentColor"');
}

async function downloadAsset(asset, urlMap) {
  const url = urlMap[asset.id];
  if (!url) throw new Error(`No image URL returned for ${asset.name} (${asset.id})`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${asset.name} failed: ${res.status}`);
  const outPath = resolve(repoRoot, asset.out);
  await mkdir(dirname(outPath), { recursive: true });
  if (asset.format === 'svg') {
    let text = await res.text();
    if (asset.currentColor) text = applyCurrentColor(text);
    await writeFile(outPath, text, 'utf8');
    return { asset, outPath, bytes: text.length };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buf);
  return { asset, outPath, bytes: buf.length };
}

async function main() {
  await loadEnvLocal();
  const token = requireToken();
  const cfg = await loadConfig();
  const filters = process.argv.slice(2);

  const assets = filterAssets(cfg.assets, filters).map((a) => applyDefaults(a, cfg.defaults));
  if (assets.length === 0) {
    console.log(`No assets matched filters: ${filters.join(', ')}`);
    return;
  }

  for (const a of assets) {
    if (!a.id) throw new Error(`Asset "${a.name ?? '<unnamed>'}" missing id`);
    if (!a.out) throw new Error(`Asset "${a.name ?? '<unnamed>'}" missing out path`);
  }

  console.log(`→ Syncing ${assets.length} asset(s) from Figma file ${cfg.fileKey}`);
  const groups = groupByExportParams(assets);
  for (const g of groups) {
    console.log(`  • requesting ${g.items.length} × ${g.format}@${g.scale}x`);
    const urlMap = await fetchGroup(token, cfg.fileKey, g);
    for (const item of g.items) {
      const result = await downloadAsset(item, urlMap);
      const rel = result.outPath.replace(repoRoot + '/', '');
      console.log(`    ✓ ${item.name.padEnd(20)}  ${rel}  (${result.bytes} B)`);
    }
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});
