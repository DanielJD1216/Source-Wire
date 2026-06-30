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
  "docs:anchors",
  "docs:external-links",
  "docs:command-setup",
  "repository:metadata",
  "repository:live-github",
  "repository:live-branch",
  "repository:branch-governance-request",
  "security:live-surface",
  "registry:live-npm",
  "release:live-tags",
  "pull-request:boundary",
  "share:audit",
  "intake:boundary",
  "safety:scan",
  "claims:scan",
  "package:required-paths",
  "ci:markers",
  "ci:markers:smoke",
  "license:rehearsal",
  "license:decision-record",
  "license:approval-request",
  "license:implementation-plan",
  "license:history-boundary",
  "legal:packet",
  "owner:launch-checklist",
  "owner:license-preflight",
  "owner:decision-intake",
  "owner:decision-workflow",
  "world:readiness",
  "world:live-status",
  "launch:decision-status",
  "release:implementation-plan",
  "release:review",
  "release:approval-request",
  "release:candidate-readiness",
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
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
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
  "docs/owner-license-decision-intake.md",
  "docs/owner-license-decision-workflow.md",
  "docs/launch-decision-status.md",
  "docs/release-implementation-runbook.md",
  "docs/public-status.md",
  "docs/repository-metadata.md",
  "docs/quickstart.md",
  "docs/release-approval-request-packet.md",
  "docs/release-candidate-readiness.md",
  "docs/branch-governance-approval-request.md",
  "docs/release-notes-draft.md",
  "docs/release-review-packet.md",
  "docs/release-version-recommendation.md",
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
  "docs/apache-2-license-implementation-readiness.md records the completed Apache-2.0 implementation while keeping publishing blocked",
  "docs/first-time-visitor-share-readiness-audit.md records source-package sharing readiness and remaining launch blockers",
  "docs/license-approval-rehearsal.md records the Apache-2.0 implementation check and current blocked publish boundary",
  "docs/license-approval-decision-record.md records the implemented owner license decision",
  "docs/license-approval-request-packet.md records the completed owner approval path",
  "docs/license-decision-implementation-plan.md maps completed Apache-2.0 implementation and remaining decision paths",
  "docs/decision-prototypes/license-recommendation.md records superseded pre-implementation license history so old UNLICENSED guidance is not mistaken for current guidance",
  "docs/legal-review-question-packet.md records remaining counsel or owner questions for contribution, support, security, brand, hosted runtime, and data boundaries",
  "docs/owner-launch-checklist.md records the source-package-ready and launch-channel-blocked owner approval order",
  "docs/owner-license-approval-preflight.md records the implemented owner license approval",
  "docs/owner-license-decision-intake.md records the captured owner decision",
  "docs/owner-license-decision-workflow.md records the completed owner decision workflow",
  "docs/launch-decision-status.md records the one-command launch status view without approving any blocked launch path",
  "docs/release-implementation-runbook.md records the future release execution order and stop conditions without approving release execution",
  "docs/release-review-packet.md records release review inputs before release implementation approval",
  "docs/release-version-recommendation.md records the recommended future first release version without changing package metadata",
  "docs/release-notes-draft.md records draft release notes without creating a GitHub release",
  "docs/release-approval-request-packet.md records exact future release decision options without publishing",
  "docs/release-candidate-readiness.md records the release-candidate preflight while release implementation remains blocked",
  "docs/branch-governance-approval-request.md records branch protection and repository ruleset decision options while live GitHub settings remain unchanged",
  "docs/public-status.md states the Apache-2.0 license, release, publishing, runtime, and contribution boundaries",
  "docs/repository-metadata.md explains GitHub metadata, support, security, contribution, and CI visibility boundaries",
  "docs/quickstart.md defines local setup and first-run commands",
  "docs/minimal-runtime-prd.md records the minimal synthetic runtime boundary while keeping hosted runtime implementation blocked",
  "docs/license-decision-gate.md records the implemented Apache-2.0 path and remaining blocked channels",
  "docs/runtime-boundary-readiness.md summarizes the runtime-boundary proof lane and blocked runtime scope",
  "docs/publish-readiness.md summarizes the local readiness gate and marker map",
  "docs/world-share-readiness.md separates Apache-2.0 source sharing from blocked production launch channels",
  "npm run docs:anchors verifies local Markdown section links before broad sharing",
  "npm run docs:external-links verifies public-facing external URLs before broad sharing without publishing or deploying",
  "npm run world:live-status verifies the owner-side live world-share state across GitHub, CI, npm, releases, tags, security, and branch governance before broad public sharing",
  "docs/share-for-review.md gives safe public sharing copy, first commands, feedback routing, and launch-channel boundaries",
  "docs/repository-metadata.md records the expected live GitHub About panel, topics, and feature flags for first visitors",
  "npm run repository:live-github verifies the owner-side live GitHub public surface before broad public sharing",
  "npm run repository:live-branch verifies the owner-side live default branch, origin/main match, branch protection state, and repository ruleset state before broad public sharing",
  "npm run repository:branch-governance-request verifies the local owner decision packet for branch protection and repository ruleset governance without changing GitHub settings",
  "npm run security:live-surface verifies the owner-side live GitHub security surface, safe public intake, and secret-scanning settings before broad public sharing",
  "npm run registry:live-npm verifies the owner-side npm registry boundary before broad public sharing",
  "npm run release:live-tags verifies the owner-side release tag boundary before broad public sharing",
  ".github/pull_request_template.md blocks public code contribution assumptions and private-data leakage through pull requests",
  "docs/technical-reviewer-guide.md gives reviewers the clone, verify, inspect, feedback, and license-boundary path",
  "docs/reviewer-feedback-guide.md defines structured public issue feedback without asking for private data",
  "CONTRIBUTING.md, SUPPORT.md, SECURITY.md, and issue templates define public intake boundaries without accepting code contributions",
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
