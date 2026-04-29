#!/usr/bin/env node
/**
 * Print a shallow tree of a Figma node, useful when you have a node-id
 * (from a Figma URL) and need to see its children to pick a smaller node
 * for export.
 *
 * Usage: npm run figma:inspect -- <figma-url> [maxDepth=3]
 */
import { loadEnvLocal, requireToken, parseFigmaUrl, figmaJson } from './_shared.mjs';

function walk(node, depth, maxDepth, out) {
  const pad = '  '.repeat(depth);
  out.push(`${pad}${node.id}  [${node.type}]  ${node.name ?? ''}`);
  if (depth >= maxDepth) return;
  for (const c of node.children ?? []) walk(c, depth + 1, maxDepth, out);
}

async function main() {
  await loadEnvLocal();
  const [, , figmaUrl, depthArg] = process.argv;
  if (!figmaUrl) {
    console.error('Usage: npm run figma:inspect -- <figma-url> [maxDepth=3]');
    process.exit(1);
  }
  const maxDepth = Number(depthArg ?? 3);
  const token = requireToken();
  const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);
  if (!nodeId) throw new Error('URL has no node-id query param');

  const json = await figmaJson(`/v1/files/${fileKey}/nodes?ids=${nodeId}`, token);
  const node = json.nodes?.[nodeId]?.document;
  if (!node) {
    console.error('Node not found. Keys:', Object.keys(json.nodes ?? {}));
    process.exit(1);
  }
  const lines = [];
  walk(node, 0, maxDepth, lines);
  console.log(lines.join('\n'));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
