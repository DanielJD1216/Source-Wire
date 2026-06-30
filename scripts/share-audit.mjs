import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 before release approval");
assertEqual(packageJson.license, "UNLICENSED", "package license must remain UNLICENSED before owner approval");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

await assertPathMissing("LICENSE", "LICENSE file must not exist before owner license approval");

for (const requiredPath of [
  "docs/public-status.md",
  "docs/share-for-review.md",
  "docs/first-time-visitor-share-readiness-audit.md",
  "docs/world-share-readiness.md",
  "docs/technical-reviewer-guide.md",
  "docs/reviewer-feedback-guide.md",
  "docs/publish-readiness.md"
]) {
  await assertPathExists(requiredPath);
}

const publicStatus = await readFile("docs/public-status.md", "utf8");
const shareForReview = await readFile("docs/share-for-review.md", "utf8");
const firstVisitorAudit = await readFile("docs/first-time-visitor-share-readiness-audit.md", "utf8");
const worldReadiness = await readFile("docs/world-share-readiness.md", "utf8");

for (const [label, text, requiredText] of [
  ["public status", publicStatus, "Source-Wire is public for technical review."],
  ["public status", publicStatus, "It is not ready for reuse, redistribution, publishing, deployment, or production use."],
  ["share for review", shareForReview, "Status: technical review only."],
  ["share for review", shareForReview, "Source-Wire is public for technical review only."],
  ["share for review", shareForReview, "Do not say:"],
  ["share for review", shareForReview, "Source-Wire is open source and ready to use."],
  ["first visitor audit", firstVisitorAudit, "Ready for technical review: yes."],
  ["first visitor audit", firstVisitorAudit, "Ready for broad public reuse: no."],
  ["first visitor audit", firstVisitorAudit, "Main blocker: owner-approved license implementation."],
  ["world readiness", worldReadiness, "Source-Wire is ready to share for technical review."],
  ["world readiness", worldReadiness, "Source-Wire cannot be shared as an open-source project"]
]) {
  if (!text.includes(requiredText)) {
    failures.push(`${label} missing required text: ${requiredText}`);
  }
}

if (failures.length > 0) {
  console.error("failed first visitor share audit");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire First Visitor Share Audit");
printRows([
  ["First visitor audit", "ready"],
  ["Technical review sharing", "ready"],
  ["Broad public reuse", "blocked"],
  ["Package license", packageJson.license],
  ["Package version", packageJson.version],
  ["LICENSE file", "not present"],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Safe Share Boundary");
printList([
  "Share for technical review only.",
  "Do not describe Source-Wire as open source yet.",
  "Do not imply reuse, redistribution, publishing, deployment, hosted runtime, or contribution rights."
]);

console.log("");
console.log("ok first visitor share audit ready");
console.log("ok technical review sharing ready");
console.log("blocked broad public reuse");

async function assertPathExists(path) {
  try {
    await stat(path);
  } catch {
    failures.push(`missing required path: ${path}`);
  }
}

async function assertPathMissing(path, reason) {
  try {
    await stat(path);
    failures.push(reason);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }

    failures.push(`could not inspect ${path}`);
  }
}

function assertEqual(actual, expected, reason) {
  if (actual !== expected) {
    failures.push(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}

function printRows(rows) {
  for (const [label, value] of rows) {
    console.log(`${label}: ${value}`);
  }
}

function printList(items) {
  for (const item of items) {
    console.log(`- ${item}`);
  }
}
