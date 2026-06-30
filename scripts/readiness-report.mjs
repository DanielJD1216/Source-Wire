import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const failures = [];

const requiredScripts = [
  "typecheck",
  "build",
  "test",
  "validate:fixtures",
  "verify:schema-exports",
  "cli:smoke",
  "consumer:smoke",
  "package:content-smoke",
  "examples:installed-smoke",
  "minimal-runtime:smoke",
  "runtime-boundary:smoke",
  "runtime-boundary:installed-smoke",
  "runtime-boundary:diagnostics-smoke",
  "reviewer:smoke",
  "docs:links",
  "docs:command-setup",
  "share:audit",
  "safety:scan",
  "claims:scan",
  "package:required-paths",
  "ci:markers",
  "ci:markers:smoke",
  "license:rehearsal",
  "license:decision-record",
  "license:approval-request",
  "license:implementation-plan",
  "legal:packet",
  "owner:launch-checklist",
  "owner:license-preflight",
  "owner:decision-workflow",
  "world:readiness",
  "launch:decision-status",
  "release:gate",
  "package:dry-run",
  "publish:readiness"
];

const blockedScope = [
  "npm publishing",
  "GitHub release publishing",
  "deployment",
  "API server runtime",
  "MCP server runtime",
  "database migrations",
  "PostgreSQL or pgvector setup",
  "memory-engine integration",
  "live connectors",
  "Mission Control UI",
  "real user data",
  "trusted Memory Record promotion"
];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0");
assertEqual(packageJson.license, "UNLICENSED", "package license must remain UNLICENSED");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted");
assertEqual(packageJson.bin?.["source-wire"], "./dist/cli.js", "source-wire bin must point to ./dist/cli.js");

for (const scriptName of requiredScripts) {
  if (typeof packageJson.scripts?.[scriptName] !== "string") {
    failures.push(`missing required script: ${scriptName}`);
  }
}

const exportKeys = Object.keys(packageJson.exports ?? {}).sort();
const expectedExports = [
  ".",
  "./schemas/chat-export-message",
  "./schemas/owner-hosted-api-mcp-boundary",
  "./schemas/project-context-pack",
  "./schemas/second-brain-v1"
];
for (const expectedExport of expectedExports) {
  if (!exportKeys.includes(expectedExport)) {
    failures.push(`missing expected package export: ${expectedExport}`);
  }
}

const schemaFiles = (await readdir(join(root, "schemas"))).filter((file) => file.endsWith(".schema.json")).sort();
for (const schemaFile of [
  "chat-export-message.schema.json",
  "project-context-pack.schema.json",
  "second-brain-v1.schema.json"
]) {
  if (!schemaFiles.includes(schemaFile)) {
    failures.push(`missing expected schema file: ${schemaFile}`);
  }
}

