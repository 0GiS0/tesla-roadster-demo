# Skills y MCP

> **Propósito:** inventariar las skills del repositorio y el servidor MCP configurado, y explicar cómo se validan.
> **Qué mantener:** la lista de skills (una por carpeta de `.github/skills/`), la configuración de `.github/mcp.json` y el funcionamiento de `validate-skills.yml`. Revisa esta página cuando cambie cualquiera de ellos.

## Skills

Viven en `.github/skills/<nombre>/SKILL.md`.

### `meme-concept-image`

Genera una imagen de concepto en el estilo low-poly de la web para cada propuesta de escena MEME elegida (issue `🖼️ meme` o borrador con los campos de `meme-proposal.yml`) y la adjunta siempre al issue.

- **Procedimiento:** captura de referencia con Playwright de la escena existente; prompt en inglés con la plantilla de `references/prompts.md` (sin UI, texto, logotipos, marcas, matrículas ni personas); imagen a 1536×1024; revisión y, si falla, una regeneración; adjuntarla con `gh issue create/edit --attach` indicando que está generada con IA.
- **Límites:** es apoyo para issues, nunca un recurso de la web ni se añade a `public/`. No se versionan capturas ni `concepto-<slug>.png`; solo `examples/`, y solo si lo pide la autora.
- **Contenido:** `SKILL.md`, `references/prompts.md` y `examples/` (tres resultados aprobados como referencia visual).

## MCP

`.github/mcp.json` configura un único servidor, **playwright**, en local con `npx @playwright/mcp@0.0.83` en modo aislado y sin interfaz (`--isolated`, `--headless`), con service workers bloqueados. Solo puede navegar a `http://127.0.0.1:5173`, `http://127.0.0.1:4173` y `https://0gis0.github.io`.

## Validación

`.github/workflows/validate-skills.yml` se ejecuta cuando cambian `.github/skills/**` o el propio workflow (en PR y en pushes a `main`). Instala waza con versión y checksum SHA-256 fijados, comprueba que las skills están listas, cuenta sus tokens y compara el resultado con la línea base de `main`.

## Relación con la fábrica

Los cambios en skills y MCP son cambios de la fábrica (`🏭 software-factory`): siempre los revisa una persona. Ver [Fábrica de software](fabrica-de-software.md).
