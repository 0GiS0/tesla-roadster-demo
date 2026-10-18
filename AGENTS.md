# Guía del repositorio

## Propósito y estado

- Recreación artística independiente del Roadster y su maniobra de rampa, giro, vuelo y aterrizaje; sin afiliación con Tesla ni pretensión de física real.
- Aplicación estática en español: Vite, React, TypeScript, Three.js, React Three Fiber y Drei, con WebGL 2.
- Todos los recursos de ejecución son locales. No añadir backend, servicios externos, fuentes/CDN, modelos de terceros, Rapier, audio, conducción libre o multijugador sin un encargo separado.
- Estado al **18 de octubre de 2026**: [issue #1](https://github.com/0GiS0/tesla-roadster-demo/issues/1) cerrada y [PR #2](https://github.com/0GiS0/tesla-roadster-demo/pull/2) integrada en `main`.
- [Web pública](https://0gis0.github.io/tesla-roadster-demo/) desplegada y verificada por el coordinador sin iniciar sesión, sin errores de consola y con el GLB público correcto (HTTP 200 y hash coincidente).
- Los textos de publicación pendiente del README y partes de `docs/pre-pr-review.md` son históricos; no describen el estado posterior al despliegue.
- Este contexto no autoriza reabrir/reutilizar la issue #1 para funcionalidades nuevas ni evita los controles de alcance y revisión.

## Mapa de archivos

- `src/main.tsx`: interfaz, reproducción, carga/error y controles accesibles.
- `src/Scene.tsx`: Canvas, vehículo, rampa, vapor, cámara y diagnóstico de rendimiento.
- `src/scenario.ts`: contrato `Scenario`, trayectoria pura y límites de reproducción.
- `src/scenario.test.ts`: contacto, rigidez, continuidad, determinismo y límites temporales.
- `src/style.css`: diseño y adaptaciones vertical/horizontal, incluida pantalla baja.
- `model/create_roadster.py`: generación original de geometría en Blender.
- `model/roadster.blend`: fuente editable; `public/models/roadster.glb`: recurso distribuido.
- `model/validate_glb.py`: contratos de ruedas y presupuesto del GLB, sin dependencias Python externas.
- `vite.config.ts`: prefijo de GitHub Pages; `.github/workflows/ci-pages.yml`: validación y despliegue.
- `README.md`: operación; `docs/pre-pr-review.md`: registro de revisión con resultados históricos identificados.

## Desarrollo y validación

Usar Node.js **22.12+**, npm y Python 3 para validar el modelo. Desde la raíz:

```sh
npm ci
npm run dev
npm run typecheck
npm test
python3 model/validate_glb.py
npm run build
npm exec vite preview -- --host 127.0.0.1
```

- Desarrollo: `http://127.0.0.1:5173/tesla-roadster-demo/`.
- Preview del build: `http://127.0.0.1:4173/tesla-roadster-demo/`.
- Conservar `/tesla-roadster-demo/` y resolver recursos con `import.meta.env.BASE_URL`; no asumir despliegue en `/`.
- Instalar desde el lockfile; mantener dependencias y lockfile compatibles.
- Ejecutar los checks afectados por el cambio. No es necesario ejecutar pruebas por una modificación puramente documental.
- Vite emite actualmente un aviso por el tamaño del chunk de Three.js; distinguir ese aviso de un fallo de compilación.

## Secuencia y controles que deben conservarse

- `Scenario` expone `id`, `title`, `duration` y `evaluate(time)`. Su evaluación pura devuelve posición, quaternion continuo, giro de ruedas, vapor, fase y velocidad derivada.
- La secuencia vigente dura **28 segundos**, con una sola subida y giro directo para volar.
- Tiempos: 0–13 subida; 13–18 giro; 18–19 vuelo nivelado; 19–27 descenso; 28 final detenido y opción de repetir.
- **No restaurar** la secuencia original de 55 segundos, su espera invertida, marcha atrás ni segunda subida: el usuario las eliminó expresamente.
- Rampa y trayectoria comparten `RADIUS`; contacto y geometría del vehículo dependen de `WHEEL_RADIUS` y `HALF_WHEELBASE`. Mantener contacto y distancia rígida entre ejes.
- Posición, orientación, ruedas y vapor dependen del tiempo absoluto. Pausar congela todos los efectos; buscar/reiniciar/repetir no acumula partículas ni estado.
- Inicio pausado; final automático al alcanzar la duración; reinicio desde cualquier fase.
- Mantener ratón y tacto, además del canvas enfocable: flechas giran, +/− acercan/alejan y Tab sale. No capturar teclas de botones ni del selector temporal.
- Restablecer cámara debe consumir primero los incrementos pendientes de OrbitControls con damping desactivado y después colocar el encuadre inicial; conservar damping durante uso normal.
- Los controles esperan la carga efectiva del GLB, no solo la creación del Canvas; un error detiene reproducción y desactiva controles.
- Conservar mensajes de carga, error con recuperación y falta de WebGL 2; interfaz y nombres accesibles en español.

## Modelo y exportación

- Mantener juntos generador, `.blend` y GLB al cambiar geometría; no sustituirlos por imágenes ni referencias descargadas.
- Referencias oficiales sirven para observar el diseño, no son recursos de ejecución ni geometría redistribuida.
- El modelo actual tiene pasos de rueda abiertos, carrocería angular, faros triangulares enrasados, techo bajo y suave de cristal bronce ahumado, bordes finos, ruedas de cinco radios partidos y propulsores separados.
- Mantener el techo elegante: no volver a un prisma, burbuja alta ni espina gruesa. Comprobar frontal, perfil y trasera.
- Regeneración normal (Blender 5.2):

```sh
blender --background --python model/create_roadster.py
```

- En el Mac utilizado: `/Applications/Blender.app/Contents/MacOS/Blender` sustituye a `blender`; verificar su disponibilidad en otra máquina.
- Por defecto solo se guardan `.blend` y GLB. Renders opcionales y portables:

```sh
blender --background --python model/create_roadster.py -- --render-dir DIRECTORIO
python3 model/validate_glb.py
```

- Cámaras y luces de estudio pueden quedar en el `.blend`, pero no exportarse al GLB. Actualmente no se exportan imágenes, texturas ni recursos externos.
- Coordenadas exportadas: **+X delante, +Y arriba, ejes de rueda en Z**.
- Pivotes: `Wheel_FL` = (1.47, 0, 0.94), `Wheel_FR` = (1.47, 0, -0.94), `Wheel_RL` = (-1.47, 0, 0.94), `Wheel_RR` = (-1.47, 0, -0.94).
- Radio exterior del neumático: **0.44**. No mover pivotes ni cambiar radio sin ajustar y validar el contacto.
- Solo las cuatro ruedas animadas usan el prefijo `Wheel_`. Las cuatro `Static_Brake_Caliper_*` son estáticas y separadas: no deben girar con los neumáticos.
- Presupuesto: **menos de 30.000 triángulos y menos de 2 MB**; validar ausencia de cámaras/luces externas y contratos de ruedas después de exportar.
- Baseline al 18/10/2026: **971.184 bytes, 29.692 triángulos, 68 mallas**. Son medidas de esa entrega, no valores perpetuos; actualizar documentación y evidencia si cambian.
- Si Blender falla al arrancar, registrar el fallo y atribuir la regeneración solo a quien realmente la haya ejecutado. No confundir inspeccionar el GLB con regenerarlo.

## Rendimiento y evidencia visual

- Baseline actual: DPR limitado a 1–1.6, sombras de 1024 px, bordes y estructura de soporte instanciados y vapor de 256 billboards con shader local. La superficie de la rampa es una malla propia.
- `?debug=1` registra una muestra de cinco segundos durante reproducción: FPS medio, p95, viewport, DPR y navegador; los fotogramas pausados no cuentan.
- Se midieron aproximadamente 59.99–60 FPS en un MacBook Pro M1 Max con Chromium. No presentar esa muestra corta como garantía ni como rendimiento de un teléfono.
- Objetivos: 60 FPS escritorio y 30 FPS móvil; distinguir hardware real de emulación de viewport.
- Para cambios visuales, capturar estado real antes y después; adjuntar imágenes con URLs duraderas en issue y PR y verificar su renderizado en GitHub.
- Etiquetar claramente capturas de aplicación, renders de Blender y referencias oficiales. Una foto de referencia o un render de estudio no demuestra el resultado web.
- Validar el encuadre y controles en escritorio, vertical y horizontal baja; conservar targets legibles y controles visibles sin scroll innecesario.
- Límites aún no verificados físicamente: gestos/rendimiento en teléfono (incluido Safari/iOS) y navegador real sin WebGL 2. No atribuirles pruebas por emulación o revisión de código.
- La inspección visual autenticada de adjuntos en el repositorio privado y una nueva captura móvil del modelo final quedaron pendientes. El usuario aceptó la entrega con esos límites; no describirlos como pruebas completadas.

## Flujo de colaboración y GitHub

Estas reglas concretan el flujo personal del usuario, sin sustituir sus instrucciones vigentes.

- Antes de herramientas para otra issue/PR o entregable independiente, hacer checkpoint de alcance, recomendar un chat nuevo y esperar elección explícita. Refinamientos, correcciones, pruebas y revisiones del entregable activo continúan en el mismo chat.
- Antes de código, leer instrucciones/contribución, remotos y rama por defecto; buscar issue existente y reutilizarla si cubre realmente el trabajo. Si no existe, crear una enfocada con un emoji y criterios de aceptación.
- Revisar etiquetas existentes. Se aprobaron 14 etiquetas con emoji; las cuatro temáticas son `🧊 3D`, `🎬 Animación`, `🌐 Experiencia web` y `🚀 Despliegue`. Pedir aprobación explícita antes de crear/renombrar/reemplazar etiquetas compartidas.
- Partir de la rama por defecto `main`, usar rama enfocada con número de issue y Conventional Commits. No incorporar mantenimiento ajeno al alcance.
- Cada plan recomienda modelo **exacto** y esfuerzo compatible para implementación y revisión, con justificación y condiciones de escalado. Verificar disponibilidad actual; no asumir un cambio de modelo.
- En esta entrega se utilizaron `gpt-6.1-sol / medium` para implementación y `gpt-6.1-sol / high` para revisión independiente, sin escalados. El plan contemplaba `gpt-6-astra / high` para problemas persistentes de geometría, transformaciones o rendimiento tras reproducir y perfilar su causa. Es un antecedente: adaptar la selección y el escalado futuros a la complejidad, el riesgo y los modelos disponibles.
- Reconsiderar el modelo tras planificar; preferir el más ligero suficiente. Si el plan aprobado pide implementación delegada con un modelo más ligero y es seleccionable, delegarla explícitamente con alcance y checks.
- Antes de **cualquier PR, incluso borrador**: acabar implementación/checks, delegar revisión independiente del diff real, corregir hallazgos y obtener reverificación del revisor.
- Presentar resumen, diff inspeccionable, validaciones, hallazgos/resolución, preview y evidencia visual. **Parar y esperar aprobación explícita del usuario del resultado actual** antes de crear la PR; aprobación del plan no basta.
- Si el resultado cambia materialmente después de la revisión, repetir validación/revisión afectadas y renovar la aprobación. Si la revisión independiente no está disponible, dejarla pendiente.
- No fusionar automáticamente. La PR debe apuntar a `main` y vincular la issue correspondiente.
- CI de PR solo valida; despliegue únicamente por push a `main` o ejecución manual seleccionando `main`, con permisos de Pages/OIDC en el job de despliegue.
- Tras integración y publicación autorizadas, verificar la URL pública sin sesión, prefijo, consola y carga correcta del GLB; no dar publicación por confirmada solo porque pasó el build.
