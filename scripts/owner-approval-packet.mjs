import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const approvalPacket = await readFile("docs/owner-approval-record-packet.md", "utf8");
const failures = [];

const approvalTargets = [
  {
    issue: 255,
    label: "First public release path",
    exactText:
      "Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms."
  },
  {
    issue: 256,
    label: "Branch governance path",
    exactText:
      "Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions."
  },
  {
    issue: 257,
    label: "Hosted runtime PRD path",
    exactText:
      "Approved for a future Source-Wire hosted runtime PRD unit: define the scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements before any hosted runtime implementation starts. Do not publish npm, create a GitHub release, deploy services, accept code contributions, or add real user data in this PRD unit."
  },
  {
    issue: 258,
    label: "Contribution terms path",
    exactText:
      "Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit."
  }
];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 until release execution");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while npm publishing is blocked");

for (const requiredPath of [
  "docs/owner-approval-record-packet.md",
  "docs/owner-launch-checklist.md",
  "docs/launch-decision-status.md",
  "docs/release-approval-request-packet.md",
  "docs/branch-governance-approval-request.md",
  "docs/legal-review-question-packet.md"
]) {
  await assertPathExists(requiredPath);
}

for (const requiredText of [
  "Status: owner approval copy packet only.",
  "This packet does not approve npm publishing",
  "Approval must be recorded separately",
  "## Owner Approval Record",
  "blocked approval recording is manual owner action"
]) {
  assertIncludes(approvalPacket, requiredText, `owner approval packet includes ${requiredText}`);
}

for (const target of approvalTargets) {
  assertIncludes(approvalPacket, `#${target.issue}`, `owner approval packet references issue ${target.issue}`);
  assertIncludes(approvalPacket, target.exactText, `owner approval packet includes exact approval text for issue ${target.issue}`);
}

if (failures.length > 0) {
  console.error("failed owner approval packet");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Owner Approval Packet");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Approval target count", String(approvalTargets.length)],
  ["Approval recording", "manual owner action"],
  ["npm publishing", "blocked"],
  ["GitHub release", "blocked"],
  ["Hosted runtime", "blocked"],
  ["Code contributions", "blocked"]
]);

printSection("Exact Approval Texts");
for (const target of approvalTargets) {
  console.log(`#${target.issue} ${target.label}`);
  console.log(target.exactText);
  console.log("");
}

printSection("Next Checks After Manual Approval");
console.log("npm run owner:decision-status");
console.log("npm run release:approval-status");

console.log("");
console.log("ok owner approval packet ready");
console.log("ok exact owner approval texts available");
console.log("blocked approval recording is manual owner action");

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

function assertIncludes(text, requiredText, reason) {
  if (!text.includes(requiredText)) {
    failures.push(`${reason}: missing ${JSON.stringify(requiredText)}`);
  }
}

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}

function printRows(rows) {
  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  for (const [label, value] of rows) {
    console.log(`${label.padEnd(labelWidth)}: ${value}`);
  }
}
