#!/usr/bin/env node
/**
 * Search a Figma file for nodes whose name matches a regex.
 * Usage: npm run figma:find -- <pattern> [fileKey]
 *
 * If fileKey is omitted, falls back to figma.assets.json fileKey.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvLocal, repoRoot, requireToken, figmaJson } from './_shared.mjs';

function* walk(node, path = []) {
  yield { node, path };
  for (const c of node.children ?? []) yield* walk(c, [...path, node.name]);
}

async function defaultFileKey() {
  const cfgPath = resolve(repoRoot, 'figma.assets.json');
  if (!existsSync(cfgPath)) return null;
  const cfg = JSON.parse(await readFile(cfgPath, 'utf8'));
  return cfg.fileKey ?? null;
}

async function main() {
  await loadEnvLocal();
  const [, , pattern, fileKeyArg] = process.argv;
  if (!pattern) {
    console.error('Usage: npm run figma:find -- <pattern> [fileKey]');
    process.exit(1);
  }
  const fileKey = fileKeyArg ?? (await defaultFileKey());
  if (!fileKey) {
    console.error('No fileKey: pass as arg or set in figma.assets.json');
    process.exit(1);
  }
  const token = requireToken();
  const re = new RegExp(pattern, 'i');

  const json = await figmaJson(`/v1/files/${fileKey}?depth=8`, token);
  const matches = [];
  for (const { node, path } of walk(json.document)) {
    if (re.test(node.name ?? '')) {
      matches.push({ id: node.id, type: node.type, name: node.name, path: path.join(' / ') });
    }
  }
  for (const m of matches) {
    console.log(`${m.id}\t[${m.type}]\t${m.name}\t<= ${m.path}`);
  }
  console.log(`\n${matches.length} match(es).`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
