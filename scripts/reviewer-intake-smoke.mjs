import { readFile, stat } from "node:fs/promises";

const failures = [];

const packageJson = JSON.parse(await readFile("package.json", "utf8"));

assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay restricted");

const templatePaths = [
  ".github/ISSUE_TEMPLATE/verification-failure.yml",
  ".github/ISSUE_TEMPLATE/docs-contract-feedback.yml",
  ".github/ISSUE_TEMPLATE/boundary-safety-concern.yml"
];

const supportPaths = [
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/pull_request_template.md",
  "CONTRIBUTING.md",
  "docs/reviewer-feedback-guide.md",
  "docs/share-for-review.md",
  "docs/world-share-packet.md",
  "docs/technical-reviewer-guide.md"
];

for (const path of [...templatePaths, ...supportPaths]) {
  await assertPathExists(path);
}

const files = new Map();
for (const path of [...templatePaths, ...supportPaths]) {
  files.set(path, await readFile(path, "utf8"));
}

assertIncludes(files.get(".github/ISSUE_TEMPLATE/config.yml"), "blank_issues_enabled: false", "issue template config disables blank issues");
assertIncludes(files.get(".github/ISSUE_TEMPLATE/config.yml"), "docs/technical-reviewer-guide.md", "issue template config links technical reviewer guide");
assertIncludes(files.get(".github/ISSUE_TEMPLATE/config.yml"), "docs/reviewer-feedback-guide.md", "issue template config links reviewer feedback guide");

verifyTemplate(".github/ISSUE_TEMPLATE/verification-failure.yml", {
  name: "Verification failure",
  label: "verification",
  requiredIds: ["command", "observed-error", "node-version", "npm-version", "install-state", "boundary-check"],
  requiredText: ["Do not paste secrets", "local private paths", "real source payloads", "Safety check"]
});

verifyTemplate(".github/ISSUE_TEMPLATE/docs-contract-feedback.yml", {
  name: "Docs or contract feedback",
  label: "contracts",
  requiredIds: ["file", "problem", "expected", "area", "boundary-check"],
  requiredText: ["synthetic examples", "public repo references", "not permission to publish npm"]
});

verifyTemplate(".github/ISSUE_TEMPLATE/boundary-safety-concern.yml", {
  name: "Boundary or safety concern",
  label: "safety",
  requiredIds: ["boundary", "location", "concern", "safer-wording", "boundary-check"],
  requiredText: ["hosted-runtime confusion", "trusted-memory auto-promotion confusion", "real memory records"]
});

for (const path of templatePaths) {
  const text = files.get(path) ?? "";
  assertIncludes(text, "reviewer-feedback", `${path} routes to reviewer-feedback label`);
  assertIncludes(text, "required: true", `${path} has required fields`);
}

const docsToCheck = [
  "CONTRIBUTING.md",
  "docs/reviewer-feedback-guide.md",
  "docs/share-for-review.md",
  "docs/world-share-packet.md",
  "docs/technical-reviewer-guide.md"
];

for (const path of docsToCheck) {
  const text = files.get(path) ?? "";
  assertIncludes(text, "verification failure", `${path} points to verification failure intake`);
  assertIncludes(text, "docs or contract feedback", `${path} points to docs or contract feedback intake`);
  assertIncludes(text, "boundary or safety concern", `${path} points to boundary or safety concern intake`);
}

for (const path of ["CONTRIBUTING.md", ".github/pull_request_template.md", "docs/reviewer-feedback-guide.md"]) {
  assertIncludes(files.get(path), "code contributions are not accepted", `${path} blocks code contribution assumptions`);
}

for (const unsafePattern of [
  /\bopen\s+for\s+contributions\b/i,
  /\bcontributions\s+are\s+open\b/i,
  /\bcode\s+contributions\s+are\s+accepted\b/i,
  /\bsubmit\s+real\s+(?:user|client|source|memory)\s+data\b/i,
  /\binclude\s+secrets\b/i
]) {
  scanUnsafeLiveClaims(unsafePattern);
}

if (failures.length > 0) {
  console.error("failed reviewer intake smoke");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Reviewer Intake Smoke");
printRows([
  ["License", packageJson.license],
  ["Version", packageJson.version],
  ["Blank issues", "disabled"],
  ["Issue templates", "verification, docs-contract, boundary-safety"],
  ["Private data", "blocked"],
  ["Feedback route", "structured issues"],
  ["Code contributions", "blocked"]
]);

console.log("");
console.log("ok reviewer intake smoke ready");
console.log("ok reviewer issue templates structured");
console.log("blocked unsafe reviewer data intake");

async function assertPathExists(path) {
  try {
    await stat(path);
  } catch {
    failures.push(`missing required reviewer intake path: ${path}`);
  }
}

function verifyTemplate(path, options) {
  const text = files.get(path) ?? "";
  assertIncludes(text, `name: ${options.name}`, `${path} has expected template name`);
  assertIncludes(text, `  - ${options.label}`, `${path} has expected label ${options.label}`);

  for (const id of options.requiredIds) {
    assertIncludes(text, `id: ${id}`, `${path} has required field id ${id}`);
  }

  for (const requiredText of options.requiredText) {
    assertIncludes(text, requiredText, `${path} has required safety or routing text`);
  }
}

function assertEqual(actual, expected, reason) {
  if (actual !== expected) {
    failures.push(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(text, requiredText, reason) {
  if (!String(text ?? "").includes(requiredText)) {
    failures.push(`${reason}: missing ${JSON.stringify(requiredText)}`);
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

function isExplicitBoundaryLine(line) {
  return /\b(?:not|no|blocked|do not|does not|without|unsafe|avoid|must not|cannot|currently|until|before|disabled|unpublished|unreleased|undeployed|yet|only)\b/i.test(line);
}

function scanUnsafeLiveClaims(unsafePattern) {
  for (const [path, text] of files) {
    const lines = text.split(/\r?\n/u);
    for (const [index, line] of lines.entries()) {
      if (!unsafePattern.test(line)) {
        continue;
      }

      const nearbyContext = lines.slice(Math.max(0, index - 3), index + 1).join("\n");
      if (isExplicitBoundaryLine(line) || /Do not say:|Unsafe Wording To Avoid/i.test(nearbyContext)) {
        continue;
      }

      failures.push(`${path} reviewer intake contains unsafe live claim matching ${unsafePattern} on line ${index + 1}`);
    }
  }
}
