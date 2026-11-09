# Roadster · Más allá del asfalto — Wiki del proyecto

> **Propósito:** portada de la wiki. Explica qué es el proyecto y enlaza cada página de `docs/`.
> **Qué mantener:** que cada página de `docs/` aparezca en el índice con una descripción de una línea, y que el resumen del proyecto coincida con el código.

## Qué es el proyecto

Una recreación artística independiente de una presentación del Roadster con rampa, sin afiliación con Tesla y sin pretensión de simulación física. Es una web estática, en español, que necesita WebGL 2. Está hecha con Vite, React, TypeScript, Three.js, React Three Fiber y Drei, y se publica en GitHub Pages. Todos los recursos de ejecución se sirven desde el propio proyecto.

La web tiene dos modos:

- **Original:** una maniobra de 28 segundos (subida, giro, vuelo y aterrizaje) sobre una rampa.
- **Modo MEME:** un catálogo de escenas inspiradas en memes. Hoy contiene «Bache volador» (12 segundos), «Robo de plaza» (10 segundos) y «Cables» (12 segundos).

Además, el repositorio funciona como una *fábrica de software*: las ideas entran como issues, se clasifican con reglas escritas, un agente las implementa y una persona las revisa antes de integrarlas.

## Índice

| Página | De qué trata |
|---|---|
| [Arquitectura de la web](arquitectura.md) | Estructura del código, contrato `Scenario`, catálogo de escenas, modelo 3D y despliegue. |
| [Cómo añadir un meme](anadir-un-meme.md) | Pasos y criterios para incorporar una escena nueva al Modo MEME. |
| [Fábrica de software](fabrica-de-software.md) | Recorrido de un issue: plantillas, triaje, agente, revisión y merge. |
| [Skills y MCP](skills-y-mcp.md) | Skills del repositorio, servidor MCP configurado y cómo se validan. |
| [Desarrollo](desarrollo.md) | Detalles técnicos y de operación, como la generación del tour en vídeo. |
| [Media en PRs](media-en-prs.md) | Cómo las PR que cambian una escena reciben vídeo y captura automáticos y por qué se publican así. |
| [Guardarraíles](guardarrailes.md) | Reglas que no se deben romper: alcance, rendimiento, accesibilidad y modelo. |
| [Lights-out](lights-out.md) | Qué cambios (`docs/` y `README.md`) se mergean sin revisión humana, por qué y cómo los mantiene el workflow `📚 Docs sync`. |
| [Revisión del Modo MEME](meme-review.md) | Evidencia de revisión de la issue #5 (histórica, en inglés). |
| [Revisión previa a PR](pre-pr-review.md) | Evidencia de revisión de la issue #1 (histórica). |

## Dónde mirar además

- [`README.md`](../README.md): ejecución local, modelo y despliegue.
- [`AGENTS.md`](../AGENTS.md): instrucciones para agentes; es la fuente de las reglas de trabajo.
- [`.github/skills/triage-issue/`](../.github/skills/triage-issue/SKILL.md): skill del triaje; las reglas están en [`references/reglas.md`](../.github/skills/triage-issue/references/reglas.md).

Cuando la documentación y el código discrepan, manda el código.
