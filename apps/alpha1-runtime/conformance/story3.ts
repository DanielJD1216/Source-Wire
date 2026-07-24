import assert from "node:assert/strict";
import {
  spawn,
  type ChildProcess,
  type ChildProcessByStdio
} from "node:child_process";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile
} from "node:fs/promises";
import { createServer } from "node:net";
import { userInfo } from "node:os";
import { dirname, resolve } from "node:path";
import type { Readable } from "node:stream";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import pg from "pg";

import type { AuthenticatedCredential } from "../src/repository.js";
import {
  consumeProtectedReadReceipt,
  prepareTrustedMemorySearch,
  type ProtectedReadReceiptBinding,
  type ProtectedReadStage
} from "../src/trusted-memory-search.js";

const { Pool } = pg;
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = resolve(appRoot, "../..");
const operatorCli = resolve(appRoot, "dist/src/cli/operator.js");
const serverEntry = resolve(appRoot, "dist/src/server.js");
const mcpServerEntry = resolve(appRoot, "dist/src/mcp/server.js");
const digestProbeEntry = resolve(
  appRoot,
  "dist/conformance/story3-digest-probe.js"
);
const foreignConsumeEntry = resolve(
  appRoot,
  "dist/conformance/story3-foreign-consume.js"
);
const reportPath =
  process.env.SOURCE_WIRE_CONFORMANCE_REPORT ??
  resolve(appRoot, ".artifacts/story3-conformance-report.json");

const roleNames = {
  schemaOwner: "source_wire_schema_owner",
  migrator: "source_wire_migrator",
  runtime: "source_wire_runtime"
} as const;

const crashStages: ProtectedReadStage[] = [
  "before_query",
  "after_query",
  "before_receipt_and_audit_commit",
  "after_durable_commit",
  "before_receipt_consumption",
  "after_receipt_consumption",
  "before_response_serialization",
  "during_response_serialization"
];

type CaseResult = {
  id: string;
  status: "passed";
  observation: string;
};

type ProcessResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type HttpResult = {
  status: number;
  text: string;
  body: Record<string, unknown>;
};

type CapturedApiProcess = ChildProcessByStdio<null, Readable, Readable>;

type IssuedHarness = {
  token: string;
  credentialId: string;
  issuedAt: Date;
  expiresAt: Date;
  capabilities: string[];
  namespaceIds: string[];
};

type ReceiptCounts = {
  total: number;
  issued: number;
  consumed: number;
};

type CrashResult = {
  stage: ProtectedReadStage;
  exitCode: number;
  protectedContentReleased: false;
  receiptDelta: number;
  durableState: "none" | "release_authorized" | "release_attempted";
};

const cases: CaseResult[] = [];
const crashMatrix: CrashResult[] = [];
const apiLogs: string[] = [];
const mcpDiagnostics: string[] = [];
const errorOutputs: string[] = [];
const safeOutputs: string[] = [];
const sensitiveValues = new Set<string>();
const generatedRoleNames = new Set<string>();
const generatedChildPids = new Set<number>();
const created = {
  database: false,
  schemaOwnerRole: false,
  migratorRole: false,
  runtimeRole: false,
  tempDirectory: false
};

let failure: unknown;
let cleanupFailure: unknown;
let cleanupPassed = false;
let adminPool: pg.Pool | undefined;
let targetAdminPool: pg.Pool | undefined;
let runtimePool: pg.Pool | undefined;
let apiProcess: CapturedApiProcess | undefined;
let mcpClient: McpClient | undefined;
let mcpTransport: StdioClientTransport | undefined;
let mcpPid: number | null = null;
let databaseName = "";
let migratorUrl = "";
let runtimeUrl = "";
let verifierKey = "";
let verifierKeyId = "local_alpha1_story3";
let ownerToken = "";
let ownerCredentialId = "";
let mainHarness: IssuedHarness | undefined;
let baseUrl = "";
let tempDirectory = "";
let protectedMarker = "";
let acceptedModerateAdvisories = 0;

try {
  await runConformance();
} catch (error) {
  failure = error;
} finally {
  let teardownFailure: unknown;
  try {
    await closeMcp();
  } catch (error) {
    teardownFailure = error;
  }
  try {
    await stopApi();
  } catch (error) {
    teardownFailure ??= error;
  }
  cleanupPassed = await cleanup();
  failure ??= teardownFailure;
  if (!cleanupPassed) {
    failure ??= cleanupFailure ?? new Error("cleanup_absence_proof_failed");
  }
  if (cleanupPassed) {
    pass(
      "S3-CLEANUP-01",
      "generated database, roles, sessions, child processes, and test temp directory were absent after cleanup"
    );
  }
  await writeReport();
  await adminPool?.end().catch(() => undefined);
}

if (failure || !cleanupPassed) {
  process.stderr.write(
    "Story 3 conformance failed. See the redacted machine report.\n"
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `ok Source-Wire Alpha 1 Story 3 conformance (${cases.length} cases)\n`
  );
}

async function runConformance(): Promise<void> {
  assert.equal(process.version, "v22.23.1");
  adminPool = new Pool({
    host: process.env.PGHOST ?? "/tmp",
    port: Number(process.env.PGPORT ?? "5432"),
    user: process.env.PGUSER ?? userInfo().username,
    database: process.env.PGDATABASE ?? "postgres",
    password: process.env.PGPASSWORD,
    max: 2,
    application_name: "source_wire_story3_conformance_admin"
  });
  adminPool.on("error", () => undefined);
  const version = await adminPool.query<{ server_version_num: string }>(
    "SELECT current_setting('server_version_num') AS server_version_num"
  );
  assert.equal(
    Math.floor(Number(version.rows[0]?.server_version_num ?? "0") / 10_000),
    16
  );
  pass("S3-ENV-01", "Node.js 22.23.1 and PostgreSQL 16 observed");

  tempDirectory = await mkdtemp(
    resolve(tmpdir(), "source-wire-story3-conformance-")
  );
  created.tempDirectory = true;
  await provisionDisposableTarget();
  await migrateAndInitialize();
  await startApi();
  mainHarness = await issueHarness(
    ["ns_story3_alpha", "ns_story3_beta"],
    ["memory_candidate.propose", "trusted_memory.search"]
  );
  await mcpLifecycleAndSearchProbe();
  await searchEligibilityAndInputProbes();
  await canonicalizationAndReceiptProbes();
  await outageTimeoutCancellationAndBoundsProbes();
  await databasePrivilegeAndDependencyProbes();
  await closeMcp();
  await stopApi();
  await crashMatrixProbes();
  await protectedContentLeakProbe();
}

