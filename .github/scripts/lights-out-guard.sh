#!/usr/bin/env bash
# Guardrails for the lights-out auto-merge. Pure: reads three JSON files and
# decides; it never calls the network.
#
#   lights-out-guard.sh PR_JSON FILES_JSON ISSUES_JSON
#   lights-out-guard.sh --is-copilot PR_JSON ISSUES_JSON
#
#   PR_JSON      REST object of the pull request (GET /pulls/{n})
#   FILES_JSON   flat array of REST file objects (GET /pulls/{n}/files)
#   ISSUES_JSON  array of the issues the PR closes, as GraphQL nodes:
#                { id, number, state, labels: { nodes: [{ name }] },
#                  assignees: { nodes: [{ login }] },
#                  connections: [{ actor: { login, __typename },
#                                  subject: { id } }] }
#                where connections are the CONNECTED_EVENT items of the PR's
#                own timeline (subject is the connected Issue).
#
# A pull request counts as made by the Copilot cloud agent when it either has
# the legacy Bot author, or (GitHub now opens these PRs as the human who
# assigned the task) all of these hold: it is not from a fork, its branch
# starts with copilot/, a linked Issue has Copilot assigned, and a Bot Copilot
# actor connected this pull request to that Issue (server-generated, so
# it cannot be forged by a PR author).
#
# --is-copilot prints "true" or "false" for that identity check alone.
#
# Exit 0 when the pull request is eligible. Otherwise exit 1 and print one
# reason per line to stdout. Limits come from MAX_CHANGED_LINES (default 150)
# and MAX_CHANGED_FILES (default 10); GITHUB_REPOSITORY is the base repository.
set -euo pipefail

usage="usage: $0 PR_JSON FILES_JSON ISSUES_JSON | $0 --is-copilot PR_JSON ISSUES_JSON"

# jq definitions shared by both modes.
# shellcheck disable=SC2016 # jq program, not a shell expansion
defs='
  def copilot_logins: ["Copilot", "copilot-swe-agent"];
  def is_copilot($p; $i; $repo):
    (($p.user.login // "") == "Copilot" and ($p.user.type // "") == "Bot")
    or (
      ($p.head.repo.full_name // "") == $repo
      and (($p.head.ref // "") | startswith("copilot/"))
      and any($i[];
        (.id // null) as $id
        | ((.labels.nodes // []) | map(.name) | index("🌙 lights-out")) != null
        and any((.assignees.nodes // [])[]; .login as $l | copilot_logins | index($l) != null)
        and $id != null
        and any((.connections // [])[];
          (.actor.__typename // "") == "Bot"
          and ((.actor.login // "") as $l | copilot_logins | index($l) != null)
          and (.subject.id // null) == $id)
      )
    );
'

if [ "${1:-}" = "--is-copilot" ]; then
  if [ "$#" -ne 3 ]; then
    echo "$usage" >&2
    exit 2
  fi
  jq -rn --slurpfile pr "$2" --slurpfile issues "$3" \
    --arg repo "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}" \
    "$defs"'is_copilot($pr[0]; $issues[0]; $repo)'
  exit 0
fi

if [ "$#" -ne 3 ]; then
  echo "$usage" >&2
  exit 2
fi

reasons="$(jq -rn \
  --slurpfile pr "$1" \
  --slurpfile files "$2" \
  --slurpfile issues "$3" \
  --arg repo "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}" \
  --argjson maxLines "${MAX_CHANGED_LINES:-150}" \
  --argjson maxFiles "${MAX_CHANGED_FILES:-10}" \
  "$defs"'
  $pr[0] as $p
  | $files[0] as $f
  | $issues[0] as $i
  | ($f | map(.filename, (.previous_filename // empty))) as $paths
  | ($f | map((.additions // 0) + (.deletions // 0)) | add // 0) as $lines
  | (
      if ($p.state != "open") then "the pull request is not open" else empty end,
      if (is_copilot($p; $i; $repo) | not)
        then "the pull request is not recognised as made by the Copilot cloud agent" else empty end,
      if (($p.head.repo.full_name // "") != $repo)
        then "the branch does not come from this repository" else empty end,
      if ($p.base.ref != "main") then "the pull request does not target main" else empty end,
      if ($i | length) == 0 then "no linked Issue" else empty end,
      ($i[] | select(.state != "OPEN") | "Issue #\(.number) is not open"),
      ($i[] | select((.labels.nodes | map(.name) | index("🌙 lights-out")) == null)
        | "Issue #\(.number) is not 🌙 lights-out"),
      if ($f | length) == 0 then "the pull request has no changed files" else empty end,
      if ($f | length) > $maxFiles then "it changes \($f | length) files (limit \($maxFiles))" else empty end,
      if $lines > $maxLines then "it changes \($lines) lines (limit \($maxLines))" else empty end,
      ($paths | unique[]
        | select(
            startswith(".github/") or startswith(".vscode/") or startswith("model/")
            or startswith("public/models/") or . == "AGENTS.md"
            or . == "package.json" or . == "package-lock.json"
          )
        | "protected path: \(.)")
    )')"

if [ -n "$reasons" ]; then
  echo "$reasons"
  exit 1
fi
