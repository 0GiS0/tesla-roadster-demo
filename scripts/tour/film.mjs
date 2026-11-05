// Writes the HyperFrames project for the tour film from the scene catalog and
// the recorded clips. Adding a `mode: 'meme'` scene to the catalog adds a
// segment here automatically; nothing is edited by hand.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const FILM_WIDTH = 1920;
export const FILM_HEIGHT = 1080;
export const PAGES_URL = 'https://0gis0.github.io/tesla-roadster-demo/';
const INTRO_SECONDS = 3.5;
const BRIDGE_SECONDS = 3.5;
const OUTRO_SECONDS = 5;

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const round = (value) => Math.round(value * 1000) / 1000;

function scene(id, duration, body, style, script) {
  return `<template>
  <style>
    #${id}-root { position: absolute; inset: 0; overflow: hidden; font-family: "Inter", sans-serif; }
${style}
  </style>
  <div id="${id}-root" data-composition-id="${id}" data-width="${FILM_WIDTH}" data-height="${FILM_HEIGHT}">
${body}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
${script}
    window.__timelines["${id}"] = tl;
  </script>
</template>
`;
}

const darkStyle = (id) => `    #${id}-root { background: #090c13; color: #f1f2f4; }
    #${id}-root .eyebrow { position: absolute; left: 192px; font: 500 28px "Space Mono", monospace; letter-spacing: 8px; color: #b67c55; }
    #${id}-root h1 { position: absolute; left: 192px; right: 192px; font-weight: 300; font-size: 132px; line-height: 1.02; letter-spacing: -4px; }
    #${id}-root p { position: absolute; left: 192px; right: 192px; font-size: 40px; color: #a4a8aa; }`;

function intro() {
  const id = 'intro';
  return scene(
    id,
    INTRO_SECONDS,
    `    <div id="${id}-eyebrow" class="eyebrow" style="top: 270px">MÁS ALLÁ DEL ASFALTO · RECREACIÓN ARTÍSTICA</div>
    <h1 id="${id}-title" style="top: 340px">El suelo era<br/>solo el principio.</h1>
    <p id="${id}-sub" style="top: 650px">Una rampa. Un impulso. Otra dimensión.</p>`,
    darkStyle(id),
    `    tl.fromTo("#${id}-eyebrow", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.1);
    tl.fromTo("#${id}-title", { y: 40 }, { y: 0, duration: 0.8, ease: "power3.out" }, 0);
    tl.fromTo("#${id}-sub", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 1.2);`,
  );
}

function clipScene({ id, entry, duration, light }) {
  const palette = light
    ? { bg: '#efede5', ink: '#343530', accent: '#6f5640', muted: '#55564f', card: '#f9f7f0e6' }
    : { bg: '#090c13', ink: '#f1f2f4', accent: '#b67c55', muted: '#a4a8aa', card: '#10151bdd' };
  const credit = entry.source ? `<div id="${id}-credit" class="credit">${escapeHtml(entry.source.label)}</div>` : '';
  return scene(
    id,
    duration,
    `    <video id="${id}-video" class="clip" data-start="0" data-duration="${round(duration)}" data-track-index="0" src="assets/clips/${entry.key}.mp4" muted playsinline></video>
    <div id="${id}-card" class="card">
      <div class="head"><div class="eyebrow">${escapeHtml(entry.label)}</div><div class="title">${escapeHtml(entry.title)}</div></div>
      <div class="body"><div class="summary">${escapeHtml(entry.summary)}</div>${credit}</div>
    </div>`,
    `    #${id}-root { background: ${palette.bg}; }
    #${id}-video { position: absolute; left: 96px; top: 56px; width: 1728px; height: 720px; object-fit: contain; background: ${palette.bg}; }
    #${id}-card { position: absolute; left: 96px; top: 816px; width: 1728px; height: 196px; display: flex; gap: 56px; align-items: center; padding: 0 40px; background: ${palette.card}; border-left: 6px solid ${palette.accent}; color: ${palette.ink}; }
    #${id}-card .head { flex: none; width: 640px; }
    #${id}-card .eyebrow { font: 500 28px "Space Mono", monospace; letter-spacing: 6px; color: ${palette.accent}; }
    #${id}-card .title { margin-top: 8px; font-size: 60px; font-weight: 500; letter-spacing: -1.5px; line-height: 1.05; }
    #${id}-card .summary { font-size: 32px; line-height: 1.3; color: ${palette.muted}; }
    #${id}-card .credit { margin-top: 14px; font: 500 28px "Space Mono", monospace; color: ${palette.ink}; }`,
    `    tl.fromTo("#${id}-card", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" }, 0.4);`,
  );
}