async function provisionDisposableTarget(): Promise<void> {
  assert(adminPool);
  const collision = await adminPool.query<{ rolname: string }>(
    "SELECT rolname FROM pg_roles WHERE rolname = ANY($1::text[])",
    [Object.values(roleNames)]
  );
  assert.equal(collision.rowCount, 0, "Story 3 conformance role collision");

  databaseName = `source_wire_story3_${randomBytes(8).toString("hex")}`;
  const migratorPassword = randomBytes(24).toString("base64url");
  const runtimePassword = randomBytes(24).toString("base64url");
  verifierKey = randomBytes(32).toString("base64url");
  for (const value of [migratorPassword, runtimePassword, verifierKey]) {
    sensitiveValues.add(value);
  }

  await executeFormatted(
    adminPool,
    `CREATE ROLE ${roleNames.schemaOwner}
       NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`
  );
  created.schemaOwnerRole = true;
  generatedRoleNames.add(roleNames.schemaOwner);
  await executeFormatted(
    adminPool,
    `CREATE ROLE ${roleNames.migrator}
       LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS
       PASSWORD %L`,
    [migratorPassword]
  );
  created.migratorRole = true;
  generatedRoleNames.add(roleNames.migrator);
  await adminPool.query(`GRANT ${roleNames.schemaOwner} TO ${roleNames.migrator}`);
  await executeFormatted(
    adminPool,
    `CREATE ROLE ${roleNames.runtime}
       LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS
       PASSWORD %L`,
    [runtimePassword]
  );
  created.runtimeRole = true;
  generatedRoleNames.add(roleNames.runtime);
  await executeFormatted(adminPool, "CREATE DATABASE %I", [databaseName]);
  created.database = true;
  await executeFormatted(adminPool, "REVOKE CONNECT ON DATABASE %I FROM PUBLIC", [
    databaseName
  ]);
  await executeFormatted(
    adminPool,
    `GRANT CONNECT ON DATABASE %I TO ${roleNames.migrator}, ${roleNames.runtime}`,
    [databaseName]
  );
  await executeFormatted(
    adminPool,
    `GRANT CREATE ON DATABASE %I TO ${roleNames.schemaOwner}`,
    [databaseName]
  );

  targetAdminPool = new Pool({
    host: process.env.PGHOST ?? "/tmp",
    port: Number(process.env.PGPORT ?? "5432"),
    user: process.env.PGUSER ?? userInfo().username,
    database: databaseName,
    password: process.env.PGPASSWORD,
    max: 4,
    application_name: "source_wire_story3_conformance_target_admin"
  });
  targetAdminPool.on("error", () => undefined);
  await targetAdminPool.query("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
  const port = Number(process.env.PGPORT ?? "5432");
  migratorUrl = `postgresql://${roleNames.migrator}:${encodeURIComponent(
    migratorPassword
  )}@127.0.0.1:${port}/${databaseName}`;
  runtimeUrl = `postgresql://${roleNames.runtime}:${encodeURIComponent(
    runtimePassword
  )}@127.0.0.1:${port}/${databaseName}`;
  sensitiveValues.add(migratorUrl);
  sensitiveValues.add(runtimeUrl);
}

async function migrateAndInitialize(): Promise<void> {
  const migration = await runProcess(
    operatorCli,
    ["migrate"],
    operatorEnvironment()
  );
  assert.equal(migration.code, 0, migration.stderr);
  const migrationBody = parseJsonLine(migration.stdout);
  assert.equal(migrationBody.status, "applied");
  assert.equal(migrationBody.version, 3);
  assert.equal((migrationBody.migrations as unknown[]).length, 3);
  const replay = await runProcess(
    operatorCli,
    ["migrate"],
    operatorEnvironment()
  );
  assert.equal(replay.code, 0, replay.stderr);
  assert.equal(parseJsonLine(replay.stdout).status, "already_applied");
  pass(
    "S3-MIG-01",
    "forward-only migrations through 0003 applied once and replayed without mutation"
  );

  assert(adminPool);
  await executeFormatted(
    adminPool,
    `REVOKE CREATE ON DATABASE %I FROM ${roleNames.schemaOwner}`,
    [databaseName]
  );
  const initialized = await runProcess(
    operatorCli,
    [
      "initialize",
      "--owner-id",
      "owner_story3",
      "--namespace-id",
      "ns_story3_alpha",
      "--namespace-id",
      "ns_story3_beta"
    ],
    operatorEnvironment()
  );
  assert.equal(initialized.code, 0, initialized.stderr);
  const body = parseJsonLine(initialized.stdout);
  assert.equal(body.schemaVersion, 3);
  const owner = body.ownerAdminCredential as Record<string, unknown>;
  ownerToken = String(owner.secret);
  ownerCredentialId = String(owner.credentialId);
  sensitiveValues.add(ownerToken);
  pass(
    "S3-INIT-01",
    "fresh generated owner and two namespaces initialized without granting search to the owner credential"
  );

  runtimePool = new Pool({
    connectionString: runtimeUrl,
    max: 3,
    connectionTimeoutMillis: 2_000,
    query_timeout: 2_000,
    statement_timeout: 2_000,
    lock_timeout: 2_000,
    application_name: "source_wire_story3_conformance_runtime_direct"
  });
  runtimePool.on("error", () => undefined);
}

async function startApi(
  crashPoint?: ProtectedReadStage
): Promise<CapturedApiProcess> {
  const port = await findAvailablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [serverEntry], {
    cwd: repoRoot,
    env: {
      ...process.env,
      TMPDIR: tempDirectory,
      SOURCE_WIRE_DATABASE_URL: runtimeUrl,
      SOURCE_WIRE_TOKEN_VERIFIER_KEY: verifierKey,
      SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID: verifierKeyId,
      SOURCE_WIRE_HOST: "127.0.0.1",
      SOURCE_WIRE_PORT: String(port),
      ...(crashPoint
        ? {
            SOURCE_WIRE_CONFORMANCE_MODE: "story3",
            SOURCE_WIRE_STORY3_CRASH_POINT: crashPoint
          }
        : {})
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  assert(child.pid);
  generatedChildPids.add(child.pid);
  child.stdout.on("data", (chunk: string) => apiLogs.push(chunk));
  child.stderr.on("data", (chunk: string) => apiLogs.push(chunk));
  apiProcess = child;
  await waitFor(async () => {
    if (child.exitCode !== null) return false;
    try {
      return (
        await fetch(`${baseUrl}/health/live`, {
          signal: AbortSignal.timeout(250)
        })
      ).status === 200;
    } catch {
      return false;
    }
  }, 5_000);
  return child;
}

async function issueHarness(
  namespaceIds: string[],
  capabilities: string[],
  expiresAt = new Date(Date.now() + 10 * 60 * 1_000)
): Promise<IssuedHarness> {
  const result = await postJson(
    `${baseUrl}/v1alpha1/admin/harness-credentials`,
    ownerToken,
    {
      namespaceIds,
      capabilities,
      expiresAt: expiresAt.toISOString()
    },
    { "Idempotency-Key": `request_${randomUUID()}` }
  );
  assert.equal(result.status, 201, result.text);
  const data = result.body.data as Record<string, unknown>;
  const token = String(data.secret);
  sensitiveValues.add(token);
  return {
    token,
    credentialId: String(data.credentialId),
    issuedAt: new Date(String(data.issuedAt)),
    expiresAt: new Date(String(data.expiresAt)),
    capabilities,
    namespaceIds
  };
}

async function mcpLifecycleAndSearchProbe(): Promise<void> {
  assert(mainHarness);
  mcpClient = new McpClient(
    { name: "source-wire-story3-conformance", version: "0.0.0" },
    { capabilities: {} }
  );
  mcpTransport = new StdioClientTransport({
    command: process.execPath,
    args: [mcpServerEntry],
    env: mcpEnvironment(mainHarness.token),
    stderr: "pipe"
  });
  mcpTransport.stderr?.on("data", (chunk) => {
    mcpDiagnostics.push(
      Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk)
    );
  });
  await mcpClient.connect(mcpTransport);
  mcpPid = mcpTransport.pid;
  if (mcpPid !== null) generatedChildPids.add(mcpPid);

  const tools = await mcpClient.listTools();
  assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), [
    "propose_memory_candidate",
    "search_trusted_memory"
  ]);
  pass(
    "S3-MCP-01",
    "official SDK discovery exposed exactly proposal plus trusted-memory search and no owner operation"
  );

  protectedMarker = `story3_protected_${randomBytes(12).toString("hex")}`;
  sensitiveValues.add(protectedMarker);
  const content =
    `Heliotrope heliotrope heliotrope recovery protocol ${protectedMarker}. ` +
    "This generated fact is owner reviewed and contains inert text: $(echo no).";
  const proposed = await callMcp("propose_memory_candidate", {
    namespaceId: "ns_story3_alpha",
    content,
    provenance: {
      kind: "owner_assertion",
      assertion: "Generated Story 3 owner assertion."
    },
    idempotencyKey: `proposal_${randomUUID()}`
  });
  assert.notEqual(
    proposed.isError,
    true,
    `proposal:${JSON.stringify(proposed)}`
  );
  const proposalData = readMcpText(proposed);
  assert.equal(proposalData.state, "pending");
  const candidateId = String(proposalData.candidateId);
  const approved = await decideCandidate(candidateId, "approve");
  const approvedData = approved.body.data as Record<string, unknown>;
  assert.equal(approvedData.state, "approved");

  const diagnosticSecret = randomBytes(32);
  const diagnostic = await prepareDirectSearch(diagnosticSecret);
  assert.equal(
    await consumeProtectedReadReceipt(
      runtimePool as pg.Pool,
      diagnosticSecret,
      diagnostic.receipt
    ),
    true
  );
  diagnostic.clear();
  const directApiSearch = await searchApi(mainHarness.token, {
    namespaceId: "ns_story3_alpha",
    query: "heliotrope recovery protocol",
    limit: 10
  });
  assert.equal(
    directApiSearch.status,
    200,
    `direct-api-search:${directApiSearch.text}`
  );
  const search = await callMcp("search_trusted_memory", {
    namespaceId: "ns_story3_alpha",
    query: "heliotrope recovery protocol",
    limit: 10
  });
  assert.notEqual(search.isError, true, `search:${JSON.stringify(search)}`);
  const searchData = readMcpText(search);
  const results = searchData.results as Array<Record<string, unknown>>;
  assert.equal(Array.isArray(results), true);
  assert.equal(results.length, 1);
  assert.equal(results[0]?.content, content);
  assert.match(String(results[0]?.rank), /^[0-9]+\.[0-9]{6}$/u);
  assert.deepEqual(results[0]?.provenance, { kind: "owner_assertion" });
  assert.deepEqual(searchData.audit, {
    eventId: (searchData.audit as Record<string, unknown>).eventId,
    releaseStatus: "release_attempted"
  });
  pass(
    "S3-MCP-02",
    "real MCP proposal, owner approval, API policy, PostgreSQL search, and audited content release completed"
  );

  const receipt = await latestReceipt();
  assert.equal(receipt.consumption_state, "consumed");
  assert.equal(receipt.release_status, "release_attempted");
  const audit = await searchAuditMetadata(receipt.audit_event_id);
  assert.equal(audit.releaseStatus, "release_authorized");
  assert.equal("content" in audit, false);
  assert.equal("clientReceived" in audit, false);
  pass(
    "S3-AUDIT-01",
    "durable audit authorized release and single-use receipt recorded an attempt without claiming client receipt"
  );
}

