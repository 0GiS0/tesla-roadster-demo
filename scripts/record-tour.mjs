// Builds the README tour film from a production build:
//   1. Playwright records one deterministic clip per scene in src/sceneCatalog.ts
//      (the time slider is driven frame by frame, never by wall-clock time).
//   2. scripts/tour/film.mjs writes a HyperFrames project (intro, original scene,
//      Modo MEME bridge, one segment per meme, outro).
//   3. HyperFrames checks and renders tour.mp4; tour.webp and tour-poster.png
//      are derived from it.
// Usage: node scripts/record-tour.mjs [--dist dist] [--out docs/assets] [--clips-dir DIR] [--project-dir DIR]
// With --clips-dir, existing clips are reused so the film can be re-rendered quickly.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { preview } from 'vite';
import { chromium } from 'playwright';
import { loadCatalog } from './tour/catalog.mjs';
import { writeFilmProject } from './tour/film.mjs';

const CAPTURE_FPS = 24;
const WIDTH = 1280;
const HEIGHT = 860;
const WEBP_FPS = 10;
const WEBP_WIDTH = 640;
const MAX_MP4_BYTES = 10 * 1024 * 1024;
const MAX_WEBP_BYTES = 2 * 1024 * 1024;

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
}

function fail(message) {
  console.error(`record-tour: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) fail(`${command} failed: ${args.join(' ')}`);
}

const ffmpeg = (args) => run('ffmpeg', ['-y', '-loglevel', 'error', ...args]);

if (spawnSync('ffmpeg', ['-version']).status !== 0) fail('ffmpeg was not found on PATH');
if (spawnSync('img2webp', ['-version']).status !== 0) fail('img2webp (WebP tools) was not found on PATH');

const distDir = resolve(arg('dist', 'dist'));
const outDir = resolve(arg('out', 'docs/assets'));
const workDir = mkdtempSync(join(tmpdir(), 'roadster-tour-'));
const clipsDir = resolve(arg('clips-dir', join(workDir, 'clips')));
const projectDir = resolve(arg('project-dir', join(workDir, 'film')));
mkdirSync(outDir, { recursive: true });
mkdirSync(clipsDir, { recursive: true });

const catalog = await loadCatalog();
console.log(`record-tour: ${catalog.length} scenes: ${catalog.map((scene) => scene.key).join(', ')}`);

async function recordClip(browser, baseUrl, entry) {
  const clip = join(clipsDir, `${entry.key}.mp4`);
  if (existsSync(clip)) {
    console.log(`record-tour: reusing ${clip}`);
    return;
  }
  const framesDir = mkdtempSync(join(workDir, `${entry.key}-`));
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto(`${baseUrl}${entry.hash}`, { waitUntil: 'load' });
    const slider = page.getByLabel('Tiempo de la maniobra');
    const stage = page.locator('.viewer-stage');
    try {
      await page.waitForFunction(
        () => {
          const input = document.querySelector('input[aria-label="Tiempo de la maniobra"]');
          return input instanceof HTMLInputElement && !input.disabled;
        },
        undefined,
        { timeout: 120_000 },
      );
    } catch {
      const hasCanvas = (await page.locator('canvas').count()) > 0;
      fail(`scene "${entry.key}" did not become ready (WebGL 2 or model failure; canvas present: ${hasCanvas}). Page errors: ${errors.join('; ') || 'none'}`);
    }
    const setTime = (time) =>
      slider.evaluate((el, value) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(el, String(value));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.blur();
        return new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
      }, time);

    const total = Math.round(entry.duration * CAPTURE_FPS);
    for (let i = 0; i < total; i += 1) {
      await setTime(Math.min(entry.duration, i / CAPTURE_FPS));
      await stage.screenshot({ path: join(framesDir, `frame-${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
      if (i % 96 === 0) console.log(`record-tour: ${entry.key} frame ${i + 1}/${total}`);
    }
    if (errors.length > 0) fail(`page errors while recording "${entry.key}": ${errors.join('; ')}`);
  } finally {
    await page.close();
  }
  // -g 30 keeps a keyframe every second; without it HyperFrames freezes frames while seeking.
  ffmpeg(['-framerate', String(CAPTURE_FPS), '-i', join(framesDir, 'frame-%04d.jpg'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(CAPTURE_FPS), '-g', '30', '-keyint_min', '30', '-an', '-movflags', '+faststart', clip]);
  rmSync(framesDir, { recursive: true, force: true });
}

const server = await preview({
  root: process.cwd(),
  build: { outDir: distDir },
  preview: { host: '127.0.0.1', port: 4173, strictPort: false },
});
const url = server.resolvedUrls?.local?.[0];
if (!url) fail('vite preview did not report a local URL');
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars'],
});
try {
  for (const entry of catalog) await recordClip(browser, url, entry);
} finally {
  await browser.close();
  await server.close();
}

