---
name: add-meme-scene
description: "Convierte una propuesta de escena MEME aprobada (Issue 🖼️ meme con los campos de meme-proposal.yml, o el formato antiguo de #8–#11) en una escena de la web: Scenario, catálogo, entorno, tests, validaciones y capturas. USE FOR: implementar una escena MEME aprobada. DO NOT USE FOR: proponer o valorar memes, generar imágenes de concepto, cambiar la escena original ni refactorizar."
---

# De Issue a escena MEME

Describe el procedimiento **actual**, sin refactorizar. Detalle y rutas en [procedimiento](references/procedimiento.md).

## Pasos

1. `gh issue view <n>` y valida los campos contra `.github/ISSUE_TEMPLATE/meme-proposal.yml` (o el formato antiguo de #8–#11). Si falta algo obligatorio, pregunta.
2. Añade el `Scenario` en `src/scenario.ts`: puro, determinista y dependiente del tiempo absoluto.
3. Regístralo en `src/sceneCatalog.ts`: hash `#meme/<slug>`, `source` con el crédito real (X, TikTok, YouTube…) y, si quieres, `tourMoment` (instante o rango en segundos) con el momento clave que mostrará el tour.
4. Si el entorno es nuevo, amplía la unión cerrada `environment` (`SceneDefinition`) y su rama de render en `src/Scene.tsx`.
5. Añade tests en `src/scenario.test.ts`: contacto, continuidad, determinismo y límites.
6. Valida: `npm run typecheck`, `npm test`, `python3 model/validate_glb.py`, `npm run build`.
7. Captura escritorio, vertical y horizontal baja (Playwright MCP si existe) y mide con `?debug=1`.
8. Pide revisión independiente del diff y **para antes de abrir la PR**: hace falta aprobación explícita.

Reglas: código y comentarios en inglés, interfaz en español, geometría procedural original, sin marcas ni recursos externos.
