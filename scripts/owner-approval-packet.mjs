import { readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const approvalPacket = await readFile("docs/owner-approval-record-packet.md", "utf8");
const failures = [];

const approvalTargets = [
  {
    target: "release-implementation",
    issue: 255,
    label: "First public release path",
    exactText:
      "Approved for a future Source-Wire release implementation unit: prepare and publish the npm package and create the matching GitHub release after final release-candidate verification. Use version 0.1.0 for the first public release unless the implementation unit finds a blocking reason to choose a different explicit version. Keep hosted runtime behavior blocked, keep production runtime claims blocked, and do not accept code contributions without separate contribution terms."
  },
  {
    target: "patch-release-implementation",
    issue: 255,
    label: "Patch release path",
    exactText:
      "Approved for a future Source-Wire patch release implementation unit: publish a patch release that corrects the exported SOURCE_WIRE_PACKAGE_VERSION mismatch in the npm package. Use version 0.1.1 unless the implementation unit finds a blocking reason to choose a different explicit patch version. Create the matching GitHub release and tag only after final release-candidate verification. Keep hosted runtime behavior, hosted-runtime child issue publication, production runtime claims, deployment, real user data, and code contribution acceptance blocked."
  },
  {
    target: "branch-governance-implementation",
    issue: 256,
    label: "Branch governance path",
    exactText:
      "Approved for a future Source-Wire branch governance implementation unit: enable minimal branch protection for main after current Package Checks are green. Require status checks before merge, block force pushes, block branch deletion, keep owner direct emergency access if needed, and do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions."
  },
  {
    target: "hosted-runtime-prd",
    issue: 257,
    label: "Hosted runtime PRD path",
    exactText:
      "Approved for a future Source-Wire hosted runtime PRD unit: define the scope, threat model, owner-hosted versus managed-hosted boundary, API server runtime, MCP server runtime, database posture, deployment boundary, public-safe fixtures, verification gates, and no-private-data requirements before any hosted runtime implementation starts. Do not publish npm, create a GitHub release, deploy services, accept code contributions, or add real user data in this PRD unit."
  },
  {
    target: "hosted-runtime-child-issue-publication",
    issue: 257,
    label: "Hosted runtime child issue publication path",
    exactText:
      "Approved for a future Source-Wire hosted runtime child issue publication unit: publish the six child issues from docs/hosted-runtime-issue-slices.md in dependency order as PRD/planning issues only. Keep hosted runtime implementation, API server implementation, MCP server runtime implementation, database migrations, deployment, production runtime use, real user data, code contribution acceptance, npm publishing, GitHub release creation, and tags blocked."
  },
  {
    target: "runtime-skeleton-implementation",
    issue: 257,
    label: "Runtime skeleton implementation path",
    exactText:
      "Approved for a future Source-Wire owner-hosted runtime skeleton implementation unit: build a public-safe synthetic owner-hosted API policy route skeleton and MCP adapter skeleton using the private Unit 25 through Unit 30 proof trail as redacted evidence only. Use synthetic fixtures only. Do not copy private implementation code or AGPLv3 code. Do not add real user data, client data, database migrations, real database connections, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, or public contribution acceptance. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled."
  },
  {
    target: "threat-model-implementation",
    issue: 259,
    label: "Threat model implementation path",
    exactText:
      "Approved for a future Source-Wire threat model implementation unit: build a public-safe synthetic trust-boundary package and validation smoke tests for unauthorized callers, cross-namespace access, source-to-memory separation, prompt-injection handling, secrets handling, audit gaps, backup and restore risk, deployment misconfiguration, MCP bypass prevention, and owner/application-controlled trusted memory approval. Use synthetic fixtures only. Do not add API server implementation, MCP server runtime implementation, database migrations, real database connections, PostgreSQL or pgvector setup, live connectors, Mission Control UI, deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled."
  },
  {
    target: "api-contract-implementation",
    issue: 260,
    label: "API contract implementation path",
    exactText:
      "Approved for a future Source-Wire API contract implementation unit: build a public-safe synthetic API policy contract package and validation smoke tests for request envelopes, endpoint groups, capability checks, namespace resolution, denied results, citations and gaps, audit metadata, source maintenance, candidate review, trusted-memory approval boundaries, handoff and status evidence, and MCP-through-API policy routing. Use synthetic fixtures only. Do not add API server implementation, route handlers, MCP server runtime implementation, database migrations, real database connections, PostgreSQL or pgvector setup, runtime adapter implementation, live connectors, Mission Control UI, deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled."
  },
  {
    target: "database-posture-implementation",
    issue: 262,
    label: "Database posture implementation path",
    exactText:
      "Approved for a future Source-Wire database posture implementation unit: build a public-safe synthetic database posture package that defines data-class contracts, lifecycle state fixtures, namespace isolation fixtures, deletion/retention fixtures, backup/restore risk fixtures, and validation/smoke checks. Use synthetic fixtures only. Do not add database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled."
  },
  {
    target: "public-safe-fixture-implementation",
    issue: 263,
    label: "Public-safe fixture implementation path",
    exactText:
      "Approved for a future Source-Wire public-safe fixture implementation unit: build a synthetic hosted-runtime fixture package and validation smoke tests for caller identity, namespaces, source evidence, candidates, trusted memory, denied cases, audit metadata, and no-auto-promotion. Use synthetic fixtures only. Do not add database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Fixtures must not include real local paths, account IDs, emails, domains, tokens, screenshots, client data, production exports, or private proof content. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled."
  },
  {
    target: "deployment-boundary-implementation",
    issue: 264,
    label: "Deployment boundary implementation path",
    exactText:
      "Approved for a future Source-Wire deployment boundary implementation unit: build a public-safe synthetic deployment readiness package and validation smoke tests for local development, owner-hosted runtime, managed-hosted deferral, stop conditions, rollback evidence, claim boundaries, and no-hosted-service proof. Use synthetic fixtures only. Do not add deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Source-Wire must not imply it hosts memory for users. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled."
  },
  {
    target: "contribution-terms-prd",
    issue: 258,
    label: "Contribution terms path",
    exactText:
      "Approved for a future Source-Wire contribution terms PRD unit: define whether and how Source-Wire can accept public code contributions, including DCO or CLA posture, maintainer review policy, private-data exclusion rules, support expectations, security-report scope, license compatibility, and PR workflow boundaries. Do not publish npm, create a GitHub release, deploy services, add hosted runtime behavior, or accept code contributions in this PRD unit."
  }
];

assertEqual(packageJson.name, "@source-wire/contracts", "package name must remain @source-wire/contracts");
assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after npm publication");

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
  "npm run owner:record-approval -- --target hosted-runtime-child-issue-publication",
  "npm run runtime:child-issue-approval-status",
  "npm run release:patch-execution-preflight",
  "blocked approval recording is manual owner action"
]) {
  assertIncludes(approvalPacket, requiredText, `owner approval packet includes ${requiredText}`);
}

for (const target of approvalTargets) {
  assertIncludes(approvalPacket, `#${target.issue}`, `owner approval packet references issue ${target.issue}`);
  assertIncludes(approvalPacket, target.target, `owner approval packet references target ${target.target}`);
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
  ["npm publishing", "published as @source-wire/contracts@0.1.0"],
  ["GitHub release", "published as v0.1.0"],
  ["Hosted runtime", "blocked"],
  ["Code contributions", "blocked"]
]);

printSection("Exact Approval Texts");
for (const target of approvalTargets) {
  console.log(`#${target.issue} ${target.label}`);
  console.log(`target: ${target.target}`);
  console.log(target.exactText);
  console.log("");
}

printSection("Next Checks After Manual Approval");
console.log("npm run owner:decision-status");
console.log("npm run runtime:child-issue-approval-status");
console.log("npm run release:patch-execution-preflight");
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