async function searchEligibilityAndInputProbes(): Promise<void> {
  assert(targetAdminPool);
  assert(mainHarness);
  await insertArtificialMemory({
    ownerId: "owner_story3",
    namespaceId: "ns_story3_alpha",
    memoryState: "active",
    revisionStatus: "active",
    content: "Heliotrope secondary generated memory."
  });
  const superseded = await insertArtificialMemory({
    ownerId: "owner_story3",
    namespaceId: "ns_story3_alpha",
    memoryState: "active",
    revisionStatus: "superseded",
    content: "Heliotrope superseded forbidden result."
  });
  const revoked = await insertArtificialMemory({
    ownerId: "owner_story3",
    namespaceId: "ns_story3_alpha",
    memoryState: "revoked",
    revisionStatus: "active",
    content: "Heliotrope revoked forbidden result."
  });
  const wrongNamespace = await insertArtificialMemory({
    ownerId: "owner_story3",
    namespaceId: "ns_story3_beta",
    memoryState: "active",
    revisionStatus: "active",
    content: "Heliotrope wrong namespace forbidden result."
  });
  await targetAdminPool.query(
    "INSERT INTO source_wire_memory.owners (owner_id) VALUES ('owner_story3_other')"
  );
  await targetAdminPool.query(
    "INSERT INTO source_wire_memory.namespaces (namespace_id, owner_id) VALUES ('ns_story3_other', 'owner_story3_other')"
  );
  const wrongOwner = await insertArtificialMemory({
    ownerId: "owner_story3_other",
    namespaceId: "ns_story3_other",
    memoryState: "active",
    revisionStatus: "active",
    content: "Heliotrope wrong owner forbidden result."
  });

  const ranked = await searchApi(mainHarness.token, {
    namespaceId: "ns_story3_alpha",
    query: "heliotrope",
    limit: 10
  });
  assert.equal(ranked.status, 200, ranked.text);
  const rankedResults = readApiResults(ranked);
  assert.equal(rankedResults.length, 2);
  assert.equal(String(rankedResults[0]?.content).includes(protectedMarker), true);
  const returnedRevisionIds = rankedResults.map((row) => row.revisionId);
  for (const excluded of [
    superseded.revisionId,
    revoked.revisionId,
    wrongNamespace.revisionId,
    wrongOwner.revisionId
  ]) {
    assert.equal(returnedRevisionIds.includes(excluded), false);
  }
  const stableReplay = await searchApi(mainHarness.token, {
    namespaceId: "ns_story3_alpha",
    query: "heliotrope",
    limit: 10
  });
  assert.deepEqual(
    readApiResults(stableReplay).map(stableSearchFields),
    rankedResults.map(stableSearchFields)
  );
  const empty = await searchApi(mainHarness.token, {
    namespaceId: "ns_story3_alpha",
    query: "term_not_present_anywhere",
    limit: 10
  });
  assert.equal(empty.status, 200, empty.text);
  assert.deepEqual(readApiResults(empty), []);
  pass(
    "S3-SEARCH-01",
    "fixed PostgreSQL FTS ranked useful active results stably and excluded superseded, revoked, cross-namespace, and cross-owner rows"
  );

  const noSearch = await issueHarness(
    ["ns_story3_alpha"],
    ["memory_candidate.propose"]
  );
  const wrongNamespaceHarness = await issueHarness(
    ["ns_story3_beta"],
    ["trusted_memory.search"]
  );
  const expired = await issueHarness(
    ["ns_story3_alpha"],
    ["trusted_memory.search"]
  );
  const revokedHarness = await issueHarness(
    ["ns_story3_alpha"],
    ["trusted_memory.search"]
  );
  const rotated = await issueHarness(
    ["ns_story3_alpha"],
    ["trusted_memory.search"]
  );
  await targetAdminPool.query(
    "UPDATE source_wire_memory.credentials SET expires_at = issued_at + interval '1 millisecond', updated_at = clock_timestamp() WHERE credential_id = $1",
    [expired.credentialId]
  );
  await targetAdminPool.query(
    "UPDATE source_wire_memory.credentials SET status = 'revoked', updated_at = clock_timestamp() WHERE credential_id = $1",
    [revokedHarness.credentialId]
  );
  await targetAdminPool.query(
    "UPDATE source_wire_memory.credentials SET status = 'rotated', updated_at = clock_timestamp() WHERE credential_id = $1",
    [rotated.credentialId]
  );
  await new Promise((resolveWait) => setTimeout(resolveWait, 10));

  const authorityDenials = await Promise.all([
    searchApi(undefined, validSearchBody()),
    searchApi(ownerToken, validSearchBody()),
    searchApi(noSearch.token, validSearchBody()),
    searchApi(wrongNamespaceHarness.token, validSearchBody()),
    searchApi(expired.token, validSearchBody()),
    searchApi(revokedHarness.token, validSearchBody()),
    searchApi(rotated.token, validSearchBody()),
    searchApi(mainHarness.token, {
      namespaceId: "ns_story3_other",
      query: "heliotrope",
      limit: 10
    })
  ]);
  assert.deepEqual(
    authorityDenials.map((result) => result.status),
    [401, 403, 403, 403, 401, 401, 401, 403]
  );
  for (const denial of authorityDenials) {
    assert.equal(denial.text.includes(protectedMarker), false);
    errorOutputs.push(denial.text);
  }
  pass(
    "S3-AUTH-01",
    "missing, owner-class, wrong-capability, wrong-namespace, expired, revoked, rotated, and cross-owner requests denied without content"
  );

  const malformedBodies: Array<
    { body: Record<string, unknown> } | { raw: string | ArrayBuffer }
  > = [
    { body: { namespaceId: "ns_story3_alpha", query: "", limit: 10 } },
    { body: { namespaceId: "ns_story3_alpha", query: "   ", limit: 10 } },
    { body: { namespaceId: "ns_story3_alpha", query: `bad\0query`, limit: 10 } },
    {
      body: {
        namespaceId: "ns_story3_alpha",
        query: "q".repeat(1_025),
        limit: 10
      }
    },
    {
      body: {
        namespaceId: "ns_story3_alpha",
        query: "heliotrope",
        limit: 0
      }
    },
    {
      body: {
        namespaceId: "ns_story3_alpha",
        query: "heliotrope",
        limit: 11
      }
    },
    {
      body: {
        namespaceId: "ns_story3_alpha",
        query: "heliotrope",
        limit: 1.5
      }
    },
    {
      body: {
        namespaceId: "ns_story3_alpha",
        query: "heliotrope",
        limit: 10,
        filter: { ownerId: "owner_story3_other" }
      }
    },
    {
      body: {
        namespaceId: "ns_story3_alpha",
        query: "heliotrope",
        limit: 10,
        sort: "content"
      }
    },
    {
      body: {
        namespaceId: "ns_story3_alpha",
        query: "heliotrope",
        limit: 10,
        sql: "SELECT *"
      }
    },
    {
      body: {
        namespaceId: "ns_story3_alpha",
        query: "heliotrope",
        limit: 10,
        cursor: "next"
      }
    },
    {
      raw:
        '{"namespaceId":"ns_story3_alpha","query":"heliotrope","query":"changed","limit":10}'
    },
    {
      raw:
        '{"namespaceId":"ns_story3_alpha","\\u0071uery":"heliotrope","query":"changed","limit":10}'
    },
    {
      raw: malformedUtf8SearchBody(Buffer.from([0xc3, 0x28]))
    },
    {
      raw:
        '{"namespaceId":"ns_story3_alpha","query":"\\ud800","limit":10}'
    }
  ];
  for (const body of malformedBodies) {
    const result: HttpResult =
      "raw" in body
        ? await postRaw(
            `${baseUrl}/v1alpha1/trusted-memories/search`,
            mainHarness.token,
            body.raw,
            "application/json"
          )
        : await searchApi(mainHarness.token, body.body);
    assert.equal([400, 413].includes(result.status), true, result.text);
    assert.equal(result.text.includes(protectedMarker), false);
    errorOutputs.push(result.text);
  }
  const injection = await searchApi(mainHarness.token, {
    namespaceId: "ns_story3_alpha",
    query: `heliotrope'); DROP TABLE source_wire_memory.trusted_memories; --`,
    limit: 10
  });
  assert.equal(injection.status, 200, injection.text);
  const tableStillExists = await targetAdminPool.query<{ exists: boolean }>(
    "SELECT to_regclass('source_wire_memory.trusted_memories') IS NOT NULL AS exists"
  );
  assert.equal(tableStillExists.rows[0]?.exists, true);
  pass(
    "S3-INPUT-01",
    "strict query, Unicode, duplicate-field, bound, filter, sort, cursor, SQL, and injection-shaped probes remained fail-closed and inert"
  );
}

