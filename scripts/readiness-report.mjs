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
  "alpha1:build",
  "alpha1:test",
  "alpha1:conformance:story1",
  "alpha1:conformance:story2",
  "minimal-runtime:smoke",
  "runtime:skeleton-smoke",
  "runtime:threat-boundary-smoke",
  "runtime:api-policy-smoke",
  "runtime:mcp-adapter-smoke",
  "runtime:database-posture-smoke",
  "runtime:fixture-smoke",
  "runtime:deployment-boundary-smoke",
  "runtime:prd-refresh-approval-request",
  "runtime:prd-refresh-approval-status",
  "runtime:prd-refresh-proof",
  "runtime:skeleton-packet",
  "runtime:threat-implementation-packet",
  "runtime:api-implementation-packet",
  "runtime:mcp-implementation-packet",
  "runtime:database-implementation-packet",
  "runtime:fixture-implementation-packet",
  "runtime:deployment-implementation-packet",
  "runtime:first-implementation-recommendation",
  "runtime:implementation-approval-status",
  "runtime-boundary:smoke",
  "runtime-boundary:installed-smoke",
  "runtime-boundary:diagnostics-smoke",
  "reviewer:smoke",
  "reviewer:labels",
  "reviewer:labels:ensure",
  "docs:links",
  "docs:anchors",
  "docs:external-links",
  "docs:command-setup",
  "repository:metadata",
  "repository:live-github",
  "repository:live-branch",
  "repository:branch-governance-request",
  "repository:branch-governance-plan",
  "repository:branch-governance-execution-packet",
  "repository:branch-governance-dry-run",
  "repository:branch-governance-apply",
  "repository:branch-governance-preflight",
  "repository:ruleset-governance-preflight",
  "security:live-surface",
  "registry:live-npm",
  "release:live-tags",
  "pull-request:boundary",
  "share:audit",
  "readme:entrypoint-smoke",
  "intake:boundary",
  "reviewer:intake-smoke",
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
  "runtime:prd-preparation",
  "runtime:prd-execution-packet",
  "runtime:prd-acceptance-matrix",
  "runtime:prd-decision-preflight",
  "runtime:slice-approval-request",
  "runtime:child-issue-publication-packet",
  "runtime:child-issue-publication-preflight",
  "runtime:child-issue-approval-status",
  "runtime:child-issue-publish",
  "runtime:child-issue-publish:smoke",
  "contribution:terms-preparation",
  "contribution:terms-execution-packet",
  "contribution:terms-policy",
  "contribution:terms-decision-preflight",
  "owner:approval-packet",
  "owner:launch-checklist",
  "owner:license-preflight",
  "owner:decision-intake",
  "owner:decision-workflow",
  "owner:decision-status",
  "owner:record-approval",
  "owner:open-issues-status",
  "owner:open-issues-status:smoke",
  "owner:refresh-decision-issues",
  "owner:decision-issues-freshness",
  "world:readiness",
  "world:share-packet",
  "world:share-operator-summary",
  "world:live-status",
  "world:share-preflight",
  "world:share-final-preflight",
  "world:post-share-monitor",
  "world:post-share-monitor:smoke",
  "launch:decision-status",
  "release:implementation-preparation",
  "release:implementation-plan",
  "release:publish-config-plan",
  "release:implementation-rehearsal",
  "release:review",
  "release:approval-request",
  "release:patch-approval-request",
  "release:patch-execution-preflight",
  "release:patch-candidate-rehearsal",
  "release:approval-status",
  "release:auth-handoff",
  "release:auth-preflight",
  "release:decision-preflight",
  "release:execution-preflight",
  "release:candidate-readiness",
  "release:artifact-manifest",
  "release:snapshot-boundary",
  "release-command-guard:smoke",
  "release:gate",
  "package:dry-run",
  "publish:readiness"
];

