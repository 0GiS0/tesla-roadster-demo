# Vídeo y captura de las escenas en las PR

El Copilot cloud agent no puede subir adjuntos (`gh pr edit --attach`) y GitHub Actions tampoco puede crear `user-attachments`. Por eso las PR que cambian una escena MEME reciben su media de forma automática mediante dos workflows.

## Cómo funciona

1. [`scene-media.yml`](../.github/workflows/scene-media.yml) (`pull_request`, solo lectura, sin secretos). Se lanza únicamente si la PR toca `src/sceneCatalog.ts`, `src/scenario.ts`, `src/Scene.tsx`, `src/ParkingLot.tsx` o `src/framing.ts`. `scripts/scene-media/changed-scenes.mjs` decide qué escenas MEME grabar: si hay entradas MEME nuevas o editadas en `src/sceneCatalog.ts`, graba únicamente esas escenas, aunque también cambie código compartido o de entorno. Si no hay ninguna entrada MEME nueva o editada, conserva la comprobación de regresiones: el código compartido graba todas las escenas MEME y `ParkingLot.tsx` solo las de entorno `parking` (también cuando solo se elimina una entrada del catálogo). Si no hay ninguna afectada, no se graba nada. Por cada escena (máximo 6) graba con `record-scene --preset ci` el MP4, la captura del fotograma clave (55 %) y un GIF de vista previa, y los sube como artefactos.
2. [`scene-media-publish.yml`](../.github/workflows/scene-media-publish.yml) (`workflow_run`, con escritura). Se ejecuta desde la rama por defecto, **sin hacer checkout del código de la PR**. Valida los artefactos como datos no confiables (número de PR, SHA, slugs, tipo y tamaño de archivo), comprueba que la PR sigue abierta en ese commit, publica los archivos en la rama `pr-media` y crea o actualiza **un único comentario** con la captura y el GIF incrustados y el enlace al MP4.

## Decisión de publicación

Se descartó el artefacto solo (no se ve incrustado y caduca) y los adjuntos (imposibles desde Actions). Se eligió una **rama de media** (`pr-media`, carpeta `pr-<n>/`) enlazada por commit desde el comentario, con GIF y PNG incrustados: se ven en la propia PR, los enlaces son durables y el MP4 se descarga completo. Los archivos nunca se versionan en `main`. En un repositorio privado las imágenes solo las ven quienes tienen acceso a él.

## Seguridad

- El workflow que ejecuta código de la PR solo tiene `contents: read`, así que en forks es inofensivo.
- El que escribe solo corre desde la rama por defecto y nunca ejecuta código de la PR; únicamente lee ficheros validados.
- Dos workflows separados evitan exponer permisos de escritura a código no confiable.
- Los comentarios se serializan por concurrencia y se localizan por marcador.

## Para agentes

Si no puedes adjuntar archivos, confía en este workflow: no dejes casillas de evidencia marcadas sin haberla producido ni inventes capturas. Haz siempre una captura «después» con Playwright MCP de cualquier cambio visual.

## Limitación

El disparador `workflow_run` solo funciona cuando el workflow de publicación está en la rama por defecto, así que el flujo completo no se puede probar antes de fusionar.
