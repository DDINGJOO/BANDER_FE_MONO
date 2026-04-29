import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, '../..');

export async function loadEnvLocal() {
  const envPath = resolve(repoRoot, '.env.local');
  if (!existsSync(envPath)) return;
  const text = await readFile(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    process.env[m[1]] ??= m[2].replace(/^['"]|['"]$/g, '');
  }
}

export function requireToken() {
  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    console.error('FIGMA_TOKEN is not set. Add it to .env.local or export it.');
    process.exit(1);
  }
  return token;
}

export function parseFigmaUrl(rawUrl) {
  const url = new URL(rawUrl);
  const segments = url.pathname.split('/').filter(Boolean);
  const idx = segments.findIndex((s) => s === 'design' || s === 'file');
  if (idx === -1 || !segments[idx + 1]) {
    throw new Error(`Could not extract fileKey from URL: ${rawUrl}`);
  }
  const fileKey = segments[idx + 1];
  const rawNodeId = url.searchParams.get('node-id');
  const nodeId = rawNodeId ? rawNodeId.replace(/-/g, ':') : null;
  return { fileKey, nodeId };
}

export async function figmaJson(path, token, init = {}) {
  const res = await fetch(`https://api.figma.com${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), 'X-Figma-Token': token },
  });
  if (!res.ok) {
    throw new Error(`Figma API ${res.status} ${res.statusText}: ${await res.text()}`);
  }
  const json = await res.json();
  if (json.err) throw new Error(`Figma API error: ${json.err}`);
  return json;
}
