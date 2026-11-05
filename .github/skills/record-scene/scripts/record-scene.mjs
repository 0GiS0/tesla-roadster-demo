#!/usr/bin/env node
// Records a scene from start to end as an H.264 MP4 using deterministic frame stepping:
// the playback is paused, the timeline slider is moved to each absolute time (frame / fps)
// and the canvas is captured, so the result does not depend on machine performance.
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
    help: { type: 'boolean', default: false },
  },
});

if (values.help) {
  console.log(`Usage: node .github/skills/record-scene/scripts/record-scene.mjs [--scene <slug>] [--out <file.mp4>]
  [--url <base>] [--fps 30] [--width 1280] [--height 720] [--portrait] [--crf 26]
  --scene     meme slug (e.g. robo-de-plaza); omit for the original ramp scene
  --portrait  vertical framing, fixed at 720x1280`);
  process.exit(0);
}

const fps = Number(values.fps);
const portrait = values.portrait;
const width = portrait ? 720 : Number(values.width);
const height = portrait ? 1280 : Number(values.height);
const slug = values.scene.replace(/^#?(meme\/)?/, '');
const hash = slug ? `#meme/${slug}` : '';
const out = resolve(values.out ?? `${slug || 'rampa'}${portrait ? '-vertical' : ''}.mp4`);
const base = values.url.endsWith('/') ? values.url : `${values.url}/`;

const frameDir = mkdtempSync(join(tmpdir(), 'record-scene-'));
mkdirSync(resolve(out, '..'), { recursive: true });

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const problems = [];
  page.on('pageerror', (error) => problems.push(error.message));
  await page.goto(`${base}${hash}`);
  await page.waitForSelector('button.primary:not([disabled])', { timeout: 60_000 });
  const canvas = page.locator('canvas').first();
  await canvas.waitFor();

  const duration = Number(await page.locator('input.timeline').getAttribute('max'));
  const frames = Math.round(duration * fps) + 1;
  console.log(`Recording "${slug || 'ramp'}": ${duration}s, ${frames} frames at ${fps} fps, ${width}x${height}`);

  const seek = (time) => page.evaluate((t) => {
    const slider = document.querySelector('input.timeline');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(slider, String(t));
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    return new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  }, time);

  for (let i = 0; i < frames; i += 1) {
    await seek(Math.min(i / fps, duration));
    await canvas.screenshot({ path: join(frameDir, `${String(i).padStart(5, '0')}.png`) });
    if (i % 100 === 0) console.log(`  frame ${i}/${frames}`);
  }
  if (problems.length) console.warn(`Page errors: ${problems.join(' | ')}`);

  const box = await canvas.boundingBox();
  const evenW = Math.floor(box.width / 2) * 2;
  const evenH = Math.floor(box.height / 2) * 2;
  const ffmpeg = spawnSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(frameDir, '%05d.png'),
    '-vf', `crop=${evenW}:${evenH}:0:0`, '-c:v', 'libx264', '-preset', 'slow', '-crf', values.crf,
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out,
  ], { stdio: 'inherit' });
  if (ffmpeg.status !== 0) throw new Error('ffmpeg failed');
  console.log(`Saved ${out} (${(statSync(out).size / 1e6).toFixed(2)} MB)`);
} finally {
  await browser.close();
  rmSync(frameDir, { recursive: true, force: true });
}
