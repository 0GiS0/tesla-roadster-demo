---
name: meme-concept-image
description: "Genera una imagen de concepto en el estilo low-poly de la web para una propuesta de escena MEME (Issue 🖼️ meme o borrador con los campos de meme-proposal.yml), usando una captura de Playwright como referencia, y la adjunta opcionalmente al Issue. USE FOR: imagen de concepto de un meme, valorar una propuesta de escena. DO NOT USE FOR: implementar la escena, añadir imágenes a la web o a public/."
---

# Imagen de concepto para memes

Material de apoyo para Issues, **nunca** un activo de la web ni se añade al repo (salvo `examples/`).

**Entrada:** Issue `🖼️ meme` o borrador con `scene_name`, `slug`, `choreography`, `environment`, `framing` de `meme-proposal.yml`.

## Procedimiento

1. Captura de referencia:
   `npx -y playwright@latest screenshot --viewport-size=1440,900 --wait-for-timeout=8000 "https://0gis0.github.io/tesla-roadster-demo/#meme/bache-volador" referencia-estilo.png`
2. Prompt en inglés con la plantilla de [prompts](references/prompts.md): estilo fijo + escena variable + «No UI, no text, no logos, no brand marks, no license plates, no people visible». Lugares genéricos, no copias de monumentos.
3. Genera a **1536×1024** con la captura como referencia (y `examples/` como secundarias si se puede). Guarda `concepto-<slug>.png`.
4. Revisa: sin texto, logotipos, marcas, matrículas ni personas, y el chiste se entiende. Si falla, regenera **una vez**.
5. Opcional, solo si se pide: `gh issue edit <n> --body-file cuerpo.md --attach './concepto-<slug>.png#Concepto de la escena <nombre>'`. `cuerpo.md` = cuerpo actual (`gh issue view <n> --json body -q .body`) + «imagen orientativa generada con IA, no es el meme original»; nunca lo sustituyas.

No hagas commit de capturas ni de `concepto-<slug>.png`; solo se versiona `examples/`.
