---
name: triage-issue
description: "Tria un issue nuevo de la fábrica de memes: elige estado (✅ agent-ready, 📐 needs-spec o 💬 needs-info), luz, complejidad y área, y deja un comentario corto. USE FOR: issues recién abiertos sin triar. DO NOT USE FOR: escribir código, asignar, cerrar o editar issues, ni inventar etiquetas."
---

# Triaje de un issue

> Reglas y ejemplos: [reglas](references/reglas.md) (las edita 🔁 La fábrica aprende, con PR revisada).

## Pasos

1. Si el issue ya tiene ✅ agent-ready, 📐 needs-spec o 💬 needs-info, ya está triado: no hagas nada.
2. Lee el issue y [reglas](references/reglas.md); si un ejemplo se parece, síguelo.
3. Elige UNA de estas etiquetas:
   - ✅ agent-ready: está claro qué hacer y se puede comprobar al terminar.
   - 📐 needs-spec: hay que pensarlo antes (sección nueva, diseño o varias partes).
   - 💬 needs-info: falta referencia, texto, alguna confirmación obligatoria del meme o qué falla.
4. Si es ✅ agent-ready, elige la luz: 💡 lights-on si cambia la web; 🌙 lights-out si solo toca documentación o inventario.
5. Pon UNA complejidad: 🟢 complexity-low, 🟡 complexity-medium o 🔴 complexity-high.
6. Pon como máximo UNA etiqueta de área (🎨 ux, ♿ accessibility, 🧊 3d, 🎬 animation, 🚀 deployment o 📝 documentation) según las reglas; ninguna si no encaja o ya hay una.
7. Quita 🔍 needs-triage si la tiene y pon las etiquetas elegidas.
8. Deja un solo comentario corto, con este formato:

   ```text
   **🏷️ Triaje:** <etiqueta>
   **Por qué:** <una o dos frases>
   **Siguiente paso:** <qué falta o quién sigue>
   ```

## Límites

Nunca escribas código, ni asignes, cierres o edites el issue, ni uses etiquetas fuera de esta lista. Ante la duda, elige la más prudente (📐 needs-spec o 💬 needs-info) y explícalo.
