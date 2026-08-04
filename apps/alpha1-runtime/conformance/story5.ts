import assert from "node:assert/strict";
import {
  spawn,
  type ChildProcess,
  type ChildProcessByStdio
} from "node:child_process";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
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

import { ALPHA1_SCHEMA_VERSION } from "../src/config.js";
import { createLocalConfigTemplate } from "../src/local-cli/config.js";
import type { ProviderReadStage } from "../src/knowledge-provider-host.js";
import type { SyntheticKnowledgeProviderFault } from "../src/knowledge-provider/synthetic-provider.js";
import {
  REPLACEABLE_EXCERPT,
  REPLACEABLE_LOCATOR,
  REPLACEABLE_PROVIDER_SCOPE_ID,
  REPLACEABLE_SEGMENT_ID,
  REPLACEABLE_SOURCE_ID
} from "../src/knowledge-provider/replaceable-synthetic-adapter.js";

const { Pool } = pg;
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = resolve(appRoot, "../..");
const operatorCli = resolve(appRoot, "dist/src/cli/operator.js");
const serverEntry = resolve(appRoot, "dist/src/server.js");
const mcpServerEntry = resolve(appRoot, "dist/src/mcp/server.js");
const localCliEntry =
  process.env.SOURCE_WIRE_PACKED_LOCAL_CLI_ENTRY ??
  resolve(appRoot, "dist/src/cli/local.js");
const reportSuffix = process.env.SOURCE_WIRE_CONFORMANCE_REPORT_SUFFIX?.trim();
if (reportSuffix && !/^[a-z0-9][a-z0-9.-]{0,31}$/u.test(reportSuffix)) {
  throw new Error("invalid conformance report suffix");
}
const reportPath =
  process.env.SOURCE_WIRE_CONFORMANCE_REPORT ??
  resolve(
    appRoot,
    `.artifacts/story5-conformance-report${reportSuffix ? `-${reportSuffix}` : ""}.json`
  );
const expectedPostgresMajor = Number(
  process.env.SOURCE_WIRE_EXPECTED_POSTGRES_MAJOR ?? "18"
);
const expectedPostgresVersionNum = process.env[
  "SOURCE_WIRE_EXPECTED_POSTGRES_VERSION_NUM"
]
  ? Number(process.env["SOURCE_WIRE_EXPECTED_POSTGRES_VERSION_NUM"])
  : expectedPostgresMajor === 18
    ? 180_004
    : undefined;

const OWNER_ID =
  process.env.SOURCE_WIRE_CROSS_PROVIDER_OWNER_ID ?? "owner_story5";
const NAMESPACE_ID =
  process.env.SOURCE_WIRE_CROSS_PROVIDER_NAMESPACE_ID ?? "ns_story5_alpha";
const SECOND_NAMESPACE_ID = "ns_story5_beta";
const PROVIDER_ADAPTER =
  process.env.SOURCE_WIRE_STORY5_PROVIDER_ADAPTER ?? "baseline";
assert(
  PROVIDER_ADAPTER === "baseline" || PROVIDER_ADAPTER === "replaceable"
);
const PROVIDER_SCOPE_ID =
  PROVIDER_ADAPTER === "replaceable"
    ? REPLACEABLE_PROVIDER_SCOPE_ID
    : "scope_docs_alpha";
const PROTECTED_QUERY = "deployment review";
const PROTECTED_EXCERPT =
  PROVIDER_ADAPTER === "replaceable"
    ? REPLACEABLE_EXCERPT
    : "Synthetic evidence: deployment requires an owner-reviewed release gate.";
const PROTECTED_LOCATOR =
  PROVIDER_ADAPTER === "replaceable"
    ? REPLACEABLE_LOCATOR
    : "synthetic://runbook/release-gate";
const SOURCE_ID =
  PROVIDER_ADAPTER === "replaceable"
    ? REPLACEABLE_SOURCE_ID
    : "source_synthetic_runbook";
const SEGMENT_ID =
  PROVIDER_ADAPTER === "replaceable"
    ? REPLACEABLE_SEGMENT_ID
    : "segment_release_gate";
const CROSS_PROVIDER_MODULE =
  process.env.SOURCE_WIRE_CROSS_PROVIDER_MODULE;
const CROSS_PROVIDER_EXPORT =
  process.env.SOURCE_WIRE_CROSS_PROVIDER_EXPORT;
const CROSS_PROVIDER_SCOPE_ID =
  process.env.SOURCE_WIRE_CROSS_PROVIDER_SCOPE_ID;
const CROSS_PROVIDER_QUERY =
  process.env.SOURCE_WIRE_CROSS_PROVIDER_QUERY;
const CROSS_PROVIDER_EXCERPT =
  process.env.SOURCE_WIRE_CROSS_PROVIDER_EXCERPT;
const CROSS_PROVIDER_LOCATOR =
  process.env.SOURCE_WIRE_CROSS_PROVIDER_LOCATOR;
const CROSS_PROVIDER_SOURCE_ID =
  process.env.SOURCE_WIRE_CROSS_PROVIDER_SOURCE_ID;
const CROSS_PROVIDER_SEGMENT_ID =
  process.env.SOURCE_WIRE_CROSS_PROVIDER_SEGMENT_ID;
const CROSS_PROVIDER_VALUES = [
  CROSS_PROVIDER_MODULE,
  CROSS_PROVIDER_EXPORT,
  CROSS_PROVIDER_SCOPE_ID,
  CROSS_PROVIDER_QUERY,
  CROSS_PROVIDER_EXCERPT,
  CROSS_PROVIDER_LOCATOR,
  CROSS_PROVIDER_SOURCE_ID,
  CROSS_PROVIDER_SEGMENT_ID
];
assert(
  CROSS_PROVIDER_VALUES.every((value) => value === undefined) ||
    CROSS_PROVIDER_VALUES.every(
      (value) => typeof value === "string" && value.length > 0
    ),
  "cross-provider conformance requires the complete public fixture binding"
);
const CROSS_PROVIDER_ENABLED = CROSS_PROVIDER_MODULE !== undefined;
const LOCAL_PROVIDER_MODULE =
  CROSS_PROVIDER_MODULE ??
  (PROVIDER_ADAPTER === "replaceable"
    ? "@source-wire/local-runtime/replaceable-synthetic-provider"
    : "@source-wire/local-runtime/synthetic-provider");
const LOCAL_PROVIDER_EXPORT =
  CROSS_PROVIDER_EXPORT ??
  (PROVIDER_ADAPTER === "replaceable"
    ? "createReplaceableSyntheticProvider"
    : "createSyntheticKnowledgeProvider");
const LOCAL_PROVIDER_SCOPE_ID =
  CROSS_PROVIDER_SCOPE_ID ?? PROVIDER_SCOPE_ID;
const LOCAL_PROTECTED_QUERY =
  CROSS_PROVIDER_QUERY ?? PROTECTED_QUERY;
const LOCAL_PROTECTED_EXCERPT =
  CROSS_PROVIDER_EXCERPT ?? PROTECTED_EXCERPT;
const LOCAL_PROTECTED_LOCATOR =
  CROSS_PROVIDER_LOCATOR ?? PROTECTED_LOCATOR;
const LOCAL_SOURCE_ID =
  CROSS_PROVIDER_SOURCE_ID ?? SOURCE_ID;
const LOCAL_SEGMENT_ID =
  CROSS_PROVIDER_SEGMENT_ID ?? SEGMENT_ID;

const roleNames = {
  schemaOwner: "source_wire_schema_owner",
  migrator: "source_wire_migrator",
  runtime: "source_wire_runtime"
} as const;