function bridge() {
  const id = 'bridge';
  return scene(
    id,
    BRIDGE_SECONDS,
    `    <div id="${id}-eyebrow" class="eyebrow" style="top: 300px">MODO MEME</div>
    <h1 id="${id}-title" style="top: 370px">Deja volar<br/>la imaginación.</h1>`,
    `    #${id}-root { background: #efede5; color: #343530; }
    #${id}-root .eyebrow { position: absolute; left: 192px; font: 500 28px "Space Mono", monospace; letter-spacing: 8px; color: #6f5640; }
    #${id}-root h1 { position: absolute; left: 192px; right: 192px; font-weight: 300; font-size: 132px; line-height: 1.02; letter-spacing: -4px; }`,
    `    tl.fromTo("#${id}-eyebrow", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.1);
    tl.fromTo("#${id}-title", { y: 40 }, { y: 0, duration: 0.8, ease: "power3.out" }, 0);`,
  );
}

function outro() {
  const id = 'outro';
  return scene(
    id,
    OUTRO_SECONDS,
    `    <div id="${id}-eyebrow" class="eyebrow" style="top: 260px">PRUÉBALA EN TU NAVEGADOR</div>
    <h1 id="${id}-title" style="top: 330px; font-size: 96px; right: 700px">Roadster,<br/>la demo.</h1>
    <p id="${id}-url" style="top: 640px; right: 700px; font: 500 34px 'Space Mono', monospace; color: #f1f2f4">${escapeHtml(PAGES_URL.replace('https://', ''))}</p>
    <img id="${id}-qr" src="assets/qr-web.svg" alt="QR" style="position: absolute; right: 192px; top: 250px; width: 440px; height: 440px; background: #fff; padding: 20px;"/>`,
    darkStyle(id),
    `    tl.fromTo("#${id}-eyebrow", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.1);
    tl.fromTo("#${id}-title", { y: 40 }, { y: 0, duration: 0.8, ease: "power3.out" }, 0);
    tl.fromTo("#${id}-url", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 1);
    tl.fromTo("#${id}-qr", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 1.2);`,
  );
}

export function writeFilmProject({ catalog, projectDir, clipsDir, qrPath, gsapPath }) {
  const originals = catalog.filter((entry) => entry.mode === 'original');
  const memes = catalog.filter((entry) => entry.mode === 'meme');
  if (originals.length === 0) throw new Error('The catalog has no original scene');

  mkdirSync(join(projectDir, 'compositions'), { recursive: true });
  mkdirSync(join(projectDir, 'assets', 'clips'), { recursive: true });
  copyFileSync(gsapPath, join(projectDir, 'assets', 'gsap.min.js'));
  copyFileSync(qrPath, join(projectDir, 'assets', 'qr-web.svg'));

  const segments = [{ id: 'intro', duration: INTRO_SECONDS, html: intro() }];
  const addClip = (entry, light) => {
    copyFileSync(join(clipsDir, `${entry.key}.mp4`), join(projectDir, 'assets', 'clips', `${entry.key}.mp4`));
    const id = `${entry.mode === 'meme' ? 'meme' : 'scene'}-${entry.key}`;
    segments.push({ id, duration: entry.duration, html: clipScene({ id, entry, duration: entry.duration, light }) });
  };
  originals.forEach((entry) => addClip(entry, false));
  if (memes.length > 0) {
    segments.push({ id: 'bridge', duration: BRIDGE_SECONDS, html: bridge() });
    memes.forEach((entry) => addClip(entry, true));
  }
  segments.push({ id: 'outro', duration: OUTRO_SECONDS, html: outro() });

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
