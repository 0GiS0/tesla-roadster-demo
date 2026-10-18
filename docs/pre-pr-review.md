# Revisión previa a PR — issue #1

Fecha: 18 de octubre de 2026. Resultado pendiente de aprobación explícita del usuario; no se ha creado una PR ni se ha publicado la web.

## Entrega

- Recreación propia del Roadster en Blender y GLB: 455.848 bytes, aproximadamente 6.936 triángulos, carrocería, ruedas y propulsores separados.
- Escena nocturna de rampa, inversión, marcha atrás, segunda subida, vuelo y aterrizaje. Línea de tiempo determinista de 55 segundos.
- Reproducción, pausa, reinicio, repetición, selección de tiempo y cámara orbital con ratón, teclado y soporte táctil de OrbitControls.
- Aplicación estática en español, con rutas bajo `/tesla-roadster-demo/` y workflow de validación/despliegue desde `main`.

## Revisión independiente

Implementación delegada: **gpt-6.1-sol / medium**. Revisión independiente: **gpt-6.1-sol / high**, agente distinto. Sin escalados.

El revisor encontró dos problemas P2 en `src/Scene.tsx`, ambos resueltos y reverificados:

1. La cámara no podía explorarse mediante teclado. Ahora el canvas tiene foco y nombre accesibles, instrucciones en español, giro mediante flechas, zoom con +/− y salida mediante Tab. El manejador solo actúa dentro del canvas.
2. Restablecer la cámara conservaba la inercia de OrbitControls. Ahora se consumen los incrementos pendientes antes de colocar la cámara. El revisor reprodujo el fallo original y comprobó la solución: error respecto al encuadre inicial inferior a `8e-15` unidades después de 60 actualizaciones, frente a 16,23 unidades antes de la corrección.

El revisor concluye: **sin hallazgos accionables pendientes**. Tipos, cuatro pruebas y compilación de producción pasan después de las correcciones.

## Validación del coordinador

- Ejecutó tipos, las cuatro pruebas de contacto/continuidad/reproducción y la compilación. El implementador y el revisor repitieron los checks afectados tras corregir la cámara.
- Inspeccionó la escena renderizada, el modelo y los momentos de inversión y vuelo frente a las referencias visuales. Es una recreación artística, no una reconstrucción fotogramétrica o simulación física.
- Comprobó pausa y reanudación, reinicio, parada automática a los 55 segundos y repetición desde cero. Los efectos usan tiempo absoluto y un conjunto fijo de partículas.
- Comprobó botones y selección temporal, foco de teclado, giro, zoom, salida mediante Tab y restablecimiento de cámara.
- Verificó encuadre y ausencia de desbordamiento a 1280×720, 390×844 y 844×390. Los tamaños móviles son emulación en un Mac, no dispositivos físicos.
- Sirvió el build de producción bajo el prefijo de Pages. El GLB devuelve HTTP 200 con tipo `model/gltf-binary`.
- Provocó un 404 real del GLB en una copia temporal del build: apareció el mensaje de recuperación y los controles quedaron desactivados. Restauró el recurso y comprobó que «Recargar escena» recupera la aplicación. También observó el estado de carga.

## Rendimiento y límites

Muestra de escritorio: MacBook Pro con Apple M1 Max, navegador integrado basado en Chromium 155, viewport 1280×720, DPR del dispositivo 2 (render limitado a 1,6). Durante 5,0001 segundos de reproducción: 300 fotogramas, **60,00 FPS medios**, p95 de **17,60 ms**. Es una muestra breve, no una garantía de rendimiento sostenido en otros equipos.

Muestra del build de producción en tamaño móvil **emulado**: mismo Mac y navegador, viewport 390×844, DPR 1. Durante 5,0009 segundos: 300 fotogramas, **59,99 FPS medios**, p95 de **19,80 ms**. Esta medición comprueba el layout móvil en una GPU de escritorio; no acredita el objetivo de 30 FPS en un teléfono.

El bundle JavaScript pesa aproximadamente 1,21 MB sin comprimir / 339 KB gzip. Vite informa del aviso de tamaño de chunk; la compilación termina correctamente.

Pendiente antes de dar por completada toda la aceptación:

- Medición de 30 FPS y gestos de giro/pellizco en teléfono físico, incluido Safari/iOS.
- Prueba del fallback en un navegador real sin WebGL 2; el camino está implementado y revisado por código.
- Inspección visual de las imágenes dentro de GitHub con una sesión autorizada: las URLs duraderas están adjuntadas y su presencia se verifica mediante API, pero el navegador de revisión no tiene sesión en el repositorio privado.
- Aprobación del usuario antes de crear la PR, integración autorizada, activación de Pages y comprobación pública sin iniciar sesión.

La evidencia inicial y las capturas finales se conservan en [la issue #1](https://github.com/0GiS0/tesla-roadster-demo/issues/1). La captura inicial es un directorio vacío servido localmente antes de implementar: no existía una interfaz comparable.