const film = writeFilmProject({
  catalog,
  projectDir,
  clipsDir,
  qrPath: resolve('docs/assets/qr-web.svg'),
  gsapPath: resolve('node_modules/gsap/dist/gsap.min.js'),
});
console.log(`record-tour: film ${film.total}s, segments: ${film.segments.map((s) => s.id).join(' > ')}`);

const hyperframes = resolve('node_modules/.bin/hyperframes');
const hfEnv = { ...process.env, HYPERFRAMES_SKIP_SKILLS: '1', HYPERFRAMES_NO_UPDATE_CHECK: '1' };
run(hyperframes, ['check', projectDir], { env: hfEnv });
const mp4 = join(outDir, 'tour.mp4');
run(hyperframes, ['render', projectDir, '--output', mp4, '--fps', String(CAPTURE_FPS), '--quality', 'looks',
  '--video-frame-format', 'png', '--strict', '--no-best-effort', '--quiet'], { env: hfEnv });

// README animation: short highlights taken from the rendered film.
const webp = join(outDir, 'tour.webp');
const poster = join(outDir, 'tour-poster.png');
const highlights = [];
for (const segment of film.segments) {
  if (segment.id === 'intro') highlights.push([segment.start + 0.9, 2.6]);
  else if (segment.id.startsWith('scene-')) highlights.push([segment.start + 10, 5]);
  else if (segment.id.startsWith('meme-')) highlights.push([segment.start + 1.8, Math.min(4, segment.duration - 2)]);
  else if (segment.id === 'outro') highlights.push([segment.start + 2, 2.5]);
}
const scaledDir = join(workDir, 'webp');
mkdirSync(scaledDir);
highlights.forEach(([start, length], index) => {
  ffmpeg(['-ss', String(start), '-t', String(length), '-i', mp4, '-vf', `fps=${WEBP_FPS},scale=${WEBP_WIDTH}:-1:flags=lanczos`,
    join(scaledDir, `h${index}-%03d.png`)]);
});
const frames = readdirSync(scaledDir).sort().map((name) => join(scaledDir, name));
run('img2webp', ['-loop', '0', '-lossy', '-q', '60', '-d', String(Math.round(1000 / WEBP_FPS)), ...frames, '-o', webp]);

const announcement = film.segments.find((s) => s.id.startsWith('scene-'));
ffmpeg(['-ss', String(announcement.start + 12), '-i', mp4, '-frames:v', '1', poster]);
if (!arg('project-dir')) rmSync(workDir, { recursive: true, force: true });

for (const [file, limit] of [[mp4, MAX_MP4_BYTES], [webp, MAX_WEBP_BYTES]]) {
  const size = statSync(file).size;
  console.log(`record-tour: ${file} ${(size / 1024 / 1024).toFixed(2)} MB`);
  if (size >= limit) fail(`${file} exceeds the ${limit / 1024 / 1024} MB budget`);
}
