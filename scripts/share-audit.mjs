import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner approval");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");

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
const safeInviteCopy = extractSectionCodeBlock(shareForReview, "Safe Invite Copy");

for (const [label, text, requiredText] of [
  ["public status", publicStatus, "Source-Wire is Apache-2.0 licensed."],
  ["public status", publicStatus, "It is published to npm and released on GitHub, but not deployed and not a hosted runtime."],
  ["share for review", shareForReview, "Status: Apache-2.0 licensed source package."],
  ["share for review", shareForReview, "Source-Wire is Apache-2.0 licensed."],
  ["share for review", shareForReview, "Do not say:"],
  ["share for review", shareForReview, "Source-Wire is production-ready."],
  ["share for review", shareForReview, "Reviewer-safe first pass:"],
  ["share for review", shareForReview, "Owner-only preflight before broad public sharing:"],
  ["world share kit", worldShareKit, "Status: public source-package and package-release share kit only."],
  ["world share kit", worldShareKit, "Source-Wire is an Apache-2.0 package of agent-first memory contracts and examples"],
  ["world share kit", worldShareKit, "Do not say:"],
  ["world share kit", worldShareKit, "Install it as a hosted runtime backend."],
  ["world share kit", worldShareKit, "Contributions are open."],
  ["first visitor audit", firstVisitorAudit, "Ready for technical review: yes."],
  ["first visitor audit", firstVisitorAudit, "Ready for source package reuse: yes, under Apache-2.0."],
  ["first visitor audit", firstVisitorAudit, "Still blocked: deployment, hosted runtime use, production runtime use, and code contribution acceptance."],
  ["world readiness", worldReadiness, "Source-Wire can be shared as an Apache-2.0 licensed source package."],
  ["world readiness", worldReadiness, "It is an npm-published package and GitHub release, but not a deployed service, hosted runtime, or production runtime."]
]) {
  if (!text.includes(requiredText)) {
    failures.push(`${label} missing required text: ${requiredText}`);
  }
}

if (safeInviteCopy.includes("npm run owner:")) {
  failures.push("safe invite copy must not ask reviewers to run owner-only commands");
}

if (safeInviteCopy.includes("npm run world:share-preflight") || safeInviteCopy.includes("npm run world:share-final-preflight")) {
  failures.push("safe invite copy must separate owner world-share preflight commands from reviewer-safe first-pass commands");
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
  ["npm publishing", "published"],
  ["GitHub release", "published"],
  ["Hosted runtime", "blocked"],
  ["Contribution acceptance", "blocked"]
]);

printSection("Safe Share Boundary");
printList([
  "Share the source repo under Apache-2.0.",
  "Share npm package @source-wire/contracts@0.1.0 and GitHub release v0.1.0.",
  "Do not imply deployment, hosted runtime, production runtime readiness, or contribution acceptance."
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

function extractSectionCodeBlock(text, heading) {
  const pattern = new RegExp(`## ${escapeRegExp(heading)}[\\s\\S]*?\`\`\`text\\n(?<block>[\\s\\S]*?)\`\`\``, "u");
  const match = text.match(pattern);
  if (!match?.groups?.block) {
    failures.push(`${heading} missing text code block`);
    return "";
  }

  return match.groups.block;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
