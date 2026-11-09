# Cómo añadir un meme

> **Propósito:** guiar la incorporación de una escena nueva al Modo MEME, desde la propuesta hasta el código.
> **Qué mantener:** los campos de la plantilla, los pasos de implementación y la lista de criterios. Revisa esta página cuando cambien `.github/ISSUE_TEMPLATE/meme-proposal.yml`, `src/sceneCatalog.ts` o el contrato `Scenario`.

## 1. Propuesta

Se abre un issue con la plantilla **🖼️ Propuesta de escena MEME** (`.github/ISSUE_TEMPLATE/meme-proposal.yml`; etiquetas `🖼️ meme` y `🔍 needs-triage`). Sus campos:

`scene_name`, `slug`, `source_link`, `author`, `video_segment`, `choreography`, `environment`, `framing`, `approx_duration`, `references`, una lista de criterios de aceptación y confirmaciones obligatorias (sin marcas ni personajes protegidos; geometría original y sin recursos externos).

El triaje exige descripción, una imagen o enlace de referencia y las dos «Confirmaciones obligatorias» marcadas; si falta algo, el issue pasa a `💬 needs-info`. Si falta alguna confirmación, el comentario pide a la autora que marque ambas: ni el triaje ni el agente pueden hacerlo por ella (ver [Fábrica de software](fabrica-de-software.md)).

## 2. Imagen de concepto

Para cada meme elegido se genera una imagen orientativa con la skill `meme-concept-image` y se adjunta al issue. Es material de apoyo: nunca se añade a la web ni a `public/`. Ver [Skills y MCP](skills-y-mcp.md).

## 3. Implementación

1. En `src/scenario.ts`, añade un `Scenario` puro: `id`, `title`, `duration` y `evaluate(time)`, que dependa solo del tiempo absoluto.
2. En `src/sceneCatalog.ts`, añade una entrada a `sceneCatalog` con `mode: 'meme'`, `hash` con la forma `#meme/<slug>`, `environment`, cámaras de escritorio y vertical (y `fit` si hace falta), `copy` en español y `source` con el crédito.
3. Si la escena necesita un entorno nuevo, amplía la unión y el render en `src/Scene.tsx` (hoy existen `ramp`, `pothole`, `parking` y `cables`).
4. Añade pruebas en `src/scenario.test.ts`: contacto, continuidad, determinismo y límites de reproducción, además de la ruta del hash.
5. El catálogo del Modo MEME se construye solo a partir de `sceneCatalog`; no hay otra lista que actualizar en la interfaz.

## 4. Criterios para darlo por terminado

Son los de la plantilla: `Scenario` puro y determinista; pruebas de contacto, continuidad, determinismo y límites; crédito visible («Visto en @X · Ver original en X», cambiando la plataforma final cuando corresponda); textos en español; encuadre correcto en escritorio, vertical y horizontal baja con capturas antes y después; y los límites de rendimiento de [Guardarraíles](guardarrailes.md). Además deben pasar lint, tipos, pruebas, validación del GLB y build.

## Referencia

«Bache volador» (`src/sceneCatalog.ts`, `potholeFlight`) es la escena de ejemplo; su revisión está en [Revisión del Modo MEME](meme-review.md).
