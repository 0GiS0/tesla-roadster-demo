---
name: record-scene
description: "Graba una escena de la web (original o MEME) de principio a fin como MP4 H.264 listo para adjuntar al cuerpo de una PR. USE FOR: vídeo de un meme para la PR, grabar la reproducción de una escena. DO NOT USE FOR: añadir vídeos a la web o a public/, el tour del README (usa record-tour)."
---

# Grabar una escena

Cada PR que añade o cambia una escena MEME **debe** llevar su vídeo en el cuerpo. Es apoyo de la PR: **nunca** se versiona ni va a `public/`. Funcionamiento, requisitos y opciones: [detalles](references/detalles.md).

## Procedimiento

1. Arranca la web (`npm run dev`).
2. Graba (1280×720 por defecto):
   `node .github/skills/record-scene/scripts/record-scene.mjs --scene <slug> --out <slug>.mp4`
   Sin `--scene` graba la rampa original.
3. Comprueba que pesa < 10 MB y revisa un fotograma (`ffmpeg -ss 5 -i <slug>.mp4 -frames:v 1 f.png`).
4. Adjúntalo con `gh pr create --attach './<slug>.mp4'` o `gh pr edit <n> --attach …` y verifica en GitHub que se reproduce.

No hagas commit del vídeo.