for (const requiredPath of [
  "README.md",
  "docs/apache-2-license-implementation-readiness.md",
  "docs/first-time-visitor-share-readiness-audit.md",
  "docs/license-approval-rehearsal.md",
  "docs/license-approval-decision-record.md",
  "docs/license-approval-request-packet.md",
  "docs/license-decision-implementation-plan.md",
  "docs/legal-review-question-packet.md",
  "docs/owner-launch-checklist.md",
  "docs/owner-license-approval-preflight.md",
  "docs/owner-license-decision-workflow.md",
  "docs/launch-decision-status.md",
  "docs/public-status.md",
  "docs/repository-metadata.md",
  "docs/quickstart.md",
  "docs/minimal-runtime-prd.md",
  "docs/license-decision-gate.md",
  "docs/runtime-boundary-readiness.md",
  "docs/publish-readiness.md",
  "docs/world-share-readiness.md",
  "docs/share-for-review.md",
  "docs/technical-reviewer-guide.md",
  "docs/reviewer-feedback-guide.md",
  "docs/ci-checks.md",
  "examples/fixtures/README.md",
  "examples/minimal-runtime/README.md",
  "examples/typescript/README.md"
]) {
  await assertPathExists(requiredPath);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`failed ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Package Readiness Report");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Publish boundary", "npm publishing blocked, publishConfig.access restricted"],
  ["Runtime boundary", "synthetic in-memory boundary only, no backend runtime included"]
]);

printSection("Package Surfaces");
printList([
  `bin: source-wire -> ${packageJson.bin["source-wire"]}`,
  ...exportKeys.map((key) => `export: ${key}`),
  ...schemaFiles.map((file) => `schema: ${file}`)
]);

printSection("Readiness Commands");
printList(requiredScripts.map((scriptName) => `npm run ${scriptName}`));

printSection("Installed Package Smokes");
printList([
  "reviewer:smoke validates the documented first reviewer path from a temporary clean checkout-style copy",
  "consumer:smoke validates package-root imports and installed CLI fixture validation",
  "package:content-smoke validates installed required paths, README/docs/examples links, installed runtime readiness summary presence, and installed readiness summary content assertions",
  "examples:installed-smoke validates copied TypeScript examples against installed package declarations",
  "minimal-runtime:smoke validates exported synthetic in-memory runtime boundary code against owner-hosted API plus MCP proof cases",
  "runtime-boundary:installed-smoke validates the packaged synthetic runtime-boundary example after install",
  "runtime-boundary:diagnostics-smoke validates the synthetic smoke diagnostic failure format"
]);

printSection("Required Readiness Docs");
printList([
  "README.md is the package entrypoint and public boundary summary",
  "docs/apache-2-license-implementation-readiness.md records the future Apache-2.0 implementation checklist without changing the current license",
  "docs/first-time-visitor-share-readiness-audit.md records technical-review readiness and broad-reuse blockers",
  "docs/license-approval-rehearsal.md records the read-only approval rehearsal and current boundary checks before license implementation",
  "docs/license-approval-decision-record.md records the pending machine-checked owner license decision without approving a license change",
  "docs/license-approval-request-packet.md records exact owner license approval options without granting approval",
  "docs/license-decision-implementation-plan.md maps each owner decision path to the next implementation unit without implementing a license change",
  "docs/legal-review-question-packet.md records counsel or owner questions for license, contribution, support, security, brand, hosted runtime, and data boundaries without approving legal changes",
  "docs/owner-launch-checklist.md records the technical-review-ready and broad-launch-blocked owner approval order",
  "docs/owner-license-approval-preflight.md records the final read-only preflight before owner license approval",
  "docs/owner-license-decision-workflow.md records the owner decision workflow and exact next physical action without approving a license change",
  "docs/launch-decision-status.md records the one-command launch status view without approving any blocked launch path",
  "docs/public-status.md states the public review, license, release, publishing, runtime, and reuse boundaries",
  "docs/repository-metadata.md explains GitHub metadata, support, security, contribution, and CI visibility boundaries",
  "docs/quickstart.md defines local setup and first-run commands",
  "docs/minimal-runtime-prd.md records the minimal synthetic runtime boundary while keeping hosted runtime implementation blocked",
  "docs/license-decision-gate.md records the owner license decision paths while keeping the current license unchanged",
  "docs/runtime-boundary-readiness.md summarizes the runtime-boundary proof lane and blocked runtime scope",
  "docs/publish-readiness.md summarizes the local readiness gate and marker map",
  "docs/world-share-readiness.md separates technical-review sharing from broad public reuse approval",
  "docs/share-for-review.md gives safe technical-review invite copy, first commands, feedback routing, and review-only boundaries",
  "docs/technical-reviewer-guide.md gives reviewers the clone, verify, inspect, feedback, and license-boundary path",
  "docs/reviewer-feedback-guide.md defines structured public issue feedback without asking for private data",
  "docs/ci-checks.md summarizes GitHub Actions Package Checks and marker map",
  "examples/fixtures/README.md summarizes synthetic fixture boundaries",
  "examples/minimal-runtime/README.md summarizes the exported synthetic runtime boundary smoke",
  "examples/typescript/README.md summarizes public TypeScript example checks"
]);

printSection("Blocked Scope");
printList(blockedScope);

console.log("");
console.log("ok readiness report");

async function assertPathExists(path) {
  try {
    await stat(join(root, path));
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
