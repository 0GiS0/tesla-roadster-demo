# Revisión previa a PR — issue #1

Fecha: 18 de octubre de 2026. **Revisión independiente renovada completada; aprobación explícita del usuario pendiente.** No se ha creado una PR ni se ha publicado la web.

## Ajuste actual solicitado

La maniobra ahora contiene **una sola subida → giro directo → vuelo → aterrizaje**, en 28 segundos. Se conservan los primeros 13 segundos de subida y los 15 segundos de giro/vuelo/aterrizaje; se eliminan la espera invertido, la marcha atrás y la segunda subida. Textos, duración accesible y pruebas se actualizan para este resultado.

Momentos actuales para revisión: 12s cerca de la cima; 13s inicio directo del giro; 16s giro; 18–19s vuelo nivelado; 23s descenso; 27–28s aterrizado. Implementación del ajuste: **gpt-6.1-sol / medium**, sin escalados.

Tipos, cuatro pruebas y build del ajuste: **pasan** (`npm run typecheck`, `npm test`, `npm run build`). Las pruebas comprueban contacto/rigidez, continuidad determinista, una única subida sin retroceso con giro directo, y los límites de reproducción de 28 segundos.

## Refinamiento actual del modelo

La petición posterior de acercar la carrocería y el techo a las referencias oficiales añade una nueva geometría original. El techo se rebaja y suaviza con 33×25 puntos, cristal bronce ahumado y bordes finos, sin bloque ni espina central. Se conservan pivotes y radio de las cuatro ruedas, la cámara y la secuencia de una subida de 28 segundos. Las pinzas de freno son estáticas, separadas de las ruedas animadas.

El GLB no incorpora imágenes, texturas externas, cámaras ni luces del estudio de Blender. Generar previews es opcional mediante `--render-dir`; la regeneración normal solo guarda el `.blend` y GLB. Validación de exportación: **pasa**, 971.184 bytes, 29.692 triángulos y 68 mallas.

## Revisión y validación del resultado actual

- Implementador: **gpt-6.1-sol / medium**. Regeneró el modelo con Blender mediante `--background --python model/create_roadster.py -- --render-dir /private/tmp`; terminó con código 0 y guardó `.blend`, GLB y dos renders. Sin escalados.
- Revisor independiente: **gpt-6.1-sol / high**, agente distinto. Revisó el diff, generador, GLB real, validador y CI; ejecutó validación del GLB, tipos, cuatro pruebas y build. **Sin hallazgos accionables pendientes.** Comprobó pivotes y radios de ruedas, pinzas estáticas, exportación local y presupuestos de geometría. Su intento adicional de abrir Blender falló durante el arranque (código 139); la regeneración ejecutada corresponde al implementador.
- Coordinador: ejecutó tipos, pruebas y build del cambio de secuencia y el validador del GLB final. Inspeccionó los renders del techo, frontal y trasera; verificó el modelo dentro del build de producción, el contacto a los 12s y el vuelo a los 18,5s. Comprobó reproducción completa y parada a los 28s, pausa en subida/vuelo, reinicio y repetición. La revisión visual es de una recreación artística, no una réplica fotogramétrica.
- La secuencia de 28s se comprobó en tamaños 390×844 y 844×390 antes del refinamiento del modelo. El layout no cambió después. La nueva captura móvil se deja pendiente: el control de viewport no aplicó el tamaño solicitado durante la última comprobación. No se presenta una captura de escritorio como móvil.
- Medición del **modelo refinado**: MacBook Pro M1 Max, Chromium 155, viewport 851×954, DPR del dispositivo 2 (render limitado a 1,6). 300 fotogramas en 5,0007 segundos: **59,99 FPS medios**, p95 **17,70 ms**. Muestra breve en escritorio; no acredita rendimiento de teléfonos.

## Evidencia actual duradera

Las capturas siguientes se adjuntaron a la issue #1. Los dos renders de Blender muestran el propio modelo exportado; se distinguen de las capturas de la aplicación. La API confirma las imágenes en el HTML de la issue; su inspección dentro de GitHub con una sesión autorizada continúa pendiente.

