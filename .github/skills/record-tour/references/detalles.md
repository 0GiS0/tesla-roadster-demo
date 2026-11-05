# Detalles del tour

El tour lo produce `scripts/record-tour.mjs` (`npm run tour`), con ayuda de `scripts/tour/`:

- `catalog.mjs` carga `src/sceneCatalog.ts` con Vite, así que el tour siempre refleja el catálogo.
- `moments.mjs` decide qué tramo de cada escena se muestra y cuánto dura. La escena original dura 4,5 s y cada meme hasta 3,5 s; con muchos memes el tramo de cada uno se reduce (mínimo 1,5 s) para que la película siga siendo corta. Con la escena original y dos memes dura 11,5 s.
- `film.mjs` escribe el proyecto HyperFrames (`index.html` y `compositions/*.html`): un tramo por escena, con título, resumen y crédito de la fuente. Todo es local (GSAP, fuentes de HyperFrames).

## Cómo se graba

Playwright abre `vite preview` sobre `dist` con Chromium y SwiftShader (sin GPU), navega a la ruta de cada escena y, para cada fotograma (24 fps), fija el control «Tiempo de la maniobra» en `from + n/24`. Como `Scenario.evaluate(time)` depende solo del tiempo absoluto, el resultado es determinista y no depende de la velocidad de la máquina. Solo se capturan los segundos del momento clave, no la escena entera. Cada clip se recodifica con `-g 30`; sin fotogramas clave cada segundo HyperFrames congela fotogramas al buscar.

Después `hyperframes check` y `hyperframes render --strict` producen `tour.mp4` (1920×1080, sin audio) y `ffmpeg` e `img2webp` derivan `tour.webp` (640 px, 10 fps) y `tour-poster.png`.

## Opciones

`--build` (ejecuta `npm run build` antes), `--dist` (`dist`), `--out` (`docs/assets`), `--clips-dir DIR` (reutiliza clips ya grabados para volver a montar rápido; bórralos si cambia `tourMoment`) y `--project-dir DIR` (conserva el proyecto HyperFrames para inspeccionarlo).

## Requisitos

Node.js 22.12+, `npm ci`, Chromium de Playwright, `ffmpeg` e `img2webp`. La versión de `hyperframes` está fijada en `devDependencies`; el script desactiva su actualización y sus skills (`HYPERFRAMES_SKIP_SKILLS`, `HYPERFRAMES_NO_UPDATE_CHECK`). Con SwiftShader tarda unos 4 minutos.

## Presupuesto y fallos

El comando termina con error si el MP4 pesa 5 MB o más, el WebP 2 MB o más, si una escena no carga (WebGL 2 o modelo) o si la página lanza errores. Con más de cuatro memes la película supera los 15 s: acorta sus `tourMoment`.

## Relación con otras skills

`record-scene` graba una escena completa como vídeo adjunto a una PR y no se versiona. `record-tour` genera el resumen versionado del README.
