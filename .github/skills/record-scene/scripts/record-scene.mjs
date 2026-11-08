#!/usr/bin/env node
// Records a scene from start to end as an H.264 MP4 using deterministic frame stepping:
// the playback is paused, the timeline slider is moved to each absolute time (frame / fps)
// and the canvas is captured, so the result does not depend on machine performance.
// requestAnimationFrame is taken over after load so the scene renders once per captured frame
// instead of continuously, which is what makes software WebGL (CI runners without GPU) viable.
// Requires a running server (npm run dev, or vite preview) and ffmpeg on PATH.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright-core';

const { values } = parseArgs({
  options: {
    scene: { type: 'string', default: '' },
    url: { type: 'string', default: 'http://127.0.0.1:5173/tesla-roadster-demo/' },
    out: { type: 'string' },
    fps: { type: 'string', default: '30' },
    width: { type: 'string', default: '1280' },
    height: { type: 'string', default: '720' },
    portrait: { type: 'boolean', default: false },
    crf: { type: 'string', default: '26' },
    preset: { type: 'string', default: '' },
    'frame-timeout': { type: 'string', default: '120' },
    still: { type: 'string', default: '' },
    'still-out': { type: 'string', default: '' },
    'still-only': { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
});

if (values.help) {
  console.log(`Usage: node .github/skills/record-scene/scripts/record-scene.mjs [--scene <slug>] [--out <file.mp4>]
  [--url <base>] [--fps 30] [--width 1280] [--height 720] [--portrait] [--crf 26]
  [--preset ci] [--frame-timeout 120] [--still <0-1>] [--still-out <file.png>]
  --preset         ci = light preset for runners without GPU (10 fps, 960x540, crf 30); explicit options win
  --frame-timeout  seconds allowed for each frame capture (default 120)
  --still          also save a PNG of the key frame at this fraction of the scene (0-1); needs --still-out
  --still-out      PNG path for --still
  --still-only     only save the PNG, skip the video (needs --still and --still-out)
  --scene     meme slug (e.g. robo-de-plaza); omit for the original ramp scene
  --portrait  vertical framing, fixed at 720x1280
  Output is exactly width x height (default 1280x720, 16:9).`);
  process.exit(0);
}

const presets = { ci: { fps: '10', width: '960', height: '540', crf: '30' } };
if (values.preset && !presets[values.preset]) {
  console.error(`Unknown --preset "${values.preset}". Available: ${Object.keys(presets).join(', ')}.`);
  process.exit(1);
}
// A preset only fills in options the user did not pass explicitly.
const given = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')[0]));
const pick = (name) => (given.has(name) || !values.preset ? values[name] : presets[values.preset][name]);
const fps = Number(pick('fps'));
const crf = pick('crf');
const portrait = values.portrait;
const width = portrait ? 720 : Number(pick('width'));
const height = portrait ? 1280 : Number(pick('height'));
const frameTimeout = Number(values['frame-timeout']) * 1000;
const stillOnly = values['still-only'];
const still = values.still === '' ? null : Number(values.still);
if (!Number.isFinite(fps) || fps <= 0 || !Number.isFinite(frameTimeout) || frameTimeout <= 0) {
  console.error('--fps and --frame-timeout must be positive numbers.');
  process.exit(1);
}
if ((still !== null || stillOnly) && (still === null || !(still >= 0 && still <= 1) || !values['still-out'])) {
  console.error('--still needs a value between 0 and 1 and --still-out <file.png> (also required by --still-only).');
  process.exit(1);
}
if (![width, height].every((n) => Number.isInteger(n) && n > 0 && n % 2 === 0)) {
  console.error('--width and --height must be positive even integers (required by yuv420p H.264).');
  process.exit(1);
}
const slug = values.scene.replace(/^#?(meme\/)?/, '');
const hash = slug ? `#meme/${slug}` : '';
const out = resolve(values.out ?? `${slug || 'rampa'}${portrait ? '-vertical' : ''}.mp4`);
const base = values.url.endsWith('/') ? values.url : `${values.url}/`;

const stillOut = values['still-out'] ? resolve(values['still-out']) : '';
const frameDir = mkdtempSync(join(tmpdir(), 'record-scene-'));
mkdirSync(resolve(out, '..'), { recursive: true });
if (stillOut) mkdirSync(resolve(stillOut, '..'), { recursive: true });

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(frameTimeout);
  // Until __manualFrames is set the page animates normally; afterwards frames only run on demand.
  await page.addInitScript(() => {
    const realRaf = window.requestAnimationFrame.bind(window);
    const queue = new Map();
    let nextId = 1;
    window.__manualFrames = false;
    window.requestAnimationFrame = (cb) => {
      if (!window.__manualFrames) return realRaf(cb);
      queue.set(nextId, cb);
      return nextId++;
    };
    window.cancelAnimationFrame = (id) => queue.delete(id);
    window.__stepFrames = (count) => {
      for (let i = 0; i < count; i += 1) {
        const pending = [...queue.values()];
        queue.clear();
        const now = performance.now();
        pending.forEach((cb) => cb(now));
      }
    };
  });
  const problems = [];
  page.on('pageerror', (error) => problems.push(error.message));
  await page.goto(`${base}${hash}`);
  await page.waitForSelector('button.primary:not([disabled])', { timeout: 60_000 });
  // Recorder-only styling: the 3D stage fills the whole viewport so the output is exactly width x height.
  await page.addStyleTag({ content: `
    .viewer-stage, .stage { position: fixed !important; inset: 0 !important; z-index: 9999 !important;
      width: 100vw !important; height: 100vh !important; min-height: 0 !important; }
    .intro, .scene-label, .interaction-hint, .keyboard-hint, .loading { display: none !important; }` });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  const canvas = page.locator('canvas').first();
  await canvas.waitFor();

  const duration = Number(await page.locator('input.timeline').getAttribute('max'));
  const frames = Math.round(duration * fps) + 1;
  await page.evaluate(() => { window.__manualFrames = true; });

  const seek = (time) => page.evaluate(async (t) => {
    const slider = document.querySelector('input.timeline');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(slider, String(t));
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    // Let React commit the new time before stepping, then run a few frames to render it.
    await new Promise((done) => setTimeout(done, 0));
    window.__stepFrames(3);
  }, time);
  const capture = async (path) => {
    // Retry once: the first capture after a heavy shader compile can miss its deadline.
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await page.screenshot({ path, animations: 'disabled', caret: 'initial', timeout: frameTimeout });
      } catch (error) {
        if (attempt >= 2) throw new Error(`frame capture failed after ${attempt} attempts (frame timeout ${frameTimeout / 1000}s; raise --frame-timeout): ${error.message}`, { cause: error });
        console.warn(`  capture timed out, retrying once: ${error.message.split('\n')[0]}`);
      }
    }
  };

    if (still !== null) {
    await seek(still * duration);
    await capture(stillOut);
    console.log(`Saved key frame ${stillOut} (t = ${(still * duration).toFixed(2)} s)`);
  }
  if (!stillOnly) {
    console.log(`Recording "${slug || 'ramp'}": ${duration}s, ${frames} frames at ${fps} fps, ${width}x${height}`);

    for (let i = 0; i < frames; i += 1) {
      await seek(Math.min(i / fps, duration));
      await capture(join(frameDir, `${String(i).padStart(5, '0')}.png`));
      if (i % 100 === 0) console.log(`  frame ${i}/${frames}`);
    }
    if (problems.length) console.warn(`Page errors: ${problems.join(' | ')}`);

    const ffmpeg = spawnSync('ffmpeg', [
      '-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(frameDir, '%05d.png'),
      '-vf', `scale=${width}:${height}`, '-c:v', 'libx264', '-preset', 'slow', '-crf', crf,
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out,
    ], { stdio: 'inherit' });
    if (ffmpeg.status !== 0) throw new Error('ffmpeg failed');
    console.log(`Saved ${out} (${(statSync(out).size / 1e6).toFixed(2)} MB)`);
  }
  if (problems.length && stillOnly) console.warn(`Page errors: ${problems.join(' | ')}`);
} finally {
  await browser.close();
  rmSync(frameDir, { recursive: true, force: true });
}
