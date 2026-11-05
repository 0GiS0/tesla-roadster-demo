// Records the guided tour of the default ramp scene from a production build.
// The maneuver depends only on absolute time, so the time slider is driven
// frame by frame and each rendered frame is captured. Output is smooth even
// on runners without a GPU. Usage: node scripts/record-tour.mjs [--dist dist] [--out dist]
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { preview } from 'vite';
import { chromium } from 'playwright';

const DURATION = 28;
const CAPTURE_FPS = 24;
const WIDTH = 1280;
const HEIGHT = 720;
const WEBP_START = 10;
const WEBP_END = 20;
const WEBP_FPS = 12;
const WEBP_WIDTH = 720;
const POSTER_TIME = 12;
const MAX_MP4_BYTES = 10 * 1024 * 1024;
const MAX_WEBP_BYTES = 5 * 1024 * 1024;

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
}

function fail(message) {
  console.error(`record-tour: ${message}`);
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) fail(`${command} failed: ${args.join(' ')}`);
}

const ffmpeg = (args) => run('ffmpeg', ['-y', '-loglevel', 'error', ...args]);

function hasFfmpegWebp() {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' });
  return result.status === 0 && result.stdout.includes('libwebp_anim');
}

if (spawnSync('ffmpeg', ['-version']).status !== 0) fail('ffmpeg was not found on PATH');
if (!hasFfmpegWebp() && spawnSync('img2webp', ['-version']).status !== 0) {
  fail('neither ffmpeg libwebp_anim nor img2webp is available');
}

const distDir = resolve(arg('dist', 'dist'));
const outDir = resolve(arg('out', distDir));
const framesDir = mkdtempSync(join(tmpdir(), 'roadster-tour-'));
mkdirSync(outDir, { recursive: true });

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

const total = DURATION * CAPTURE_FPS + 1;
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: 'load' });

  const slider = page.getByLabel('Tiempo de la maniobra');
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
    fail(`the 3D scene did not become ready (WebGL 2 or model failure; canvas present: ${hasCanvas}). Page errors: ${errors.join('; ') || 'none'}`);
  }

  const setTime = (time) =>
    slider.evaluate((el, value) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, String(value));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.blur();
      return new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    }, time);

  for (let i = 0; i < total; i += 1) {
    await setTime(Math.min(DURATION, i / CAPTURE_FPS));
    await page.screenshot({
      path: join(framesDir, `frame-${String(i).padStart(4, '0')}.jpg`),
      type: 'jpeg',
      quality: 92,
    });
    if (i % 96 === 0) console.log(`record-tour: frame ${i + 1}/${total}`);
  }
  if (errors.length > 0) fail(`page errors during capture: ${errors.join('; ')}`);
} finally {
  await browser.close();
  await server.close();
}

const pattern = join(framesDir, 'frame-%04d.jpg');
const mp4 = join(outDir, 'tour.mp4');
const webp = join(outDir, 'tour.webp');
const poster = join(outDir, 'tour-poster.png');
const webpFrames = (WEBP_END - WEBP_START) * WEBP_FPS;
const webpFilter = `fps=${WEBP_FPS},scale=${WEBP_WIDTH}:-1:flags=lanczos`;

ffmpeg(['-framerate', String(CAPTURE_FPS), '-i', pattern, '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);

const webpInput = ['-framerate', String(CAPTURE_FPS), '-start_number', String(WEBP_START * CAPTURE_FPS), '-i', pattern,
  '-frames:v', String(webpFrames), '-vf', webpFilter];
if (hasFfmpegWebp()) {
  ffmpeg([...webpInput, '-c:v', 'libwebp_anim', '-quality', '70', '-compression_level', '6', '-loop', '0', webp]);
} else {
  // ffmpeg without libwebp: scale to PNG frames and assemble with img2webp.
  const scaledDir = join(framesDir, 'webp');
  mkdirSync(scaledDir);
  ffmpeg([...webpInput, join(scaledDir, 'f-%04d.png')]);
  const frames = readdirSync(scaledDir).sort().map((name) => join(scaledDir, name));
  run('img2webp', ['-loop', '0', '-lossy', '-q', '70', '-d', String(Math.round(1000 / WEBP_FPS)), ...frames, '-o', webp]);
}

ffmpeg(['-i', join(framesDir, `frame-${String(POSTER_TIME * CAPTURE_FPS).padStart(4, '0')}.jpg`), '-frames:v', '1', poster]);
rmSync(framesDir, { recursive: true, force: true });

for (const [file, limit] of [[mp4, MAX_MP4_BYTES], [webp, MAX_WEBP_BYTES]]) {
  const size = statSync(file).size;
  console.log(`record-tour: ${file} ${(size / 1024 / 1024).toFixed(2)} MB`);
  if (size >= limit) fail(`${file} exceeds the ${limit / 1024 / 1024} MB budget`);
}
