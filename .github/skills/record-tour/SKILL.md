---
name: record-tour
description: "Graba el tour corto de la web (10–15 s) con HyperFrames: primero la escena original de la rampa y después el momento clave de cada meme del catálogo, y regenera docs/assets/tour.mp4, tour.webp y tour-poster.png. Pensada para un agente sin intervención humana, en un runner Linux sin GPU. USE FOR: regenerar el tour del README tras un despliegue, ajustar el momento clave de un meme. DO NOT USE FOR: grabar una escena completa para una PR (usa record-scene), añadir o editar memes, ni tocar public/."
---

# Grabar el tour

Un único comando, sin preguntas, que escribe en `docs/assets/`. Requisitos, opciones y solución de fallos: [detalles](references/detalles.md).

## Procedimiento

1. Prepara el entorno (una vez por runner): `npm ci`, `npx playwright install --with-deps chromium` y `ffmpeg` + `img2webp` (paquete `webp`) en el PATH.
2. Graba: `npm run tour -- --build`. Compila `dist`, graba solo el momento clave de cada escena a fotograma fijado (SwiftShader, sin GPU), monta con HyperFrames (`check` y `render`) y genera los tres archivos.
3. Comprueba la salida de `record-tour:`: el MP4 dura 10–15 s (el comando lo exige) y pesa < 5 MB, el WebP < 2 MB. Si un límite se supera, el comando falla.
4. Revisa un fotograma (`ffmpeg -ss 5 -i docs/assets/tour.mp4 -frames:v 1 f.png`) y haz commit de `docs/assets/tour.*` y `tour-poster.png`.

## Memes nuevos

Entran solos desde `src/sceneCatalog.ts` (`mode: 'meme'`). El momento clave es opcional: `tourMoment: 6` (instante) o `tourMoment: { from: 2.5, to: 6 }` (rango del deslizador, en segundos). Sin él se usa una ventana centrada al 55 % de la escena.

No edites la skill ni los scripts para añadir un meme.
