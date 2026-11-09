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

## Agent Hooks: lint y Markdown antes de la PR

Los checks obligatorios de `main` son `🧪 validate` y `📚 docs`. Una PR que no los pase no se puede fusionar, y en las PR 🌙 lights-out eso significa que se queda abierta. Para que los agentes lo arreglen antes de llegar a la PR, `.github/hooks/pre-pr-checks.json` declara dos [hooks de Copilot](https://docs.github.com/en/copilot/reference/hooks-reference). Los scripts están en `.github/hooks/scripts/` y solo usan Node.js, sin dependencias nuevas (valen en macOS y Linux).

| Hook | Cuándo salta | Qué comprueba | Cómo se entera el agente |
|---|---|---|---|
| `postToolUse` (`post-edit-check.mjs`) | Tras cada `edit`, `create` o `apply_patch` | Solo el fichero tocado: `.ts`, `.tsx`, `.js`, `.mjs`, `.cjs` → `eslint`; `README.md` y `docs/**/*.md` → `markdownlint-cli2@0.24.0` | Devuelve el error como `additionalContext`, que el agente lee en el mismo turno |
| `agentStop` (`final-check.mjs`) | Cuando el agente va a terminar | Todo lo cambiado en la rama respecto a `origin/main` (confirmado, preparado, sin preparar y nuevo): código → `npm run lint` y `npm run typecheck`; Markdown → `markdownlint-cli2` y `node scripts/check-markdown-links.mjs` | Si algo falla, bloquea el final (`decision: "block"`) y el error pasa a ser el siguiente prompt |

- Se usa `agentStop` y no `sessionEnd` porque este último no puede bloquear ni devolver nada al agente.
- Los dos hooks no hacen nada si el cambio no toca ficheros de esos tipos. La comprobación de enlaces solo se ejecuta al final, porque a mitad de trabajo puede apuntar a páginas que aún no existen.
- ⏳ Pendiente de verificar: que el agente en la nube cargue estos hooks y que `npx markdownlint-cli2` funcione dentro de su firewall. Requiere una sesión real del agente en la nube; `copilot-setup-steps.yml` ya instala las dependencias (`npm ci`) antes de que arranque.
- Tras 8 bloqueos seguidos Copilot CLI ignora el hook y termina, para evitar bucles.
- Copilot CLI carga `.github/hooks/*.json` del repositorio (hay que confiar en la carpeta) y, según su documentación, también el agente en la nube (allí `npx` depende de lo que permita su firewall). Los hooks de código necesitan `npm ci` previo; sin `node_modules` se omiten.

### Y en `📚 Docs sync` (gh-aw)

La documentación de gh-aw no menciona `.github/hooks`, y su firewall solo deja pasar los dominios declarados en `network:`: por defecto no incluye el registro de npm, así que `npx markdownlint-cli2` no funcionaría. Por eso los hooks salen enseguida cuando existe `GITHUB_AW` (variable que gh-aw pone al agente) y `docs-sync.md` tiene su propia defensa:

- `network.allowed` incluye `node`, y el prompt pide al agente ejecutar `npx --yes markdownlint-cli2@0.24.0` y `node scripts/check-markdown-links.mjs` antes de abrir la PR.
- Un `post-steps` en el runner repite esas dos comprobaciones tras el agente. Si fallan, el job `agent` falla y el job `🔀 Enable auto-merge` no se ejecuta (ahora exige `agent` en verde), de modo que la PR no se fusiona sola.

## Quién revisa qué

El ruleset de `main` exige la revisión de un code owner. `.github/CODEOWNERS` decide quién cuenta como tal; en CODEOWNERS gana la última regla que coincide con cada fichero.

| Rutas | Code owners |
|---|---|
| `model/` y `public/models/` | `@0GiS0` y `@returngis-demo` (basta la aprobación de uno) |
| `AGENTS.md`, `.github/` y `.vscode/` | Solo `@0GiS0` |
| Todo lo demás (`src/`, `docs/`, `README.md`, `scripts/`…) | Sin propietario (lights-out, ver [Lights-out](lights-out.md)) |

- No hay regla `*`: las PR de Issues lights-out que tocan la web no quedan bloqueadas, porque Copilot no puede aprobar y la aprobación de quien lo lanzó no cuenta en sus PR.
- Riesgo asumido: las PR humanas que tocan solo código de la web tampoco necesitan revisión de propietario. Las barreras son los checks obligatorios `🧪 validate` y `📚 docs`.
- Una PR que mezcle la web con `.github/`, `.vscode/`, `AGENTS.md` o el modelo 3D sigue necesitando la aprobación de los propietarios de esas rutas.

Más contexto: [Arquitectura de la web](arquitectura.md) y [Fábrica de software](fabrica-de-software.md).
