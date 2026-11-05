# 🌙 Lights-out

*Lights-out* es el modo en el que una PR se mergea sin revisión humana porque el cambio es seguro por construcción. Hoy solo aplica a la documentación.

## Qué cubre

- Únicamente los ficheros bajo `docs/`.
- `docs/` no tiene propietario en `.github/CODEOWNERS` (entrada `docs/` sin owners, después de `*`), así que el ruleset de `main` no exige revisión del propietario del código.
- El único requisito es el check obligatorio `validate`: si está en verde, la PR puede mergearse.

## Quién activa el auto-merge

No hay un flujo genérico por etiqueta. El Agentic Workflow que mantiene la documentación (#44) activa el auto-merge en sus propias PR. Para ello el repositorio debe tener activada la opción *Allow auto-merge*.

## Qué sigue protegido

Todo lo que está fuera de `docs/` sigue teniendo propietario y necesita su revisión: código, `model/`, `public/models/`, `.github/`, `.vscode/` y `AGENTS.md`. Una PR que mezcle `docs/` con cualquiera de esas rutas requiere revisión humana, porque CODEOWNERS se evalúa por fichero.
