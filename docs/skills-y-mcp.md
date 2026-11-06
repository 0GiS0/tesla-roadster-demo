# Skills y MCP

> **Propósito:** inventariar las skills del repositorio y el servidor MCP configurado, y explicar cómo se validan.
> **Qué mantener:** la lista de skills (una por carpeta de `.github/skills/`), la configuración de `.github/mcp.json` y el funcionamiento de `validate-skills.yml`. Revisa esta página cuando cambie cualquiera de ellos.

## Skills

Viven en `.github/skills/<nombre>/SKILL.md`.

### `add-meme-scene`

Convierte una propuesta de escena MEME aprobada (issue `🖼️ meme` con los campos de `meme-proposal.yml`, o el formato antiguo de #8–#11) en una escena de la web.

- **Procedimiento:** `Scenario` puro en `src/scenario.ts`, registro en `src/sceneCatalog.ts` (hash `#meme/<slug>`, `source` y `tourMoment` opcional), entorno nuevo si hace falta en `src/Scene.tsx`, tests en `src/scenario.test.ts`, validaciones (`npm run typecheck`, `npm test`, `python3 model/validate_glb.py`, `npm run build`) y capturas en escritorio, vertical y horizontal baja. Se detiene antes de abrir la PR: hace falta aprobación explícita.
- **Límites:** no propone ni valora memes, no genera imágenes de concepto, no cambia la escena original ni refactoriza.
- **Contenido:** `SKILL.md` y `references/procedimiento.md`.

### `meme-concept-image`

Genera una imagen de concepto en el estilo low-poly de la web para cada propuesta de escena MEME elegida (issue `🖼️ meme` o borrador con los campos de `meme-proposal.yml`) y la adjunta siempre al issue.

- **Procedimiento:** captura de referencia con Playwright de la escena existente; prompt en inglés con la plantilla de `references/prompts.md` (sin UI, texto, logotipos, marcas, matrículas ni personas); imagen a 1536×1024; revisión y, si falla, una regeneración; adjuntarla con `gh issue create/edit --attach` indicando que está generada con IA.
- **Límites:** es apoyo para issues, nunca un recurso de la web ni se añade a `public/`. No se versionan capturas ni `concepto-<slug>.png`; solo `examples/`, y solo si lo pide la autora.
- **Contenido:** `SKILL.md`, `references/prompts.md` y `examples/` (tres resultados aprobados como referencia visual).

### `record-scene`

Graba una escena (original o MEME) de principio a fin como MP4 H.264 para adjuntarlo al cuerpo de la PR. Toda PR que añade o cambia una escena MEME lleva su vídeo.

- **Procedimiento:** con la web en marcha (`npm run dev`), `node .github/skills/record-scene/scripts/record-scene.mjs --scene <slug> --out <slug>.mp4` (1280×720 por defecto; sin `--scene` graba la rampa original). Debe pesar < 10 MB y se adjunta con `gh pr create --attach` o `gh pr edit --attach`.
- **Límites:** el vídeo no se versiona ni va a `public/`; el tour del README usa `record-tour`.
- **Contenido:** `SKILL.md`, `references/detalles.md` y `scripts/`.

### `record-tour`

Graba el tour corto de la web (10–15 s) con HyperFrames: la escena original y el momento clave de cada meme del catálogo. Está pensada para que un agente la ejecute sin intervención humana en un runner Linux sin GPU.

- **Procedimiento:** `npm run tour -- --build` (compila, graba a fotograma fijado con SwiftShader, monta con HyperFrames y escribe `docs/assets/tour.mp4`, `tour.webp` y `tour-poster.png`). Límites comprobados por el comando: MP4 < 5 MB y WebP < 2 MB.
- **Memes nuevos:** entran solos desde `src/sceneCatalog.ts`; `tourMoment` (instante o rango) es opcional.
- **Contenido:** `SKILL.md` y `references/detalles.md`. Reutiliza `scripts/record-tour.mjs` y `scripts/tour/`.

### `triage-issue`

Tria un issue nuevo de la fábrica: elige una etiqueta (`✅ agent-ready`, `📐 needs-spec` o `💬 needs-info`), la luz (`💡 lights-on` o `🌙 lights-out`, solo si es `✅ agent-ready`) y deja un único comentario corto.

- **Procedimiento:** si el issue ya está triado no hace nada; si no, aplica las reglas y ejemplos de `references/reglas.md`, quita `🔍 needs-triage` y comenta con el formato «Triaje / Por qué / Siguiente paso».
- **Límites:** no escribe código, no asigna, cierra ni edita issues y no inventa etiquetas. Ante la duda elige la opción más prudente.
- **Contenido:** `SKILL.md` y `references/reglas.md` (las reglas se editan con PR revisada).

## MCP

`.github/mcp.json` configura un único servidor, **playwright**, en local con `npx @playwright/mcp@0.0.83` en modo aislado y sin interfaz (`--isolated`, `--headless`), con service workers bloqueados. Solo puede navegar a `http://127.0.0.1:5173`, `http://127.0.0.1:4173` y `https://0gis0.github.io`.

## Validación

`.github/workflows/validate-skills.yml` se ejecuta cuando cambian `.github/skills/**` o el propio workflow (en PR y en pushes a `main`). Instala waza con versión y checksum SHA-256 fijados, comprueba que las skills están listas, cuenta sus tokens y compara el resultado con la línea base de `main`.

La comparación mide todos los archivos de cada skill, `SKILL.md` y `references/` incluidos, y falla si alguno crece más de un 10 % respecto a `main` (los archivos nuevos quedan exentos). En cada PR del mismo repositorio, la ejecución publica siempre una tabla con el resultado de cada skill en un único comentario que se actualiza en las ejecuciones siguientes (las PR desde forks solo tienen el resumen del job).

## Relación con la fábrica

Los cambios en skills y MCP son cambios de la fábrica (`🏭 software-factory`): siempre los revisa una persona. Ver [Fábrica de software](fabrica-de-software.md).
