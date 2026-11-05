---
name: meme-concept-image
description: "Genera siempre una imagen de concepto en el estilo low-poly de la web para cada propuesta de escena MEME elegida (Issue 🖼️ meme o borrador con los campos de meme-proposal.yml), usando una captura de Playwright como referencia, y la adjunta siempre al Issue. USE FOR: imagen de concepto de un meme, valorar una propuesta. DO NOT USE FOR: implementar la escena, añadir imágenes a la web o a public/."
---

# Imagen de concepto para memes

Se genera **siempre**, para cada meme elegido como propuesta. Es apoyo para Issues, **nunca** activo de la web ni se añade al repo (salvo `examples/`).

**Entrada:** Issue `🖼️ meme` o borrador con `scene_name`, `slug`, `choreography`, `environment`, `framing` de `meme-proposal.yml`.

## Procedimiento

1. Captura de referencia:
   `npx -y playwright@latest screenshot --viewport-size=1440,900 --wait-for-timeout=8000 "https://0gis0.github.io/tesla-roadster-demo/#meme/bache-volador" referencia-estilo.png`
2. Prompt en inglés con la plantilla de [prompts](references/prompts.md): estilo fijo + escena + restricciones (sin UI, texto, logos, marcas, matrículas ni personas). Lugares genéricos.
3. Genera a **1536×1024** con la captura como referencia (y `examples/` si se puede). Guarda `concepto-<slug>.png`.
4. Revisa: sin texto, logotipos, marcas, matrículas ni personas, y el chiste se entiende. Si falla, regenera **una vez**.
5. Si se crea el Issue, adjúntala **siempre** con `gh issue create/edit --attach`, conservando el cuerpo y marcándola como imagen generada con IA ([comandos](references/prompts.md#publicación)).

La PR de la escena lleva su vídeo (skill `record-scene`).

No hagas commit de capturas ni de `concepto-<slug>.png`; solo se versiona `examples/`, y solo si lo pide la autora.