const blockedScope = [
  "publishing a new package version",
  "creating a new GitHub release",
  "deployment",
  "hosted or production API server runtime",
  "hosted or production MCP service",
  "non-disposable or production database migrations",
  "production PostgreSQL or any pgvector setup",
  "trusted-memory search, correction, and revocation in the real runtime",
  "memory-engine integration",
  "live connectors",
  "Mission Control UI",
  "real user data",
  "automatic, agent-controlled, or non-disposable trusted Memory Record promotion"
];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.version, "0.1.0", "package version must match approved release version");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must match approved release access");
assertEqual(packageJson.bin?.["source-wire"], "dist/cli.js", "source-wire bin must point to dist/cli.js");

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
  "AGENTS.md",
  "README.md",
  "docs/getting-started/alpha1-story1-local-runtime.md",
  "docs/getting-started/alpha1-story2-candidate-approval.md",
  "docs/internal/apache-2-license-implementation-readiness.md",
  "docs/internal/first-time-visitor-share-readiness-audit.md",
  "docs/internal/license-approval-rehearsal.md",
  "docs/internal/license-approval-decision-record.md",
  "docs/internal/license-approval-request-packet.md",
  "docs/internal/license-decision-implementation-plan.md",
  "docs/internal/legal-review-question-packet.md",
  "docs/internal/hosted-runtime-prd-preparation.md",
  "docs/internal/hosted-runtime-prd-execution-packet.md",
  "docs/internal/contribution-terms-prd-preparation.md",
  "docs/internal/contribution-terms-prd-execution-packet.md",
  "docs/internal/owner-approval-record-packet.md",
  "docs/internal/owner-launch-checklist.md",
  "docs/internal/owner-license-approval-preflight.md",
  "docs/internal/owner-license-decision-intake.md",
  "docs/internal/owner-license-decision-workflow.md",
  "docs/internal/owner-open-issues-status.md",
  "docs/internal/launch-decision-status.md",
  "docs/internal/release-implementation-rehearsal.md",
  "docs/internal/release-implementation-runbook.md",
  "docs/internal/release-publish-config-plan.md",
  "docs/status/public-status.md",
  "docs/reference/repository-metadata.md",
  "docs/getting-started/quickstart.md",
  "docs/internal/release-approval-request-packet.md",
  "docs/internal/release-artifact-manifest.md",
  "docs/status/release-snapshot-boundary.md",
  "docs/internal/release-candidate-readiness.md",
  "docs/internal/release-implementation-preparation.md",
  "docs/internal/branch-governance-approval-request.md",
  "docs/internal/branch-governance-decision-preflight.md",
  "docs/internal/branch-governance-execution-packet.md",
  "docs/internal/branch-governance-implementation-dry-run.md",
  "docs/internal/branch-governance-apply.md",
  "docs/internal/release-notes-draft.md",
  "docs/internal/release-review-packet.md",
  "docs/internal/release-version-recommendation.md",
  "docs/internal/release-auth-handoff.md",
  "docs/internal/minimal-runtime-prd.md",
  "docs/internal/license-decision-gate.md",
  "docs/internal/runtime-boundary-readiness.md",
  "docs/internal/runtime-first-implementation-recommendation.md",
  "docs/internal/runtime-implementation-approval-status.md",
  "docs/internal/runtime-skeleton-implementation-proof.md",
  "docs/internal/runtime-skeleton-smoke.md",
  "docs/internal/runtime-threat-boundary-implementation-proof.md",
  "docs/internal/runtime-threat-boundary-smoke.md",
  "docs/internal/threat-model-implementation-packet.md",
  "docs/internal/threat-model-implementation-slices.md",
  "docs/internal/api-contract-implementation-packet.md",
  "docs/internal/api-contract-implementation-slices.md",
  "docs/internal/api-policy-contract-implementation-proof.md",
  "docs/internal/api-policy-contract-smoke.md",
  "docs/internal/mcp-adapter-contract-implementation-proof.md",
  "docs/internal/mcp-adapter-contract-smoke.md",
  "docs/internal/mcp-contract-implementation-packet.md",
  "docs/internal/mcp-contract-implementation-slices.md",
  "docs/internal/database-posture-implementation-packet.md",
  "docs/internal/database-posture-implementation-proof.md",
  "docs/internal/database-posture-implementation-slices.md",
  "docs/internal/database-posture-smoke.md",
  "docs/internal/public-safe-fixture-implementation-proof.md",
  "docs/internal/public-safe-fixture-implementation-packet.md",
  "docs/internal/public-safe-fixture-implementation-slices.md",
  "docs/internal/public-safe-fixture-smoke.md",
  "docs/internal/deployment-boundary-implementation-packet.md",
  "docs/internal/deployment-boundary-implementation-proof.md",
  "docs/internal/deployment-boundary-implementation-slices.md",
  "docs/internal/deployment-boundary-smoke.md",
  "docs/guides/publish-readiness.md",
  "docs/internal/world-share-readiness.md",
  "docs/internal/world-share-kit.md",
  "docs/internal/world-share-packet.md",
  "docs/internal/world-share-operator-summary.md",
  "docs/internal/world-share-post-share-monitor.md",
  "docs/guides/share-for-review.md",
  "docs/guides/technical-reviewer-guide.md",
  "docs/guides/reviewer-feedback-guide.md",
  "docs/reference/ci-checks.md",
  "examples/fixtures/README.md",
  "examples/minimal-runtime/README.md",
  "examples/fixtures/api-contract/README.md",
  "examples/fixtures/api-contract/api-policy-contract-fixture-matrix.json",
  "examples/fixtures/database-posture/README.md",
  "examples/fixtures/database-posture/database-posture-fixture-matrix.json",
  "examples/fixtures/hosted-runtime/README.md",
  "examples/fixtures/hosted-runtime/hosted-runtime-fixture-matrix.json",
  "examples/fixtures/deployment-boundary/README.md",
  "examples/fixtures/deployment-boundary/deployment-boundary-fixture-matrix.json",
  "examples/fixtures/mcp-contract/README.md",
  "examples/fixtures/mcp-contract/mcp-adapter-contract-fixture-matrix.json",
  "examples/fixtures/runtime-skeleton/README.md",
  "examples/fixtures/runtime-skeleton/runtime-skeleton-fixture-matrix.json",
  "examples/fixtures/runtime-threat-boundary/README.md",
  "examples/fixtures/runtime-threat-boundary/runtime-threat-boundary-fixture-matrix.json",
  "examples/runtime-skeleton/README.md",
  "examples/runtime-skeleton/runtime-skeleton-smoke.mjs",
  "examples/runtime-threat-boundary/README.md",
  "examples/runtime-threat-boundary/runtime-threat-boundary-smoke.mjs",
  "examples/api-contract/README.md",
  "examples/api-contract/api-policy-contract-smoke.mjs",
  "examples/database-posture/README.md",
  "examples/database-posture/database-posture-smoke.mjs",
  "examples/hosted-runtime-fixtures/README.md",
  "examples/hosted-runtime-fixtures/hosted-runtime-fixtures-smoke.mjs",
  "examples/deployment-boundary/README.md",
  "examples/deployment-boundary/deployment-boundary-smoke.mjs",
  "examples/mcp-contract/README.md",
  "examples/mcp-contract/mcp-adapter-contract-smoke.mjs",
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
  ["Publish boundary", "npm package public at @source-wire/contracts@0.1.0, hosted runtime blocked"],
  ["Published runtime boundary", "the installed contracts package contains synthetic policy and architecture proofs only; it contains no backend runtime"],
  ["Latest-source runtime boundary", "an unpublished loopback-only Alpha 1 Stories 1 and 2 workspace proves disposable PostgreSQL 16 migration, bootstrap, credential lifecycle, authenticated health, one stdio MCP proposal tool, pending candidates, and owner-controlled approval or rejection; it contains no trusted-memory search, correction, revocation, deployment, hosting, production support, or real data"]
]);

