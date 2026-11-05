// Shared helpers for the Agent Hooks. Zero dependencies: Node.js built-ins only.
// The checks mirror the required CI checks: "🧪 validate" (lint, typecheck) and "📚 docs"
// (markdownlint and relative-link check). Keep the markdownlint version in sync with
// .github/workflows/docs.yml.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const MARKDOWNLINT = "markdownlint-cli2@0.24.0";

// gh-aw runs the agent behind a firewall that blocks the npm registry, so `npx` cannot work there.
// The 📚 Docs sync workflow runs these checks in its own post-steps instead (see docs/guardarrailes.md).
export const insideAgenticWorkflow = process.env.GITHUB_AW === "true";

const CODE_EXT = /\.(?:[cm]?[jt]sx?)$/;
const MAX_OUTPUT = 6000;

export function isCodeFile(file) {
  return CODE_EXT.test(file);
}

// Same scope as the `globs` of .markdownlint-cli2.jsonc: README.md and docs/**/*.md.
export function isDocFile(file) {
  return file === "README.md" || (file.startsWith("docs/") && file.endsWith(".md"));
}

// Normalizes a path to a repo-relative POSIX path, or returns null when it is outside the repo.
export function toRepoPath(file, cwd = repoRoot) {
  const abs = isAbsolute(file) ? file : resolve(cwd, file);
  const rel = relative(repoRoot, abs);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) return null;
  return rel.split(sep).join("/");
}

export function readStdinJson() {
  return new Promise((resolveInput) => {
    let raw = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (raw += chunk));
    process.stdin.on("end", () => {
      try {
        resolveInput(raw.trim() ? JSON.parse(raw) : {});
      } catch {
        resolveInput({});
      }
    });
    process.stdin.on("error", () => resolveInput({}));
  });
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    // npm and npx are .cmd shims on Windows.
    shell: process.platform === "win32",
    maxBuffer: 16 * 1024 * 1024,
    timeout: 120_000,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  const failed = result.error ? true : result.status !== 0;
  return { ok: !failed, output: result.error ? `${result.error.message}\n${output}`.trim() : output };
}

function hasLocalDependencies() {
  return existsSync(resolve(repoRoot, "node_modules", ".bin"));
}

function truncate(text) {
  return text.length > MAX_OUTPUT ? `${text.slice(0, MAX_OUTPUT)}\n... (output truncated)` : text;
}

// Each check returns { name, command, ok, output }; checks that cannot run return null.
function check(name, command, args) {
  const { ok, output } = run(command, args);
  return { name, command: [command, ...args].join(" "), ok, output: truncate(output) };
}

export function lintCode(files) {
  if (!hasLocalDependencies()) return null;
  return check("eslint", "npx", ["--no-install", "eslint", ...(files ?? ["."])]);
}

export function typecheck() {
  if (!hasLocalDependencies()) return null;
  return check("typecheck", "npm", ["run", "--silent", "typecheck"]);
}

export function lintMarkdown(files) {
  // --no-globs lints only the given files; without files it uses the globs of the config.
  const args = ["--yes", MARKDOWNLINT, ...(files ? ["--no-globs", ...files] : [])];
  return check("markdownlint", "npx", args);
}

export function checkLinks() {
  return check("markdown links", "node", ["scripts/check-markdown-links.mjs"]);
}

export function formatFailures(results) {
  return results
    .filter((r) => r && !r.ok)
    .map((r) => `### ${r.name} failed (\`${r.command}\`)\n\n${r.output}`)
    .join("\n\n");
}

// Repo-relative files changed on this branch: committed (against origin/main), staged,
// unstaged and untracked. Deleted files are excluded.
export function changedFiles() {
  const lists = [
    ["diff", "--name-only", "--diff-filter=d", "origin/main...HEAD"],
    ["diff", "--name-only", "--diff-filter=d", "HEAD"],
    ["ls-files", "--others", "--exclude-standard"],
  ];
  const files = new Set();
  for (const args of lists) {
    const result = spawnSync("git", args, { cwd: repoRoot, encoding: "utf8" });
    if (result.status !== 0) continue;
    for (const line of result.stdout.split("\n")) if (line.trim()) files.add(line.trim());
  }
  return [...files].filter((file) => existsSync(resolve(repoRoot, file)));
}
