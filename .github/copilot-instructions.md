## Convenciones de GitHub Actions

- Todos los workflows de `.github/workflows/` llevan un emoji al inicio de su `name:` y del `name:` de cada step. Los identificadores y nombres de los jobs no se cambian (por ejemplo, `validate` es el check que se exige en el ruleset).
- Las acciones se fijan por SHA completo de commit, con la versión en un comentario (`uses: actions/checkout@<sha> # v4.4.0`). Resuelve el SHA con `gh api` contra la etiqueta real; Dependabot mantiene los SHA actualizados.
- El job `validate` ejecuta `npm run lint`, `npm run typecheck`, `npm test`, la validación del GLB y `npm run build`.

