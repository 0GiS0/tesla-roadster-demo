# Arquitectura de la web

> **Propósito:** describir cómo está construida la web: módulos, flujo de reproducción, modelo 3D y despliegue.
> **Qué mantener:** la tabla de archivos, el contrato `Scenario`, los tiempos de la maniobra original y los datos del catálogo. Revisa esta página cuando cambie algo en `src/`, `model/`, `vite.config.ts` o `.github/workflows/ci-pages.yml`.

## Pila

Vite, React 19, TypeScript, Three.js, React Three Fiber y Drei. Es una página estática: sin backend, sin cuentas y sin recursos externos en ejecución. Se necesita WebGL 2; si no está disponible se muestra un mensaje alternativo en español.

## Mapa del código

| Archivo | Responsabilidad |
|---|---|
| `src/main.tsx` | Estado de reproducción, controles en español, carga, errores y selección de escena por fragmento de URL. |
| `src/Scene.tsx` | `Canvas`, vehículo, rampa, entorno «bache», vapor, cámara orbital y diagnóstico de rendimiento. |
| `src/scenario.ts` | Contrato `Scenario`, trayectorias, constantes de contacto y `advance` (límites de reproducción). |
| `src/sceneCatalog.ts` | Registro de escenas (`sceneCatalog`), resolución por hash y construcción de enlaces. |
| `src/share.ts` | Copia del enlace al portapapeles con resultado explícito. |
| `src/style.css` | Diseños de escritorio, vertical y horizontal baja, y foco de teclado. |
| `src/scenario.test.ts` | Pruebas de contacto, continuidad, determinismo, límites y enlaces. |
| `model/create_roadster.py` | Geometría original procedural en Blender. |
| `model/roadster.blend`, `public/models/roadster.glb` | Modelo editable y recurso desplegado. |
| `model/validate_glb.py` | Validación independiente del GLB (presupuestos y ruedas). |
| `vite.config.ts` | Prefijo base del repositorio para GitHub Pages. |

## Contrato `Scenario`

Cada escena implementa `{ id, title, duration, evaluate(time) }`. `evaluate` devuelve una pose (posición, cuaternión, giro de ruedas, vapor, fase y velocidad) que depende solo del tiempo absoluto de reproducción. Por eso pausar, saltar y repetir son deterministas.

Hay dos escenarios:

- `rampFlight` (`ramp-flight`): 28 s. 0–13 s subida; 13–18 s giro; 18–19 s vuelo nivelado; 19–27 s descenso; 28 s terminado.
- `potholeFlight` (`bache-volador`): 12 s.

## Catálogo y rutas

`sceneCatalog` define, por escena: `key`, `hash`, `mode` (`original` o `meme`), `scenario`, `environment` (`ramp` o `pothole`), cámaras de escritorio y vertical, textos (`copy`) y, en los memes, el crédito (`source`). La escena original usa el hash vacío; «Bache volador» usa `#meme/bache-volador`. Un hash desconocido vuelve a la escena original.

## Modelo 3D

El GLB se genera desde Blender con `model/create_roadster.py` y se valida con `model/validate_glb.py`. Las coordenadas exportadas son +X adelante y +Y arriba, con los ejes de las ruedas en Z. Los detalles de contacto y presupuestos están en [Guardarraíles](guardarrailes.md).

## Construcción y despliegue

`.github/workflows/ci-pages.yml` ejecuta el job `validate` (lint, comprobación de tipos, pruebas, validación del GLB y build) en pull requests y en pushes a `main`. El job `deploy` solo se ejecuta fuera de pull requests y en `main`, y publica `dist/` en GitHub Pages.
