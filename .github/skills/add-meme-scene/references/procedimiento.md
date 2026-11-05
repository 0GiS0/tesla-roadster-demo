# Procedimiento detallado

## 1. Campos del Issue

IDs de `.github/ISSUE_TEMPLATE/meme-proposal.yml`:

| ID | Uso |
|----|-----|
| `scene_name` | `copy.title` y `Scenario.title` |
| `slug` | `key`, `Scenario.id` y hash `#meme/<slug>` |
| `source_link` | `source.url` |
| `author` | `source.label` |
| `video_segment` | referencia de la coreografía (opcional) |
| `choreography` | trayectoria de `evaluate(time)` |
| `environment` | geometría procedural en `src/Scene.tsx` |
| `framing` | `camera` del catálogo (opcional) |
| `approx_duration` | `Scenario.duration` (opcional) |
| `references` | solo consulta; no se distribuyen (opcional) |
| `acceptance_checklist` | lo que debe cumplir la escena |
| `mandatory_checks` | sin marcas, logotipos ni recursos externos |

El slug va en minúsculas, sin espacios ni acentos. Los Issues antiguos #8–#11 no usan estos IDs: extrae los mismos datos del texto libre.

## 2. `src/scenario.ts`

Referencia: `potholeFlight` (`id: 'bache-volador'`). Cumple la interfaz `Scenario` (`id`, `title`, `duration`, `evaluate(time)`) y devuelve un `Pose`. Posición, cuaternión, giro de ruedas y vapor dependen solo del tiempo absoluto. Usa las constantes `RADIUS`, `WHEEL_RADIUS = 0.44` y `HALF_WHEELBASE = 1.47`.

## 3. `src/sceneCatalog.ts`

Añade un `SceneDefinition` a `sceneCatalog` con `mode: 'meme'`, `hash: '#meme/<slug>'`, `scenario`, `environment`, `camera` (`desktop`, `portrait` y, si hace falta, `fit`), `copy` (`label: 'MODO MEME'`, título y resumen en español) y `source`.

El texto de `source.label` sigue «Visto en @X · Ver original en X», pero **sustituye la «X» final por la plataforma real** (TikTok, YouTube…); la plantilla fija X por defecto.

## 4. `src/Scene.tsx`

`environment` es una unión cerrada (`'ramp' | 'pothole'`) en `SceneDefinition`. Para un entorno nuevo, amplíala y añade su rama en `Scene` (hoy `definition.environment==='ramp'` frente a `<Pothole/>`) con un componente procedural propio y el color de cielo. No añadas recursos externos.

## 5. `src/scenario.test.ts`

Sigue las pruebas de `potholeFlight`: contacto rígido, continuidad, determinismo y límites de reproducción (`advance`).

## 6. Validaciones

```sh
npm run typecheck
npm test
python3 model/validate_glb.py
npm run build
```

`npm run lint` también existe en `package.json`; CI lo ejecuta.

## 7. Capturas y rendimiento

`npm run dev` y abre `http://127.0.0.1:5173/tesla-roadster-demo/?debug=1#meme/<slug>` (la consulta `?debug=1` va **antes** del hash; detrás no funciona y la web cae a la escena original). Registra en consola la muestra de rendimiento de cinco segundos. Captura escritorio, vertical y horizontal baja, antes y después si la escena modifica una existente. Límites: DPR 1,6, sombras de 1024 px y 256 partículas.

## 8. Revisión

Revisor independiente sobre el diff real, corrige hallazgos y que los verifique. No abras la PR (ni borrador) sin aprobación explícita de la usuaria. Los commits siguen Conventional Commits.
