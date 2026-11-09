# Reglas del triaje de la fábrica de memes

Parte de `triage-issue`: la lee 🚦 Triaje y la cambia 🔁 La fábrica aprende con PR revisada.

## Qué es la web

Web estática en GitHub Pages: el coche volador de Tesla y sus memes. Cada meme es una
escena con imagen, pie de foto y texto alternativo; el inventario los lista.

## Reglas

- ✅ agent-ready: meme nuevo con descripción, imagen o enlace y ambas confirmaciones
  obligatorias marcadas; o fallo reproducible. Comprobable al terminar.
- 📐 needs-spec: algo nuevo que no es un meme (sección, diseño, votaciones, cuentas…)
  o que toca varias partes de la web.
- 💬 needs-info: falta la imagen o el enlace, el texto del meme, o qué falla y dónde.
  En memes, también si falta alguna de las dos «Confirmaciones obligatorias»
  (derechos; originalidad y recursos locales), no los criterios de aceptación.
  Pide marcarlas; ni el triaje ni el agente las marcan por la autora.
- 💡 lights-on: cambia lo que ve el público.
- 🌙 lights-out: solo cambia documentación o inventario (pie de foto, texto alternativo,
  lista de memes); tiene prioridad sobre 💡 lights-on aunque el pie sea visible.

### Complejidad

- 🟢 complexity-low: 1–2 archivos, sin lógica nueva ni 3D (favicon, textos).
- 🟡 complexity-medium: funcionalidad acotada o recursos que generar; todo 🖼️ meme.
- 🔴 complexity-high: modelo 3D, arquitectura, dependencias, alcance abierto.

### Área

UNA como máximo, de esta lista cerrada: 🎨 ux (interfaz, controles, rendimiento),
♿ accessibility, 🧊 3d (modelos, luces, entornos), 🎬 animation (trayectorias, efectos),
🚀 deployment (CI, Pages), 📝 documentation (solo docs). Ninguna si es 🖼️ meme o
🏭 software-factory, si ya hay una de una persona o si ninguna encaja con claridad.
Plantilla de mejora, `Área`: Interfaz, Controles o Rendimiento → 🎨 ux;
Accesibilidad → ♿ accessibility; Otra → por contenido. 🎨 ux o ♿ accessibility + 🟢 low activa `🌙 Lights-out assign`.

### Según el tipo de issue

- 🖼️ meme: ✅ agent-ready con descripción, referencia y ambas confirmaciones; si no, 💬 needs-info.
- 🐛 bug: ✅ agent-ready si trae pasos y qué debería pasar; si no, 💬 needs-info.
- ✨ enhancement: 📐 needs-spec salvo cambio pequeño, en una parte y comprobable.
- 🏭 software-factory: nunca 🌙 lights-out; siempre 💡 lights-on. Con criterios concretos
  y comprobables, ✅ agent-ready; 📐 needs-spec solo si no se sabe cómo hacerlo.

## Ejemplos

### El coche que vuela para no pisar un charco
- Decisión: ✅ agent-ready · 💡 lights-on
- Por qué: descripción, referencia y ambas confirmaciones marcadas.

### Añadir votaciones para elegir el mejor meme
- Decisión: 📐 needs-spec
- Por qué: funcionalidad nueva (guardar votos, evitar repetidos).

### El autoservicio de McDonald's en el cielo
- Decisión: 💬 needs-info
- Por qué: trae descripción y referencia, pero queda una confirmación obligatoria sin marcar.
- Siguiente paso: autora, marca ambas «Confirmaciones obligatorias».

### Corregir el texto alternativo del meme del charco
- Decisión: ✅ agent-ready · 🌙 lights-out
- Por qué: solo cambia el inventario y la accesibilidad, no la escena.

### Hacer más grande el botón de reiniciar en móvil
- Decisión: ✅ agent-ready · 💡 lights-on · 🟢 complexity-low · 🎨 ux
- Por qué: cambio pequeño de interfaz, comprobable y en una sola parte.

## Lecciones

<!-- La Automation 🔁 La fábrica aprende añade aquí un ejemplo por cada corrección. -->

### Añadir un segundo code owner para revisar los cambios de la web (#59)
- Decisión: ✅ agent-ready · 💡 lights-on
- Por qué: Define los cambios y criterios de aceptación concretos y comprobables; ser software-factory exige revisión humana, no especificación previa.
