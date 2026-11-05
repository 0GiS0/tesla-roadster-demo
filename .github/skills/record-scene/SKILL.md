---
name: record-scene
description: "Graba una escena de la web (original o MEME) de principio a fin como MP4 H.264 listo para adjuntar al cuerpo de una PR. USE FOR: vídeo de un meme para la PR, grabar la reproducción de una escena. DO NOT USE FOR: añadir vídeos a la web o a public/, el tour del README (#37)."
---

# Grabar una escena

Cada PR que añade o cambia una escena MEME **debe** llevar el vídeo de la escena en su cuerpo. El vídeo es apoyo para la PR: **nunca** se versiona ni va a `public/`.

## Cómo funciona

`scripts/record-scene.mjs` abre la escena (`#meme/<slug>`) con Playwright, deja la reproducción en pausa y mueve la línea de tiempo a cada instante absoluto (`frame / fps`). Como `Scenario.evaluate(time)` es determinista, el resultado no depende del rendimiento de la máquina. Captura el canvas y lo codifica con ffmpeg (H.264, `yuv420p`, `faststart`, CRF 26): ~10 s a 30 fps pesa menos de 1 MB. No cambia el comportamiento de la app.

Requisitos: ffmpeg en el PATH, `npm ci` (usa `playwright-core`) y Chromium de Playwright (`npx playwright-core install chromium` si falta). Renderiza con SwiftShader (≈1 s por fotograma): una escena de 10 s tarda unos 5 min.

## Procedimiento

1. Arranca la web: `npm run dev` (o `npm run build && npm exec vite preview -- --host 127.0.0.1`, cambiando `--url` a `http://127.0.0.1:4173/tesla-roadster-demo/`).
2. Graba (`--portrait` genera la variante vertical 720×1280, opcional):
   `node .github/skills/record-scene/scripts/record-scene.mjs --scene <slug> --out <slug>.mp4`
   Sin `--scene` graba la rampa original. Salida por defecto 1280×720 (16:9), configurable con `--width`/`--height`; otras opciones: `--fps`, `--crf`, `--url`.
3. Comprueba que pesa < 10 MB y revisa algún fotograma (`ffmpeg -ss 5 -i <slug>.mp4 -frames:v 1 f.png`).
4. Adjúntalo al cuerpo de la PR con `gh pr create --attach './<slug>.mp4'` o `gh pr edit <n> --attach …` (los vídeos no admiten texto alternativo; añade un pie en el cuerpo) y verifica en GitHub que el reproductor aparece. Si falla, revisa la PR antes de reintentar para no duplicar.

No hagas commit del vídeo.
