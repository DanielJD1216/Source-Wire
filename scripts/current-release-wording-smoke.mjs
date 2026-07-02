import { readFile } from "node:fs/promises";

const checkedFiles = [
  "README.md",
  "docs/ci-checks.md",
  "docs/index.md",
  "docs/license-decision-gate.md",
  "docs/legal-review-question-packet.md",
  "docs/owner-launch-checklist.md",
  "docs/owner-license-approval-preflight.md",
  "docs/public-status.md",
  "docs/publish-readiness.md",
  "docs/release-decision.md",
  "docs/runtime-boundary.md",
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
  /\brelease has not been executed\b/iu
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