async function canonicalizationAndReceiptProbes(): Promise<void> {
  assert(mainHarness);
  assert(targetAdminPool);
  assert(runtimePool);
  await closeMcp();
  await stopApi();
  await startApi();
  const first = await searchApi(mainHarness.token, {
    namespaceId: "ns_story3_alpha",
    query: "heliotrope",
    limit: 7
  });
  assert.equal(first.status, 200, first.text);
  const firstDigests = await receiptDigestsForAudit(readAuditEventId(first));
  await stopApi();
  await startApi();
  const second = await searchApi(mainHarness.token, {
    namespaceId: "ns_story3_alpha",
    query: "heliotrope",
    limit: 7
  });
  assert.equal(second.status, 200, second.text);
  const secondDigests = await receiptDigestsForAudit(readAuditEventId(second));
  assert.deepEqual(secondDigests, firstDigests);

  const cleanProbeOne = await runProcess(
    digestProbeEntry,
    [],
    {
      PATH: process.env.PATH ?? "",
      TMPDIR: tempDirectory,
      LANG: "C",
      LC_ALL: "C",
      TZ: "UTC"
    }
  );
  const cleanProbeTwo = await runProcess(
    digestProbeEntry,
    [],
    {
      PATH: process.env.PATH ?? "",
      TMPDIR: tempDirectory,
      LANG: "en_US.UTF-8",
      LC_ALL: "en_US.UTF-8",
      TZ: "Pacific/Honolulu"
    }
  );
  assert.equal(cleanProbeOne.code, 0, cleanProbeOne.stderr);
  assert.equal(cleanProbeTwo.code, 0, cleanProbeTwo.stderr);
  assert.equal(cleanProbeTwo.stdout, cleanProbeOne.stdout);
  const probeDigests = parseJsonLine(cleanProbeOne.stdout);
  assert.match(String(probeDigests.requestDigest), /^[0-9a-f]{64}$/u);
  assert.match(String(probeDigests.resultDigest), /^[0-9a-f]{64}$/u);
  pass(
    "S3-DIGEST-01",
    "request and ordered-result digests matched across fresh API processes and clean locale-independent probes"
  );

  const actor = mainHarnessActor();
  const processSecret = randomBytes(32);
  const prepared = await prepareTrustedMemorySearch(
    runtimePool,
    actor,
    {
      namespaceId: "ns_story3_alpha",
      query: "heliotrope",
      queryByteCount: Buffer.byteLength("heliotrope", "utf8"),
      limit: 7
    },
    randomUUID(),
    {
      processReleaseSecret: processSecret,
      startedAtMs: Date.now()
    }
  );
  const encodedBinding = Buffer.from(
    JSON.stringify(prepared.receipt),
    "utf8"
  ).toString("base64url");
  const foreignFirst = await runProcess(
    foreignConsumeEntry,
    [],
    {
      PATH: process.env.PATH ?? "",
      TMPDIR: tempDirectory,
      SOURCE_WIRE_STORY3_RUNTIME_URL: runtimeUrl,
      SOURCE_WIRE_STORY3_RECEIPT_BINDING: encodedBinding
    }
  );
  const restartedForeign = await runProcess(
    foreignConsumeEntry,
    [],
    {
      PATH: process.env.PATH ?? "",
      TMPDIR: tempDirectory,
      SOURCE_WIRE_STORY3_RUNTIME_URL: runtimeUrl,
      SOURCE_WIRE_STORY3_RECEIPT_BINDING: encodedBinding
    }
  );
  assert.equal(foreignFirst.code, 0, foreignFirst.stderr);
  assert.equal(restartedForeign.code, 0, restartedForeign.stderr);
  assert.deepEqual(parseJsonLine(foreignFirst.stdout), { consumed: false });
  assert.deepEqual(parseJsonLine(restartedForeign.stdout), { consumed: false });
  assert.equal(
    await consumeProtectedReadReceipt(
      runtimePool,
      processSecret,
      prepared.receipt
    ),
    true
  );
  assert.equal(
    await consumeProtectedReadReceipt(
      runtimePool,
      processSecret,
      prepared.receipt
    ),
    false
  );
  prepared.clear();
  pass(
    "S3-RECEIPT-01",
    "two foreign clean processes lost the first race while the origin consumed once and replay then failed"
  );

  const substitutionSecret = randomBytes(32);
  const substitution = await prepareDirectSearch(substitutionSecret);
  const alternateCredentialId = randomUUID();
  const substitutions: ProtectedReadReceiptBinding[] = [
    { ...substitution.receipt, receiptId: randomUUID() },
    { ...substitution.receipt, traceId: randomUUID() },
    { ...substitution.receipt, requestId: randomUUID() },
    {
      ...substitution.receipt,
      actorCredentialId: alternateCredentialId,
      actorReference: `credential:${alternateCredentialId}`
    },
    { ...substitution.receipt, ownerId: "owner_story3_other" },
    { ...substitution.receipt, namespaceId: "ns_story3_beta" },
    {
      ...substitution.receipt,
      releaseBinding: randomBytes(32).toString("base64url")
    },
    { ...substitution.receipt, requestDigest: "0".repeat(64) },
    { ...substitution.receipt, resultDigest: "1".repeat(64) },
    {
      ...substitution.receipt,
      coveredResultCount:
        substitution.receipt.coveredResultCount === 10
          ? 9
          : substitution.receipt.coveredResultCount + 1
    }
  ];
  for (const changed of substitutions) {
    assert.equal(
      await consumeProtectedReadReceipt(
        runtimePool,
        substitutionSecret,
        changed
      ),
      false
    );
  }
  assert.equal(
    await consumeProtectedReadReceipt(
      runtimePool,
      substitutionSecret,
      substitution.receipt
    ),
    true
  );
  substitution.clear();
  pass(
    "S3-RECEIPT-02",
    "receipt, trace, request, actor, owner, namespace, binding, request, result, and count substitutions all failed before the original binding won"
  );

  const expirySecret = randomBytes(32);
  const expiring = await prepareDirectSearch(expirySecret, 50);
  await new Promise((resolveWait) => setTimeout(resolveWait, 80));
  assert.equal(
    await consumeProtectedReadReceipt(
      runtimePool,
      expirySecret,
      expiring.receipt
    ),
    false
  );
  expiring.clear();

  const raceSecret = randomBytes(32);
  const racing = await prepareDirectSearch(raceSecret);
  const race = await Promise.all([
    consumeProtectedReadReceipt(runtimePool, raceSecret, racing.receipt),
    consumeProtectedReadReceipt(runtimePool, raceSecret, racing.receipt)
  ]);
  assert.deepEqual(race.sort(), [false, true]);
  racing.clear();
  pass(
    "S3-RECEIPT-03",
    "expired receipt failed and concurrent same-origin compare-and-set produced exactly one winner"
  );
}