const providerFaults: SyntheticKnowledgeProviderFault[] = [
  "provider_scope_mismatch",
  "acl_denied",
  "provenance_missing",
  "result_bound_exceeded",
  "deadline_exceeded",
  "never_settles",
  "provider_outage"
];

const crashStages: ProviderReadStage[] = [
  "after_provider_return",
  "after_response_serialization",
  "after_audit_commit",
  "after_receipt_consumption",
  "after_response_write"
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

type IssuedHarness = {
  token: string;
  credentialId: string;
};

type ReceiptCounts = {
  total: number;
  issued: number;
  consumed: number;
};

type ProviderReceiptRow = {
  receipt_id: string;
  format_version: number;
  trace_id: string;
  request_id: string;
  actor_reference: string;
  actor_credential_id: string;
  actor_identity_id: string;
  owner_id: string;
  namespace_id: string;
  provider_id: string;
  provider_scope_id: string;
  operation: string;
  policy_decision: string;
  release_binding: string;
  request_digest: string;
  result_digest: string;
  target_order_digest: string;
  response_byte_count: number;
  covered_result_count: number;
  issued_at: Date;
  expires_at: Date;
  origin_process_id: string;
  origin_process_verifier: string;
  audit_event_id: string;
  consumption_state: string;
  release_status: string;
};

type CapturedApiProcess = ChildProcessByStdio<null, Readable, Readable>;

const cases: CaseResult[] = [];
const crashResults: Array<{
  stage: ProviderReadStage;
  receiptDelta: number;
  consumedDelta: number;
}> = [];
const apiLogs: string[] = [];
const mcpDiagnostics: string[] = [];
const errorOutputs: string[] = [];
const sensitiveValues = new Set<string>();
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
let ownerToken = "";
let harness: IssuedHarness | undefined;
let baseUrl = "";
let tempDirectory = "";
let postgresqlVersionNum = 0;

for (const value of [
  PROTECTED_QUERY,
  PROTECTED_EXCERPT,
  PROTECTED_LOCATOR,
  SOURCE_ID,
  SEGMENT_ID,
  LOCAL_PROTECTED_QUERY,
  LOCAL_PROTECTED_EXCERPT,
  LOCAL_PROTECTED_LOCATOR,
  LOCAL_SOURCE_ID,
  LOCAL_SEGMENT_ID
]) {
  sensitiveValues.add(value);
}

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
      "S5-CLEANUP-01",
      "generated database, roles, sessions, API and MCP processes, and temporary directory were absent after cleanup"
    );
  }
  await writeReport();
  await adminPool?.end().catch(() => undefined);
}

if (failure || !cleanupPassed) {
  process.stderr.write(
    "Story 5 conformance failed. See the redacted machine report.\n"
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `ok Source-Wire Alpha 1 Story 5 conformance (${cases.length} cases)\n`
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
    application_name: "source_wire_story5_conformance_admin"
  });
  adminPool.on("error", () => undefined);
  const version = await adminPool.query<{ server_version_num: string }>(
    "SELECT current_setting('server_version_num') AS server_version_num"
  );
  postgresqlVersionNum = Number(version.rows[0]?.server_version_num ?? "0");
  assert.equal(
    Math.floor(postgresqlVersionNum / 10_000),
    expectedPostgresMajor
  );
  if (expectedPostgresVersionNum !== undefined) {
    assert.equal(postgresqlVersionNum, expectedPostgresVersionNum);
  }
  pass(
    "S5-ENV-01",
    `Node.js 22.23.1 and PostgreSQL ${postgresqlVersionNum} observed`
  );

  tempDirectory = await mkdtemp(
    resolve(tmpdir(), "source-wire-story5-conformance-")
  );
  created.tempDirectory = true;
  await provisionDisposableTarget();
  await migrateAndInitialize();
  await startApi();
  harness = await issueHarness(
    [NAMESPACE_ID],
    ["memory_candidate.propose", "source_evidence.read", "trusted_memory.search"]
  );
  await mcpProviderReadProbes();
  await authorizationProbes();
  await durableAuditAndNoPromotionProbes();
  await closeMcp();
  await immutableProviderBindingAuthorizationProbes();
  await providerFaultProbes();
  await receiptDenialReplayAndPrivilegeProbes();
  await stopApi();
  await crashMatrixProbes();
  await exactFetchResponseHandoffCrashProbe();
  await leakResistanceProbe();
  await localCliProviderCompositionProbe();
  await localCliFailureBoundaryProbe();
}

