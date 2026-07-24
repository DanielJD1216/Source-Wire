import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";

const repo = "DanielJD1216/Source-Wire";

const gates = [
  {
    issue: 259,
    target: "threat-model-implementation",
    label: "Threat model implementation",
    packet: "docs/internal/threat-model-implementation-packet.md",
    slices: "docs/internal/threat-model-implementation-slices.md",
    command: "runtime:threat-implementation-packet",
    exactApprovalText:
      "Approved for a future Source-Wire threat model implementation unit: build a public-safe synthetic trust-boundary package and validation smoke tests for unauthorized callers, cross-namespace access, source-to-memory separation, prompt-injection handling, secrets handling, audit gaps, backup and restore risk, deployment misconfiguration, MCP bypass prevention, and owner/application-controlled trusted memory approval. Use synthetic fixtures only. Do not add API server implementation, MCP server runtime implementation, database migrations, real database connections, PostgreSQL or pgvector setup, live connectors, Mission Control UI, deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled."
  },
  {
    issue: 260,
    target: "api-contract-implementation",
    label: "API contract implementation",
    packet: "docs/internal/api-contract-implementation-packet.md",
    slices: "docs/internal/api-contract-implementation-slices.md",
    command: "runtime:api-implementation-packet",
    exactApprovalText:
      "Approved for a future Source-Wire API contract implementation unit: build a public-safe synthetic API policy contract package and validation smoke tests for request envelopes, endpoint groups, capability checks, namespace resolution, denied results, citations and gaps, audit metadata, source maintenance, candidate review, trusted-memory approval boundaries, handoff and status evidence, and MCP-through-API policy routing. Use synthetic fixtures only. Do not add API server implementation, route handlers, MCP server runtime implementation, database migrations, real database connections, PostgreSQL or pgvector setup, runtime adapter implementation, live connectors, Mission Control UI, deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled."
  },
  {
    issue: 261,
    target: "mcp-contract-implementation",
    label: "MCP contract implementation",
    packet: "docs/internal/mcp-contract-implementation-packet.md",
    slices: "docs/internal/mcp-contract-implementation-slices.md",
    command: "runtime:mcp-implementation-packet",
    exactApprovalText:
      "Approved for a future Source-Wire MCP contract implementation unit: build a public-safe synthetic MCP adapter contract package and validation smoke tests for tool declarations, input validation, MCP-to-API envelopes, capability mapping, namespace forwarding, denied results, citation and gap preservation, audit metadata, source evidence search, trusted memory search, context assembly, candidate review, source maintenance, handoff and status evidence, and trusted-memory approval boundaries. Use synthetic fixtures only. Do not add MCP server runtime implementation, API server implementation, route handlers, database migrations, real database connections, PostgreSQL or pgvector setup, runtime adapter implementation, live connectors, Mission Control UI, deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. MCP must not bypass Source-Wire API policy. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled."
  },
  {
    issue: 262,
    target: "database-posture-implementation",
    label: "Database posture implementation",
    packet: "docs/internal/database-posture-implementation-packet.md",
    slices: "docs/internal/database-posture-implementation-slices.md",
    command: "runtime:database-implementation-packet",
    exactApprovalText:
      "Approved for a future Source-Wire database posture implementation unit: build a public-safe synthetic database posture package that defines data-class contracts, lifecycle state fixtures, namespace isolation fixtures, deletion/retention fixtures, backup/restore risk fixtures, and validation/smoke checks. Use synthetic fixtures only. Do not add database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Source evidence must remain separate from trusted memory. Trusted memory promotion must remain owner or application controlled."
  },
  {
    issue: 263,
    target: "public-safe-fixture-implementation",
    label: "Public-safe fixture implementation",
    packet: "docs/internal/public-safe-fixture-implementation-packet.md",
    slices: "docs/internal/public-safe-fixture-implementation-slices.md",
    command: "runtime:fixture-implementation-packet",
    exactApprovalText:
      "Approved for a future Source-Wire public-safe fixture implementation unit: build a synthetic hosted-runtime fixture package and validation smoke tests for caller identity, namespaces, source evidence, candidates, trusted memory, denied cases, audit metadata, and no-auto-promotion. Use synthetic fixtures only. Do not add database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, deployment, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Fixtures must not include real local paths, account IDs, emails, domains, tokens, screenshots, client data, production exports, or private proof content. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled."
  },
  {
    issue: 264,
    target: "deployment-boundary-implementation",
    label: "Deployment boundary implementation",
    packet: "docs/internal/deployment-boundary-implementation-packet.md",
    slices: "docs/internal/deployment-boundary-implementation-slices.md",
    command: "runtime:deployment-implementation-packet",
    exactApprovalText:
      "Approved for a future Source-Wire deployment boundary implementation unit: build a public-safe synthetic deployment readiness package and validation smoke tests for local development, owner-hosted runtime, managed-hosted deferral, stop conditions, rollback evidence, claim boundaries, and no-hosted-service proof. Use synthetic fixtures only. Do not add deployment config, cloud provider config, Docker or container deployment config for runtime services, hosted services, database migrations, real database connections, PostgreSQL or pgvector setup, API server implementation, MCP server runtime implementation, live connectors, Mission Control UI, managed hosting, npm publishing, GitHub release creation, package version changes, public contribution acceptance, real user data, client data, private implementation code, or AGPLv3 code. Source-Wire must not imply it hosts memory for users. MCP must not bypass Source-Wire API policy. Trusted memory promotion must remain owner or application controlled."
  }
];

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const ownerApprovalPacket = await readFile("docs/internal/owner-approval-record-packet.md", "utf8");
const approvalRecorder = await readFile("scripts/record-owner-approval.mjs", "utf8");
const failures = [];
const results = [];

