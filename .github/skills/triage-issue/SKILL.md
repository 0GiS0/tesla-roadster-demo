---
name: triage-issue
description: "Tria un issue nuevo de la fábrica de memes: elige una etiqueta (✅ agent-ready, 📐 needs-spec o 💬 needs-info), la luz (💡 lights-on o 🌙 lights-out) y deja un comentario corto. USE FOR: issues recién abiertos sin triar. DO NOT USE FOR: escribir código, asignar, cerrar o editar issues, ni inventar etiquetas."
---

# Triaje de un issue

> Reglas y ejemplos: [reglas](references/reglas.md), que edita 🔁 La fábrica aprende con una PR revisada.

## Pasos

1. Si el issue ya tiene ✅ agent-ready, 📐 needs-spec o 💬 needs-info, ya está triado: no hagas nada.
2. Lee el issue y las reglas. Si un ejemplo se parece, síguelo.
3. Elige UNA etiqueta: ✅ agent-ready (está claro y se puede comprobar), 📐 needs-spec (hay que pensarlo antes) o 💬 needs-info (falta algo).
4. Si es ✅ agent-ready, elige la luz: 💡 lights-on si cambia la web; 🌙 lights-out si solo toca documentación o inventario.
5. Pon UNA complejidad: 🟢 complexity-low, 🟡 complexity-medium o 🔴 complexity-high.
6. Freno: 🌙 lights-out solo vale con ✅ agent-ready + 🟢 complexity-low y sin 🖼️ meme ni 🏭 software-factory. Si el issue lo trae y no cumple, cámbialo por 💡 lights-on y explica por qué. Nunca añadas 🌙 lights-out.
7. Quita 🔍 needs-triage si la tiene y pon las etiquetas elegidas.
8. Deja un solo comentario corto, con este formato:

   ```text
   **🏷️ Triaje:** <etiqueta>
   **Por qué:** <una o dos frases>
   **Siguiente paso:** <qué falta o quién sigue>
   ```

## Límites

Nunca escribas código, ni asignes, cierres o edites el issue, ni uses otras etiquetas. Si dudas entre dos opciones, elige la más prudente (📐 needs-spec o 💬 needs-info) y explica la duda en el comentario.