async function localCliProviderCompositionProbe(): Promise<void> {
  assert(targetAdminPool);
  assert(harness);
  const module = LOCAL_PROVIDER_MODULE;
  const exportName = LOCAL_PROVIDER_EXPORT;
  const providerModuleBefore = await providerModuleDigest(module);
  const configPath = resolve(
    tempDirectory,
    `source-wire-story6-provider-${
      CROSS_PROVIDER_ENABLED ? "external" : PROVIDER_ADAPTER
    }.json`
  );
  await writeFile(
    configPath,
    `${JSON.stringify(
      {
        ...createLocalConfigTemplate({
          ownerId: OWNER_ID,
          namespaceIds: [NAMESPACE_ID]
        }),
        knowledgeProvider: {
          module,
          exportName,
          providerScopeId: LOCAL_PROVIDER_SCOPE_ID,
          timeoutMs: 1_000
        }
      },
      null,
      2
    )}\n`,
    { mode: 0o600 }
  );
  await chmod(configPath, 0o600);

  const offlineCheck = await runProcess(
    localCliEntry,
    ["provider", "check", "--config", configPath, "--json"],
    {}
  );
  assert.equal(offlineCheck.code, 0, offlineCheck.stderr);
  const offlineResult = parseJsonLine(offlineCheck.stdout);
  assert.equal(
    (offlineResult.result as Record<string, unknown>).executableLoaded,
    false
  );
  assert.equal(offlineCheck.stdout.includes(LOCAL_PROTECTED_EXCERPT), false);

  const connectedCheck = await runProcess(
    localCliEntry,
    [
      "provider",
      "check",
      "--config",
      configPath,
      "--connect",
      "--json"
    ],
    {}
  );
  assert.equal(connectedCheck.code, 0, connectedCheck.stderr);
  const connectedResult = parseJsonLine(connectedCheck.stdout);
  assert.deepEqual(connectedResult.result, {
    contractVersion: "knowledge-provider.v1",
    executableLoaded: true,
    profileValidation: "passed",
    readiness: "ready",
    evidenceReleased: false
  });
  assert.equal(connectedCheck.stdout.includes(LOCAL_PROTECTED_EXCERPT), false);
  pass(
    "S6-PROVIDER-01",
    "offline provider checking loaded no executable code while explicit connected checking validated the immutable read-only profile and health operation without evidence release"
  );

  const beforeState = await governedStateCounts();
  const beforeReceipts = await receiptCounts();
  const diagnostics: string[] = [];
  const client = new McpClient(
    {
      name: "source-wire-story6-provider-conformance",
      version: "0.0.0"
    },
    { capabilities: {} }
  );
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [localCliEntry, "mcp", "stdio", "--config", configPath],
    env: {
      SOURCE_WIRE_DATABASE_URL: runtimeUrl,
      SOURCE_WIRE_TOKEN_VERIFIER_KEY: verifierKey,
      SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID:
        "local_alpha1_story5",
      SOURCE_WIRE_OWNER_TOKEN: ownerToken
    },
    stderr: "pipe"
  });
  transport.stderr?.on("data", (chunk) => {
    diagnostics.push(
      Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk)
    );
  });

  let localPid: number | null = null;
  let processCredentialId = "";
  try {
    await client.connect(transport);
    localPid = transport.pid;
    if (localPid !== null) generatedChildPids.add(localPid);
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), [
      "get_source_evidence",
      "propose_memory_candidate",
      "search_source_evidence",
      "search_trusted_memory"
    ]);

    const search = (await client.callTool({
      name: "search_source_evidence",
      arguments: {
        namespaceId: NAMESPACE_ID,
        query: LOCAL_PROTECTED_QUERY,
        limit: 10
      }
    })) as Record<string, unknown>;
    assert.notEqual(search.isError, true, JSON.stringify(search));
    const searchResult = search.structuredContent as Record<string, unknown>;
    assert.equal(searchResult.status, "allowed");
    assert.equal(
      (
        searchResult.evidence as Array<Record<string, unknown>>
      )[0]?.excerpt,
      LOCAL_PROTECTED_EXCERPT
    );

    const exact = (await client.callTool({
      name: "get_source_evidence",
      arguments: {
        namespaceId: NAMESPACE_ID,
        sourceId: LOCAL_SOURCE_ID,
        segmentId: LOCAL_SEGMENT_ID
      }
    })) as Record<string, unknown>;
    assert.notEqual(exact.isError, true, JSON.stringify(exact));
    const exactResult = exact.structuredContent as Record<string, unknown>;
    assert.equal(exactResult.status, "allowed");
    assert.equal(
      (
        exactResult.evidence as Array<Record<string, unknown>>
      )[0]?.segmentId,
      LOCAL_SEGMENT_ID
    );

    const issued = await targetAdminPool.query<{
      credential_id: string;
      status: string;
    }>(
      `SELECT credential.credential_id, credential.status
         FROM source_wire_memory.credentials AS credential
        WHERE credential.credential_class = 'harness'
          AND credential.credential_id <> $1
          AND credential.status = 'active'
          AND EXISTS (
            SELECT 1
              FROM source_wire_memory.credential_capability_grants AS grant_row
             WHERE grant_row.credential_id = credential.credential_id
               AND grant_row.capability = 'source_evidence.read'
          )
        ORDER BY credential.issued_at DESC
        LIMIT 1`,
      [harness.credentialId]
    );
    assert.equal(issued.rowCount, 1);
    processCredentialId = issued.rows[0]?.credential_id ?? "";
  } finally {
    await client.close().catch(() => undefined);
    if (localPid !== null) {
      await waitFor(async () => !processExists(localPid as number), 5_000);
    }
    await rm(configPath, { force: true });
  }

  assert.notEqual(processCredentialId, "");
  await waitFor(async () => {
    const status = await targetAdminPool?.query<{ status: string }>(
      `SELECT status
         FROM source_wire_memory.credentials
        WHERE credential_id = $1`,
      [processCredentialId]
    );
    return status?.rows[0]?.status === "revoked";
  }, 5_000);
  const afterReceipts = await receiptCounts();
  assert.equal(afterReceipts.total - beforeReceipts.total, 2);
  assert.equal(afterReceipts.consumed - beforeReceipts.consumed, 2);
  assert.deepEqual(await governedStateCounts(), beforeState);
  const auditMetadata = await targetAdminPool.query<{ metadata: string }>(
    `SELECT audit.metadata::text AS metadata
       FROM source_wire_memory.provider_read_receipts AS receipt
       JOIN source_wire_memory.audit_events AS audit
         ON audit.event_id = receipt.audit_event_id
      ORDER BY receipt.issued_at DESC, receipt.receipt_id DESC
      LIMIT 2`
  );
  for (const row of auditMetadata.rows) {
    for (const forbidden of [
      module,
      exportName,
      configPath,
      ownerToken,
      runtimeUrl,
      LOCAL_PROTECTED_EXCERPT,
      LOCAL_PROTECTED_LOCATOR
    ]) {
      assert.equal(row.metadata.includes(forbidden), false);
    }
  }
  const diagnosticText = diagnostics.join("");
  for (const forbidden of [
    module,
    exportName,
    configPath,
    ownerToken,
    runtimeUrl,
    verifierKey,
    LOCAL_PROTECTED_EXCERPT
  ]) {
    assert.equal(diagnosticText.includes(forbidden), false);
  }
  pass(
    "S6-PROVIDER-02",
    "one owner-selected provider produced exactly four stdio tools and routed search plus exact fetch through loopback policy, durable audit, and single-use release receipts"
  );
  pass(
    "S6-PROVIDER-03",
    "provider reads created zero governed memory, provider details stayed out of MCP diagnostics and audit metadata, and coordinated shutdown revoked the process credential"
  );
  assert.equal(await providerModuleDigest(module), providerModuleBefore);
  if (CROSS_PROVIDER_ENABLED) {
    pass(
      "S6-EVIDENCE-FIRST-01",
      "the separately packed evidence-first adapter stayed byte-stable while the unchanged local CLI released ordered synthetic search and exact-fetch evidence through protected audit and single-use receipts"
    );
    pass(
      "S6-EVIDENCE-FIRST-02",
      "cross-repository reads produced zero memory candidates, trusted memories, or adapter-package writes and exposed no provider credential, endpoint, SQL, entitlement, or ranking implementation"
    );
  }
}