printSection("Package Surfaces");
printList([
  `bin: source-wire -> ${packageJson.bin["source-wire"]}`,
  ...exportKeys.map((key) => `export: ${key}`),
  ...schemaFiles.map((file) => `schema: ${file}`)
]);

printSection("Readiness Commands");
printList(requiredScripts.map((scriptName) => `npm run ${scriptName}`));

printSection("Latest Source Alpha 1 Proof");
printList([
  "alpha1:build builds the unpublished local runtime workspace without adding it to the contracts package",
  "alpha1:test runs focused request-boundary, request-deadline, credential, idempotency, rate-gate, candidate-list, bounded-stdio, MCP-discovery, and schema-compatibility tests",
  "alpha1:conformance:story1 uses Node.js 22.23.1 plus generated disposable PostgreSQL 16 state to prove the live loopback Story 1 path, stalled-body deadline recovery, and cleanup",
  "alpha1:conformance:story2 uses a real MCP client, loopback API, owner CLI, and generated disposable PostgreSQL 16 state to prove pending proposal, owner decision, durable lifecycle idempotency, atomic audit, least privilege, and cleanup",
  "docs/getting-started/alpha1-story1-local-runtime.md and docs/getting-started/alpha1-story2-candidate-approval.md define prerequisites, commands, trust boundaries, retry behavior, cleanup, and blocked scope"
]);

