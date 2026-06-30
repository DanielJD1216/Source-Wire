import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 before release approval");
assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner approval");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

await assertPathExists("LICENSE");

for (const requiredPath of [
  "docs/public-status.md",
  "docs/share-for-review.md",
  "docs/world-share-kit.md",
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
const worldShareKit = await readFile("docs/world-share-kit.md", "utf8");
const firstVisitorAudit = await readFile("docs/first-time-visitor-share-readiness-audit.md", "utf8");
const worldReadiness = await readFile("docs/world-share-readiness.md", "utf8");

for (const [label, text, requiredText] of [
  ["public status", publicStatus, "Source-Wire is Apache-2.0 licensed."],
  ["public status", publicStatus, "It is not published to npm, not released on GitHub, not deployed, and not a hosted runtime."],
  ["share for review", shareForReview, "Status: Apache-2.0 licensed source package."],
  ["share for review", shareForReview, "Source-Wire is Apache-2.0 licensed."],
  ["share for review", shareForReview, "Do not say:"],
  ["share for review", shareForReview, "Source-Wire is production-ready."],
  ["world share kit", worldShareKit, "Status: public source-package share kit only."],
  ["world share kit", worldShareKit, "Source-Wire is an Apache-2.0 source package skeleton"],
  ["world share kit", worldShareKit, "Do not say:"],
  ["world share kit", worldShareKit, "Install it from npm."],
  ["world share kit", worldShareKit, "Contributions are open."],
  ["first visitor audit", firstVisitorAudit, "Ready for technical review: yes."],
  ["first visitor audit", firstVisitorAudit, "Ready for source package reuse: yes, under Apache-2.0."],
  ["first visitor audit", firstVisitorAudit, "Still blocked: npm publishing, GitHub release publishing, deployment, hosted runtime use, production runtime use, and code contribution acceptance."],
  ["world readiness", worldReadiness, "Source-Wire can be shared as an Apache-2.0 licensed source package."],
  ["world readiness", worldReadiness, "It is not an npm-published package, GitHub release, deployed service, hosted runtime, or production runtime."]
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
  ["Source package sharing", "ready"],
  ["Source package reuse", "Apache-2.0"],
  ["Package license", packageJson.license],
  ["Package version", packageJson.version],
  ["LICENSE file", "present"],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Safe Share Boundary");
printList([
  "Share the source repo under Apache-2.0.",
  "Do not imply npm publication, GitHub release, deployment, hosted runtime, production runtime readiness, or contribution acceptance."
]);

console.log("");
console.log("ok first visitor share audit ready");
console.log("ok apache 2 reuse ready");
console.log("blocked production launch channels");

async function assertPathExists(path) {
  try {
    await stat(path);
  } catch {
    failures.push(`missing required path: ${path}`);
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