for (const gate of gates) {
  await assertPathExists(gate.packet);
  await assertPathExists(gate.slices);
  assertScriptExists(gate.command, gate.label);
  assertIncludes(ownerApprovalPacket, gate.target, `owner approval packet target for ${gate.label}`);
  assertIncludes(ownerApprovalPacket, gate.exactApprovalText, `owner approval packet exact text for ${gate.label}`);
  assertIncludes(approvalRecorder, gate.target, `owner approval recorder target for ${gate.label}`);
  assertIncludes(approvalRecorder, gate.exactApprovalText, `owner approval recorder exact text for ${gate.label}`);

  const issue = await ghJson([
    "issue",
    "view",
    String(gate.issue),
    "--repo",
    repo,
    "--json",
    "number,title,state,body,comments,url"
  ]);
  const comments = Array.isArray(issue.comments) ? issue.comments : [];
  const approvalComments = comments.filter((comment) => (comment.body ?? "").includes(gate.exactApprovalText));
  const approvalRecordPresent = hasApprovalRecordSection(issue.body ?? "", gate.exactApprovalText);
  const exactApprovalRecorded = approvalRecordPresent || approvalComments.length > 0;
  const approvalEvidence = approvalRecordPresent
    ? "owner approval record section"
    : approvalComments.length > 0
      ? "separate issue comment"
      : "none";

  results.push({
    ...gate,
    issue,
    approvalRecordPresent,
    approvalComments,
    exactApprovalRecorded,
    approvalEvidence
  });
}

if (failures.length > 0) {
  console.error("failed runtime implementation approval status");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

printSection("Source-Wire Runtime Implementation Approval Status");
console.log("This owner-side status check is read-only.");
console.log("It verifies the six implementation approval gates from issues #259 through #264.");
console.log("It does not record owner approval, implement hosted runtime behavior, add API server runtime, add MCP server runtime, add database migrations, connect to a database, deploy services, publish npm, create a GitHub release, create tags, accept code contributions, add real user data, or approve production runtime use.");
printRows([
  ["Package", packageJson.name],
  ["Version", packageJson.version],
  ["License", packageJson.license],
  ["Gate count", String(results.length)]
]);

for (const result of results) {
  printSection(`#${result.issue.number} ${result.label}`);
  printRows([
    ["Title", result.issue.title],
    ["URL", result.issue.url],
    ["State", result.issue.state],
    ["Target", result.target],
    ["Packet", result.packet],
    ["Slice map", result.slices],
    ["Command", `npm run ${result.command}`],
    ["Exact approval", result.exactApprovalRecorded ? "recorded" : "not recorded"],
    ["Approval evidence", result.approvalEvidence],
    ["Approval comments", String(result.approvalComments.length)]
  ]);
}

const approved = results.filter((result) => result.exactApprovalRecorded);
const missing = results.filter((result) => !result.exactApprovalRecorded);

printSection("Runtime Implementation Approval Status Result");
console.log("ok runtime implementation approval status readable");
console.log(`ok runtime implementation gates prepared ${results.length}`);

for (const result of approved) {
  console.log(`ok exact ${result.target} approval recorded`);
}

for (const result of missing) {
  console.log(`blocked ${result.target} approval missing`);
}

if (missing.length > 0) {
  console.log("blocked runtime implementation approvals missing");
  console.log("blocked hosted runtime implementation");
} else {
  console.log("ok all runtime implementation approvals recorded");
  console.log("blocked hosted runtime implementation");
}

function hasApprovalRecordSection(body, exactApprovalTextToFind) {
  const marker = "## Owner Approval Record";
  const markerIndex = body.indexOf(marker);
  if (markerIndex === -1) {
    return false;
  }

  const sectionStart = markerIndex + marker.length;
  const nextSectionIndex = body.indexOf("\n## ", sectionStart);
  const section = nextSectionIndex === -1 ? body.slice(markerIndex) : body.slice(markerIndex, nextSectionIndex);
  return section.includes(exactApprovalTextToFind);
}

async function assertPathExists(path) {
  try {
    await stat(path);
  } catch {
    failures.push(`missing required path: ${path}`);
  }
}

function assertScriptExists(command, label) {
  if (!packageJson.scripts?.[command]) {
    failures.push(`missing npm script for ${label}: ${command}`);
  }
}

function assertIncludes(text, requiredText, reason) {
  if (!text.includes(requiredText)) {
    failures.push(`${reason}: missing ${JSON.stringify(requiredText)}`);
  }
}

function ghJson(args) {
  return new Promise((resolve, reject) => {
    execFile("gh", args, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`gh ${args.join(" ")} failed\n${stderr || error.message}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (parseError) {
        reject(new Error(`Unable to parse gh JSON: ${parseError.message}`));
      }
    });
  });
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
