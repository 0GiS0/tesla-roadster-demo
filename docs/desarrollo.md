# Desarrollo

Documentación técnica del proyecto (antes en el README).

<details>
<summary><strong>🎥 Cómo se genera el tour en vídeo</strong></summary>

<br>

El tour es una película montada con [HyperFrames](https://hyperframes.heygen.com) a partir del catálogo de escenas (`src/sceneCatalog.ts`). Orden: título de entrada → escena original («El suelo era solo el principio») → puente «Modo MEME · Deja volar la imaginación» → un tramo por cada escena `mode: 'meme'` (título, resumen y crédito de la fuente visible) → cierre con la URL de Pages y el QR local. No usa material de Tesla: la escena original es la propia recreación de esta web.

1. `scripts/record-tour.mjs` sirve `dist` con `vite preview`, abre Chromium headless con Playwright (versión fijada) y, para cada escena del catálogo, navega a su ruta (`#meme/...`) y fija el control deslizante «Tiempo de la maniobra». Como la animación depende solo del tiempo absoluto, captura fotograma a fotograma (24 fps) sin grabar en tiempo real, así que el resultado es determinista incluso en un runner sin GPU. Cada clip se recodifica con `-g 30` (un fotograma clave por segundo; sin él HyperFrames congela fotogramas al buscar).
2. `scripts/tour/film.mjs` genera el proyecto HyperFrames (`index.html` y `compositions/*.html`) desde el catálogo. No hay composiciones editadas a mano, y todo (GSAP, fuentes incluidas en HyperFrames, QR) es local.
3. `hyperframes check` valida el proyecto y `hyperframes render` produce `tour.mp4`. Después `ffmpeg` e `img2webp` generan:

- `tour.mp4`: película completa, sin audio (H.264, menos de 10 MB).
- `tour.webp`: resumen animado corto (menos de 2 MB), el que se incrusta en el README.
- `tour-poster.png`: fotograma de portada.

Si WebGL o el modelo no cargan, o `hyperframes check` falla, el script termina con error y el despliegue se detiene.

**Añadir un meme al tour:** basta con añadir su entrada `mode: 'meme'` (con `copy` y `source`) a `src/sceneCatalog.ts`. En el siguiente `npm run tour` aparece como un tramo nuevo, con su título, resumen y `source.label`.

En el workflow `ci-pages.yml` el tour se genera tras `npm run build` (con `HYPERFRAMES_SKIP_SKILLS=1` y `HYPERFRAMES_NO_UPDATE_CHECK=1`; la versión de `hyperframes` está fijada en `devDependencies`). En los PRs se sube como artefacto `tour` para revisarlo, sin permisos de despliegue. En `main` se incluye en `dist` y se publica con la web en `/tour.mp4`, `/tour.webp` y `/tour-poster.png`, así que no hay commits de bots.

Para generarlo en local (necesitas `ffmpeg`, `img2webp` y Chromium de Playwright):

```sh
npm ci
npx playwright install chromium
npm run build
npm run tour -- --out /tmp/tour
```

Con `--clips-dir DIR` se reutilizan los clips ya grabados para volver a montar la película rápido. En local también puedes montar la película con tu skill `returngis-record-demo`; CI usa `npm run tour`, que no depende de plugins locales.

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