async function localCliFailureBoundaryProbe(): Promise<void> {
  assert(targetAdminPool);
  const module = LOCAL_PROVIDER_MODULE;
  const exportName = LOCAL_PROVIDER_EXPORT;
  const configPath = resolve(
    tempDirectory,
    `source-wire-story6-failure-${PROVIDER_ADAPTER}.json`
  );
  const mismatchedConfigPath = resolve(
    tempDirectory,
    `source-wire-story6-mismatch-${PROVIDER_ADAPTER}.json`
  );
  const config = {
    ...createLocalConfigTemplate({
      ownerId: OWNER_ID,
      namespaceIds: [NAMESPACE_ID]
    }),
    knowledgeProvider: {
      module,
      exportName,
      providerScopeId: LOCAL_PROVIDER_SCOPE_ID,
      timeoutMs: 1_000
    }
  };
  await writeFile(
    configPath,
    `${JSON.stringify(config, null, 2)}\n`,
    { mode: 0o600 }
  );
  await chmod(configPath, 0o600);
  await writeFile(
    mismatchedConfigPath,
    `${JSON.stringify(
      {
        ...config,
        knowledgeProvider: {
          ...config.knowledgeProvider,
          providerScopeId: "scope_story6_mismatch"
        }
      },
      null,
      2
    )}\n`,
    { mode: 0o600 }
  );
  await chmod(mismatchedConfigPath, 0o600);

  const runtimeEnvironment = {
    SOURCE_WIRE_DATABASE_URL: runtimeUrl,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY: verifierKey,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID: "local_alpha1_story5",
    SOURCE_WIRE_OWNER_TOKEN: ownerToken
  };
  const unavailableDatabaseUrl =
    "postgresql://unavailable:unavailable@127.0.0.1:1/unavailable";
  sensitiveValues.add(unavailableDatabaseUrl);

  try {
    const unavailable = await runProcess(
      localCliEntry,
      ["mcp", "stdio", "--config", configPath],
      {
        ...runtimeEnvironment,
        SOURCE_WIRE_DATABASE_URL: unavailableDatabaseUrl
      }
    );
    assert.equal(unavailable.code, 1);
    assert.equal(unavailable.stdout, "");
    assert.match(unavailable.stderr, /database_unavailable/u);
    assertSafeLocalFailure(
      unavailable,
      [configPath, mismatchedConfigPath]
    );

    const latestMigration = await targetAdminPool.query<{
      checksum_sha256: string;
    }>(
      `SELECT checksum_sha256
         FROM source_wire_memory.schema_migrations
        WHERE version = $1`,
      [ALPHA1_SCHEMA_VERSION]
    );
    const expectedChecksum = latestMigration.rows[0]?.checksum_sha256;
    assert(expectedChecksum);
    const incompatibleChecksum = "0".repeat(64);
    await targetAdminPool.query(
      `UPDATE source_wire_memory.schema_migrations
          SET checksum_sha256 = $1
        WHERE version = $2`,
      [incompatibleChecksum, ALPHA1_SCHEMA_VERSION]
    );
    try {
      const incompatible = await runProcess(
        localCliEntry,
        ["mcp", "stdio", "--config", configPath],
        runtimeEnvironment
      );
      assert.equal(incompatible.code, 1);
      assert.equal(incompatible.stdout, "");
      assert.match(incompatible.stderr, /database_incompatible/u);
      assertSafeLocalFailure(
        incompatible,
        [configPath, mismatchedConfigPath]
      );
      const afterFailure = await targetAdminPool.query<{
        checksum_sha256: string;
      }>(
        `SELECT checksum_sha256
           FROM source_wire_memory.schema_migrations
          WHERE version = $1`,
        [ALPHA1_SCHEMA_VERSION]
      );
      assert.equal(
        afterFailure.rows[0]?.checksum_sha256,
        incompatibleChecksum
      );
    } finally {
      await targetAdminPool.query(
        `UPDATE source_wire_memory.schema_migrations
            SET checksum_sha256 = $1
          WHERE version = $2`,
        [expectedChecksum, ALPHA1_SCHEMA_VERSION]
      );
    }
    pass(
      "S6-FAIL-01",
      "database outage and incompatible migration state failed before startup with one redacted result, empty protocol stdout, and zero automatic migration mutation"
    );

    const credentialsBeforeMismatch = await harnessCredentialRows();
    const mismatch = await runProcess(
      localCliEntry,
      ["mcp", "stdio", "--config", mismatchedConfigPath],
      runtimeEnvironment
    );
    assert.equal(mismatch.code, 1);
    assert.equal(mismatch.stdout, "");
    assert.match(mismatch.stderr, /api_start_failed/u);
    assertSafeLocalFailure(mismatch, [configPath, mismatchedConfigPath]);
    assert.deepEqual(
      await harnessCredentialRows(),
      credentialsBeforeMismatch
    );

    const sessionsBefore = await runtimeSessionCount();
    for (const fault of [
      "api_after_credential",
      "mcp_after_start"
    ] as const) {
      const credentialsBefore = new Set(
        (await harnessCredentialRows()).map((row) => row.credential_id)
      );
      const result = await runProcess(
        localCliEntry,
        ["mcp", "stdio", "--config", configPath],
        {
          ...runtimeEnvironment,
          SOURCE_WIRE_CONFORMANCE_MODE: "story6",
          SOURCE_WIRE_STORY6_LOCAL_FAULT: fault
        }
      );
      assert.equal(result.code, 1);
      assert.equal(result.stdout, "");
      assert.match(
        result.stderr,
        fault === "api_after_credential"
          ? /composition_failed/u
          : /mcp_start_failed/u
      );
      assertSafeLocalFailure(result, [configPath, mismatchedConfigPath]);
      const createdRows = (await harnessCredentialRows()).filter(
        (row) => !credentialsBefore.has(row.credential_id)
      );
      assert.equal(createdRows.length, 1, fault);
      assert.equal(createdRows[0]?.status, "revoked", fault);
      await waitFor(
        async () => (await runtimeSessionCount()) === sessionsBefore,
        5_000
      );
    }
    pass(
      "S6-FAIL-02",
      "malformed provider composition invoked no provider and API or MCP child crashes stopped the complete local composition with stable safe errors"
    );
    pass(
      "S6-FAIL-03",
      "crash cleanup revoked each process credential, removed dependent database sessions, emitted no malformed stdout, and leaked no protected content or local secrets"
    );
  } finally {
    await rm(configPath, { force: true });
    await rm(mismatchedConfigPath, { force: true });
  }
}

async function harnessCredentialRows(): Promise<Array<{
  credential_id: string;
  status: string;
}>> {
  assert(targetAdminPool);
  const result = await targetAdminPool.query<{
    credential_id: string;
    status: string;
  }>(
    `SELECT credential_id::text, status
       FROM source_wire_memory.credentials
      WHERE credential_class = 'harness'
      ORDER BY credential_id`
  );
  return result.rows;
}

async function runtimeSessionCount(): Promise<number> {
  assert(targetAdminPool);
  const result = await targetAdminPool.query<{ count: string }>(
    `SELECT count(*)::text AS count
       FROM pg_stat_activity
      WHERE datname = $1
        AND usename = $2
        AND application_name = 'source_wire_alpha1_runtime'`,
    [databaseName, roleNames.runtime]
  );
  return Number(result.rows[0]?.count ?? "-1");
}

function assertSafeLocalFailure(
  result: ProcessResult,
  localPaths: readonly string[]
): void {
  const output = `${result.stdout}${result.stderr}`;
  errorOutputs.push(output);
  for (const sensitive of sensitiveValues) {
    assert.equal(output.includes(sensitive), false);
  }
  for (const localPath of localPaths) {
    assert.equal(output.includes(localPath), false);
  }
  for (const forbidden of [
    PROTECTED_QUERY,
    PROTECTED_EXCERPT,
    PROTECTED_LOCATOR,
    LOCAL_PROTECTED_QUERY,
    LOCAL_PROTECTED_EXCERPT,
    LOCAL_PROTECTED_LOCATOR,
    moduleSafeMarker()
  ]) {
    assert.equal(output.includes(forbidden), false);
  }
  assert.equal(/postgres(?:ql)?:\/\//iu.test(output), false);
}

function moduleSafeMarker(): string {
  return LOCAL_PROVIDER_MODULE;
}

async function provisionDisposableTarget(): Promise<void> {
  assert(adminPool);
  const collision = await adminPool.query<{ rolname: string }>(
    "SELECT rolname FROM pg_roles WHERE rolname = ANY($1::text[])",
    [Object.values(roleNames)]
  );
  assert.equal(collision.rowCount, 0, "Story 5 conformance role collision");

  databaseName = `source_wire_story5_${randomBytes(8).toString("hex")}`;
  const migratorPassword = randomBytes(24).toString("base64url");
  const runtimePassword = randomBytes(24).toString("base64url");
  verifierKey = randomBytes(32).toString("base64url");
  for (const value of [
    databaseName,
    migratorPassword,
    runtimePassword,
    verifierKey
  ]) {
    sensitiveValues.add(value);
  }

  await executeFormatted(
    adminPool,
    `CREATE ROLE ${roleNames.schemaOwner}
       NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`
  );
  created.schemaOwnerRole = true;
  await executeFormatted(
    adminPool,
    `CREATE ROLE ${roleNames.migrator}
       LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS
       PASSWORD %L`,
    [migratorPassword]
  );
  created.migratorRole = true;
  await adminPool.query(
    `GRANT ${roleNames.schemaOwner} TO ${roleNames.migrator}`
  );
  await executeFormatted(
    adminPool,
    `CREATE ROLE ${roleNames.runtime}
       LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS
       PASSWORD %L`,
    [runtimePassword]
  );
  created.runtimeRole = true;
  await executeFormatted(adminPool, "CREATE DATABASE %I", [databaseName]);
  created.database = true;
  await executeFormatted(
    adminPool,
    "REVOKE CONNECT ON DATABASE %I FROM PUBLIC",
    [databaseName]
  );
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
    max: 3,
    application_name: "source_wire_story5_conformance_target_admin"
  });
  targetAdminPool.on("error", () => undefined);
  await targetAdminPool.query("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
  const port = Number(process.env.PGPORT ?? "5432");
  migratorUrl =
    `postgresql://${roleNames.migrator}:${encodeURIComponent(migratorPassword)}` +
    `@127.0.0.1:${port}/${databaseName}`;
  runtimeUrl =
    `postgresql://${roleNames.runtime}:${encodeURIComponent(runtimePassword)}` +
    `@127.0.0.1:${port}/${databaseName}`;
  sensitiveValues.add(migratorUrl);
  sensitiveValues.add(runtimeUrl);
}

