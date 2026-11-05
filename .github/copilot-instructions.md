## Convenciones de GitHub Actions

- Todos los workflows de `.github/workflows/` llevan un emoji al inicio de su `name:` y del `name:` de cada step. Los identificadores y nombres de los jobs no se cambian (por ejemplo, `validate` es el check que se exige en el ruleset).
- Las acciones se fijan por SHA completo de commit, con la versión en un comentario (`uses: actions/checkout@<sha> # v4.4.0`). Resuelve el SHA con `gh api` contra la etiqueta real; Dependabot mantiene los SHA actualizados.
- El job `validate` ejecuta `npm run lint`, `npm run typecheck`, `npm test`, la validación del GLB y `npm run build`.

<!-- github-knowledge-base-start -->
## Knowledge Base

### Purpose

This repository uses the Knowledge Base at [https://github.com/0GiS0/tesla-roadster-demo](https://github.com/0GiS0/tesla-roadster-demo) on branch `main`.

### Required behavior

1. Before changing code, read `docs/index.md` from that branch.
2. Use the index to open only the knowledge files relevant to the task.
3. If the index is unavailable, stop and report that the Knowledge Base could not be loaded.

### Source of truth

Generated knowledge tracks the code. When the knowledge and code disagree, trust the code.
<!-- github-knowledge-base-end -->
