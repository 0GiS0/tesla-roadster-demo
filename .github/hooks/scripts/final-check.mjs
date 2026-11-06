// agentStop hook: last gate before the agent hands the work over (and before any PR).
// It runs the same checks as the required CI checks on everything changed in the branch.
// On failure it blocks the stop, so the agent receives the errors as its next prompt.
import {
  changedFiles,
  checkLinks,
  formatFailures,
  isCodeFile,
  isDocFile,
  lintCode,
  lintMarkdown,
  insideAgenticWorkflow,
  readStdinJson,
  typecheck,
} from "./checks.mjs";

if (insideAgenticWorkflow) process.exit(0);

await readStdinJson();

const files = changedFiles();
const hasCode = files.some(isCodeFile);
const hasDocs = files.some(isDocFile);

const results = [];
if (hasCode) results.push(lintCode(), typecheck());
if (hasDocs) results.push(lintMarkdown(), checkLinks());

const failures = formatFailures(results);
if (failures) {
  const reason = [
    "Do not finish yet: the required CI checks (`🧪 validate` and `📚 docs`) would fail,",
    "which blocks the pull request from merging. Fix these problems and verify them:",
    "",
    failures,
  ].join("\n");
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
}