printSection("Installed Package Smokes");
printList([
  "reviewer:smoke validates the documented first reviewer path from a temporary clean checkout-style copy",
  "consumer:smoke validates package-root imports and installed CLI fixture validation",
  "package:content-smoke validates installed required paths, README/docs/examples links and anchors, installed runtime readiness summary presence, and installed readiness summary content assertions",
  "examples:installed-smoke validates copied TypeScript examples against installed package declarations",
  "minimal-runtime:smoke validates exported synthetic in-memory runtime boundary code against owner-hosted API plus MCP proof cases",
  "runtime:skeleton-smoke validates exported synthetic owner-hosted API policy route and MCP adapter code without starting a server, connecting a database, or promoting trusted memory automatically",
  "runtime:threat-boundary-smoke validates the synthetic trust-boundary package against unauthorized callers, namespace isolation, source-memory separation, prompt injection, secrets, audit gaps, backup restore drift, deployment exposure, MCP bypass, and owner-controlled approval",
  "runtime:api-policy-smoke validates the synthetic API policy contract package against request envelopes, endpoint groups, capability checks, namespace resolution, denied results, citations, gaps, audit metadata, source maintenance, candidate review, trusted-memory approval boundaries, handoff/status evidence, and MCP-through-API routing",
  "runtime:mcp-adapter-smoke validates the synthetic MCP adapter contract package against tool declarations, input validation, MCP-to-API envelopes, capability mapping, namespace forwarding, denied results, citations, gaps, audit metadata, source evidence search, trusted memory search, context assembly, candidate review, source maintenance, handoff/status evidence, and trusted-memory approval boundaries",
  "runtime:database-posture-smoke validates the synthetic database posture package against data-class contracts, lifecycle states, namespace isolation, deletion, retention, backup, restore, derived data inheritance, and owner/application-controlled trusted memory approval",
  "runtime:fixture-smoke validates the synthetic hosted-runtime fixture package against caller identity, namespace isolation, source evidence, candidates, trusted memory, denied results, audit metadata, MCP-through-API policy routing, and no automatic trusted memory promotion",
  "runtime:deployment-boundary-smoke validates the synthetic deployment-boundary package against local development, owner-hosted runtime review, managed-hosted deferral, stop conditions, rollback evidence, claim boundaries, no-hosted-service proof, MCP-through-API policy routing, and owner-controlled trusted memory promotion",
  "runtime:prd-refresh-approval-request validates the future owner-hosted runtime PRD refresh approval packet while production runtime remains blocked",
  "runtime:prd-refresh-approval-status verifies whether the exact runtime PRD refresh approval has been separately recorded without mutating GitHub state",
  "runtime:prd-refresh-proof validates the recorded runtime PRD refresh approval, refreshed public owner-hosted runtime PRD, and refreshed wrapper-runtime gate while hosted runtime implementation remains blocked",
  "runtime:skeleton-packet validates the runtime skeleton implementation packet, approval boundary, safety claims, and production-runtime blockers",
  "runtime:threat-implementation-packet validates the synthetic trust-boundary implementation approval packet while production runtime remains blocked",
  "runtime:api-implementation-packet validates the synthetic API policy contract implementation approval packet while API server runtime remains blocked",
  "runtime:mcp-implementation-packet validates the synthetic MCP adapter contract implementation approval packet while MCP server runtime remains blocked",
  "runtime:database-implementation-packet validates the historical synthetic database-posture unit; the separately bounded Alpha 1 Stories 1 and 2 workspace is the only latest-source migration and database path",
  "runtime:fixture-implementation-packet validates the implemented synthetic public-safe fixture package while hosted runtime implementation remains blocked",
  "runtime:deployment-implementation-packet validates the implemented synthetic deployment-boundary package while deployment config and hosted services remain blocked",
  "runtime:first-implementation-recommendation verifies issue #259 threat-model implementation was the recommended first approval gate and now points to the synthetic threat-boundary proof",
  "runtime:implementation-approval-status verifies live owner approval status for runtime implementation issues #259 through #264 without recording approval or implementing runtime behavior",
  "runtime-boundary:installed-smoke validates the packaged synthetic runtime-boundary example after install",
  "runtime-boundary:diagnostics-smoke validates the synthetic smoke diagnostic failure format",
  "reviewer:intake-smoke validates structured reviewer issue templates, private-data warnings, and blocked code-contribution intake",
  "runtime:child-issue-publish:smoke validates the hosted-runtime child issue publisher dry run and missing-approval write guard without GitHub mutations",
  "world:post-share-monitor:smoke validates post-share issue and pull request classification rules without live GitHub issues",
  "world:share-operator-summary validates the local owner next-action summary while hosted runtime child planning issues remain published and runtime implementation remains blocked",
  "reviewer:labels validates live GitHub reviewer labels used by the issue templates"
]);