async function migrateAndInitialize(): Promise<void> {
  const migrated = await runProcess(
    operatorCli,
    ["migrate"],
    operatorEnvironment()
  );
  assert.equal(migrated.code, 0, migrated.stderr);
  assert.equal(parseJsonLine(migrated.stdout).version, ALPHA1_SCHEMA_VERSION);
  const replay = await runProcess(
    operatorCli,
    ["migrate"],
    operatorEnvironment()
  );
  assert.equal(replay.code, 0, replay.stderr);
  assert.equal(parseJsonLine(replay.stdout).status, "already_applied");
  pass(
    "S5-MIG-01",
    `forward-only migrations through ${ALPHA1_SCHEMA_VERSION} applied once and replayed without mutation`
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
      OWNER_ID,
      "--namespace-id",
      NAMESPACE_ID,
      "--namespace-id",
      SECOND_NAMESPACE_ID
    ],
    operatorEnvironment()
  );
  assert.equal(
    initialized.code,
    0,
    `${initialized.stderr}\n${initialized.stdout}`
  );
  const body = parseJsonLine(initialized.stdout);
  assert.equal(body.schemaVersion, ALPHA1_SCHEMA_VERSION);
  const owner = body.ownerAdminCredential as Record<string, unknown>;
  ownerToken = String(owner.secret);
  sensitiveValues.add(ownerToken);
  runtimePool = new Pool({
    connectionString: runtimeUrl,
    max: 2,
    query_timeout: 2_000,
    application_name: "source_wire_story5_conformance_runtime_probe"
  });
  runtimePool.on("error", () => undefined);
  pass(
    "S5-INIT-01",
    "generated owner and namespace initialized without source evidence, candidates, or trusted memory"
  );
}