![Modelo refinado: techo y trasera, render en Blender](https://github.com/user-attachments/assets/c718af59-d8c8-4e8c-879c-f7e223aa9a1f)

![Modelo refinado: render frontal en Blender](https://github.com/user-attachments/assets/e5feda1b-e143-467e-806d-8cba8c161c8e)

![Aplicación actual: modelo refinado en vuelo a los 18,5 segundos](https://github.com/user-attachments/assets/7bbc7c69-0beb-437c-bfcb-6cdfecc72201)

![Aplicación actual: contacto con la rampa a los 12 segundos](https://github.com/user-attachments/assets/e2679453-7373-4adc-a658-00b260f1ba6a)

Comparación anterior al refinamiento, con el primer modelo y la secuencia original de 55s:

![Antes: aplicación con el primer modelo en vuelo](https://github.com/user-attachments/assets/18fd6b61-779b-4c59-89b6-ba481706f351)

## Entrega

- Modelo refinado propio de Blender y GLB: 971.184 bytes, 29.692 triángulos. Pasos de rueda abiertos, frontal anguloso con faros triangulares, techo panorámico bajo y suave, cinco radios partidos, frenos y pinzas estáticas, franja trasera y propulsores separados.
- Escena nocturna con una subida, giro directo, vuelo y aterrizaje. Línea de tiempo determinista de 28 segundos.
- Reproducción, pausa, reinicio, repetición, selección de tiempo y cámara orbital con ratón, teclado y soporte táctil de OrbitControls.
- Aplicación estática en español, con rutas bajo `/tesla-roadster-demo/` y workflow de validación/despliegue desde `main`.

## Revisión independiente anterior (versión de 55 segundos)

Implementación delegada: **gpt-6.1-sol / medium**. Revisión independiente: **gpt-6.1-sol / high**, agente distinto. Sin escalados.

El revisor encontró dos problemas P2 en `src/Scene.tsx`, ambos resueltos y reverificados:

1. La cámara no podía explorarse mediante teclado. Ahora el canvas tiene foco y nombre accesibles, instrucciones en español, giro mediante flechas, zoom con +/− y salida mediante Tab. El manejador solo actúa dentro del canvas.
2. Restablecer la cámara conservaba la inercia de OrbitControls. Ahora se consumen los incrementos pendientes antes de colocar la cámara. El revisor reprodujo el fallo original y comprobó la solución: error respecto al encuadre inicial inferior a `8e-15` unidades después de 60 actualizaciones, frente a 16,23 unidades antes de la corrección.

El revisor concluye: **sin hallazgos accionables pendientes**. Tipos, cuatro pruebas y compilación de producción pasan después de las correcciones.

## Validación histórica del coordinador (versión de 55 segundos)

- Ejecutó tipos, las cuatro pruebas de contacto/continuidad/reproducción y la compilación. El implementador y el revisor repitieron los checks afectados tras corregir la cámara.
- Inspeccionó la escena renderizada, el modelo y los momentos de inversión y vuelo frente a las referencias visuales. Es una recreación artística, no una reconstrucción fotogramétrica o simulación física.
- Comprobó pausa y reanudación, reinicio, parada automática a los 55 segundos y repetición desde cero. Los efectos usan tiempo absoluto y un conjunto fijo de partículas.
- Comprobó botones y selección temporal, foco de teclado, giro, zoom, salida mediante Tab y restablecimiento de cámara.
- Verificó encuadre y ausencia de desbordamiento a 1280×720, 390×844 y 844×390. Los tamaños móviles son emulación en un Mac, no dispositivos físicos.
- Sirvió el build de producción bajo el prefijo de Pages. El GLB devuelve HTTP 200 con tipo `model/gltf-binary`.
- Provocó un 404 real del GLB en una copia temporal del build: apareció el mensaje de recuperación y los controles quedaron desactivados. Restauró el recurso y comprobó que «Recargar escena» recupera la aplicación. También observó el estado de carga.

## Rendimiento histórico y límites

Muestra de escritorio: MacBook Pro con Apple M1 Max, navegador integrado basado en Chromium 155, viewport 1280×720, DPR del dispositivo 2 (render limitado a 1,6). Durante 5,0001 segundos de reproducción: 300 fotogramas, **60,00 FPS medios**, p95 de **17,60 ms**. Es una muestra breve, no una garantía de rendimiento sostenido en otros equipos.

Muestra del build de producción en tamaño móvil **emulado**: mismo Mac y navegador, viewport 390×844, DPR 1. Durante 5,0009 segundos: 300 fotogramas, **59,99 FPS medios**, p95 de **19,80 ms**. Esta medición comprueba el layout móvil en una GPU de escritorio; no acredita el objetivo de 30 FPS en un teléfono.

El bundle JavaScript pesa aproximadamente 1,21 MB sin comprimir / 339 KB gzip. Vite informa del aviso de tamaño de chunk; la compilación termina correctamente.

Pendiente antes de dar por completada toda la aceptación:

- Medición de 30 FPS y gestos de giro/pellizco en teléfono físico, incluido Safari/iOS.
- Prueba del fallback en un navegador real sin WebGL 2; el camino está implementado y revisado por código.
- Inspección visual de las imágenes dentro de GitHub con una sesión autorizada: las URLs duraderas están adjuntadas y su presencia se verifica mediante API, pero el navegador de revisión no tiene sesión en el repositorio privado.
- Aprobación del usuario antes de crear la PR, integración autorizada, activación de Pages y comprobación pública sin iniciar sesión.

La evidencia inicial y las capturas finales se conservan en [la issue #1](https://github.com/0GiS0/tesla-roadster-demo/issues/1). La captura inicial es un directorio vacío servido localmente antes de implementar: no existía una interfaz comparable.
