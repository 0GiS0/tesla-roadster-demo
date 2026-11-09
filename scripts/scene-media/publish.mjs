// Publishes the scene media recorded by the pull_request workflow.
// Runs in the privileged workflow_run workflow from the default branch: it never executes PR code and treats
// every artifact byte, name and number as untrusted data that is validated before use.
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const MARKER = '<!-- scene-media -->';
export const MEDIA_BRANCH = 'pr-media';
export const MAX_SCENES = 6;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MB = 1024 * 1024;
// Expected files per scene: extension, size limit and magic-byte check.
export const MEDIA_KINDS = {
  mp4: { limit: 10 * MB, valid: (b) => b.length > 12 && b.subarray(4, 8).toString('latin1') === 'ftyp' },
  png: { limit: 5 * MB, valid: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  gif: { limit: 8 * MB, valid: (b) => b.length > 6 && /^GIF8[79]a$/.test(b.subarray(0, 6).toString('latin1')) },
};

export const isValidSlug = (value) => typeof value === 'string' && value.length <= 64 && SLUG_PATTERN.test(value);

/** Parses meta.json from the artifact; throws on anything unexpected. */
export function parseMeta(text) {
  const meta = JSON.parse(text);
  if (!Number.isSafeInteger(meta.pr) || meta.pr < 1) throw new Error('meta.pr must be a positive integer');
  if (typeof meta.headSha !== 'string' || !/^[0-9a-f]{40}$/.test(meta.headSha)) throw new Error('meta.headSha must be a full SHA');
  if (!Array.isArray(meta.scenes) || meta.scenes.length > MAX_SCENES) throw new Error('meta.scenes must be a short array');
  if (!meta.scenes.every(isValidSlug) || new Set(meta.scenes).size !== meta.scenes.length) throw new Error('meta.scenes has an invalid slug');
  return { pr: meta.pr, headSha: meta.headSha, scenes: [...meta.scenes].sort(), truncated: meta.truncated === true };
}

/** Reads a regular file (never a symlink) and checks its size and type. Returns null when it is not acceptable. */
export function readMedia(path, kind) {
  let stat;
  try {
    stat = lstatSync(path);
  } catch {
    return null;
  }
  const rule = MEDIA_KINDS[kind];
  if (!stat.isFile() || stat.size === 0 || stat.size > rule.limit) return null;
  const data = readFileSync(path);
  return rule.valid(data) ? data : null;
}

/** Validates the artifact of one scene; returns the accepted files by kind, or null if any is missing or invalid. */
export function collectScene(incomingDir, slug) {
  const dir = join(incomingDir, `scene-media-${slug}`);
  const files = {};
  for (const kind of Object.keys(MEDIA_KINDS)) {
    const data = readMedia(join(dir, `${slug}.${kind}`), kind);
    if (!data) return null;
    files[kind] = data;
  }
  return files;
}

export function renderComment({ meta, results, mediaBase, runUrl }) {
  const lines = [MARKER, '## 📸 Escenas MEME de esta PR', ''];
  if (meta.scenes.length === 0) {
    lines.push('El último commit no cambia ninguna escena MEME, así que no se ha grabado nada nuevo.');
    return `${lines.join('\n')}\n`;
  }
  lines.push(
    `Vídeo y captura «después» de cada escena afectada, grabados con \`record-scene --preset ci\` para el commit \`${meta.headSha.slice(0, 7)}\`. Este comentario se actualiza en cada push ([ver ejecución](${runUrl})).`,
    '',
  );
  for (const slug of meta.scenes) {
    lines.push(`### 🎬 \`${slug}\``, '');
    if (!results[slug]) {
      lines.push(`⚠️ No se pudo grabar esta escena. Revisa [la ejecución](${runUrl}).`, '');
      continue;
    }
    const url = (ext) => `${mediaBase}/${slug}/${slug}.${ext}`;
    lines.push(
      `![Captura «después» de la escena ${slug}](${url('png')})`,
      '',
      `![Vista previa animada de la escena ${slug}](${url('gif')})`,
      '',
      `[▶️ Vídeo MP4 completo](${url('mp4')}) · [📦 Artefactos de la ejecución](${runUrl})`,
      '',
    );
  }
  if (meta.truncated) lines.push(`> Hay más escenas afectadas: solo se graban las ${MAX_SCENES} primeras por orden alfabético.`, '');
  return `${lines.join('\n')}\n`;
}

const run = (cmd, args, options = {}) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options });

function authArgs(token) {
  return ['-c', `http.extraheader=AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`];
}

