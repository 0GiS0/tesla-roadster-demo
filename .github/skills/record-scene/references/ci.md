# Grabar sin GPU (CI) y captura «después»

Léelo solo al grabar en un runner sin GPU (cloud agent, GitHub Actions) o al necesitar la captura «después».

## 🐢 Causa y solución

Con WebGL por software la escena, que renderiza en bucle, dejaba cada `page.screenshot` esperando 3–10 s (a veces >30 s). Tras cargar, el script toma el control de `requestAnimationFrame` y renderiza solo una vez por fotograma capturado.

## ⚙️ Opciones

- `--preset ci`: 10 fps, 960×540, CRF 30. Las opciones explícitas (`--fps`, `--width`, `--height`, `--crf`) ganan.
- `--frame-timeout <s>`: plazo por fotograma (120 por defecto) con un reintento; si falla, súbelo o baja fps/resolución.

Medido en un contenedor Linux de 2 CPU sin GPU: `cables` a 960×540 y 10 fps, 3 min.

## 🖼️ Captura «después»

`--still 0.55 --still-out <slug>-despues.png` guarda un PNG del fotograma en esa fracción de la escena (0,55 es el momento clave del tour). `--still-only` omite el vídeo. No se versiona.