async function startApi(options?: {
  fault?: SyntheticKnowledgeProviderFault;
  crashPoint?: ProviderReadStage;
}): Promise<void> {
  assert.equal(apiProcess, undefined);
  const port = baseUrl
    ? Number(new URL(baseUrl).port)
    : await findAvailablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  apiProcess = spawn(process.execPath, [serverEntry], {
    cwd: repoRoot,
    env: {
      ...process.env,
      SOURCE_WIRE_DATABASE_URL: runtimeUrl,
      SOURCE_WIRE_TOKEN_VERIFIER_KEY: verifierKey,
      SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID: "local_alpha1_story5",
      SOURCE_WIRE_HOST: "127.0.0.1",
      SOURCE_WIRE_PORT: String(port),
      SOURCE_WIRE_CONFORMANCE_MODE: "story5",
      SOURCE_WIRE_STORY5_SYNTHETIC_PROVIDER: "enabled",
      SOURCE_WIRE_STORY5_PROVIDER_ADAPTER: PROVIDER_ADAPTER,
      SOURCE_WIRE_STORY5_OWNER_ID: OWNER_ID,
      SOURCE_WIRE_STORY5_NAMESPACE_ID: NAMESPACE_ID,
      ...(options?.fault
        ? { SOURCE_WIRE_STORY5_SYNTHETIC_FAULT: options.fault }
        : {}),
      ...(options?.crashPoint
        ? {
            SOURCE_WIRE_STORY5_PROVIDER_CRASH_POINT:
              options.crashPoint
          }
        : {})
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  apiProcess.stdout.setEncoding("utf8");
  apiProcess.stderr.setEncoding("utf8");
  assert(apiProcess.pid);
  generatedChildPids.add(apiProcess.pid);
  apiProcess.stdout.on("data", (chunk: string) => apiLogs.push(chunk));
  apiProcess.stderr.on("data", (chunk: string) => apiLogs.push(chunk));
  await waitFor(async () => {
    if (apiProcess?.exitCode !== null) return false;
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
}

async function issueHarness(
  namespaceIds: string[],
  capabilities: string[]
): Promise<IssuedHarness> {
  const result = await postJson(
    `${baseUrl}/v1alpha1/admin/harness-credentials`,
    ownerToken,
    {
      namespaceIds,
      capabilities,
      expiresAt: new Date(Date.now() + 10 * 60 * 1_000).toISOString()
    },
    { "Idempotency-Key": `request_${randomUUID()}` }
  );
  assert.equal(result.status, 201, result.text);
  const data = result.body.data as Record<string, unknown>;
  const token = String(data.secret);
  sensitiveValues.add(token);
  return {
    token,
    credentialId: String(data.credentialId)
  };
}

async function mcpProviderReadProbes(): Promise<void> {
  assert(harness);
  const environment = mcpEnvironment(harness.token);
  assert.deepEqual(Object.keys(environment).sort(), [
    "HOME",
    "PATH",
    "SOURCE_WIRE_API_URL",
    "SOURCE_WIRE_MCP_TOKEN",
    "TMPDIR"
  ]);
  for (const forbidden of [
    "DATABASE",
    "POSTGRES",
    "PGHOST",
    "PROVIDER",
    "ENDPOINT",
    "CREDENTIAL"
  ]) {
    assert.equal(
      Object.keys(environment).some((key) => key.includes(forbidden)),
      false
    );
  }
  mcpClient = new McpClient(
    { name: "source-wire-story5-conformance", version: "0.0.0" },
    { capabilities: {} }
  );
  mcpTransport = new StdioClientTransport({
    command: process.execPath,
    args: [mcpServerEntry],
    env: environment,
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
    "get_source_evidence",
    "propose_memory_candidate",
    "search_source_evidence",
    "search_trusted_memory"
  ]);
  pass(
    "S5-MCP-01",
    "official SDK discovery exposed exactly the two memory tools and two source-evidence tools"
  );

  const search = await callMcp("search_source_evidence", {
    namespaceId: NAMESPACE_ID,
    query: PROTECTED_QUERY,
    limit: 10
  });
  assert.notEqual(search.isError, true, JSON.stringify(search));
  const searchData = search.structuredContent as Record<string, unknown>;
  assert.equal(searchData.status, "allowed");
  const searchEvidence = searchData.evidence as Array<
    Record<string, unknown>
  >;
  assert.equal(searchEvidence.length, 1);
  assert.equal(searchEvidence[0]?.excerpt, PROTECTED_EXCERPT);
  assert.equal(
    (searchData.audit as Record<string, unknown>).releaseStatus,
    "release_attempted"
  );

  const exact = await callMcp("get_source_evidence", {
    namespaceId: NAMESPACE_ID,
    sourceId: SOURCE_ID,
    segmentId: SEGMENT_ID
  });
  assert.notEqual(exact.isError, true, JSON.stringify(exact));
  const exactData = exact.structuredContent as Record<string, unknown>;
  assert.equal(exactData.status, "allowed");
  const exactEvidence = exactData.evidence as Array<Record<string, unknown>>;
  assert.equal(exactEvidence.length, 1);
  assert.equal(exactEvidence[0]?.sourceId, SOURCE_ID);
  assert.equal(exactEvidence[0]?.segmentId, SEGMENT_ID);
  assert.equal(
    (exactData.audit as Record<string, unknown>).releaseStatus,
    "release_attempted"
  );
  pass(
    "S5-READ-01",
    "search and exact fetch crossed MCP, loopback API policy, immutable provider host, synthetic provider, durable audit, and single-use receipt consumption"
  );
  pass(
    "S5-MCP-02",
    "MCP process environment contained only loopback API authority and no provider or database authority"
  );
}

async function authorizationProbes(): Promise<void> {
  const noCapability = await issueHarness(
    [NAMESPACE_ID],
    ["trusted_memory.search"]
  );
  const noCapabilityResult = await searchApi(noCapability.token);
  assertError(noCapabilityResult, "capability_not_allowed", 403);

  const wrongNamespace = await issueHarness(
    [SECOND_NAMESPACE_ID],
    ["source_evidence.read"]
  );
  const wrongNamespaceResult = await searchApi(wrongNamespace.token);
  assertError(wrongNamespaceResult, "namespace_not_allowed", 403);

  assert(harness);
  const callerScope = await postJson(
    `${baseUrl}/v1alpha1/source-evidence/search`,
    harness.token,
    {
      namespaceId: NAMESPACE_ID,
      query: PROTECTED_QUERY,
      providerScopeId: PROVIDER_SCOPE_ID
    }
  );
  assertError(callerScope, "validation_failed", 400);
  pass(
    "S5-AUTH-01",
    "missing capability, foreign namespace, and caller-selected provider scope failed before evidence release"
  );
}

async function immutableProviderBindingAuthorizationProbes(): Promise<void> {
  await stopApi();
  await startApi({ crashPoint: "after_provider_return" });
  const multiNamespaceHarness = await issueHarness(
    [NAMESPACE_ID, SECOND_NAMESPACE_ID],
    ["source_evidence.read"]
  );
  const before = await receiptCounts();
  const search = await postJson(
    `${baseUrl}/v1alpha1/source-evidence/search`,
    multiNamespaceHarness.token,
    {
      namespaceId: SECOND_NAMESPACE_ID,
      query: PROTECTED_QUERY,
      limit: 10
    }
  );
  assertError(search, "namespace_not_allowed", 403);
  const exact = await postJson(
    `${baseUrl}/v1alpha1/source-evidence/get`,
    multiNamespaceHarness.token,
    {
      namespaceId: SECOND_NAMESPACE_ID,
      sourceId: LOCAL_SOURCE_ID,
      segmentId: LOCAL_SEGMENT_ID
    }
  );
  assertError(exact, "namespace_not_allowed", 403);
  assert.deepEqual(await receiptCounts(), before);
  const health = await fetch(`${baseUrl}/health/live`, {
    signal: AbortSignal.timeout(1_000)
  });
  assert.equal(health.status, 200);
  await stopApi();
  await startApi();
  pass(
    "S5-AUTH-02",
    "multi-namespace search and exact fetch mismatches were denied before provider invocation, audit issuance, or evidence release"
  );
}

async function durableAuditAndNoPromotionProbes(): Promise<void> {
  assert(targetAdminPool);
  const receipts = await targetAdminPool.query<{
    operation: string;
    consumption_state: string;
    release_status: string;
    metadata: string;
  }>(
    `SELECT
       receipt.operation,
       receipt.consumption_state,
       receipt.release_status,
       audit.metadata::text AS metadata
     FROM source_wire_memory.provider_read_receipts AS receipt
     JOIN source_wire_memory.audit_events AS audit
       ON audit.event_id = receipt.audit_event_id
     ORDER BY receipt.issued_at, receipt.receipt_id`
  );
  assert.deepEqual(
    receipts.rows.map((row) => ({
      operation: row.operation,
      consumption_state: row.consumption_state,
      release_status: row.release_status
    })),
    [
      {
        operation: "search_evidence",
        consumption_state: "consumed",
        release_status: "release_attempted"
      },
      {
        operation: "get_evidence",
        consumption_state: "consumed",
        release_status: "release_attempted"
      }
    ]
  );
  for (const row of receipts.rows) {
    for (const protectedValue of [
      PROTECTED_QUERY,
      PROTECTED_EXCERPT,
      PROTECTED_LOCATOR,
      SOURCE_ID,
      SEGMENT_ID,
      "record_deployment_review"
    ]) {
      assert.equal(row.metadata.includes(protectedValue), false);
    }
  }
  const state = await governedStateCounts();
  assert.deepEqual(state, {
    candidate_count: "0",
    memory_count: "0",
    revision_count: "0"
  });
  pass(
    "S5-AUDIT-01",
    "both provider reads committed safe metadata-only audits before one consumed receipt released exact covered bytes"
  );
  pass(
    "S5-MEMORY-01",
    "provider reads created zero candidates, trusted memories, and trusted revisions"
  );
}

async function providerFaultProbes(): Promise<void> {
  assert(harness);
  await stopApi();
  for (const [index, fault] of providerFaults.entries()) {
    await startApi({ fault });
    const before = await receiptCounts();
    const result = await searchApi(harness.token, 5_000);
    assertError(result, "operation_unavailable", 503);
    assert.equal(result.text.includes(PROTECTED_EXCERPT), false);
    assert.deepEqual(await receiptCounts(), before);
    await stopApi();
    pass(
      `S5-FAULT-0${index + 1}`,
      `${fault} failed closed without evidence release or receipt mutation`
    );
  }
  await startApi();
  pass(
    "S5-FAULT-08",
    "provider scope, ACL, provenance, result bound, delayed deadline, never-settling deadline, and outage faults returned constant safe failures with zero receipts or evidence"
  );
}

async function receiptDenialReplayAndPrivilegeProbes(): Promise<void> {
  assert(targetAdminPool);
  assert(runtimePool);
  assert(harness);
  const consumeSignature =
    "source_wire_memory.consume_provider_read_receipt(uuid, smallint, uuid, uuid, varchar, uuid, uuid, varchar, varchar, varchar, varchar, varchar, varchar, varchar, varchar, varchar, varchar, integer, smallint, timestamptz, timestamptz, uuid, varchar, uuid)";
  await targetAdminPool.query(
    `REVOKE EXECUTE ON FUNCTION ${consumeSignature} FROM ${roleNames.runtime}`
  );
  const denied = await searchApi(harness.token);
  assertError(denied, "audit_unavailable", 503);
  assert.equal(denied.text.includes(PROTECTED_EXCERPT), false);
  await targetAdminPool.query(
    `GRANT EXECUTE ON FUNCTION ${consumeSignature} TO ${roleNames.runtime}`
  );

  const recovered = await searchApi(harness.token);
  assert.equal(recovered.status, 200, recovered.text);
  const latest = await latestProviderReceipt();
  assert.equal(latest.consumption_state, "consumed");
  assert.equal(latest.release_status, "release_attempted");
  assert.equal(
    await consumeProviderReceipt(latest, "0".repeat(64)),
    false
  );
  assert.equal(
    await consumeProviderReceipt(latest, latest.origin_process_verifier),
    false
  );
  pass(
    "S5-RECEIPT-01",
    "receipt-function outage withheld evidence, recovery succeeded, foreign verifier lost, and exact replay stayed single use"
  );

  const rolePosture = await targetAdminPool.query<{
    rolname: string;
    rolsuper: boolean;
    rolcreatedb: boolean;
    rolcreaterole: boolean;
    rolreplication: boolean;
    rolbypassrls: boolean;
  }>(
    `SELECT
       rolname,
       rolsuper,
       rolcreatedb,
       rolcreaterole,
       rolreplication,
       rolbypassrls
     FROM pg_roles
     WHERE rolname = ANY($1::text[])
     ORDER BY rolname`,
    [[roleNames.migrator, roleNames.runtime]]
  );
  assert.equal(rolePosture.rowCount, 2);
  for (const row of rolePosture.rows) {
    assert.deepEqual(
      {
        rolsuper: row.rolsuper,
        rolcreatedb: row.rolcreatedb,
        rolcreaterole: row.rolcreaterole,
        rolreplication: row.rolreplication,
        rolbypassrls: row.rolbypassrls
      },
      {
        rolsuper: false,
        rolcreatedb: false,
        rolcreaterole: false,
        rolreplication: false,
        rolbypassrls: false
      }
    );
  }
  for (const statement of [
    "SELECT * FROM source_wire_memory.provider_read_receipts LIMIT 1",
    "SELECT * FROM source_wire_memory.audit_events LIMIT 1",
    "UPDATE source_wire_memory.provider_read_receipts SET release_status = 'release_attempted'",
    "DELETE FROM source_wire_memory.provider_read_receipts",
    "CREATE TABLE public.story5_forbidden(id integer)"
  ]) {
    await expectRuntimeDenied(statement);
  }
  const privileges = await targetAdminPool.query<{
    provider_table_select: boolean;
    audit_table_select: boolean;
    consume_execute: boolean;
  }>(
    `SELECT
       has_table_privilege(
         $1,
         'source_wire_memory.provider_read_receipts',
         'SELECT'
       ) AS provider_table_select,
       has_table_privilege(
         $1,
         'source_wire_memory.audit_events',
         'SELECT'
       ) AS audit_table_select,
       has_function_privilege(
         $1,
         $2,
         'EXECUTE'
       ) AS consume_execute`,
    [roleNames.runtime, consumeSignature]
  );
  assert.deepEqual(privileges.rows[0], {
    provider_table_select: false,
    audit_table_select: false,
    consume_execute: true
  });
  pass(
    "S5-PRIV-01",
    "runtime and migrator roles remained non-privileged while runtime retained only narrow receipt function execution and no direct provider-read or audit table access"
  );
}

async function crashMatrixProbes(): Promise<void> {
  assert(harness);
  for (const stage of crashStages) {
    const before = await receiptCounts();
    await startApi({ crashPoint: stage });
    let responseText = "";
    try {
      const response = await fetch(
        `${baseUrl}/v1alpha1/source-evidence/search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${harness.token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            namespaceId: NAMESPACE_ID,
            query: PROTECTED_QUERY,
            limit: 10
          }),
          signal: AbortSignal.timeout(5_000)
        }
      );
      responseText = await response.text();
    } catch {
      responseText = "";
    }
    assert.equal(responseText.includes(PROTECTED_EXCERPT), false, stage);
    const child = apiProcess;
    assert(child);
    const exitCode =
      child.exitCode ?? (await waitForExit(child, 5_000));
    assert.equal(exitCode, 87, stage);
    apiProcess = undefined;
    const after = await receiptCounts();
    const receiptDelta = after.total - before.total;
    const consumedDelta = after.consumed - before.consumed;
    if (
      stage === "after_provider_return" ||
      stage === "after_response_serialization"
    ) {
      assert.equal(receiptDelta, 0, stage);
      assert.equal(consumedDelta, 0, stage);
    } else if (stage === "after_audit_commit") {
      assert.equal(receiptDelta, 1, stage);
      assert.equal(consumedDelta, 0, stage);
      const issued = await latestProviderReceipt();
      assert.equal(issued.consumption_state, "issued");
      assert.equal(
        await consumeProviderReceipt(issued, "0".repeat(64)),
        false
      );
    } else {
      assert.equal(receiptDelta, 1, stage);
      assert.equal(consumedDelta, 1, stage);
    }
    crashResults.push({ stage, receiptDelta, consumedDelta });
  }
  pass(
    "S5-CRASH-01",
    "provider return, serialization, audit, receipt, and response-handoff crash points exited deterministically and released no protected response"
  );
}

async function exactFetchResponseHandoffCrashProbe(): Promise<void> {
  assert(harness);
  const before = await receiptCounts();
  await startApi({ crashPoint: "after_response_write" });
  let responseText = "";
  try {
    const response = await fetch(
      `${baseUrl}/v1alpha1/source-evidence/get`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${harness.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          namespaceId: NAMESPACE_ID,
          sourceId: LOCAL_SOURCE_ID,
          segmentId: LOCAL_SEGMENT_ID
        }),
        signal: AbortSignal.timeout(5_000)
      }
    );
    responseText = await response.text();
  } catch {
    responseText = "";
  }
  assert.equal(
    responseText.includes(LOCAL_PROTECTED_EXCERPT),
    false,
    "exact_fetch_after_response_write"
  );
  const child = apiProcess;
  assert(child);
  const exitCode =
    child.exitCode ?? (await waitForExit(child, 5_000));
  assert.equal(exitCode, 87, "exact_fetch_after_response_write");
  apiProcess = undefined;
  const after = await receiptCounts();
  assert.equal(after.total - before.total, 1);
  assert.equal(after.consumed - before.consumed, 1);
  pass(
    "S5-CRASH-02",
    "exact fetch used the shared protected response handoff and released no protected response when the handoff crashed"
  );
}

async function leakResistanceProbe(): Promise<void> {
  assert(targetAdminPool);
  const receiptAndAuditText = await targetAdminPool.query<{ value: string }>(
    `SELECT
       coalesce(string_agg(receipt::text, E'\\n'), '') ||
       coalesce(string_agg(audit.metadata::text, E'\\n'), '') AS value
     FROM source_wire_memory.provider_read_receipts AS receipt
     JOIN source_wire_memory.audit_events AS audit
       ON audit.event_id = receipt.audit_event_id`
  );
  const protectedOutputs = [
    apiLogs.join(""),
    mcpDiagnostics.join(""),
    errorOutputs.join(""),
    receiptAndAuditText.rows[0]?.value ?? ""
  ];
  for (const output of protectedOutputs) {
    for (const sensitive of sensitiveValues) {
      assert.equal(output.includes(sensitive), false);
    }
    assert.equal(/postgres(?:ql)?:\/\//iu.test(output), false);
  }
  assert.deepEqual(await governedStateCounts(), {
    candidate_count: "0",
    memory_count: "0",
    revision_count: "0"
  });
  pass(
    "S5-LEAK-01",
    "logs, MCP diagnostics, safe errors, receipts, and audit metadata contained no protected content, generated credentials, database locators, or raw provider details"
  );
}

async function searchApi(
  token: string,
  timeoutMs = 3_000
): Promise<HttpResult> {
  return postJson(
    `${baseUrl}/v1alpha1/source-evidence/search`,
    token,
    {
      namespaceId: NAMESPACE_ID,
      query: PROTECTED_QUERY,
      limit: 10
    },
    {},
    timeoutMs
  );
}

async function governedStateCounts(): Promise<Record<string, string>> {
  assert(targetAdminPool);
  const result = await targetAdminPool.query<Record<string, string>>(
    `SELECT
       (SELECT count(*) FROM source_wire_memory.memory_candidates)::text
         AS candidate_count,
       (SELECT count(*) FROM source_wire_memory.trusted_memories)::text
         AS memory_count,
       (SELECT count(*) FROM source_wire_memory.trusted_memory_revisions)::text
         AS revision_count`
  );
  const row = result.rows[0];
  assert(row);
  return row;
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
     FROM source_wire_memory.provider_read_receipts`
  );
  const row = result.rows[0];
  assert(row);
  return {
    total: Number(row.total),
    issued: Number(row.issued),
    consumed: Number(row.consumed)
  };
}

async function latestProviderReceipt(): Promise<ProviderReceiptRow> {
  assert(targetAdminPool);
  const result = await targetAdminPool.query<ProviderReceiptRow>(
    `SELECT *
       FROM source_wire_memory.provider_read_receipts
      ORDER BY issued_at DESC, receipt_id DESC
      LIMIT 1`
  );
  const row = result.rows[0];
  assert(row);
  return row;
}

async function consumeProviderReceipt(
  receipt: ProviderReceiptRow,
  originProcessVerifier: string
): Promise<boolean> {
  assert(runtimePool);
  const result = await runtimePool.query<{ consumed: boolean }>(
    `SELECT source_wire_memory.consume_provider_read_receipt(
       $1::uuid, $2::smallint, $3::uuid, $4::uuid, $5::varchar, $6::uuid,
       $7::uuid, $8::varchar, $9::varchar, $10::varchar, $11::varchar,
       $12::varchar, $13::varchar, $14::varchar, $15::varchar, $16::varchar,
       $17::varchar, $18::integer, $19::smallint, $20::timestamptz,
       $21::timestamptz, $22::uuid, $23::varchar, $24::uuid
     ) AS consumed`,
    [
      receipt.receipt_id,
      receipt.format_version,
      receipt.trace_id,
      receipt.request_id,
      receipt.actor_reference,
      receipt.actor_credential_id,
      receipt.actor_identity_id,
      receipt.owner_id,
      receipt.namespace_id,
      receipt.provider_id,
      receipt.provider_scope_id,
      receipt.operation,
      receipt.policy_decision,
      receipt.release_binding,
      receipt.request_digest,
      receipt.result_digest,
      receipt.target_order_digest,
      receipt.response_byte_count,
      receipt.covered_result_count,
      receipt.issued_at,
      receipt.expires_at,
      receipt.origin_process_id,
      originProcessVerifier,
      receipt.audit_event_id
    ]
  );
  return result.rows[0]?.consumed === true;
}

async function expectRuntimeDenied(statement: string): Promise<void> {
  assert(runtimePool);
  let denied = false;
  try {
    await runtimePool.query(statement);
  } catch {
    denied = true;
  }
  assert.equal(denied, true, statement);
}

async function callMcp(
  name:
    | "propose_memory_candidate"
    | "search_trusted_memory"
    | "search_source_evidence"
    | "get_source_evidence",
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  assert(mcpClient);
  return (await mcpClient.callTool({
    name,
    arguments: args
  })) as Record<string, unknown>;
}

function mcpEnvironment(token: string): Record<string, string> {
  return {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    TMPDIR: tempDirectory,
    SOURCE_WIRE_API_URL: baseUrl,
    SOURCE_WIRE_MCP_TOKEN: token
  };
}

function operatorEnvironment(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    SOURCE_WIRE_MIGRATOR_DATABASE_URL: migratorUrl,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY: verifierKey,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID: "local_alpha1_story5"
  };
}

async function postJson(
  url: string,
  token: string | undefined,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
  timeoutMs = 3_000
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
  const text = await response.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    parsed = {};
  }
  if (!response.ok) errorOutputs.push(text);
  return { status: response.status, text, body: parsed };
}

function assertError(
  result: HttpResult,
  code: string,
  status: number
): void {
  assert.equal(result.status, status, result.text);
  assert.equal(
    (result.body.error as Record<string, unknown> | undefined)?.code,
    code
  );
  assert.equal(result.text.includes(PROTECTED_EXCERPT), false);
  assert.equal(result.text.includes(PROTECTED_LOCATOR), false);
  assert.equal(/postgres(?:ql)?:\/\//iu.test(result.text), false);
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

async function runProcess(
  executable: string,
  args: string[],
  environment: NodeJS.ProcessEnv,
  cwd = repoRoot,
  timeoutMs = 15_000
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

async function providerModuleDigest(module: string): Promise<string> {
  const modulePath = fileURLToPath(import.meta.resolve(module));
  return createHash("sha256")
    .update(await readFile(modulePath))
    .digest("hex");
}

async function waitForExit(
  child: ChildProcess,
  timeoutMs: number
): Promise<number> {
  if (child.exitCode !== null) return child.exitCode ?? 1;
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
      server.close(() => resolvePort(address.port));
    });
  });
}

function parseJsonLine(output: string): Record<string, unknown> {
  return JSON.parse(output.trim().split(/\r?\n/u).at(-1) ?? "{}") as Record<
    string,
    unknown
  >;
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
    if (created.tempDirectory && tempDirectory) {
      await rm(tempDirectory, { recursive: true, force: true });
      created.tempDirectory = false;
    }
    if (!adminPool) return true;
    if (created.database) {
      await adminPool.query(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1",
        [databaseName]
      );
      await executeFormatted(adminPool, "DROP DATABASE IF EXISTS %I", [
        databaseName
      ]);
      created.database = false;
    }
    if (created.migratorRole) {
      await adminPool.query(`DROP ROLE IF EXISTS ${roleNames.migrator}`);
      created.migratorRole = false;
    }
    if (created.runtimeRole) {
      await adminPool.query(`DROP ROLE IF EXISTS ${roleNames.runtime}`);
      created.runtimeRole = false;
    }
    if (created.schemaOwnerRole) {
      await adminPool.query(`DROP ROLE IF EXISTS ${roleNames.schemaOwner}`);
      created.schemaOwnerRole = false;
    }
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
      [databaseName, Object.values(roleNames)]
    );
    assert.deepEqual(residue.rows[0], {
      database_exists: false,
      role_exists: false,
      session_exists: false
    });
    assert.equal(
      [...generatedChildPids].some((pid) => processExists(pid)),
      false
    );
    return true;
  } catch (error) {
    cleanupFailure = error;
    return false;
  }
}

async function writeReport(): Promise<void> {
  const commit = await runProcess(
    "git",
    ["rev-parse", "HEAD"],
    process.env,
    repoRoot
  ).catch(() => ({ code: 1, stdout: "unavailable", stderr: "" }));
  const packageLockSha256 = createHash("sha256")
    .update(await readFile(resolve(repoRoot, "package-lock.json")))
    .digest("hex");
  const report = {
    schema: "source-wire.alpha1.story5-conformance.v1",
    revision: 1,
    status: failure || !cleanupPassed ? "failed" : "passed",
    sourceCommit: commit.stdout.trim(),
    environment: {
      node: process.version,
      postgresqlMajor: expectedPostgresMajor,
      postgresqlVersionNum: postgresqlVersionNum || undefined,
      dataClass: "generated_disposable_only",
      apiListener: "literal_loopback_only",
      mcpTransport: "stdio_only",
      packageLockSha256
    },
    cases,
    crashResults,
    cleanup: {
      passed: cleanupPassed,
      scope:
        "generated_database_roles_sessions_children_and_temp_directory_only"
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

function redactFailure(message: string): string {
  let redacted = message;
  for (const sensitive of sensitiveValues) {
    redacted = redacted.replaceAll(sensitive, "[redacted]");
  }
  redacted = redacted.replace(
    /postgres(?:ql)?:\/\/\S+/giu,
    "[database-locator-redacted]"
  );
  return redacted.slice(0, 500);
}