/** Replaces `pr-<n>/` on the media branch with the staged files and returns the resulting commit SHA. */
function pushMedia({ remote, token, pr, stagedDir, message }) {
  const auth = authArgs(token);
  for (let attempt = 1; attempt <= 4; attempt++) {
    const work = mkdtempSync(join(tmpdir(), 'scene-media-git-'));
    const git = (...args) => run('git', [...auth, ...args], { cwd: work, stdio: ['ignore', 'pipe', 'inherit'] });
    try {
      const exists = run('git', [...auth, 'ls-remote', '--heads', remote, MEDIA_BRANCH]).trim() !== '';
      if (exists) run('git', [...auth, 'clone', '--quiet', '--depth', '1', '--branch', MEDIA_BRANCH, remote, work]);
      else {
        git('init', '--quiet', '--initial-branch', MEDIA_BRANCH);
        git('remote', 'add', 'origin', remote);
        writeFileSync(join(work, 'README.md'), 'Media generated by the scene-media workflows for pull requests. Do not edit by hand.\n');
        git('add', 'README.md');
      }
      rmSync(join(work, `pr-${pr}`), { recursive: true, force: true });
      if (stagedDir) run('cp', ['-R', join(stagedDir, `pr-${pr}`), join(work, `pr-${pr}`)]);
      git('add', '--all');
      if (git('status', '--porcelain').trim() !== '') {
        git('-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com', 'commit', '--quiet', '-m', message);
        git('push', '--quiet', 'origin', `HEAD:refs/heads/${MEDIA_BRANCH}`);
      }
      return git('rev-parse', 'HEAD').trim();
    } catch (error) {
      if (attempt === 4) throw error;
      console.warn(`Pushing media failed (attempt ${attempt}); retrying from a fresh clone.`);
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  }
}

function upsertComment({ repo, pr, body, createIfMissing }) {
  const ids = run('gh', ['api', '--paginate', `repos/${repo}/issues/${pr}/comments`, '--jq',
    `.[] | select(.user.login == "github-actions[bot]" and (.body | contains("${MARKER}"))) | .id`]).split('\n').filter(Boolean);
  const bodyFile = join(mkdtempSync(join(tmpdir(), 'scene-media-comment-')), 'comment.md');
  writeFileSync(bodyFile, body);
  if (ids.length > 0) {
    run('gh', ['api', '--method', 'PATCH', `repos/${repo}/issues/comments/${ids[0]}`, '--field', `body=@${bodyFile}`]);
    console.log(`Updated comment ${ids[0]}.`);
    return;
  }
  if (!createIfMissing) {
    console.log('No scene changes and no previous comment: nothing to post.');
    return;
  }
  run('gh', ['api', '--method', 'POST', `repos/${repo}/issues/${pr}/comments`, '--field', `body=@${bodyFile}`]);
  console.log('Created comment.');
}

function main() {
  const { values } = parseArgs({
    options: { incoming: { type: 'string' }, 'dry-run': { type: 'boolean', default: false }, 'comment-out': { type: 'string', default: '' } },
  });
  const incoming = resolve(values.incoming ?? 'incoming');
  const { GH_TOKEN: token, GITHUB_REPOSITORY: repo, HEAD_SHA: headSha, RUN_URL: runUrl = '' } = process.env;
  const server = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('GITHUB_REPOSITORY is missing or malformed');
  if (!/^[0-9a-f]{40}$/.test(headSha ?? '')) throw new Error('HEAD_SHA must be the full SHA of the triggering run');

  const metaPath = join(incoming, 'scene-media-meta', 'meta.json');
  if (!existsSync(metaPath) || !lstatSync(metaPath).isFile() || lstatSync(metaPath).size > 10_000) throw new Error('meta.json is missing or too large');
  const meta = parseMeta(readFileSync(metaPath, 'utf8'));
  if (meta.headSha !== headSha) throw new Error('meta.headSha does not match the triggering commit');

  if (!values['dry-run']) {
    // The PR number comes from untrusted data: only trust it when that PR is open at exactly the triggering commit.
    const pull = JSON.parse(run('gh', ['api', `repos/${repo}/pulls/${meta.pr}`, '--jq', '{state: .state, sha: .head.sha}']));
    if (pull.state !== 'open' || pull.sha !== headSha) {
      console.log(`PR #${meta.pr} is closed or has a newer commit; skipping.`);
      return;
    }
  }

  const staged = mkdtempSync(join(tmpdir(), 'scene-media-stage-'));
  const results = {};
  for (const slug of meta.scenes) {
    const files = collectScene(incoming, slug);
    results[slug] = Boolean(files);
    if (!files) {
      console.warn(`::warning::Scene ${slug} has missing or invalid media.`);
      continue;
    }
    const target = join(staged, `pr-${meta.pr}`, slug);
    mkdirSync(target, { recursive: true });
    for (const [kind, data] of Object.entries(files)) writeFileSync(join(target, `${slug}.${kind}`), data);
  }

  let commit = 'dry-run';
  if (!values['dry-run'] && Object.values(results).some(Boolean)) {
    commit = pushMedia({ remote: `${server}/${repo}.git`, token, pr: meta.pr, stagedDir: staged, message: `chore: scene media for PR ${meta.pr} at ${headSha.slice(0, 7)}` });
  }
  const mediaBase = `${server}/${repo}/raw/${commit}/pr-${meta.pr}`;
  const body = renderComment({ meta, results, mediaBase, runUrl });
  if (values['comment-out']) writeFileSync(values['comment-out'], body);
  if (!values['dry-run']) upsertComment({ repo, pr: meta.pr, body, createIfMissing: meta.scenes.length > 0 });
  rmSync(staged, { recursive: true, force: true });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
