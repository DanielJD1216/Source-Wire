import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const readme = await readFile("README.md", "utf8");
const failures = [];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public");

for (const requiredText of [
  "Current public status: Source-Wire is Apache-2.0 licensed as a source package.",
  "The contracts package is published to npm and released on GitHub.",
  "Latest source also contains unpublished, loopback-only Alpha 1 Stories 1 and 2 for disposable local PostgreSQL, MCP candidate proposal, and owner-approval proof.",
  "Nothing is deployed or hosted.",
  "## First Reviewer Quickstart",
  "Use Node.js 22 with npm.",
  "npm install",
  "npm run readiness:report",
  "npm run reviewer:smoke",
  "npm run publish:readiness",
  "## Still Blocked",
  "hosted runtime",
  "production runtime use",
  "code contribution acceptance",
  "[Documentation Index](docs/README.md)",
  "[Alpha 1 Story 2 Candidate Approval](docs/getting-started/alpha1-story2-candidate-approval.md)",
  "[Share For Technical Review](docs/guides/share-for-review.md)",
  "[Reviewer Feedback Guide](docs/guides/reviewer-feedback-guide.md)",
  "Known `v0.1.0` package issue: the immutable npm artifact exports `SOURCE_WIRE_PACKAGE_VERSION` as `0.0.0`"
]) {
  assertIncludes(readme, requiredText, `README public entrypoint includes ${requiredText}`);
}

assertBefore("## First Reviewer Quickstart", "## What This Public Skeleton Includes");
assertBefore("## Still Blocked", "## What This Public Skeleton Includes");

for (const unsafePattern of [
  /\bInstall\s+from\s+npm\b/i,
  /\bnpm\s+published\b/i,
  /\bproduction\s+ready\b/i,
  /\bhosted\s+memory\s+backend\b/i,
  /\bcode\s+contributions\s+are\s+accepted\b/i,
  /\bcontributions\s+are\s+open\b/i
]) {
  scanUnsafeLiveClaims(unsafePattern);
}

if (failures.length > 0) {
  console.error("failed README entrypoint smoke");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire README Entrypoint Smoke");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["First reviewer path", "present"],
  ["Public documentation", "linked"],
  ["Blocked launch channels", "visible before package details"],
  ["Unsafe live claims", "absent"]
]);

console.log("");
console.log("ok readme entrypoint smoke ready");
console.log("ok readme first reviewer path visible");
console.log("blocked unsafe readme launch claims");

function assertEqual(actual, expected, reason) {
  if (actual !== expected) {
    failures.push(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(text, requiredText, reason) {
  if (!text.includes(requiredText)) {
    failures.push(`${reason}: missing ${JSON.stringify(requiredText)}`);
  }
}

function assertBefore(firstText, secondText) {
  const firstIndex = readme.indexOf(firstText);
  const secondIndex = readme.indexOf(secondText);
  if (firstIndex === -1 || secondIndex === -1 || firstIndex > secondIndex) {
    failures.push(`README must show ${JSON.stringify(firstText)} before ${JSON.stringify(secondText)}`);
  }
}

function scanUnsafeLiveClaims(unsafePattern) {
  const lines = readme.split(/\r?\n/u);
  for (const [index, line] of lines.entries()) {
    if (!unsafePattern.test(line)) {
      continue;
    }

    const nearbyContext = lines.slice(Math.max(0, index - 3), index + 1).join("\n");
    if (isExplicitBoundaryLine(line) || /Do not say:|Unsafe Wording To Avoid/i.test(nearbyContext)) {
      continue;
    }

    failures.push(`README contains unsafe live claim matching ${unsafePattern} on line ${index + 1}`);
  }
}

function isExplicitBoundaryLine(line) {
  return /\b(?:not|no|blocked|do not|does not|without|unsafe|avoid|must not|cannot|currently|until|before|disabled|unpublished|unreleased|undeployed|yet|only)\b/i.test(line);
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
