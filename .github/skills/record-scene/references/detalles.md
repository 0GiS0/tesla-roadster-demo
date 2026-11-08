# Detalles de la grabación

`scripts/record-scene.mjs` abre la escena (`#meme/<slug>`) con Playwright, deja la reproducción en pausa y mueve la línea de tiempo a cada instante absoluto (`frame / fps`). Como `Scenario.evaluate(time)` es determinista, el resultado no depende del rendimiento de la máquina. Tras cargar, el script toma el control de `requestAnimationFrame`: la escena se renderiza solo una vez por fotograma capturado, no en bucle continuo. Captura la página con el escenario a pantalla completa y codifica con ffmpeg (H.264, `yuv420p`, `faststart`, CRF 26): ~10 s a 30 fps pesa menos de 1 MB. No cambia el comportamiento de la app.

## Requisitos

- ffmpeg en el PATH y `npm ci` (usa `playwright-core`).
- Chromium de Playwright: `npx playwright-core install chromium` si falta.
- Renderiza con SwiftShader, sin GPU. En un equipo normal tarda ≈0,4 s por fotograma a 640×360; en 2 vCPU sin GPU, unos 1,4 s por fotograma a 960×540 (la escena `cables`, 121 fotogramas, 3 min).

## 🐢 Runners sin GPU

Con WebGL por software el render va a unos 4 FPS. La causa del `page.screenshot: Timeout 30000ms exceeded` era que la escena seguía renderizando en bucle mientras Playwright esperaba a capturar: cada captura tardaba entre 3 y 10 s incluso a 640×360, y a veces superaba los 30 s. Se resuelve con tres medidas:

- El render va por demanda (ver arriba): la página queda ociosa durante la captura.
- `--frame-timeout <s>` (120 por defecto) fija el plazo de cada fotograma y se reintenta una vez; el error indica qué opción subir.
- `--preset ci` aplica 10 fps, 960×540 y CRF 30. Las opciones explícitas (`--fps`, `--width`, `--height`, `--crf`) prevalecen sobre el preset. Para acortar más, baja `--fps` o la resolución.

Verificado en un contenedor Linux `mcr.microsoft.com/playwright:v1.64.1-noble` limitado a 2 CPU y sin GPU, que aproxima `ubuntu-latest`. Antes de la corrección, 61 fotogramas a 5 fps y 640×360 tardaban 12 min.

## Servidor

`npm run dev`, o `npm run build && npm exec vite preview -- --host 127.0.0.1` con `--url http://127.0.0.1:4173/tesla-roadster-demo/`.

## Opciones

`--scene`, `--out`, `--url`, `--fps` (30), `--width`/`--height` (1280×720, enteros pares), `--portrait` (720×1280), `--crf` (26), `--preset ci`, `--frame-timeout` (120 s), `--still <0-1>` con `--still-out <png>` y `--still-only`.

## 🖼️ Captura «después»

`--still 0.55 --still-out cables-despues.png` guarda un PNG del fotograma en esa fracción de la escena (0,55 es el momento clave del tour). Con `--still-only` no se codifica el vídeo. La captura es apoyo de la PR: no se versiona.

## Adjuntar

Los vídeos no admiten texto alternativo en `--attach`: añade un pie en el cuerpo. Si falla, revisa la PR antes de reintentar para no duplicar.
