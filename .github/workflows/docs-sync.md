---
name: "📚 Docs sync"
description: Keeps docs/ and README.md in sync with the code after each successful production deployment.

on:
  workflow_run:
    workflows: ["🚀 Validate and deploy Pages"]
    types: [completed]
    branches: [main]
    conclusion: success
  workflow_dispatch:
  permissions:
    actions: read
  # Skip when a previous docs sync PR is still open, so runs never stack.
  skip-if-match: 'is:pr is:open label:"🌙 lights-out" in:title "docs:"'
  steps:
    # A successful run is not enough: docs-only pushes skip the deploy job, so only
    # continue when the "🌐 deploy" job itself finished successfully.
    - name: 🌐 Check that the deploy job succeeded
      id: deploy_check
      env:
        GH_TOKEN: ${{ github.token }}
        EVENT_NAME: ${{ github.event_name }}
        RUN_ID: ${{ github.event.workflow_run.id }}
      shell: bash
      run: |
        set -euo pipefail
        if [ "$EVENT_NAME" != workflow_run ]; then
          echo "deployed=true" >> "$GITHUB_OUTPUT"
          exit 0
        fi
        conclusion=$(gh api --paginate "repos/$GITHUB_REPOSITORY/actions/runs/$RUN_ID/jobs?per_page=100" \
          --jq '.jobs[] | select(.name == "🌐 deploy") | .conclusion')
        echo "Deploy job conclusion: ${conclusion:-<not found>}"
        if [ "$conclusion" = success ]; then
          echo "deployed=true" >> "$GITHUB_OUTPUT"
        else
          echo "deployed=false" >> "$GITHUB_OUTPUT"
        fi

jobs:
  pre-activation:
    outputs:
      deployed: ${{ steps.deploy_check.outputs.deployed }}

  # Runs outside the agent, after the pull request exists, and only touches that pull request.
  auto-merge:
    name: 🔀 Enable auto-merge
    needs: [safe_outputs]
    if: ${{ always() && needs.safe_outputs.outputs.created_pr_number != '' }}
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions:
      contents: write
      pull-requests: write
    steps:
      - name: 🔍 Verify that the pull request only touches documentation
        id: verify
        env:
          GH_TOKEN: ${{ github.token }}
          PR_NUMBER: ${{ needs.safe_outputs.outputs.created_pr_number }}
        shell: bash
        run: |
          set -euo pipefail
          pr=$(gh api "repos/$GITHUB_REPOSITORY/pulls/$PR_NUMBER")
          draft=$(jq -r '.draft' <<< "$pr")
          head_repo=$(jq -r '.head.repo.full_name' <<< "$pr")
          base=$(jq -r '.base.ref' <<< "$pr")
          if [ "$draft" != false ] || [ "$head_repo" != "$GITHUB_REPOSITORY" ] || [ "$base" != main ]; then
            echo "::warning::PR #$PR_NUMBER is a draft, comes from a fork or does not target main; auto-merge not enabled."
            echo "eligible=false" >> "$GITHUB_OUTPUT"
            exit 0
          fi
          # Every changed path (including the previous name of a renamed file) must be docs/ or README.md.
          files=$(gh api --paginate "repos/$GITHUB_REPOSITORY/pulls/$PR_NUMBER/files?per_page=100" \
            --jq '.[] | .filename, (.previous_filename // empty)')
          if [ -z "$files" ]; then
            echo "::warning::PR #$PR_NUMBER has no changed files; auto-merge not enabled."
            echo "eligible=false" >> "$GITHUB_OUTPUT"
            exit 0
          fi
          while IFS= read -r file; do
            case "$file" in
              docs/* | README.md) ;;
              *)
                echo "::warning::PR #$PR_NUMBER touches $file outside docs/ and README.md; auto-merge not enabled."
                echo "eligible=false" >> "$GITHUB_OUTPUT"
                exit 0
                ;;
            esac
          done <<< "$files"
          echo "eligible=true" >> "$GITHUB_OUTPUT"

      - name: 🔀 Enable auto-merge (squash)
        if: ${{ steps.verify.outputs.eligible == 'true' }}
        env:
          GH_TOKEN: ${{ github.token }}
          PR_NUMBER: ${{ needs.safe_outputs.outputs.created_pr_number }}
        shell: bash
        run: |
          gh pr merge "$PR_NUMBER" --repo "$GITHUB_REPOSITORY" --auto --squash
          echo "✅ Auto-merge enabled on PR #$PR_NUMBER" >> "$GITHUB_STEP_SUMMARY"

if: needs.pre_activation.outputs.deployed == 'true'

permissions:
  contents: read

engine: copilot

timeout-minutes: 20

tools:
  bash: ["cat", "ls", "grep", "find", "head", "tail", "wc", "diff", "git log", "git diff", "git show", "git status"]
  edit:

safe-outputs:
  create-pull-request:
    title-prefix: "docs: "
    labels: ["📝 documentation", "🌙 lights-out"]
    draft: false
    max: 1
    if-no-changes: ignore
    fallback-as-issue: false
    # The default GITHUB_TOKEN cannot trigger the required pull_request checks.
    github-token: ${{ secrets.DOCS_SYNC_PR_TOKEN }}
    allowed-files:
      - "docs/**"
      - "README.md"
    protected-files:
      policy: blocked
      exclude:
        - /README.md
---

# 📚 Docs sync

You keep the documentation of this repository in sync with its code. The repository is a static web, in Spanish, built with Vite, React, TypeScript and Three.js. Its `docs/` folder is a wiki and `README.md` is the entry point.

## Scope

- You may only create or modify files under `docs/` and the root `README.md`. Any other path is refused by the pipeline.
- Never modify `AGENTS.md`, `.github/`, source code, tests, models or configuration.
- Keep the lights-out banner at the top of `README.md` (the image `docs/assets/lights-out-banner.png` and the link to `docs/lights-out.md`) exactly as it is.
- Write all documentation in Spanish, matching the tone and structure of the existing pages. Keep code identifiers, commands and file names unchanged.
- Do not rewrite pages that are already accurate. Prefer small, precise edits over large rewrites.
- Pages marked as historical (`docs/meme-review.md`, `docs/pre-pr-review.md`) are evidence and must not be changed.

## Method

1. Read `docs/index.md`, then every page it lists. Each page starts with a note describing its purpose and what must be kept up to date; follow it.
2. Compare each statement with the code as it is now: `src/`, `model/`, `public/`, `package.json`, `.github/workflows/`, `.github/skills/` and `AGENTS.md`. When documentation and code disagree, the code is right.
3. Check in particular: the scene catalog and the Scenario contract, commands and versions, the deployment flow, workflows and checks named in the docs, skills and MCP configuration, and that every page of `docs/` appears in the index.
4. Relative links and images must keep working, and Markdown must pass `markdownlint` (`.markdownlint-cli2.jsonc`).
5. If you find nothing that needs updating, do not create a pull request: call `noop` with a short reason.

## Pull request

When something needs updating, make the edits in the working tree and open one pull request. Write the title (after the `docs: ` prefix) and the body in Spanish. The body lists the pages changed and, for each, the code fact that justified the change. Do not mention internal tooling details. Do not add closing keywords for issues.