printSection("Required Readiness Docs");
printList([
  "AGENTS.md distinguishes the published contracts package, synthetic examples, and unpublished local Alpha 1 Stories 1 and 2 proof for AI agents",
  "README.md is the package entrypoint and public boundary summary",
  "docs/getting-started/alpha1-story1-local-runtime.md defines the unpublished loopback Story 1 foundation and disposable PostgreSQL boundary",
  "docs/getting-started/alpha1-story2-candidate-approval.md defines the unpublished Story 2 stdio MCP proposal, owner-decision, durable idempotency, and cleanup proof",
  "docs/internal/apache-2-license-implementation-readiness.md records the completed Apache-2.0 implementation while keeping hosted runtime and production runtime blocked",
  "docs/internal/first-time-visitor-share-readiness-audit.md records source-package sharing readiness and remaining launch blockers",
  "docs/internal/license-approval-rehearsal.md records the Apache-2.0 implementation check and current runtime/contribution boundary",
  "docs/internal/license-approval-decision-record.md records the implemented owner license decision",
  "docs/internal/license-approval-request-packet.md records the completed owner approval path",
  "docs/internal/license-decision-implementation-plan.md maps completed Apache-2.0 implementation and remaining decision paths",
  "docs/internal/decision-prototypes/license-recommendation.md records superseded pre-implementation license history so old UNLICENSED guidance is not mistaken for current guidance",
  "docs/internal/legal-review-question-packet.md records remaining counsel or owner questions for contribution, support, security, brand, hosted runtime, and data boundaries",
  "docs/internal/hosted-runtime-prd-preparation.md records the hosted runtime PRD evidence map and stop conditions while implementation remains blocked",
  "docs/internal/hosted-runtime-prd-execution-packet.md records the hosted runtime PRD scope, evidence checks, verification path, and stop conditions while runtime implementation remains blocked",
  "docs/internal/hosted-runtime-prd-acceptance-matrix.md maps each approved hosted-runtime PRD clause to evidence and stop conditions while runtime implementation remains blocked",
  "docs/internal/hosted-runtime-prd-decision-preflight.md records the live owner-side hosted runtime PRD preflight with child issue publication already approved and published",
  "docs/internal/hosted-runtime-child-issue-publication-preflight.md records the owner-side child issue publication preflight while runtime implementation remains blocked",
  "npm run runtime:child-issue-approval-status verifies whether the exact hosted-runtime child issue publication approval has been separately recorded without mutating GitHub state",
  "docs/internal/contribution-terms-prd-preparation.md records the contribution terms PRD evidence map and stop conditions while code contribution acceptance remains blocked",
  "docs/internal/contribution-terms-prd-execution-packet.md records the contribution terms PRD scope, evidence checks, verification path, and stop conditions while code contribution acceptance remains blocked",
  "docs/internal/contribution-terms-prd-decision-preflight.md records the live owner-side contribution terms PRD preflight while code contribution acceptance remains blocked",
  "docs/internal/owner-approval-record-packet.md records exact owner approval text for issues #255 through #258 while keeping approval recording as a separate manual owner action",
  "docs/internal/owner-approval-recorder.md records the guarded owner approval recorder command, its dry-run default, exact-text write requirement, and blocked execution boundary",
  "docs/internal/owner-launch-checklist.md records the source-package-ready state and remaining launch-channel approval order",
  "docs/internal/owner-license-approval-preflight.md records the implemented owner license approval",
  "docs/internal/owner-license-decision-intake.md records the captured owner decision",
  "docs/internal/owner-license-decision-workflow.md records the completed owner decision workflow",
  "docs/internal/owner-decision-issue-refresh.md records the owner-side live GitHub issue refresh command for keeping public owner-decision issues current",
  "npm run owner:decision-issues-freshness verifies public owner-decision issue bodies match the current Source-Wire commit and latest green Package Checks without mutating GitHub state",
  "npm run owner:decision-status verifies whether public owner-decision issues #255 through #258 have separate exact approval records or approval comments without mutating GitHub state",
  "docs/internal/owner-open-issues-status.md records the live open-issue boundary, npm run owner:open-issues-status verifies issues #255 through #258 are closed as completed history while hosted runtime child issue publication approval is retained and issues #259 through #264 are published, and npm run owner:open-issues-status:smoke verifies the future hosted-runtime planning issue state without creating or reading GitHub issues",
  "docs/internal/launch-decision-status.md records the one-command launch status view without approving any blocked launch path",
  "docs/internal/release-implementation-rehearsal.md records historical release rehearsal evidence for the 0.1.0 package",
  "docs/internal/release-implementation-runbook.md records the release execution order and stop conditions for future package versions",
  "docs/internal/release-publish-config-plan.md records the package publish configuration history and future-version guardrails",
  "docs/internal/release-review-packet.md records release review inputs",
  "docs/internal/release-version-recommendation.md records the first release version decision history",
  "docs/internal/release-notes-draft.md records release notes source text",
  "docs/internal/release-approval-request-packet.md records exact release decision options and owner approval history",
  "docs/internal/release-patch-approval-request.md records the future patch release approval path for the immutable npm 0.1.0 SOURCE_WIRE_PACKAGE_VERSION mismatch while keeping release mutation blocked",
  "docs/internal/release-patch-execution-preflight.md records the read-only patch release execution preflight, exact approval requirement, and blocked mutation boundary",
  "docs/internal/release-patch-candidate-rehearsal.md records the temp-directory 0.1.1 patch rehearsal without mutating real package files",
  "npm run release:approval-status verifies whether issue #255 has a separate exact owner approval record or approval comment",
  "docs/internal/release-auth-handoff.md records the owner-side npm authentication handoff for future release mutation",
  "docs/internal/release-auth-preflight.md records the owner-side npm and GitHub authentication preflight",
  "npm run release:decision-preflight verifies world-share, owner open-issue boundary, release-candidate, artifact, approval-request, and launch-decision evidence",
  "docs/internal/release-execution-preflight.md records the read-only owner-side release execution preflight and live release evidence",
  "docs/internal/release-candidate-readiness.md records release-candidate evidence",
  "docs/internal/release-artifact-manifest.md records the package artifact identity, file count, size, shasum, and integrity",
  "docs/status/release-snapshot-boundary.md distinguishes latest main, the immutable npm artifact, and the immutable v0.1.0 release snapshot",
  "docs/internal/release-implementation-preparation.md records the release execution packet, required approval evidence, and stop conditions",
  "docs/internal/branch-governance-approval-request.md records minimal branch protection as approved and implemented while repository ruleset options remain deferred",
  "docs/internal/branch-governance-decision-preflight.md records the live owner-side branch governance preflight after minimal branch protection",
  "docs/internal/branch-governance-execution-packet.md records the exact minimal branch protection settings, pre-execution checks, verification, and rollback path after approval",
  "docs/internal/branch-governance-implementation-dry-run.md records the owner-side dry-run payload, exact required check context, approval record, and live implementation state",
  "docs/internal/branch-governance-apply.md records the guarded owner-side branch protection apply command, exact approval requirement, write confirmation, and implemented default mode",
  "docs/internal/branch-governance-implementation-plan.md records the branch governance implementation plan, recommended minimal branch protection path, required preflight, post-change verification, and rollback plan",
  "docs/status/public-status.md states the Apache-2.0 license, release, publishing, runtime, and contribution boundaries",
  "docs/reference/repository-metadata.md explains GitHub metadata, support, security, contribution, and CI visibility boundaries",
  "docs/getting-started/quickstart.md defines local setup and first-run commands",
  "docs/internal/minimal-runtime-prd.md records the minimal synthetic runtime boundary while keeping hosted runtime implementation blocked",
  "docs/internal/license-decision-gate.md records the implemented Apache-2.0 path and remaining blocked channels",
  "docs/internal/runtime-boundary-readiness.md summarizes the runtime-boundary proof lane and blocked runtime scope",
  "docs/internal/runtime-first-implementation-recommendation.md records why issue #259 threat-model implementation is the recommended first approval gate",
  "docs/internal/runtime-implementation-approval-status.md records the read-only owner-side status check for the six hosted-runtime implementation approval gates",
  "docs/internal/runtime-skeleton-implementation-proof.md records the synthetic owner-hosted API policy route and MCP adapter skeleton proof while production runtime remains blocked",
  "docs/internal/runtime-skeleton-smoke.md records the synthetic runtime skeleton smoke command, expected markers, and blocked side effects",
  "docs/internal/runtime-threat-boundary-implementation-proof.md records the synthetic threat-boundary implementation proof while production runtime remains blocked",
  "docs/internal/runtime-threat-boundary-smoke.md records the synthetic threat-boundary smoke command, expected markers, and blocked side effects",
  "docs/internal/api-policy-contract-implementation-proof.md records the synthetic API policy contract implementation proof while API server runtime remains blocked",
  "docs/internal/api-policy-contract-smoke.md records the synthetic API policy contract smoke command, expected markers, and blocked side effects",
  "docs/internal/mcp-adapter-contract-implementation-proof.md records the synthetic MCP adapter contract implementation proof while MCP server runtime remains blocked",
  "docs/internal/mcp-adapter-contract-smoke.md records the synthetic MCP adapter contract smoke command, expected markers, and blocked side effects",
  "docs/internal/threat-model-implementation-packet.md records the next synthetic trust-boundary implementation approval path while production runtime remains blocked",
  "docs/internal/threat-model-implementation-slices.md records the future threat case, trust-boundary fixture, smoke, docs, and readiness slices",
  "docs/internal/api-contract-implementation-packet.md records the next synthetic API policy contract implementation approval path while API server runtime remains blocked",
  "docs/internal/api-contract-implementation-slices.md records the future request envelope, endpoint group, policy matrix, smoke, docs, and readiness slices",
  "docs/internal/mcp-contract-implementation-packet.md records the synthetic MCP adapter contract implementation approval path and completed proof while MCP server runtime remains blocked",
  "docs/internal/mcp-contract-implementation-slices.md records the completed tool declaration, input validation, MCP-to-API envelope, policy matrix, smoke, docs, and readiness slices",
  "docs/internal/database-posture-implementation-packet.md records the implemented synthetic database posture package while migrations and real database connections remain blocked",
  "docs/internal/database-posture-implementation-proof.md records the synthetic database posture package proof while real database runtime remains blocked",
  "docs/internal/database-posture-implementation-slices.md records the completed data-class, lifecycle, namespace, deletion, retention, backup, restore, smoke, and docs slices",
  "docs/internal/database-posture-smoke.md records the synthetic database posture smoke command, expected markers, and blocked side effects",
  "docs/internal/public-safe-fixture-implementation-packet.md records the implemented synthetic hosted-runtime fixture package while real services and real data remain blocked",
  "docs/internal/public-safe-fixture-implementation-proof.md records the synthetic hosted-runtime fixture package proof while hosted runtime remains blocked",
  "docs/internal/public-safe-fixture-implementation-slices.md records the completed fixture contract, fixture matrix, smoke, docs, and readiness slices",
  "docs/internal/public-safe-fixture-smoke.md records the synthetic hosted-runtime fixture smoke command, expected markers, and blocked side effects",
  "docs/internal/deployment-boundary-implementation-packet.md records the implemented synthetic deployment-boundary package while deployment config and hosted services remain blocked",
  "docs/internal/deployment-boundary-implementation-proof.md records the synthetic deployment-boundary package proof while hosted runtime implementation remains blocked",
  "docs/internal/deployment-boundary-implementation-slices.md records the completed local, owner-hosted, managed-hosted, stop-condition, rollback, smoke, docs, and readiness slices",
  "docs/internal/deployment-boundary-smoke.md records the synthetic deployment-boundary smoke command, expected markers, and blocked side effects",
  "docs/guides/publish-readiness.md summarizes the local readiness gate and marker map",
  "docs/internal/world-share-readiness.md separates Apache-2.0 source sharing from blocked production launch channels",
  "docs/internal/world-share-kit.md provides public copy for YouTube, Substack, social posts, direct review invites, safe claims, unsafe claims, and feedback boundaries",
  "docs/internal/world-share-packet.md provides the exact share packet command, public copy, first reviewer commands, owner preflight, feedback route, and blocked boundaries",
  "docs/internal/world-share-final-preflight.md records the final owner-side live preflight before broad public sharing while keeping launch channels blocked",
  "docs/internal/world-share-post-share-monitor.md records the owner-side read-only monitor for structured reviewer feedback after public sharing",
  "npm run docs:anchors verifies local Markdown section links before broad sharing",
  "npm run docs:external-links verifies public-facing external URLs before broad sharing without deploying",
  "npm run world:live-status verifies the owner-side live world-share state across package metadata, package-lock metadata, GitHub, CI, npm, releases, tags, security, and branch governance before broad public sharing",
  "npm run world:share-preflight verifies public external links, live world-share status, launch decision blockers, owner-decision issue status, and the owner open issue boundary before broad public sharing",
  "npm run world:share-final-preflight also verifies the owner open issue future planning smoke so the approved hosted-runtime child issue state remains testable without creating GitHub issues",
  "docs/guides/share-for-review.md gives safe public sharing copy, first commands, feedback routing, and launch-channel boundaries",
  "docs/reference/repository-metadata.md records the expected live GitHub About panel, topics, and feature flags for first visitors",
  "npm run repository:live-github verifies the owner-side live GitHub public surface before broad public sharing",
  "npm run repository:live-branch verifies the owner-side live default branch, origin/main match, branch protection state, required branch-protection check context when enabled, and repository ruleset state before broad public sharing",
  "npm run repository:branch-governance-request verifies the local owner decision packet for branch protection and repository ruleset governance without changing GitHub settings",
  "npm run repository:branch-governance-plan verifies the local implementation plan for minimal branch protection and future repository rulesets without changing GitHub settings",
  "npm run repository:branch-governance-execution-packet verifies the exact minimal branch protection execution packet without changing GitHub settings",
  "npm run repository:branch-governance-dry-run verifies the branch-protection payload, live required check context, approval record, and implementation state without changing GitHub settings",
  "npm run repository:branch-governance-apply verifies the guarded branch-protection apply path without changing GitHub settings unless exact approval, --write, and --confirm-exact are supplied",
  "npm run repository:branch-governance-preflight verifies live branch state, owner decision status, and governance execution docs after minimal branch protection",
  "npm run repository:ruleset-governance-preflight verifies live minimal branch protection, latest green Package Checks, absent active repository rulesets, and missing ruleset approval before any future ruleset implementation",
  "npm run security:live-surface verifies the owner-side live GitHub security surface, safe public intake, and secret-scanning settings before broad public sharing",
  "npm run registry:live-npm verifies the owner-side npm registry publication before broad public sharing",
  "npm run release:live-tags verifies the owner-side release tag and GitHub release before broad public sharing",
  ".github/pull_request_template.md blocks public code contribution assumptions and private-data leakage through pull requests",
  "docs/guides/technical-reviewer-guide.md gives reviewers the clone, verify, inspect, feedback, and license-boundary path",
  "docs/guides/reviewer-feedback-guide.md defines structured public issue feedback without asking for private data",
  "docs/internal/reviewer-labels.md records the live GitHub label check and owner-side label repair command for reviewer intake",
  "npm run readme:entrypoint-smoke verifies README keeps the public status, first reviewer path, share links, and blocked launch channels visible before package details",
  "CONTRIBUTING.md, SUPPORT.md, SECURITY.md, and issue templates define public intake boundaries without accepting code contributions",
  "docs/reference/ci-checks.md summarizes GitHub Actions Package Checks and marker map",
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