async function outageTimeoutCancellationAndBoundsProbes(): Promise<void> {
  assert(mainHarness);
  assert(targetAdminPool);
  assert(adminPool);
  const auditLock = await targetAdminPool.connect();
  try {
    await auditLock.query("BEGIN");
    await auditLock.query(
      "LOCK TABLE source_wire_memory.audit_events IN ACCESS EXCLUSIVE MODE"
    );
    const auditUnavailable = await searchApi(
      mainHarness.token,
      validSearchBody(),
      7_000
    );
    assert.equal(auditUnavailable.status, 503, auditUnavailable.text);
    assert.equal(auditUnavailable.text.includes(protectedMarker), false);
    errorOutputs.push(auditUnavailable.text);
  } finally {
    await auditLock.query("ROLLBACK").catch(() => undefined);
    auditLock.release();
  }
  pass(
    "S3-FAIL-01",
    "audit lock outage returned a zero-content unavailable result"
  );

  const consumeSignature =
    "source_wire_memory.consume_protected_read_receipt(uuid, smallint, uuid, uuid, varchar, uuid, varchar, varchar, varchar, varchar, varchar, varchar, varchar, smallint, timestamptz, timestamptz, varchar)";
  await targetAdminPool.query(
    `REVOKE EXECUTE ON FUNCTION ${consumeSignature} FROM ${roleNames.runtime}`
  );
  let consumeUnavailable: HttpResult;
  try {
    consumeUnavailable = await searchApi(
      mainHarness.token,
      validSearchBody(),
      7_000
    );
  } finally {
    await targetAdminPool.query(
      `GRANT EXECUTE ON FUNCTION ${consumeSignature} TO ${roleNames.runtime}`
    );
  }
  assert.equal(consumeUnavailable.status, 503, consumeUnavailable.text);
  assert.equal(consumeUnavailable.text.includes(protectedMarker), false);
  errorOutputs.push(consumeUnavailable.text);
  pass(
    "S3-FAIL-02",
    "receipt-consumption outage left durable authorization but released zero protected content"
  );

  const queryLock = await targetAdminPool.connect();
  try {
    await queryLock.query("BEGIN");
    await queryLock.query(
      "LOCK TABLE source_wire_memory.trusted_memory_revisions IN ACCESS EXCLUSIVE MODE"
    );
    const timedOut = await searchApi(
      mainHarness.token,
      validSearchBody(),
      7_000
    );
    assert.equal(timedOut.status, 503, timedOut.text);
    assert.equal(timedOut.text.includes(protectedMarker), false);
    errorOutputs.push(timedOut.text);
  } finally {
    await queryLock.query("ROLLBACK").catch(() => undefined);
    queryLock.release();
  }
  pass(
    "S3-FAIL-03",
    "fixed two-second query and lock timeout returned zero protected content"
  );

  const beforeCancellation = await receiptCounts();
  const cancellationLock = await targetAdminPool.connect();
  try {
    await cancellationLock.query("BEGIN");
    await cancellationLock.query(
      "LOCK TABLE source_wire_memory.trusted_memory_revisions IN ACCESS EXCLUSIVE MODE"
    );
    const controller = new AbortController();
    const pending = fetch(`${baseUrl}/v1alpha1/trusted-memories/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mainHarness.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(validSearchBody()),
      signal: controller.signal
    }).catch(() => undefined);
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
    controller.abort();
    await pending;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  } finally {
    await cancellationLock.query("ROLLBACK").catch(() => undefined);
    cancellationLock.release();
  }
  await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  const afterCancellation = await receiptCounts();
  assert.equal(afterCancellation.issued, beforeCancellation.issued);
  assert.equal(
    afterCancellation.total === beforeCancellation.total ||
      afterCancellation.consumed > beforeCancellation.consumed,
    true
  );
  pass(
    "S3-FAIL-04",
    "client cancellation released no response and left no newly reusable receipt"
  );

  const boundedContentPrefix = "boundedneedle ";
  const boundedContent =
    boundedContentPrefix +
    "x".repeat(8_192 - Buffer.byteLength(boundedContentPrefix, "utf8"));
  assert.equal(Buffer.byteLength(boundedContent, "utf8"), 8_192);
  for (let index = 0; index < 10; index += 1) {
    await insertArtificialMemory({
      ownerId: "owner_story3",
      namespaceId: "ns_story3_alpha",
      memoryState: "active",
      revisionStatus: "active",
      content: boundedContent
    });
  }
  const bounded = await searchApi(mainHarness.token, {
    namespaceId: "ns_story3_alpha",
    query: "boundedneedle",
    limit: 10
  });
  assert.equal(bounded.status, 200, bounded.text);
  const boundedResults = readApiResults(bounded);
  const aggregateBytes = boundedResults.reduce(
    (sum, row) => sum + Buffer.byteLength(String(row.content), "utf8"),
    0
  );
  assert.equal(boundedResults.length, 8);
  assert.equal(aggregateBytes, 65_536);
  assert.equal(Buffer.byteLength(bounded.text, "utf8") <= 98_304, true);
  assert.equal(
    boundedResults.every(
      (row) => Buffer.byteLength(String(row.content), "utf8") === 8_192
    ),
    true
  );
  pass(
    "S3-BOUND-01",
    "whole 8,192-byte rows stopped before the 65,536-byte aggregate and 98,304-byte response bounds without truncation"
  );
}

async function databasePrivilegeAndDependencyProbes(): Promise<void> {
  assert(runtimePool);
  assert(targetAdminPool);
  for (const statement of [
    "SELECT * FROM source_wire_memory.protected_read_receipts LIMIT 1",
    `INSERT INTO source_wire_memory.protected_read_receipts (
       receipt_id, format_version, trace_id, request_id, actor_reference,
       actor_credential_id, owner_id, namespace_id, operation, policy_decision,
       release_binding, request_digest, result_digest, covered_result_count,
       issued_at, expires_at, origin_process_verifier, audit_event_id
     ) VALUES (
       gen_random_uuid(), 1, gen_random_uuid(), gen_random_uuid(), 'blocked',
       gen_random_uuid(), 'owner_story3', 'ns_story3_alpha',
       'search_trusted_memory', 'allowed', repeat('a', 43), repeat('0', 64),
       repeat('1', 64), 0, clock_timestamp(),
       clock_timestamp() + interval '1 second', repeat('2', 64),
       gen_random_uuid()
     )`,
    "UPDATE source_wire_memory.protected_read_receipts SET release_status = 'release_attempted'",
    "DELETE FROM source_wire_memory.protected_read_receipts",
    "TRUNCATE source_wire_memory.protected_read_receipts",
    "UPDATE source_wire_memory.trusted_memory_revisions SET content = 'changed'",
    "CREATE TABLE source_wire_memory.story3_forbidden (id integer)",
    `SET ROLE ${roleNames.schemaOwner}`
  ]) {
    await expectRuntimeDenied(statement);
  }
  const runtimeMigration = await runProcess(
    operatorCli,
    ["migrate"],
    {
      ...process.env,
      TMPDIR: tempDirectory,
      SOURCE_WIRE_MIGRATOR_DATABASE_URL: runtimeUrl,
      SOURCE_WIRE_TOKEN_VERIFIER_KEY: verifierKey,
      SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID: verifierKeyId
    }
  );
  assert.notEqual(runtimeMigration.code, 0);
  safeOutputs.push(runtimeMigration.stdout, runtimeMigration.stderr);
  pass(
    "S3-DB-01",
    "runtime could use narrow receipt functions but direct read, insert, broad update, delete, truncate, trusted revision rewrite, DDL, role assumption, and migration all failed"
  );

  const ftsIndex = await targetAdminPool.query<{
    indexdef: string;
  }>(
    `SELECT indexdef
       FROM pg_indexes
      WHERE schemaname = 'source_wire_memory'
        AND indexname = 'trusted_memory_revisions_active_fts'`
  );
  assert.equal(ftsIndex.rowCount, 1);
  assert.match(ftsIndex.rows[0]?.indexdef ?? "", /USING gin/u);
  assert.match(ftsIndex.rows[0]?.indexdef ?? "", /status[\s\S]*'active'/u);
  const extensions = await targetAdminPool.query<{ extname: string }>(
    "SELECT extname FROM pg_extension ORDER BY extname"
  );
  assert.equal(
    extensions.rows.some((row) => row.extname === "vector"),
    false
  );
  const packageJson = JSON.parse(
    await readFile(resolve(appRoot, "package.json"), "utf8")
  ) as { dependencies: Record<string, string> };
  const dependencyNames = Object.keys(packageJson.dependencies);
  assert.equal(
    dependencyNames.some((name) =>
      /(?:pgvector|pinecone|weaviate|qdrant|embedding|openai)/iu.test(name)
    ),
    false
  );
  const audit = await runProcess(
    npmCliPath(),
    ["audit", "--omit=dev", "--json"],
    process.env
  );
  assert.equal(audit.code === 0 || audit.code === 1, true);
  const auditReport = JSON.parse(audit.stdout) as {
    metadata?: { vulnerabilities?: Record<string, number> };
  };
  assert.equal(auditReport.metadata?.vulnerabilities?.high ?? 0, 0);
  assert.equal(auditReport.metadata?.vulnerabilities?.critical ?? 0, 0);
  acceptedModerateAdvisories =
    auditReport.metadata?.vulnerabilities?.moderate ?? 0;
  assert.equal(acceptedModerateAdvisories, 2);
  pass(
    "S3-DEP-01",
    "active-only GIN FTS, no vector or provider dependency, zero high or critical advisories, and two accepted stdio-irrelevant moderate advisories observed"
  );
}

async function crashMatrixProbes(): Promise<void> {
  assert(mainHarness);
  assert.equal(apiProcess, undefined);
  for (const stage of crashStages) {
    const before = await receiptCounts();
    const child = await startApi(stage);
    let responseText = "";
    let responseStatus = 0;
    try {
      const response = await fetch(
        `${baseUrl}/v1alpha1/trusted-memories/search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mainHarness.token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(validSearchBody()),
          signal: AbortSignal.timeout(7_000)
        }
      );
      responseStatus = response.status;
      responseText = await response.text();
    } catch {
      responseText = "";
    }
    const exitCode =
      child.exitCode === null ? await waitForExit(child, 7_000) : child.exitCode;
    apiProcess = undefined;
    assert.equal(exitCode, 86, `crash stage ${stage}`);
    assert.notEqual(responseStatus, 200, `crash stage ${stage}`);
    assert.equal(responseText.includes(protectedMarker), false);
    errorOutputs.push(responseText);
    const after = await receiptCounts();
    const receiptDelta = after.total - before.total;
    const preCommit =
      stage === "before_query" ||
      stage === "after_query" ||
      stage === "before_receipt_and_audit_commit";
    const committedBeforeConsume =
      stage === "after_durable_commit" ||
      stage === "before_receipt_consumption";
    if (preCommit) {
      assert.equal(receiptDelta, 0, stage);
    } else {
      assert.equal(receiptDelta, 1, stage);
    }
    if (committedBeforeConsume) {
      assert.equal(after.issued - before.issued, 1, stage);
    }
    if (!preCommit && !committedBeforeConsume) {
      assert.equal(after.consumed - before.consumed, 1, stage);
    }
    const durableState = preCommit
      ? "none"
      : committedBeforeConsume
        ? "release_authorized"
        : "release_attempted";
    crashMatrix.push({
      stage,
      exitCode,
      protectedContentReleased: false,
      receiptDelta,
      durableState
    });
  }
  assert.equal(crashMatrix.length, 8);
  pass(
    "S3-CRASH-01",
    "all eight real process crashes matched pre-commit, authorized, or attempted durable state with zero content release"
  );
}

