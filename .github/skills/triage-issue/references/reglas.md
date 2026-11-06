# Reglas del triaje de la fábrica de memes

Este archivo es parte de la skill `triage-issue`: la lee la Automation 🚦 Triaje de la fábrica
en cada issue nuevo. Lo cambia la Automation 🔁 La fábrica aprende, siempre con una PR que revisa una persona.

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
- 💡 lights-on: la luz por defecto; el cambio lo revisa una persona.
- 🌙 lights-out: solo lo pone una persona admin al crear el issue; el triaje
  nunca lo añade y solo lo mantiene si pasa el freno (ver Complejidad).

### Complejidad

Pon siempre UNA:

- 🟢 complexity-low: 1–2 archivos y sin lógica nueva; no toca 3D ni animación ni
  añade dependencias, y se comprueba de un vistazo (textos, enlaces, favicon,
  meta tags, un estilo concreto, documentación).
- 🟡 complexity-medium: una funcionalidad acotada de la interfaz, varios archivos
  o recursos que generar (imágenes, audio). Toda escena 🖼️ meme (3D, animación y grabación).
- 🔴 complexity-high: modelo 3D, arquitectura, dependencias nuevas o alcance abierto.

Freno: 🌙 lights-out solo se mantiene con ✅ agent-ready + 🟢 complexity-low y sin
🖼️ meme ni 🏭 software-factory; si no, pasa a 💡 lights-on con el motivo. Nunca lo añadas tú.

### Según el tipo de issue

- 🖼️ meme: ✅ agent-ready si trae descripción y referencia; si no, 💬 needs-info.
- 🐛 bug: ✅ agent-ready si trae pasos para reproducirlo y qué debería pasar;
  si no, 💬 needs-info.
- ✨ enhancement: 📐 needs-spec salvo que sea un cambio pequeño, en una sola parte
  de la web y con criterios de aceptación que se puedan comprobar.
- 🏭 software-factory: nunca 🌙 lights-out y siempre lleva 💡 lights-on, aunque no
  cambie la web. Si tiene criterios de aceptación concretos y comprobables, es
  ✅ agent-ready; 📐 needs-spec solo si aún no se sabe cómo hacerlo. Siempre lo
  revisa una persona.

## Ejemplos

### El coche que vuela para no pisar un charco
- Decisión: ✅ agent-ready · 💡 lights-on · 🟡 complexity-medium
- Por qué: es un meme nuevo con descripción y enlace a la imagen original.

### Añadir votaciones para elegir el mejor meme
- Decisión: 📐 needs-spec · 🔴 complexity-high
- Por qué: no es un meme, es una funcionalidad nueva (guardar votos, evitar votos repetidos).

### El autoservicio de McDonald's en el cielo
- Decisión: 💬 needs-info · 🟡 complexity-medium
- Por qué: no trae imagen ni enlace de referencia; no se sabe qué escena recrear.

### Corregir el texto alternativo del meme del charco (con 🌙 lights-out)
- Decisión: ✅ agent-ready · 🌙 lights-out · 🟢 complexity-low
- Por qué: solo cambia el inventario y la accesibilidad, no la escena.

### Cambiar el favicon de la web (con 🌙 lights-out)
- Decisión: ✅ agent-ready · 🌙 lights-out · 🟢 complexity-low
- Por qué: un archivo, sin lógica nueva, se comprueba de un vistazo.

### Escena meme pedida con 🌙 lights-out
- Decisión: ✅ agent-ready · 💡 lights-on (cambia 🌙 lights-out) · 🟡 complexity-medium
- Por qué: toda escena meme es 🟡 y nunca va por el carril autónomo.

## Lecciones

<!-- La Automation 🔁 La fábrica aprende añade aquí un ejemplo por cada corrección. -->

### Añadir un segundo code owner para revisar los cambios de la web (#59)
- Decisión: ✅ agent-ready · 💡 lights-on · 🟢 complexity-low
- Por qué: Define los cambios y criterios de aceptación concretos y comprobables; ser software-factory exige revisión humana, no especificación previa.
