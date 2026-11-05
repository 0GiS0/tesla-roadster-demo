# Reglas del triaje de la fábrica de memes

Este archivo lo lee la Automation 🚦 Triaje de la fábrica en cada issue nuevo.
Lo cambia la Automation 🔁 La fábrica aprende, siempre con una PR que revisa una persona.

## Qué es la web

Una web estática en GitHub Pages que recrea el coche volador de Tesla y los memes
que salieron después. Cada meme es una escena con su imagen, su pie de foto y su
texto alternativo. La sección de inventario lista todos los memes publicados.

## Reglas

- ✅ agent-ready: un meme nuevo con descripción y una imagen o enlace de referencia;
  o un fallo concreto que se puede reproducir. Se puede comprobar al terminar.
- 📐 needs-spec: algo nuevo que no es un meme: una sección, un cambio de diseño,
  votaciones, cuentas de usuario… o algo que toca varias partes de la web.
- 💬 needs-info: falta la imagen o el enlace de referencia, el texto del meme,
  o no se sabe qué falla ni dónde.
- 💡 lights-on: cambia lo que ve el público en la web.
- 🌙 lights-out: solo cambia la documentación o el inventario (pie de foto,
  texto alternativo, la lista de memes).

### Según el tipo de issue

- 🖼️ meme: ✅ agent-ready si trae descripción y referencia; si no, 💬 needs-info.
- 🐛 bug: ✅ agent-ready si trae pasos para reproducirlo y qué debería pasar;
  si no, 💬 needs-info.
- ✨ enhancement: 📐 needs-spec salvo que sea un cambio pequeño, en una sola parte
  de la web y con criterios de aceptación que se puedan comprobar.
- 🏭 software-factory: nunca 🌙 lights-out. Cambia cómo trabaja la fábrica
  (plantillas, skills, MCP, workflows, CODEOWNERS), así que siempre lo revisa una persona.

## Ejemplos

### El coche que vuela para no pisar un charco
- Decisión: ✅ agent-ready · 💡 lights-on
- Por qué: es un meme nuevo con descripción y enlace a la imagen original.

### Añadir votaciones para elegir el mejor meme
- Decisión: 📐 needs-spec
- Por qué: no es un meme, es una funcionalidad nueva (guardar votos, evitar votos repetidos).

### El autoservicio de McDonald's en el cielo
- Decisión: 💬 needs-info
- Por qué: no trae imagen ni enlace de referencia; no se sabe qué escena recrear.

### Corregir el texto alternativo del meme del charco
- Decisión: ✅ agent-ready · 🌙 lights-out
- Por qué: solo cambia el inventario y la accesibilidad, no la escena.

## Lecciones

<!-- La Automation 🔁 La fábrica aprende añade aquí un ejemplo por cada corrección. -->