async function protectedContentLeakProbe(): Promise<void> {
  assert(targetAdminPool);
  assert(protectedMarker);
  const auditRows = await targetAdminPool.query<{
    metadata: string;
    release_status: string | null;
  }>(
    `SELECT
       metadata::text AS metadata,
       metadata->>'releaseStatus' AS release_status
       FROM source_wire_memory.audit_events
      ORDER BY occurred_at, event_id`
  );
  const auditText = auditRows.rows.map((row) => row.metadata).join("\n");
  assert.equal(auditText.includes(protectedMarker), false);
  assert.equal(/client[_ ]?received/iu.test(auditText), false);
  assert.equal(
    auditRows.rows
      .filter((row) => row.release_status !== null)
      .every((row) => row.release_status === "release_authorized"),
    true
  );
  const emitted = [
    ...apiLogs,
    ...mcpDiagnostics,
    ...errorOutputs,
    ...safeOutputs
  ].join("\n");
  assert.equal(emitted.includes(protectedMarker), false);
  assert.equal(emitted.includes(ownerToken), false);
  assert.equal(emitted.includes(runtimeUrl), false);
  const tempEntries = await readdir(tempDirectory, { recursive: true });
  assert.deepEqual(tempEntries, []);
  const metricsTables = await targetAdminPool.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'source_wire_memory'
        AND table_name ILIKE '%metric%'`
  );
  assert.equal(metricsTables.rowCount, 0);
  pass(
    "S3-LEAK-01",
    "protected content was absent from logs, MCP diagnostics, errors, audit metadata, metrics, and the owned temporary path"
  );
}

async function prepareDirectSearch(
  processReleaseSecret: Buffer,
  receiptTtlMs?: number
) {
  assert(runtimePool);
  const options: Parameters<typeof prepareTrustedMemorySearch>[4] = {
    processReleaseSecret,
    startedAtMs: Date.now()
  };
  if (receiptTtlMs !== undefined) options.receiptTtlMs = receiptTtlMs;
  return prepareTrustedMemorySearch(
    runtimePool,
    mainHarnessActor(),
    {
      namespaceId: "ns_story3_alpha",
      query: "heliotrope",
      queryByteCount: Buffer.byteLength("heliotrope", "utf8"),
      limit: 7
    },
    randomUUID(),
    options
  );
}

function mainHarnessActor(): AuthenticatedCredential {
  assert(mainHarness);
  return {
    credentialId: mainHarness.credentialId,
    credentialClass: "harness",
    status: "active",
    ownerId: "owner_story3",
    namespaceIds: [...mainHarness.namespaceIds],
    capabilities: [
      "memory_candidate.propose",
      "trusted_memory.search"
    ],
    issuedAt: mainHarness.issuedAt,
    expiresAt: mainHarness.expiresAt,
    actorReference: `credential:${mainHarness.credentialId}`
  };
}

async function decideCandidate(
  candidateId: string,
  decision: "approve" | "reject"
): Promise<HttpResult> {
  return postJson(
    `${baseUrl}/v1alpha1/admin/memory-candidates/${candidateId}/decision`,
    ownerToken,
    {
      namespaceId: "ns_story3_alpha",
      decision,
      expectedState: "pending",
      reason: "Generated Story 3 owner decision.",
      idempotencyKey: `decision_${randomUUID()}`
    }
  );
}

async function insertArtificialMemory(input: {
  ownerId: string;
  namespaceId: string;
  memoryState: "active" | "revoked";
  revisionStatus: "active" | "superseded" | "revoked";
  content: string;
}): Promise<{ memoryId: string; revisionId: string }> {
  assert(targetAdminPool);
  const candidateId = randomUUID();
  const memoryId = randomUUID();
  const revisionId = randomUUID();
  const contentByteCount = Buffer.byteLength(input.content, "utf8");
  const client = await targetAdminPool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO source_wire_memory.memory_candidates (
         candidate_id, owner_id, namespace_id, proposed_by_credential_id, state,
         content, content_byte_count, decided_at, decided_by_credential_id
       ) VALUES ($1, $2, $3, $4, 'approved', $5, $6, clock_timestamp(), $4)`,
      [
        candidateId,
        input.ownerId,
        input.namespaceId,
        ownerCredentialId,
        input.content,
        contentByteCount
      ]
    );
    await client.query(
      `INSERT INTO source_wire_memory.candidate_provenance (
         candidate_id, owner_id, namespace_id, provenance_kind, owner_assertion
       ) VALUES ($1, $2, $3, 'owner_assertion', 'Generated Story 3 fixture assertion.')`,
      [candidateId, input.ownerId, input.namespaceId]
    );
    await client.query(
      `INSERT INTO source_wire_memory.trusted_memories (
         memory_id, owner_id, namespace_id, origin_candidate_id, state
       ) VALUES ($1, $2, $3, $4, $5)`,
      [
        memoryId,
        input.ownerId,
        input.namespaceId,
        candidateId,
        input.memoryState
      ]
    );
    await client.query(
      `INSERT INTO source_wire_memory.trusted_memory_revisions (
         revision_id, memory_id, owner_id, namespace_id, revision_number, status,
         content, content_byte_count, origin_candidate_id, created_by_credential_id
       ) VALUES ($1, $2, $3, $4, 1, $5, $6, $7, $8, $9)`,
      [
        revisionId,
        memoryId,
        input.ownerId,
        input.namespaceId,
        input.revisionStatus,
        input.content,
        contentByteCount,
        candidateId,
        ownerCredentialId
      ]
    );
    await client.query(
      `INSERT INTO source_wire_memory.trusted_memory_provenance (
         revision_id, memory_id, owner_id, namespace_id, origin_candidate_id,
         provenance_kind, owner_assertion
       ) VALUES (
         $1, $2, $3, $4, $5, 'owner_assertion',
         'Generated Story 3 fixture assertion.'
       )`,
      [
        revisionId,
        memoryId,
        input.ownerId,
        input.namespaceId,
        candidateId
      ]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
  return { memoryId, revisionId };
}

