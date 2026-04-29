#!/usr/bin/env node
/**
 * Auto-generate catalog entries (figma.assets.json `assets[]`) by walking
 * the children of one or more Figma nodes (typically the "Icon" canvas).
 *
 * Each direct-child COMPONENT or COMPONENT_SET becomes an asset entry. For
 * COMPONENT_SET (variants), each child COMPONENT becomes a separate asset
 * with name suffix from its variant property.
 *
 * Usage:
 *   npm run figma:catalog -- <node-url> [--prefix=icon] [--out=src/assets/icons] [--currentColor] [--apply]
 *
 *   --apply  merges generated entries into figma.assets.json (existing entries
 *            with the same `name` keep their original config — only new ones added).
 *   Without --apply, prints the JSON to stdout for review.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnvLocal, repoRoot, requireToken, parseFigmaUrl, figmaJson } from './_shared.mjs';

const CONFIG_PATH = resolve(repoRoot, 'figma.assets.json');

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function variantSuffix(componentName) {
  // "Property 1=one" → "one"
  const m = componentName.match(/[Pp]roperty\s*\d*=([^,]+)/);
  if (m) return slugify(m[1]);
  return slugify(componentName);
}

function parseArgs(argv) {
  const args = { url: null, prefix: 'icon', out: 'src/assets/icons', currentColor: false, apply: false };
  for (const a of argv.slice(2)) {
    if (!a.startsWith('--')) {
      if (!args.url) args.url = a;
      continue;
    }
    const [k, v = 'true'] = a.replace(/^--/, '').split('=');
    if (k === 'prefix') args.prefix = v;
    else if (k === 'out') args.out = v;
    else if (k === 'currentColor') args.currentColor = v !== 'false';
    else if (k === 'apply') args.apply = v !== 'false';
  }
  return args;
}

function buildEntries(parent, opts, used) {
  const entries = [];
  for (const child of parent.children ?? []) {
    if (child.type === 'COMPONENT_SET') {
      for (const variant of child.children ?? []) {
        if (variant.type !== 'COMPONENT') continue;
        const variantPart = variantSuffix(variant.name);
        const baseName = `${opts.prefix}-${slugify(child.name)}${variantPart ? `-${variantPart}` : ''}`;
        const name = uniqueName(baseName, used);
        entries.push(makeEntry(name, variant.id, opts));
      }
      continue;
    }
    if (child.type === 'COMPONENT') {
      const baseName = `${opts.prefix}-${slugify(child.name)}`;
      const name = uniqueName(baseName, used);
      entries.push(makeEntry(name, child.id, opts));
    }
  }
  return entries;
}

function uniqueName(base, used) {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let i = 2;
  while (used.has(`${base}-${i}`)) i += 1;
  const next = `${base}-${i}`;
  used.add(next);
  return next;
}

function makeEntry(name, id, opts) {
  const out = `${opts.out.replace(/\/$/, '')}/${name.replace(/^icon-/, '')}.svg`;
  const e = { name, id, out };
  if (opts.currentColor) e.currentColor = true;
  return e;
}

async function main() {
  await loadEnvLocal();
  const args = parseArgs(process.argv);
  if (!args.url) {
    console.error('Usage: figma:catalog -- <node-url> [--prefix=icon] [--out=src/assets/icons] [--currentColor] [--apply]');
    process.exit(1);
  }
  const token = requireToken();
  const { fileKey, nodeId } = parseFigmaUrl(args.url);
  if (!nodeId) throw new Error('URL must include node-id');

  const json = await figmaJson(`/v1/files/${fileKey}/nodes?ids=${nodeId}`, token);
  const node = json.nodes?.[nodeId]?.document;
  if (!node) throw new Error(`Node ${nodeId} not found`);

  const cfg = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  const used = new Set((cfg.assets ?? []).map((a) => a.name));
  const entries = buildEntries(node, args, used);

  if (!args.apply) {
    console.log(JSON.stringify(entries, null, 2));
    console.log(`\n// ${entries.length} entries (preview only — pass --apply to merge)`);
    return;
  }

  const existingByName = new Map((cfg.assets ?? []).map((a) => [a.name, a]));
  let added = 0;
  for (const e of entries) {
    if (!existingByName.has(e.name)) {
      cfg.assets.push(e);
      added += 1;
    }
  }
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  console.log(`✓ Merged ${added} new entries into figma.assets.json (skipped ${entries.length - added} duplicates).`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
