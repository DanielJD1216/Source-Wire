import { readFile } from "node:fs/promises";

const checkedFiles = [
  "README.md",
  "docs/ci-checks.md",
  "docs/index.md",
  "docs/apache-2-license-implementation-readiness.md",
  "docs/license-approval-decision-record.md",
  "docs/license-approval-request-packet.md",
  "docs/license-decision-implementation-plan.md",
  "docs/license-decision-gate.md",
  "docs/legal-review-question-packet.md",
  "docs/future-license-change-plan.md",
  "docs/owner-license-approval-packet.md",
  "docs/owner-launch-checklist.md",
  "docs/owner-license-approval-preflight.md",
  "docs/owner-license-decision-intake.md",
  "docs/owner-license-decision-workflow.md",
  "docs/public-status.md",
  "docs/publish-readiness.md",
  "docs/release-approval-request-packet.md",
  "docs/release-decision.md",
  "docs/release-execution-preflight.md",
  "docs/release-implementation-preparation.md",
  "docs/release-implementation-rehearsal.md",
  "docs/release-implementation-runbook.md",
  "docs/release-notes-draft.md",
  "docs/release-version-recommendation.md",
  "docs/runtime-boundary.md",
  "docs/license-version-policy.md",
  "docs/public-runtime-decision.md",
  "docs/runtime-implementation-gate.md",
  "docs/share-for-review.md",
  "docs/technical-reviewer-guide.md",
  "docs/world-share-kit.md",
  "docs/world-share-packet.md",
  "docs/world-share-readiness.md",
  "examples/typescript/README.md",
  "scripts/check-ci-markers.mjs",
  "scripts/ci-markers-smoke.mjs",
  "scripts/contribution-terms-prd-preparation.mjs",
  "scripts/legal-review-packet.mjs",
  "scripts/license-approval-request.mjs",
  "scripts/license-decision-record.mjs",
  "scripts/license-history-boundary.mjs",
  "scripts/license-implementation-plan.mjs",
  "scripts/owner-approval-packet.mjs",
  "scripts/owner-decision-workflow.mjs",
  "scripts/owner-launch-checklist.mjs",
  "scripts/owner-license-decision-intake.mjs",
  "scripts/owner-license-preflight.mjs",
  "scripts/pull-request-boundary.mjs",
  "scripts/release-approval-status.mjs",
  "scripts/release-approval-request.mjs",
  "scripts/release-auth-handoff.mjs",
  "scripts/release-auth-preflight.mjs",
  "scripts/readiness-report.mjs",
  "scripts/release-implementation-plan.mjs",
  "scripts/release-implementation-preparation.mjs",
  "scripts/reviewer-intake-smoke.mjs"
];

const stalePatterns = [
  /\bnot published to npm yet\b/iu,
  /\bnot published to npm\b/iu,
  /\bunpublished to npm\b/iu,
  /\bunreleased on GitHub\b/iu,
  /\bpackage version is `0\.0\.0`\b/iu,
  /\bversion remains `0\.0\.0`\b/iu,
  /\| Package version \| `0\.0\.0` \|/iu,
  /\bnpm publishing is blocked\b/iu,
  /\bGitHub release publishing is blocked\b/iu,
  /\["npm publishing", "blocked"\]/iu,
  /\["GitHub release", "blocked"\]/iu,
  /\bblocked npm publishing release execution not performed\b/iu,
  /\bblocked github release execution not performed\b/iu,
  /\bblocked version release execution not performed\b/iu,
  /\bblocked release execution not performed\b/iu,
  /\bblocked until final release execution\b/iu,
  /\["Owner action", "npm authentication required"\]/iu,
  /\bbefore npm publishing or GitHub release creation\b/iu,
  /\bbefore release execution\b/iu,
  /\bused before release execution\b/iu,
  /\bRelease execution remains blocked until npm authentication\b/iu,
  /\brelease has not been executed\b/iu,
  /\bBefore npm publishing, GitHub release creation\b/iu,
  /\bnot npm publishing, GitHub release\b/iu,
  /\bnpm authentication is missing\b/iu,
  /\bGitHub release creation are still unperformed\b/iu,
  /\bnpm publishing remains blocked\b/iu,
  /\bSource-Wire as unpublished\b/iu,
  /\buntil a later PRD explicitly opens npm publishing\b/iu,
  /^Publishing remains blocked\.$/imu,
  /\brelease gate still blocks npm publishing\b/iu,
  /\bnpm_publish_approval: blocked\b/iu,
  /\bgithub_release_approval: blocked\b/iu,
  /\bCurrent package version:\s*```text\s*0\.0\.0/su,
  /\bCurrent Version\s*```text\s*0\.0\.0/su,
  /\bUse `0\.1\.0` only in a future release implementation unit\b/iu,
  /\bIf approved later, `0\.1\.0` should mean\b/iu,
  /\bDo not publish this note until npm publishing is actually approved and completed\b/iu,
  /\bIf npm publishing is approved later\b/iu,
  /\bThis release would provide\b/iu,
  /\bThis release would not include\b/iu
];

const failures = [];

for (const file of checkedFiles) {
  const text = await readFile(file, "utf8");

  for (const pattern of stalePatterns) {
    if (pattern.test(text)) {
      failures.push(`${file} contains stale current-release wording matching ${pattern}`);
    }
  }
}

if (failures.length > 0) {
  console.error("failed current release wording smoke");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("ok current release wording smoke ready");
console.log("ok npm package publication wording current");
console.log("ok github release wording current");