async function latestReceipt(): Promise<{
  receipt_id: string;
  consumption_state: string;
  release_status: string;
  audit_event_id: string;
}> {
  assert(targetAdminPool);
  const result = await targetAdminPool.query<{
    receipt_id: string;
    consumption_state: string;
    release_status: string;
    audit_event_id: string;
  }>(
    `SELECT receipt_id, consumption_state, release_status, audit_event_id
       FROM source_wire_memory.protected_read_receipts
      ORDER BY issued_at DESC, receipt_id DESC
      LIMIT 1`
  );
  assert.equal(result.rowCount, 1);
  return result.rows[0] as {
    receipt_id: string;
    consumption_state: string;
    release_status: string;
    audit_event_id: string;
  };
}

async function searchAuditMetadata(
  auditEventId: string
): Promise<Record<string, unknown>> {
  assert(targetAdminPool);
  const result = await targetAdminPool.query<{ metadata: unknown }>(
    "SELECT metadata FROM source_wire_memory.audit_events WHERE event_id = $1",
    [auditEventId]
  );
  assert.equal(result.rowCount, 1);
  const metadata = result.rows[0]?.metadata;
  assert(metadata && typeof metadata === "object" && !Array.isArray(metadata));
  return metadata as Record<string, unknown>;
}

async function receiptDigestsForAudit(auditEventId: string): Promise<{
  request_digest: string;
  result_digest: string;
  covered_result_count: number;
}> {
  assert(targetAdminPool);
  const result = await targetAdminPool.query<{
    request_digest: string;
    result_digest: string;
    covered_result_count: number;
  }>(
    `SELECT request_digest, result_digest, covered_result_count
       FROM source_wire_memory.protected_read_receipts
      WHERE audit_event_id = $1`,
    [auditEventId]
  );
  assert.equal(result.rowCount, 1);
  return result.rows[0] as {
    request_digest: string;
    result_digest: string;
    covered_result_count: number;
  };
}

async function receiptCounts(): Promise<ReceiptCounts> {
  assert(targetAdminPool);
  const result = await targetAdminPool.query<{
    total: string;
    issued: string;
    consumed: string;
  }>(
    `SELECT
       count(*)::text AS total,
       count(*) FILTER (WHERE consumption_state = 'issued')::text AS issued,
       count(*) FILTER (WHERE consumption_state = 'consumed')::text AS consumed
       FROM source_wire_memory.protected_read_receipts`
  );
  const row = result.rows[0];
  assert(row);
  return {
    total: Number(row.total),
    issued: Number(row.issued),
    consumed: Number(row.consumed)
  };
}

async function expectRuntimeDenied(statement: string): Promise<void> {
  assert(runtimePool);
  let denied = false;
  try {
    await runtimePool.query(statement);
  } catch {
    denied = true;
  }
  assert.equal(denied, true, `runtime statement unexpectedly allowed: ${statement}`);
}

function validSearchBody(): Record<string, unknown> {
  return {
    namespaceId: "ns_story3_alpha",
    query: "heliotrope",
    limit: 10
  };
}

async function searchApi(
  token: string | undefined,
  body: Record<string, unknown>,
  timeoutMs = 7_000
): Promise<HttpResult> {
  return postJson(
    `${baseUrl}/v1alpha1/trusted-memories/search`,
    token,
    body,
    {},
    timeoutMs
  );
}

function readApiResults(result: HttpResult): Array<Record<string, unknown>> {
  const data = result.body.data;
  assert(data && typeof data === "object" && !Array.isArray(data));
  const results = (data as Record<string, unknown>).results;
  assert(Array.isArray(results));
  return results as Array<Record<string, unknown>>;
}

function readAuditEventId(result: HttpResult): string {
  const audit = result.body.audit;
  assert(audit && typeof audit === "object" && !Array.isArray(audit));
  const eventId = (audit as Record<string, unknown>).eventId;
  assert.equal(typeof eventId, "string");
  return eventId as string;
}

function stableSearchFields(
  row: Record<string, unknown>
): Record<string, unknown> {
  return {
    memoryId: row.memoryId,
    revisionId: row.revisionId,
    content: row.content,
    rank: row.rank,
    provenance: row.provenance
  };
}

async function callMcp(
  name: "propose_memory_candidate" | "search_trusted_memory",
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  assert(mcpClient);
  return (await mcpClient.callTool({
    name,
    arguments: args
  })) as Record<string, unknown>;
}

function readMcpText(result: Record<string, unknown>): Record<string, unknown> {
  const content = result.content as Array<Record<string, unknown>>;
  const text = content[0]?.text;
  assert.equal(typeof text, "string");
  return JSON.parse(text as string) as Record<string, unknown>;
}

async function closeMcp(): Promise<void> {
  const pid = mcpPid;
  const client = mcpClient;
  let closeFailure: unknown;
  try {
    await client?.close();
  } catch (error) {
    closeFailure = error;
  } finally {
    mcpClient = undefined;
    mcpTransport = undefined;
    mcpPid = null;
  }
  if (pid !== null) {
    try {
      await waitFor(async () => !processExists(pid), 3_000);
    } catch (error) {
      if (processExists(pid)) process.kill(pid, "SIGKILL");
      await waitFor(async () => !processExists(pid), 1_000);
      closeFailure ??= error;
    }
  }
  if (closeFailure) throw closeFailure;
}

async function stopApi(): Promise<void> {
  const child = apiProcess;
  apiProcess = undefined;
  if (!child) return;
  if (child.exitCode === null && child.pid && processExists(child.pid)) {
    child.kill("SIGTERM");
  }
  if (child.exitCode === null) {
    try {
      await waitForExit(child, 5_000);
    } catch (error) {
      if (child.pid && processExists(child.pid)) child.kill("SIGKILL");
      if (child.pid) {
        await waitFor(async () => !processExists(child.pid as number), 1_000);
      }
      throw error;
    }
  }
}

function mcpEnvironment(token: string): Record<string, string> {
  return {
    PATH: process.env.PATH ?? "",
    TMPDIR: tempDirectory,
    SOURCE_WIRE_API_URL: baseUrl,
    SOURCE_WIRE_MCP_TOKEN: token
  };
}

function operatorEnvironment(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    TMPDIR: tempDirectory,
    SOURCE_WIRE_MIGRATOR_DATABASE_URL: migratorUrl,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY: verifierKey,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID: verifierKeyId
  };
}

async function postJson(
  url: string,
  token: string | undefined,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
  timeoutMs = 7_000
): Promise<HttpResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs)
  });
  return responseResult(response);
}

async function postRaw(
  url: string,
  token: string | undefined,
  body: string | ArrayBuffer,
  contentType: string
): Promise<HttpResult> {
  const headers: Record<string, string> = {
    "Content-Type": contentType
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(7_000)
  });
  return responseResult(response);
}

async function responseResult(response: Response): Promise<HttpResult> {
  const text = await response.text();
  let body: Record<string, unknown> = {};
  if (text) {
    const parsed = JSON.parse(text) as unknown;
    assert(parsed && typeof parsed === "object" && !Array.isArray(parsed));
    body = parsed as Record<string, unknown>;
  }
  return {
    status: response.status,
    text,
    body
  };
}

function malformedUtf8SearchBody(invalidBytes: Buffer): ArrayBuffer {
  const body = Buffer.concat([
    Buffer.from('{"namespaceId":"ns_story3_alpha","query":"', "utf8"),
    invalidBytes,
    Buffer.from('","limit":10}', "utf8")
  ]);
  return Uint8Array.from(body).buffer;
}

async function runProcess(
  executable: string,
  args: string[],
  environment: NodeJS.ProcessEnv,
  cwd = repoRoot,
  timeoutMs = 20_000
): Promise<ProcessResult> {
  const isJavaScript =
    executable.endsWith(".js") && executable !== process.execPath;
  const child = spawn(
    isJavaScript ? process.execPath : executable,
    isJavaScript ? [executable, ...args] : args,
    {
      cwd,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });
  const code = await waitForExit(child, timeoutMs);
  return { code, stdout, stderr };
}

