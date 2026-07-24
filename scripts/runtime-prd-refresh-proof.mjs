import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const approvalUrl = "https://github.com/DanielJD1216/Source-Wire/issues/257#issuecomment-4884301286";
const blockedMarker = "blocked hosted runtime implementation";
const failures = [];

const requiredDocs = [
  "docs/internal/hosted-runtime-prd.md",
  "docs/internal/runtime-implementation-decision-gate.md",
  "docs/internal/private-proof-runtime-extraction-readiness.md",
  "docs/internal/runtime-prd-refresh-approval-status.md",
  "docs/internal/runtime-prd-refresh-approval-request.md",
  "docs/internal/runtime-prd-refresh-proof.md"
];

for (const path of requiredDocs) {
  const text = await readFile(path, "utf8");
  assertIncludes(text, approvalUrl, `${path} must cite recorded runtime PRD refresh approval`);
  assertIncludes(text.toLowerCase(), "runtime implementation remains blocked", `${path} must keep runtime implementation blocked`);
}

const status = await execFileAsync("node", ["scripts/runtime-prd-refresh-approval-status.mjs"], {
  encoding: "utf8",
  maxBuffer: 1024 * 1024
});

assertIncludes(status.stdout, "ok exact runtime PRD refresh approval recorded", "approval status must prove exact approval");
assertIncludes(status.stdout, blockedMarker, "approval status must keep hosted runtime implementation blocked");

if (failures.length > 0) {
  console.error("failed runtime PRD refresh proof");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("ok runtime PRD refresh proof ready");
console.log("ok exact runtime PRD refresh approval recorded");
console.log(blockedMarker);

function assertIncludes(text, expected, reason) {
  if (!text.includes(expected)) {
    failures.push(`${reason}: missing ${JSON.stringify(expected)}`);
  }
}
