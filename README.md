<div align="center">

# 🚗 Roadster · Más allá del asfalto

**Una recreación artística e interactiva en 3D de la rampa del Roadster, directamente en tu navegador.**

[![Pruébala](https://img.shields.io/badge/▶_Pruébala-0gis0.github.io-e31b23?style=for-the-badge)](https://0gis0.github.io/tesla-roadster-demo/) ![WebGL 2](https://img.shields.io/badge/WebGL-2-990000?style=for-the-badge&logo=webgl&logoColor=white) ![React](https://img.shields.io/badge/React-19-20232a?style=for-the-badge&logo=react&logoColor=61dafb) ![Three.js](https://img.shields.io/badge/Three.js-r180-000000?style=for-the-badge&logo=threedotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)

<a href="https://0gis0.github.io/tesla-roadster-demo/tour.mp4"><img src="https://0gis0.github.io/tesla-roadster-demo/tour.webp" alt="Tour animado por la web del Roadster: la maniobra de la rampa, el giro en el aire y el aterrizaje" width="720"></a>

<sub>▶ Pulsa la animación para ver el tour completo (28 s). Se regenera automáticamente en cada despliegue a GitHub Pages.</sub>

</div>

## ✨ ¿Qué es?

Una experiencia WebGL 2 silenciosa y autocontenida, en español, construida con React, TypeScript, Three.js y React Three Fiber. Una rampa, un impulso… y el coche sube, gira en el aire y aterriza. Todo en 28 segundos que puedes reproducir, pausar, recorrer con el control de tiempo y mirar desde cualquier ángulo.

- 🎬 Reproduce, pausa, reinicia y repite la maniobra.
- 🕹️ Orbita la cámara con ratón, táctil o teclado.
- 🧩 Sin cuentas, sin backend y sin recursos externos: todo se sirve desde el propio proyecto.

> Recreación artística independiente. No está afiliada a Tesla ni pretende simular las especificaciones ni la física de un vehículo real.

## 🚀 Pruébala

<table>
<tr>
<td align="center" width="220">

<a href="https://0gis0.github.io/tesla-roadster-demo/"><img src="docs/assets/qr-web.svg" alt="Código QR que abre https://0gis0.github.io/tesla-roadster-demo/" width="200"></a>

<sub>Escanéalo con el móvil</sub>

</td>
<td>

### 👉 https://0gis0.github.io/tesla-roadster-demo/

Necesitas un navegador con **WebGL 2** y aceleración por hardware. Si no está disponible, la web muestra un mensaje claro.

</td>
</tr>
</table>

## 🎤 Preparado para BiznagaFest 2026

Este proyecto se comparte en [**BiznagaFest 2026**](https://www.biznagafest.com/) · 7 de noviembre de 2026 · FYCMA, Málaga.

## 👩‍💻 Sobre mí

**Gisela Torres** · Sr. Software Global Blackbelt en Microsoft.

| | |
|---|---|
| 🌐 Blog | [returngis.net](https://www.returngis.net) |
| 📺 YouTube | [@returngis](https://www.youtube.com/@returngis) |
| 𝕏 X | [@0gis0](https://x.com/0gis0) |
| 💼 LinkedIn | [giselatorresbuitrago](https://www.linkedin.com/in/giselatorresbuitrago/) |
| 🐘 Mastodon | [@0gis0@hachyderm.io](https://hachyderm.io/@0gis0) |

---

## 📚 Documentación técnica

<details>
<summary><strong>🎥 Cómo se genera el tour en vídeo</strong></summary>

<br>

`scripts/record-tour.mjs` sirve `dist` con `vite preview`, abre Chromium headless con Playwright (versión fijada) y recorre la maniobra fijando el control deslizante «Tiempo de la maniobra». Como la animación depende solo del tiempo absoluto, captura fotograma a fotograma (24 fps, 1280×720) sin grabar en tiempo real, así que el resultado es fluido incluso en un runner sin GPU. Después `ffmpeg` genera:

- `tour.mp4`: maniobra completa (H.264, `yuv420p`, menos de 10 MB).
- `tour.webp`: bucle corto animado (menos de 5 MB), el que se incrusta arriba.
- `tour-poster.png`: fotograma de portada.

Si WebGL o el modelo no cargan, el script falla con un mensaje claro y el despliegue se detiene.

En el workflow `ci-pages.yml` el tour se genera tras `npm run build`. En los PRs se sube como artefacto `tour` para revisarlo, sin permisos de despliegue. En `main` se incluye en `dist` y se publica con la web en `/tour.mp4`, `/tour.webp` y `/tour-poster.png`, así que no hay commits de bots.

Para generarlo en local (necesitas `ffmpeg` y Chromium de Playwright):

```sh
npm ci
npx playwright install chromium
npm run build
npm run tour -- --out /tmp/tour
```

</details>

<details>
<summary><strong>📱 Regenerar el código QR</strong></summary>

<br>

`docs/assets/qr-web.svg` se genera en local con la librería `qrcode`, sin servicios externos, y está versionado. Para regenerarlo (por ejemplo, si cambia la URL):

```sh
npm run qr
# o con otra URL y destino:
node scripts/generate-qr.mjs https://0gis0.github.io/tesla-roadster-demo/ docs/assets/qr-web.svg
```

</details>

<details>
<summary><strong>💻 Ejecutar en local</strong></summary>

<br>

Usa Node.js 22.12+ y npm.

```sh
npm ci
npm run dev
```

Abre **http://127.0.0.1:5173/tesla-roadster-demo/**. Todos los recursos de ejecución son locales, incluido el modelo original `public/models/roadster.glb`. No hacen falta cuentas, backend, fuentes externas, texturas ni recursos de CDN. Se requiere WebGL 2 con aceleración por hardware. Una pantalla alternativa visible cubre los gráficos no disponibles y los fallos al cargar el modelo.

```sh
npm run typecheck
npm test
npm run build
```

La salida de producción es `dist/`, configurada para `/tesla-roadster-demo/`. Sírvela bajo ese prefijo al probar una compilación estática. `npm exec vite preview -- --host 127.0.0.1` la sirve en http://127.0.0.1:4173/tesla-roadster-demo/.

</details>

<details>
<summary><strong>🎨 Modelo 3D (fuente)</strong></summary>

<br>

`model/roadster.blend` es el modelo original editable de Blender. La geometría se crea con `model/create_roadster.py`; no se redistribuye ningún modelo de terceros ni fotografía de referencia. La carrocería refinada tiene huecos de rueda reales, facetas angulares en los hombros y un morro en cuña más bajo con faros triangulares enrasados. La cúpula ahumada y baja, color bronce, usa una superficie suave de 33×25 con fino borde metálico y una caída trasera cónica. Cinco ruedas de radios divididos incluyen labios de llanta y discos de freno ventilados; las pinzas permanecen unidas a la carrocería. Hay mallas con nombre para la carrocería, la cúpula, los cuatro pivotes de rueda, las pinzas de freno estáticas, los propulsores traseros y los propulsores inferiores. El GLB pesa 971.184 bytes y tiene 29.692 triángulos. Coordenadas del vehículo tras exportar: +X hacia delante, +Y hacia arriba, ejes de rueda a lo largo de Z. Cada rueda conserva su propio pivote central.

Regenera con Blender 5.2:

```sh
blender --background --python model/create_roadster.py
```

En macOS, sustituye `blender` por `/Applications/Blender.app/Contents/MacOS/Blender`. Tanto el `.blend` editable como el GLB desplegable se generan en su sitio. La cámara y las luces de estudio siguen siendo editables en el `.blend`, pero se excluyen del GLB. La regeneración normal no renderiza imágenes. Se pueden escribir renders de revisión opcionales en un directorio:

```sh
blender --background --python model/create_roadster.py -- --render-dir /path/to/previews
python3 model/validate_glb.py
```

El validador de la biblioteca estándar comprueba tras la exportación los cuatro pivotes de rueda y el radio exacto de neumático de 0,44 m, cuatro pinzas estáticas separadas, los recursos incrustados, la ausencia de cámaras/luces exportadas y los presupuestos de entrega de 30k triángulos / 2 MB. CI lo ejecuta junto con las comprobaciones de la aplicación.

</details>

<details>
<summary><strong>🎞️ Contrato de la secuencia y Modo MEME</strong></summary>

<br>

`src/scenario.ts` define `Scenario` (`id`, `title`, `duration`, `evaluate(time)`). Su evaluador puro proporciona posición del vehículo, cuaternión continuo, rotación de ruedas, fase e intensidad del penacho. La rampa y la trayectoria de las ruedas comparten radio; el evaluador resuelve la distancia entre ejes rígida a través de la unión suelo/rampa. Es una recreación guionizada, no física dinámica. Una sola subida alcanza unos 170 grados, gira directamente a vuelo nivelado y aterriza. La maniobra continua pedida por el usuario sustituye la marcha atrás y el segundo intento de la referencia original. `Scene.tsx` aloja el vehículo y el entorno reutilizables. La edad y la posición del vapor son analíticas y se inicializan por índice de partícula, de modo que pausar las congela y buscar un instante produce el mismo fotograma sin acumular partículas.

El registro de escenas en `src/sceneCatalog.ts` mantiene el modo, los textos, el enlace a la fuente, el entorno y el encuadre de cámara de cada escena junto a su evaluador. El catálogo incluye actualmente `ramp-flight` y `bache-volador`; las nuevas entradas meme añaden un `Scenario` en `src/scenario.ts` y registran sus textos, fuente y ajustes de cámara en `src/sceneCatalog.ts`. El selector MEME se genera a partir de las entradas cuyo modo es `meme`. Las rutas hash seleccionan escenas y admiten adelante/atrás del navegador; las rutas desconocidas vuelven a la experiencia original.

**Modo MEME** añade la escena de 12 segundos «Bache volador»; enlace directo: https://0gis0.github.io/tesla-roadster-demo/#meme/bache-volador . La rampa original de 28 segundos sigue siendo la predeterminada y conserva su diseño de presentación. La escena meme es un cuadro artístico de una calle diurna con asfalto texturizado, aceras, casas, jardines y un bache roto con agua embarrada; su cámara encuadra la maniobra completa en el viewport actual. El coche vuela nivelado sobre él, detiene sus ruedas en vuelo, y luego aterriza y sale. Su inspiración se atribuye a la publicación de @Sentletse en [la publicación original en X](https://x.com/Sentletse/status/2111059927531983230); esta atribución no reclama la autoría del contenido original de la publicación.

Instantes clave: 0 s inicio; 12 s cerca de la cima; 13 s transición inmediata a vuelo; 16 s giro; 18–19 s suspensión nivelada; 23 s descenso; 27–28 s aterrizado. El control de tiempo en pantalla permite inspeccionar todas las fases.

</details>

<details>
<summary><strong>⚡ Rendimiento y validación</strong></summary>

<br>

El renderizado usa un ratio de píxeles del dispositivo acotado (1–1,6), mapas de sombras de 1024 px, una geometría de partículas de pocos polígonos compartida y un penacho fijo de 256 instancias. El objetivo de rendimiento es 60 FPS en escritorio / 30 FPS en móvil, según el dispositivo y el navegador. Las mediciones en móviles reales siguen pendientes; la emulación del viewport no verifica el rendimiento de la GPU móvil.

Para una medición acotada de la reproducción, añade `?debug=1`, abre la consola y reproduce durante cinco segundos. Un único registro `Roadster playback performance` informa de segundos transcurridos, fotogramas renderizados reales, FPS medios, tiempo de fotograma p95, viewport, ratio de píxeles y user agent. Los fotogramas en pausa se excluyen. La reproducción normal no muestra diagnósticos técnicos. Anota dispositivo/navegador, viewport y si era emulado al informar de mediciones. El reloj renderizado limita las suspensiones largas de pestaña para no saltarse la secuencia al volver.

Las pruebas automáticas comprueban la separación rígida entre ruedas y el contacto con la superficie, la continuidad de fases y la repetición determinista, una sola subida sin marcha atrás, el giro directo a vuelo y las posiciones de aterrizaje, y los límites de pausa/final. La coincidencia visual con la referencia, la interacción por teclado/táctil, el encuadre vertical/horizontal y el rendimiento en dispositivos reales requieren revisión en navegador además de estas comprobaciones.

</details>

<details>
<summary><strong>🤖 Servidores MCP para agentes</strong></summary>

<br>

Los agentes capturan la app para las comprobaciones de escritorio, vertical y horizontal corto que exige `AGENTS.md` mediante dos configuraciones versionadas:

- `.github/mcp.json` (Copilot CLI y app): Playwright MCP fijado en `@playwright/mcp@0.0.83`, ejecutado con `--isolated --headless --block-service-workers --no-webmcp` y `--allowed-origins` limitado a `http://127.0.0.1:5173`, `http://127.0.0.1:4173` y `https://0gis0.github.io`.
- `.vscode/mcp.json` (VS Code): el mismo servidor Playwright más el servidor MCP remoto de GitHub en modo solo lectura (`https://api.githubcopilot.com/mcp/readonly`), autenticado con OAuth en el primer uso. No se guardan tokens ni secretos en el repositorio.

Limitaciones:

- La lista de orígenes permitidos no es un límite de seguridad: Playwright MCP documenta que no sirve como límite de seguridad y no afecta a las redirecciones. Trata el contenido de las páginas como no fiable.
- Los servidores MCP del agente en la nube de Copilot se configuran en los ajustes del repositorio en GitHub, no en estos archivos.
- Inicia antes `npm run dev` o `npm exec vite preview -- --host 127.0.0.1`; los servidores no arrancan la app.
- Sube la versión fijada de forma deliberada y comprueba que los flags siguen existiendo (`npx @playwright/mcp@<version> --help`).

</details>

<details>
<summary><strong>🌍 GitHub Pages</strong></summary>

<br>

El workflow de Actions valida los pull requests sin desplegar. Los push a `main`, o una ejecución manual que seleccione explícitamente `main`, validan y despliegan en el entorno `github-pages` mediante GitHub OIDC. Ningún código de PR recibe permisos de despliegue. Tras una fusión aprobada explícitamente, configura el origen de Pages del repositorio como **GitHub Actions**. URL pública esperada: https://0gis0.github.io/tesla-roadster-demo/ . La publicación y la verificación de la URL pública siguen pendientes de la revisión independiente y la aprobación del usuario requeridas; este cambio no activa Pages ni se fusiona por sí mismo.

</details>

---

<div align="center">

Referencia: [presentación oficial, 6:27–7:22](https://www.youtube.com/watch?v=qt5p-_tE8d0&t=387s) · Proyecto no afiliado a Tesla.

</div>