async function waitForExit(
  child: ChildProcess,
  timeoutMs: number
): Promise<number> {
  if (child.exitCode !== null) return child.exitCode;
  return new Promise<number>((resolveCode, reject) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("process_timeout"));
    }, timeoutMs);
    child.once("error", reject);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      resolveCode(code ?? 1);
    });
  });
}

async function waitFor(
  check: () => Promise<boolean>,
  timeoutMs: number
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  throw new Error("bounded_wait_timeout");
}

async function executeFormatted(
  pool: pg.Pool,
  format: string,
  values: string[] = []
): Promise<void> {
  if (values.length === 0) {
    await pool.query(format);
    return;
  }
  const formatted = await pool.query<{ sql: string }>(
    `SELECT format($1::text, ${values
      .map((_, index) => `$${index + 2}::text`)
      .join(", ")}) AS sql`,
    [format, ...values]
  );
  const sql = formatted.rows[0]?.sql;
  assert(sql);
  await pool.query(sql);
}

async function findAvailablePort(): Promise<number> {
  return new Promise<number>((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      assert(address && typeof address === "object");
      const port = address.port;
      server.close(() => resolvePort(port));
    });
  });
}

function parseJsonLine(output: string): Record<string, unknown> {
  return JSON.parse(output.trim().split(/\r?\n/u).at(-1) ?? "{}") as Record<
    string,
    unknown
  >;
}

function npmCliPath(): string {
  const path = process.env.npm_execpath;
  if (!path?.endsWith("npm-cli.js")) {
    throw new Error("npm_cli_unavailable");
  }
  return path;
}

function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function pass(id: string, observation: string): void {
  assert.equal(
    cases.some((result) => result.id === id),
    false,
    `duplicate conformance case id: ${id}`
  );
  cases.push({ id, status: "passed", observation });
}

async function cleanup(): Promise<boolean> {
  try {
    await runtimePool?.end();
    runtimePool = undefined;
    await targetAdminPool?.end();
    targetAdminPool = undefined;
    if (adminPool && created.database) {
      await adminPool.query(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1",
        [databaseName]
      );
      await executeFormatted(adminPool, "DROP DATABASE IF EXISTS %I", [
        databaseName
      ]);
      created.database = false;
    }
    if (adminPool && created.migratorRole) {
      await adminPool.query(`DROP ROLE IF EXISTS ${roleNames.migrator}`);
      created.migratorRole = false;
    }
    if (adminPool && created.runtimeRole) {
      await adminPool.query(`DROP ROLE IF EXISTS ${roleNames.runtime}`);
      created.runtimeRole = false;
    }
    if (adminPool && created.schemaOwnerRole) {
      await adminPool.query(`DROP ROLE IF EXISTS ${roleNames.schemaOwner}`);
      created.schemaOwnerRole = false;
    }
    if (created.tempDirectory && tempDirectory) {
      await rm(tempDirectory, { recursive: true, force: true });
      created.tempDirectory = false;
    }

    if (adminPool) {
      const generatedRoles = [...generatedRoleNames];
      const residue = await adminPool.query<{
        database_exists: boolean;
        role_exists: boolean;
        session_exists: boolean;
      }>(
        `SELECT
           EXISTS (
             SELECT 1 FROM pg_database WHERE datname = $1
           ) AS database_exists,
           EXISTS (
             SELECT 1 FROM pg_roles WHERE rolname = ANY($2::text[])
           ) AS role_exists,
           EXISTS (
             SELECT 1
               FROM pg_stat_activity
              WHERE datname = $1 OR usename = ANY($2::text[])
           ) AS session_exists`,
        [databaseName, generatedRoles]
      );
      assert.deepEqual(residue.rows[0], {
        database_exists: false,
        role_exists: false,
        session_exists: false
      });
    }
    assert.equal(
      [...generatedChildPids].some((pid) => processExists(pid)),
      false,
      "generated child process residue"
    );
    if (tempDirectory) {
      const tempAbsent = await readdir(tempDirectory).then(
        () => false,
        () => true
      );
      assert.equal(tempAbsent, true);
    }
    return true;
  } catch (error) {
    cleanupFailure = error;
    return false;
  }
}

async function writeReport(): Promise<void> {
  const packageJson = JSON.parse(
    await readFile(resolve(appRoot, "package.json"), "utf8")
  ) as { dependencies: Record<string, string> };
  const commit = await runProcess(
    "git",
    ["rev-parse", "HEAD"],
    process.env,
    repoRoot
  ).catch(() => ({ code: 1, stdout: "unavailable", stderr: "" }));
  const status = await runProcess(
    "git",
    ["status", "--porcelain=v1", "-z"],
    process.env,
    repoRoot
  ).catch(() => ({ code: 1, stdout: "unavailable", stderr: "" }));
  const sourceTreeDigestSha256 = await computeSourceTreeDigest(
    commit.stdout.trim()
  );
  const packageLockSha256 = createHash("sha256")
    .update(await readFile(resolve(repoRoot, "package-lock.json")))
    .digest("hex");
  const migrationChecksums = await Promise.all(
    [
      "migrations/0001_story1_bootstrap.sql",
      "migrations/0002_story2_candidate_lifecycle.sql",
      "migrations/0003_story3_audited_search.sql"
    ].map(async (path) => ({
      path,
      sha256: createHash("sha256")
        .update(await readFile(resolve(appRoot, path)))
        .digest("hex")
    }))
  );
  const report = {
    schema: "source-wire.alpha1.story3-conformance.v1",
    revision: 1,
    status: failure || !cleanupPassed ? "failed" : "passed",
    sourceCommit: commit.stdout.trim(),
    sourceTree: {
      dirty: status.stdout.length > 0,
      digestSha256: sourceTreeDigestSha256,
      packageLockSha256,
      migrationChecksums
    },
    environment: {
      node: process.version,
      postgresqlMajor: 16,
      dataClass: "generated_disposable_only",
      apiListener: "literal_loopback_only",
      mcpTransport: "stdio_only",
      retrieval: "postgresql_full_text_only"
    },
    boundaries: {
      remoteMcp: "blocked",
      embeddingsAndPgvector: "blocked",
      externalProviders: "blocked",
      deploymentAndHosting: "blocked",
      productionAndRealData: "blocked",
      releaseMutation: "blocked",
      clientReceiptClaim: "absent"
    },
    dependencies: packageJson.dependencies,
    acceptedModerateAdvisories,
    crashMatrix,
    cases,
    cleanup: {
      passed: cleanupPassed,
      scope:
        "generated_database_roles_sessions_children_and_test_temp_directory_only"
    },
    failure: failure
      ? {
          kind: failure instanceof Error ? failure.name : "UnknownError",
          message: redactFailure(
            failure instanceof Error ? failure.message : "unknown failure"
          )
        }
      : null
  };
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  for (const sensitive of sensitiveValues) {
    assert.equal(serialized.includes(sensitive), false);
  }
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, serialized, { mode: 0o600 });
}

async function computeSourceTreeDigest(commit: string): Promise<string> {
  const trackedDiff = await runProcess(
    "git",
    ["diff", "--binary", "HEAD", "--"],
    process.env,
    repoRoot
  );
  assert.equal(trackedDiff.code, 0);
  const untracked = await runProcess(
    "git",
    ["ls-files", "--others", "--exclude-standard", "-z"],
    process.env,
    repoRoot
  );
  assert.equal(untracked.code, 0);
  const paths = untracked.stdout
    .split("\0")
    .filter(
      (path) =>
        path.length > 0 &&
        !path.startsWith("apps/alpha1-runtime/.artifacts/")
    )
    .sort((left, right) =>
      Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
    );
  const digest = createHash("sha256")
    .update(commit, "utf8")
    .update("\0", "utf8")
    .update(trackedDiff.stdout, "utf8");
  for (const path of paths) {
    digest
      .update("\0", "utf8")
      .update(path, "utf8")
      .update("\0", "utf8")
      .update(await readFile(resolve(repoRoot, path)));
  }
  return digest.digest("hex");
}

function redactFailure(message: string): string {
  let redacted = message;
  for (const sensitive of sensitiveValues) {
    redacted = redacted.replaceAll(sensitive, "[redacted]");
  }
  redacted = redacted.replace(
    /postgres(?:ql)?:\/\/\S+/giu,
    "[database-locator-redacted]"
  );
  if (databaseName) {
    redacted = redacted.replaceAll(databaseName, "[generated-database]");
  }
  return redacted.slice(0, 500);
}
