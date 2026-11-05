# Guardarraíles

> **Propósito:** resumir las reglas que no se deben romper al cambiar la web, el modelo o la fábrica.
> **Qué mantener:** que cada regla coincida con `AGENTS.md` y con el código (constantes, presupuestos, workflows). `AGENTS.md` es la fuente; esta página solo la resume y no la sustituye.

## Alcance

- Es una recreación artística independiente, no una simulación física ni un producto oficial.
- No añadir backend, recursos externos en ejecución, Rapier, audio, conducción libre, multijugador ni escenarios extra sin petición.
- La maniobra original dura 28 s: una subida, un giro directo a vuelo y aterrizaje. No se restaura la espera de 55 s, el descenso inverso ni la segunda subida salvo cambio de requisito.

## Escenarios

- Mantener la interfaz pura `Scenario`: `id`, `title`, `duration`, `evaluate(time)`.
- Posición, cuaternión, giro de ruedas y vapor dependen del tiempo absoluto. Pausar congela todos los efectos; reiniciar, saltar y repetir son deterministas y no acumulan partículas ni recursos.

## Modelo 3D

- Contacto alineado con `RADIUS`, `WHEEL_RADIUS = 0.44` y `HALF_WHEELBASE = 1.47`; si cambian, se actualizan contrato y validación a la vez.
- Coordenadas: +X adelante, +Y arriba, ejes de rueda en Z. Pivotes: `Wheel_FL` (1.47, 0, 0.94), `Wheel_FR` (1.47, 0, -0.94), `Wheel_RL` (-1.47, 0, 0.94), `Wheel_RR` (-1.47, 0, -0.94).
- Solo las cuatro ruedas animadas usan el prefijo `Wheel_`; `Static_Brake_Caliper_*` queda aparte y estático.
- Generador, `.blend` y GLB se mantienen coherentes; sin cámaras, luces ni recursos externos en el GLB.
- Presupuestos: menos de 30 000 triángulos y menos de 2 000 000 bytes (`model/validate_glb.py`).

## Rendimiento

DPR máximo 1,6, sombras de 1024 px y 256 partículas fijas, salvo que una medición justifique cambiarlo. `?debug=1` registra una muestra de rendimiento de cinco segundos.

## Accesibilidad y robustez

- Controles en español, accesibles con ratón, táctil y teclado: flechas orbitan, +/− acercan o alejan, Tab sale del lienzo.
- El restablecimiento de cámara vacía el amortiguado de OrbitControls antes de colocar la vista inicial.
- Mantener los estados de carga, error y ausencia de WebGL; los controles quedan desactivados hasta que el modelo carga.
- Los recursos se resuelven con `import.meta.env.BASE_URL` y se mantiene el prefijo de Pages.

## Proceso

- GitHub Flow: reutilizar o crear un issue, rama enfocada con su número, Conventional Commits y revisión independiente antes de abrir una PR. No se fusiona automáticamente.
- Las PR solo validan; el despliegue se ejecuta tras un push a `main` o manualmente sobre `main`.
- Código y comentarios en inglés; la interfaz y la documentación, en español.
- Hecho significa: lint, tipos, pruebas, validación del GLB y build en verde. Los cambios de interfaz o modelo requieren además capturas antes y después. Tras un despliegue autorizado se verifica la página pública, el prefijo de Pages, la consola y el acceso al GLB.

## Quién revisa qué

El ruleset de `main` exige la revisión de un code owner. `.github/CODEOWNERS` decide quién cuenta como tal; en CODEOWNERS gana la última regla que coincide con cada fichero.

| Rutas | Code owners |
|---|---|
| La web: regla por defecto `*`, código en `src/`, `model/` y `public/models/` | `@0GiS0` y `@returngis-demo` (basta la aprobación de uno) |
| `AGENTS.md`, `.github/` y `.vscode/` | Solo `@0GiS0` |
| `/docs/` y `/README.md` | Sin propietario (lights-out, ver [Lights-out](lights-out.md)) |

- Las reglas de gobernanza van después de `*` y no incluyen a `@returngis-demo`, para que no hereden su propiedad.
- Una PR que mezcle la web con `.github/`, `.vscode/` o `AGENTS.md` sigue necesitando la aprobación de `@0GiS0`.

Más contexto: [Arquitectura de la web](arquitectura.md) y [Fábrica de software](fabrica-de-software.md).
