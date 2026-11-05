# Detalles de la grabación

`scripts/record-scene.mjs` abre la escena (`#meme/<slug>`) con Playwright, deja la reproducción en pausa y mueve la línea de tiempo a cada instante absoluto (`frame / fps`). Como `Scenario.evaluate(time)` es determinista, el resultado no depende del rendimiento de la máquina. Captura la página con el escenario a pantalla completa y codifica con ffmpeg (H.264, `yuv420p`, `faststart`, CRF 26): ~10 s a 30 fps pesa menos de 1 MB. No cambia el comportamiento de la app.

## Requisitos

- ffmpeg en el PATH y `npm ci` (usa `playwright-core`).
- Chromium de Playwright: `npx playwright-core install chromium` si falta.
- Renderiza con SwiftShader (≈1 s por fotograma): una escena de 10 s tarda unos 5 min.

## Servidor

`npm run dev`, o `npm run build && npm exec vite preview -- --host 127.0.0.1` con `--url http://127.0.0.1:4173/tesla-roadster-demo/`.

## Opciones

`--scene`, `--out`, `--url`, `--fps` (30), `--width`/`--height` (1280×720, enteros pares), `--portrait` (720×1280), `--crf` (26).

## Adjuntar

Los vídeos no admiten texto alternativo en `--attach`: añade un pie en el cuerpo. Si falla, revisa la PR antes de reintentar para no duplicar.
