// Writes the HyperFrames project for the tour film from the scene catalog and
// the recorded key-moment clips. Adding a `mode: 'meme'` scene to the catalog
// adds a segment here automatically; nothing is edited by hand.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const FILM_WIDTH = 1920;
export const FILM_HEIGHT = 1080;

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const round = (value) => Math.round(value * 1000) / 1000;

function clipScene({ id, entry, duration, light }) {
  const palette = light
    ? { bg: '#efede5', ink: '#343530', accent: '#6f5640', muted: '#55564f', card: '#f9f7f0e6' }
    : { bg: '#090c13', ink: '#f1f2f4', accent: '#b67c55', muted: '#a4a8aa', card: '#10151bdd' };
  const credit = entry.source ? `<div id="${id}-credit" class="credit">${escapeHtml(entry.source.label)}</div>` : '';
  return `<template>
  <style>
    #${id}-root { position: absolute; inset: 0; overflow: hidden; font-family: "Inter", sans-serif; background: ${palette.bg}; }
    #${id}-video { position: absolute; left: 96px; top: 56px; width: 1728px; height: 720px; object-fit: contain; background: ${palette.bg}; }
    #${id}-card { position: absolute; left: 96px; top: 816px; width: 1728px; height: 196px; display: flex; gap: 56px; align-items: center; padding: 0 40px; background: ${palette.card}; border-left: 6px solid ${palette.accent}; color: ${palette.ink}; }
    #${id}-card .head { flex: none; width: 640px; }
    #${id}-card .eyebrow { font: 500 28px "Space Mono", monospace; letter-spacing: 6px; color: ${palette.accent}; }
    #${id}-card .title { margin-top: 8px; font-size: 60px; font-weight: 500; letter-spacing: -1.5px; line-height: 1.05; }
    #${id}-card .summary { font-size: 32px; line-height: 1.3; color: ${palette.muted}; }
    #${id}-card .credit { margin-top: 14px; font: 500 28px "Space Mono", monospace; color: ${palette.ink}; }
  </style>
  <div id="${id}-root" data-composition-id="${id}" data-width="${FILM_WIDTH}" data-height="${FILM_HEIGHT}">
    <video id="${id}-video" class="clip" data-start="0" data-duration="${round(duration)}" data-track-index="0" src="assets/clips/${entry.key}.mp4" muted playsinline></video>
    <div id="${id}-card" class="card">
      <div class="head"><div class="eyebrow">${escapeHtml(entry.label)}</div><div class="title">${escapeHtml(entry.title)}</div></div>
      <div class="body"><div class="summary">${escapeHtml(entry.summary)}</div>${credit}</div>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.fromTo("#${id}-card", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, 0.2);
    window.__timelines["${id}"] = tl;
  </script>
</template>
`;
}

export function writeFilmProject({ catalog, projectDir, clipsDir, gsapPath }) {
  const originals = catalog.filter((entry) => entry.mode === 'original');
  const memes = catalog.filter((entry) => entry.mode === 'meme');
  if (originals.length === 0) throw new Error('The catalog has no original scene');

  mkdirSync(join(projectDir, 'compositions'), { recursive: true });
  mkdirSync(join(projectDir, 'assets', 'clips'), { recursive: true });
  copyFileSync(gsapPath, join(projectDir, 'assets', 'gsap.min.js'));

  const segments = [];
  const addClip = (entry, light) => {
    copyFileSync(join(clipsDir, `${entry.key}.mp4`), join(projectDir, 'assets', 'clips', `${entry.key}.mp4`));
    const id = `${entry.mode === 'meme' ? 'meme' : 'scene'}-${entry.key}`;
    segments.push({ id, duration: entry.moment.length, html: clipScene({ id, entry, duration: entry.moment.length, light }) });
  };
  originals.forEach((entry) => addClip(entry, false));
  memes.forEach((entry) => addClip(entry, true));

  let cursor = 0;
  const hosts = segments.map((segment, index) => {
    writeFileSync(join(projectDir, 'compositions', `${segment.id}.html`), segment.html);
    const host = `      <div id="${segment.id}" data-composition-id="${segment.id}" data-composition-src="compositions/${segment.id}.html" data-start="${round(cursor)}" data-duration="${round(segment.duration)}" data-track-index="${index + 1}" data-width="${FILM_WIDTH}" data-height="${FILM_HEIGHT}"></div>`;
    cursor += segment.duration;
    return host;
  });
  const total = round(cursor);

  writeFileSync(
    join(projectDir, 'index.html'),
    `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${FILM_WIDTH}, height=${FILM_HEIGHT}" />
    <script src="assets/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${FILM_WIDTH}px; height: ${FILM_HEIGHT}px; overflow: hidden; background: #090c13; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${FILM_WIDTH}" data-height="${FILM_HEIGHT}">
${hosts.join('\n')}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`,
  );
  writeFileSync(
    join(projectDir, 'hyperframes.json'),
    JSON.stringify({ $schema: 'https://hyperframes.heygen.com/schema/hyperframes.json', paths: { blocks: 'compositions', components: 'compositions/components', assets: 'assets' } }, null, 2),
  );
  writeFileSync(join(projectDir, 'meta.json'), JSON.stringify({ name: 'roadster-tour' }, null, 2));
  let start = 0;
  return {
    total,
    segments: segments.map((s) => {
      const info = { id: s.id, start, duration: s.duration };
      start += s.duration;
      return info;
    }),
  };
}
