## Convenciones de GitHub Actions

- Todos los workflows de `.github/workflows/` llevan un emoji al inicio de su `name:`, del `name:` de cada job y del `name:` de cada step. Los identificadores (`id`) de los jobs no se cambian; el nombre del job es el contexto del check, así que si se renombra hay que actualizar el check obligatorio del ruleset (por ejemplo, `🧪 validate` en `ci-pages.yml`).
- Las acciones se fijan por SHA completo de commit, con la versión en un comentario (`uses: actions/checkout@<sha> # v4.4.0`). Resuelve el SHA con `gh api` contra la etiqueta real; Dependabot mantiene los SHA actualizados.
- El job `validate` ejecuta `npm run lint`, `npm run typecheck`, `npm test`, la validación del GLB y `npm run build`.

