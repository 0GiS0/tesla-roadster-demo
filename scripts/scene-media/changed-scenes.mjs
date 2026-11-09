// Detects which MEME scenes a pull request changes, so the scene-media workflow only records those.
// Runs inside the unprivileged pull_request workflow: its output is untrusted data for the publisher.
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const CATALOG_FILE = 'src/sceneCatalog.ts';
// Shared code that renders every scene: a change here can alter any MEME.
export const SHARED_SCENE_FILES = ['src/scenario.ts', 'src/Scene.tsx', 'src/framing.ts'];
// Files that only affect scenes using the given catalog `environment`.
export const ENVIRONMENT_FILES = { 'src/ParkingLot.tsx': 'parking' };
export const MAX_SCENES = 6;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Splits the `sceneCatalog` array literal into its top-level object entries. */
export function parseCatalog(source) {
  const head = /sceneCatalog\s*:\s*SceneDefinition\[\]\s*=\s*\[/.exec(source);
  if (!head) return [];
  const entries = [];
  let depth = 0;
  let start = -1;
  for (let i = head.index + head[0].length; i < source.length; i++) {
    const c = source[i];
    if (c === "'" || c === '"' || c === '`') {
      for (i++; i < source.length && source[i] !== c; i++) if (source[i] === '\\') i++;
    } else if (c === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
    } else if (c === '/' && source[i + 1] === '*') {
      i = source.indexOf('*/', i + 2);
      if (i < 0) break;
      i++;
    } else if (c === '{') {
      if (depth++ === 0) start = i;
    } else if (c === '}') {
      if (--depth === 0) entries.push(source.slice(start, i + 1));
    } else if (c === ']' && depth === 0) {
      break;
    }
  }
  return entries.map((text) => {
    const field = (name) => new RegExp(`\\b${name}:\\s*'([^']*)'`).exec(text)?.[1] ?? '';
    const slug = /^#meme\/([^/]+)$/.exec(field('hash'))?.[1] ?? '';
    return { key: field('key'), mode: field('mode'), environment: field('environment'), slug, text };
  });
}

/**
 * Returns the sorted slugs of the MEME scenes to record.
 * A scene counts as changed when its catalog entry is new or edited, when shared rendering code changes,
 * or when a file bound to its environment changes.
 */
export function detectChangedScenes({ baseCatalog, headCatalog, changedFiles }) {
  const memes = headCatalog.filter((e) => e.mode === 'meme' && SLUG_PATTERN.test(e.slug) && e.slug.length <= 64);
  const baseByKey = new Map(baseCatalog.map((e) => [e.key, e.text.trim()]));
  const files = new Set(changedFiles);
  const all = SHARED_SCENE_FILES.some((f) => files.has(f));
  const environments = new Set(Object.entries(ENVIRONMENT_FILES).filter(([f]) => files.has(f)).map(([, env]) => env));
  const slugs = memes
    .filter((e) => all || environments.has(e.environment) || baseByKey.get(e.key) !== e.text.trim())
    .map((e) => e.slug);
  const unique = [...new Set(slugs)].sort();
  return { scenes: unique.slice(0, MAX_SCENES), truncated: unique.length > MAX_SCENES };
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const gitOrEmpty = (...args) => {
  try {
    return git(...args);
  } catch {
    return '';
  }
};

function main() {
  const { values } = parseArgs({
    options: { base: { type: 'string' }, head: { type: 'string', default: 'HEAD' }, 'meta-out': { type: 'string', default: '' } },
  });
  if (!values.base || !/^[0-9a-f]{40}$/.test(values.base)) throw new Error('--base needs a full commit SHA');
  const changedFiles = git('diff', '--name-only', values.base, values.head).split('\n').filter(Boolean);
  const result = detectChangedScenes({
    baseCatalog: parseCatalog(gitOrEmpty('show', `${values.base}:${CATALOG_FILE}`)),
    headCatalog: parseCatalog(gitOrEmpty('show', `${values.head}:${CATALOG_FILE}`)),
    changedFiles,
  });
  console.log(`Changed files: ${changedFiles.length}; scenes to record: ${result.scenes.join(', ') || 'none'}${result.truncated ? ' (truncated)' : ''}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `scenes=${JSON.stringify(result.scenes)}\n`);
  if (values['meta-out']) {
    mkdirSync(dirname(values['meta-out']), { recursive: true });
    const meta = { version: 1, pr: Number(process.env.PR_NUMBER), headSha: process.env.HEAD_SHA ?? '', ...result };
    writeFileSync(values['meta-out'], `${JSON.stringify(meta, null, 2)}\n`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
