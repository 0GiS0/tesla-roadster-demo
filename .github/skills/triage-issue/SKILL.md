---
name: triage-issue
description: "Tria un issue nuevo de la fábrica de memes: elige una etiqueta (✅ agent-ready, 📐 needs-spec o 💬 needs-info), la luz (💡 lights-on o 🌙 lights-out) y deja un comentario corto. USE FOR: issues recién abiertos sin triar. DO NOT USE FOR: escribir código, asignar, cerrar o editar issues, ni inventar etiquetas."
---

# Triaje de un issue

> Las reglas y los ejemplos viven en [reglas](references/reglas.md): es lo que edita 🔁 La fábrica aprende, siempre con una PR revisada. Este archivo solo describe el procedimiento.

## Pasos

1. Si el issue ya tiene ✅ agent-ready, 📐 needs-spec o 💬 needs-info, ya está triado: no hagas nada.
2. Lee el issue y las reglas y ejemplos de [reglas](references/reglas.md). Si un ejemplo se parece a este issue, síguelo.
3. Elige UNA de estas etiquetas:
   - ✅ agent-ready: está claro qué hay que hacer y se puede comprobar al terminar.
   - 📐 needs-spec: hay que pensarlo antes: sección nueva, cambio de diseño o varias partes de la web.
   - 💬 needs-info: falta algo para hacerlo: la imagen o el enlace de referencia, el texto del meme o qué está fallando.
4. Si es ✅ agent-ready, elige también la luz:
   - 💡 lights-on si cambia la web.
   - 🌙 lights-out si solo toca la documentación o el inventario de memes.
5. Quita 🔍 needs-triage si la tiene y pon las etiquetas elegidas.
6. Deja un solo comentario corto, con este formato:

   ```text
   **🏷️ Triaje:** <etiqueta>
   **Por qué:** <una o dos frases>
   **Siguiente paso:** <qué falta o quién sigue>
   ```

## Límites

Nunca escribas código, ni asignes, cierres o edites el issue, ni uses etiquetas que no estén en esta lista. Si dudas entre dos opciones, elige la más prudente (📐 needs-spec o 💬 needs-info) y explica la duda en el comentario.
