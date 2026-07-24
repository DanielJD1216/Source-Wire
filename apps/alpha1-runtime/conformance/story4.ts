import assert from "node:assert/strict";
import { spawn, type ChildProcessByStdio } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile
} from "node:fs/promises";
import { createServer } from "node:net";
import { userInfo } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { Readable } from "node:stream";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import pg from "pg";

import {
  initializeFromPortableExport,
  type PortableRestoreStage
} from "../src/portable-recovery.js";
import {
  parsePortableBundle,
  type ParsedPortableBundle
} from "../src/portable-format.js";
import { validatePortableState } from "../src/portable-validation.js";
import { createOperatorPool } from "../src/database.js";
import { readAlpha1Migrations } from "../src/migration.js";
import { writeSensitiveStreamAtomically } from "../src/safe-local-file.js";

const { Pool } = pg;
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = resolve(appRoot, "../..");
const operatorCli = resolve(appRoot, "dist/src/cli/operator.js");
const ownerCli = resolve(appRoot, "dist/src/cli/owner.js");
const serverEntry = resolve(appRoot, "dist/src/server.js");
const lifecycleMutator = resolve(
  appRoot,
  "dist/conformance/story4-lifecycle-mutate.js"
);
const reportPath =
  process.env.SOURCE_WIRE_CONFORMANCE_REPORT ??
  resolve(appRoot, ".artifacts/story4-conformance-report.json");

const roleNames = {
  schemaOwner: "source_wire_schema_owner",
  migrator: "source_wire_migrator",
  runtime: "source_wire_runtime"
} as const;

type CaseResult = {
  id: string;
  status: "passed";
  observation: string;
};

type DatabaseTarget = {
  name: string;
  admin: pg.Pool;
  migratorUrl: string;
  runtimeUrl: string;
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
  headers: Headers;
  bytes: Buffer;
};

type CapturedChildProcess = ChildProcessByStdio<null, Readable, Readable>;

const cases: CaseResult[] = [];
const createdDatabases = new Set<string>();
const sensitiveValues = new Set<string>();
const capturedOutputs: string[] = [];
const apiLogs: string[] = [];
const activeServers = new Set<CapturedChildProcess>();
let adminPool: pg.Pool | undefined;
let tempDirectory = "";
let migratorPassword = "";
let runtimePassword = "";
let verifierKey = "";
const verifierKeyId = "local_story4_conformance";
let source: DatabaseTarget | undefined;
let portable: DatabaseTarget | undefined;
let physical: DatabaseTarget | undefined;
let ownerToken = "";
let ownerCredentialId = "";
let harnessToken = "";
let harnessCredentialId = "";
let sourceBaseUrl = "";
let activeMemoryId = "";
let activeRevisionId = "";
let exportBundle: Buffer | undefined;
let exportDigest = "";
let exportRecordCount = 0;
let failure: unknown;
let cleanupPassed = false;

try {
  await runConformance();
} catch (error) {
  failure = error;
} finally {
  await stopAllServers();
  cleanupPassed = await cleanup();
  if (cleanupPassed) {
    pass(
      "S4-CLEANUP-01",
      "all generated databases, static conformance roles, child processes, and local artifacts were removed"
    );
  }
  await writeReport();
  await adminPool?.end().catch(() => undefined);
}

if (failure || !cleanupPassed) {
  process.stderr.write(
    "Story 4 conformance failed. See the redacted machine report.\n"
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `ok Source-Wire Alpha 1 Story 4 conformance (${cases.length} cases)\n`
  );
}

async function runConformance(): Promise<void> {
  assert.equal(
    process.version,
    "v22.23.1",
    "conformance must run on Node.js 22.23.1"
  );
  adminPool = new Pool({
    host: process.env.PGHOST ?? "/tmp",
    port: Number(process.env.PGPORT ?? "5432"),
    user: process.env.PGUSER ?? userInfo().username,
    database: process.env.PGDATABASE ?? "postgres",
    password: process.env.PGPASSWORD,
    max: 2,
    application_name: "source_wire_story4_conformance_admin"
  });
  adminPool.on("error", () => undefined);
  const version = await adminPool.query<{ server_version_num: string }>(
    "SELECT current_setting('server_version_num') AS server_version_num"
  );
  assert.equal(
    Math.floor(Number(version.rows[0]?.server_version_num ?? "0") / 10_000),
    16
  );
  tempDirectory = await realpath(
    await mkdtemp(join(tmpdir(), "source-wire-story4-"))
  );
  await chmod(tempDirectory, 0o700);
  pass(
    "S4-ENV-01",
    "Node.js 22.23.1 and PostgreSQL 16 were observed with a private generated artifact directory"
  );

  await provisionRoles();
  await localFileFailureProbes();
  await migrationProbes();
  source = await provisionDatabase("source");
  await sourceWorkflow();
  await portableRestoreWorkflow();
  await physicalRecoveryWorkflow();
  await privilegeAndSecretProbes();
}

async function localFileFailureProbes(): Promise<void> {
  const destination = join(tempDirectory, "injected-export.ndjson");
  await assert.rejects(
    writeSensitiveStreamAtomically(
      destination,
      (async function* () {
        yield Buffer.from('{"kind":"header"}\n');
        throw new Error("injected_stream_failure");
      })(),
      1_024
    ),
    /injected_stream_failure/u
  );
  await assert.rejects(lstat(destination), { code: "ENOENT" });
  assert.deepEqual(
    (await readdir(tempDirectory)).filter((name) => name.endsWith(".tmp")),
    []
  );
  pass(
    "S4-FILE-01",
    "an injected export stream failure left no finalized destination or temporary artifact"
  );
}

async function provisionRoles(): Promise<void> {
  assert(adminPool);
  const collision = await adminPool.query<{ rolname: string }>(
    "SELECT rolname FROM pg_roles WHERE rolname = ANY($1::text[])",
    [Object.values(roleNames)]
  );
  assert.equal(collision.rowCount, 0, "static conformance role collision");
  migratorPassword = randomBytes(24).toString("base64url");
  runtimePassword = randomBytes(24).toString("base64url");
  verifierKey = randomBytes(32).toString("base64url");
  sensitiveValues.add(migratorPassword);
  sensitiveValues.add(runtimePassword);
  sensitiveValues.add(verifierKey);
  await adminPool.query(
    `CREATE ROLE ${roleNames.schemaOwner}
       NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE
       NOREPLICATION NOBYPASSRLS`
  );
  await executeFormatted(
    adminPool,
    `CREATE ROLE ${roleNames.migrator}
       LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE
       NOREPLICATION NOBYPASSRLS PASSWORD %L`,
    [migratorPassword]
  );
  await adminPool.query(
    `GRANT ${roleNames.schemaOwner} TO ${roleNames.migrator}`
  );
  await executeFormatted(
    adminPool,
    `CREATE ROLE ${roleNames.runtime}
       LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE
       NOREPLICATION NOBYPASSRLS PASSWORD %L`,
    [runtimePassword]
  );
}

async function migrationProbes(): Promise<void> {
  const forward = await provisionDatabase("forward");
  await installFirstThreeMigrations(forward);
  const migrate = await runProcess(
    operatorCli,
    ["migrate"],
    operatorEnvironment(forward)
  );
  assert.equal(migrate.code, 0, migrate.stderr);
  const versions = await forward.admin.query<{
    version: number;
    state: string;
  }>(
    `SELECT version, state
       FROM source_wire_memory.schema_migrations
      ORDER BY version`
  );
  assert.deepEqual(versions.rows, [
    { version: 1, state: "completed" },
    { version: 2, state: "completed" },
    { version: 3, state: "completed" },
    { version: 4, state: "completed" }
  ]);
  pass(
    "S4-MIG-01",
    "the delivered Story 3 schema advanced through forward-only migration 0004"
  );

  const rollback = await provisionDatabase("rollback");
  await installFirstThreeMigrations(rollback);
  const migrations = await readAlpha1Migrations();
  const story4 = migrations[3]!;
  const client = await rollback.admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SET LOCAL ROLE ${roleNames.schemaOwner}`);
    await client.query(story4.sql);
    throw new Error("injected_migration_failure");
  } catch {
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
  const rollbackState = await rollback.admin.query<{
    maximum_version: number;
    epoch_table: string | null;
  }>(
    `SELECT
       (SELECT max(version) FROM source_wire_memory.schema_migrations)
         AS maximum_version,
       to_regclass('source_wire_memory.authentication_epochs')::text
         AS epoch_table`
  );
  assert.deepEqual(rollbackState.rows[0], {
    maximum_version: 3,
    epoch_table: null
  });
  pass(
    "S4-MIG-02",
    "an injected failure rolled back the full Story 4 migration and left Story 3 intact"
  );
  await closeTarget(forward);
  await closeTarget(rollback);
}

async function sourceWorkflow(): Promise<void> {
  assert(source);
  assert.equal(
    (
      await runProcess(
        operatorCli,
        ["migrate"],
        operatorEnvironment(source)
      )
    ).code,
    0
  );
  const initialized = await runProcess(
    operatorCli,
    [
      "initialize",
      "--owner-id",
      "owner_story4",
      "--namespace-id",
      "ns_story4_alpha",
      "--namespace-id",
      "ns_story4_beta"
    ],
    operatorEnvironment(source)
  );
  assert.equal(initialized.code, 0, initialized.stderr);
  const initializedBody = parseJsonLine(initialized.stdout);
  const owner = initializedBody.ownerAdminCredential as Record<
    string,
    unknown
  >;
  ownerToken = String(owner.secret);
  ownerCredentialId = String(owner.credentialId);
  sensitiveValues.add(ownerToken);
  pass(
    "S4-INIT-01",
    "the source installation began with one owner-admin and two explicit namespaces"
  );

  const runtime = await startRuntime(source);
  sourceBaseUrl = runtime.baseUrl;
  const harness = await postJson(
    `${sourceBaseUrl}/v1alpha1/admin/harness-credentials`,
    ownerToken,
    {
      namespaceIds: ["ns_story4_alpha", "ns_story4_beta"],
      capabilities: [
        "memory_candidate.propose",
        "trusted_memory.search"
      ],
      expiresAt: new Date(Date.now() + 10 * 60 * 1_000).toISOString()
    },
    { "Idempotency-Key": `request_${randomUUID()}` }
  );
  assert.equal(harness.status, 201, harness.text);
  const harnessData = harness.body.data as Record<string, unknown>;
  harnessToken = String(harnessData.secret);
  harnessCredentialId = String(harnessData.credentialId);
  sensitiveValues.add(harnessToken);

  const main = await createApprovedMemory(
    "Original synthetic Story 4 memory.",
    "Synthetic source assertion."
  );
  const correctionInput = join(tempDirectory, "correction-input.json");
  await writeFile(
    correctionInput,
    JSON.stringify({
      content: "Corrected synthetic Story 4 memory.",
      reason: "Synthetic owner correction."
    }),
    { mode: 0o600 }
  );
  const correctionKey = `request_${randomUUID()}`;
  const correction = await runProcess(
    ownerCli,
    [
      "correct-memory",
      "--base-url",
      sourceBaseUrl,
      "--namespace-id",
      "ns_story4_alpha",
      "--memory-id",
      main.memoryId,
      "--expected-revision-id",
      main.revisionId,
      "--input-file",
      correctionInput,
      "--idempotency-key",
      correctionKey
    ],
    ownerEnvironment(ownerToken)
  );
  assert.equal(correction.code, 0, correction.stderr);
  const correctionBody = parseJsonLine(correction.stdout);
  const correctionData = correctionBody.data as Record<string, unknown>;
  const correctedRevisionId = String(correctionData.revisionId);
  assert.equal(correctionData.revisionNumber, 2);
  const replay = await runProcess(
    ownerCli,
    [
      "correct-memory",
      "--base-url",
      sourceBaseUrl,
      "--namespace-id",
      "ns_story4_alpha",
      "--memory-id",
      main.memoryId,
      "--expected-revision-id",
      main.revisionId,
      "--input-file",
      correctionInput,
      "--idempotency-key",
      correctionKey
    ],
    ownerEnvironment(ownerToken)
  );
  assert.equal(replay.code, 0);
  assert.equal(
    (parseJsonLine(replay.stdout).data as Record<string, unknown>).revisionId,
    correctedRevisionId
  );
  const changedInput = join(tempDirectory, "correction-changed.json");
  await writeFile(
    changedInput,
    JSON.stringify({
      content: "Changed replay must not commit.",
      reason: "Synthetic owner correction."
    }),
    { mode: 0o600 }
  );
  const changedReplay = await runProcess(
    ownerCli,
    [
      "correct-memory",
      "--base-url",
      sourceBaseUrl,
      "--namespace-id",
      "ns_story4_alpha",
      "--memory-id",
      main.memoryId,
      "--expected-revision-id",
      main.revisionId,
      "--input-file",
      changedInput,
      "--idempotency-key",
      correctionKey
    ],
    ownerEnvironment(ownerToken)
  );
  assert.equal(changedReplay.code, 1);
  assertApiError(parseJsonLine(changedReplay.stdout), "idempotency_conflict");
  const stale = await postJson(
    `${sourceBaseUrl}/v1alpha1/admin/trusted-memories/${main.memoryId}/corrections`,
    ownerToken,
    {
      namespaceId: "ns_story4_alpha",
      expectedRevisionId: main.revisionId,
      content: "Stale correction must not commit.",
      reason: "Synthetic stale correction.",
      idempotencyKey: `request_${randomUUID()}`
    }
  );
  assertError(stale, "revision_conflict");

  const history = await source.admin.query<{
    active_count: string;
    correction_lineage_count: string;
    owner_assertion_count: string;
    revision_count: string;
    superseded_count: string;
  }>(
    `SELECT
       (SELECT count(*) FROM source_wire_memory.trusted_memory_revisions
         WHERE memory_id = $1 AND status = 'active')::text AS active_count,
       (SELECT count(*) FROM source_wire_memory.trusted_memory_revisions
         WHERE memory_id = $1)::text AS revision_count,
       (SELECT count(*) FROM source_wire_memory.trusted_memory_revisions
         WHERE memory_id = $1 AND status = 'superseded')::text
         AS superseded_count,
       (SELECT count(*) FROM source_wire_memory.trusted_memory_provenance
         WHERE revision_id = $2
           AND provenance_kind = 'correction_lineage')::text
         AS correction_lineage_count,
       (SELECT count(*) FROM source_wire_memory.trusted_memory_provenance
         WHERE revision_id = $2
           AND provenance_kind = 'owner_assertion')::text
         AS owner_assertion_count`,
    [main.memoryId, correctedRevisionId]
  );
  assert.deepEqual(history.rows[0], {
    active_count: "1",
    correction_lineage_count: "1",
    owner_assertion_count: "2",
    revision_count: "2",
    superseded_count: "1"
  });
  pass(
    "S4-LIFE-01",
    "owner CLI correction was fix-forward, provenance-carrying, exactly replayable, and stale or changed replay safe"
  );

  await lifecycleRaceProbes();
  const stable = await createApprovedMemory(
    "Stable active memory survives portability.",
    "Synthetic stable source assertion."
  );
  activeMemoryId = stable.memoryId;
  activeRevisionId = stable.revisionId;

  const revocationInput = join(tempDirectory, "revocation-input.json");
  await writeFile(
    revocationInput,
    JSON.stringify({ reason: "Synthetic owner revocation." }),
    { mode: 0o600 }
  );
  const revocation = await runProcess(
    ownerCli,
    [
      "revoke-memory",
      "--base-url",
      sourceBaseUrl,
      "--namespace-id",
      "ns_story4_alpha",
      "--memory-id",
      main.memoryId,
      "--expected-revision-id",
      correctedRevisionId,
      "--input-file",
      revocationInput,
      "--idempotency-key",
      `request_${randomUUID()}`
    ],
    ownerEnvironment(ownerToken)
  );
  assert.equal(revocation.code, 0, revocation.stderr);
  const revokedSearch = await postJson(
    `${sourceBaseUrl}/v1alpha1/trusted-memories/search`,
    harnessToken,
    {
      namespaceId: "ns_story4_alpha",
      query: "Corrected synthetic Story 4 memory",
      limit: 10
    }
  );
  assert.equal(revokedSearch.status, 200, revokedSearch.text);
  assert.equal(
    JSON.stringify(revokedSearch.body).includes(main.memoryId),
    false
  );
  const revokedState = await source.admin.query<{
    active_revision_count: string;
    lifecycle_count: string;
    memory_state: string;
  }>(
    `SELECT
       memory.state AS memory_state,
       (SELECT count(*) FROM source_wire_memory.trusted_memory_revisions
         WHERE memory_id = memory.memory_id AND status = 'active')::text
         AS active_revision_count,
       (SELECT count(*) FROM source_wire_memory.trusted_memory_lifecycle_events
         WHERE memory_id = memory.memory_id
           AND event_type = 'revocation')::text AS lifecycle_count
     FROM source_wire_memory.trusted_memories AS memory
     WHERE memory.memory_id = $1`,
    [main.memoryId]
  );
  assert.deepEqual(revokedState.rows[0], {
    memory_state: "revoked",
    active_revision_count: "0",
    lifecycle_count: "1"
  });
  pass(
    "S4-LIFE-02",
    "owner CLI revocation preserved history, produced zero active revisions, and excluded the memory from protected search"
  );

  await stopServer(runtime.process);
  const resumedRuntime = await protectedReadLifecycleProbes();
  sourceBaseUrl = resumedRuntime.baseUrl;
  await exportProbes();
  await insertIssuedReceiptForPhysicalRecovery();
  await stopServer(resumedRuntime.process);
}

async function lifecycleRaceProbes(): Promise<void> {
  const correctionRace = await createApprovedMemory(
    "Correction race source.",
    "Synthetic correction race assertion."
  );
  const correctionRequests = await Promise.all([
    postJson(
      `${sourceBaseUrl}/v1alpha1/admin/trusted-memories/${correctionRace.memoryId}/corrections`,
      ownerToken,
      {
        namespaceId: "ns_story4_alpha",
        expectedRevisionId: correctionRace.revisionId,
        content: "Correction race winner alpha.",
        reason: "Synthetic race alpha.",
        idempotencyKey: `request_${randomUUID()}`
      }
    ),
    postJson(
      `${sourceBaseUrl}/v1alpha1/admin/trusted-memories/${correctionRace.memoryId}/corrections`,
      ownerToken,
      {
        namespaceId: "ns_story4_alpha",
        expectedRevisionId: correctionRace.revisionId,
        content: "Correction race winner beta.",
        reason: "Synthetic race beta.",
        idempotencyKey: `request_${randomUUID()}`
      }
    )
  ]);
  assert.deepEqual(
    correctionRequests.map((result) => result.status).sort(),
    [200, 409]
  );
  const correctionRevocationRace = await createApprovedMemory(
    "Correction revocation race source.",
    "Synthetic mixed race assertion."
  );
  const mixed = await Promise.all([
    postJson(
      `${sourceBaseUrl}/v1alpha1/admin/trusted-memories/${correctionRevocationRace.memoryId}/corrections`,
      ownerToken,
      {
        namespaceId: "ns_story4_alpha",
        expectedRevisionId: correctionRevocationRace.revisionId,
        content: "Mixed race corrected state.",
        reason: "Synthetic mixed correction.",
        idempotencyKey: `request_${randomUUID()}`
      }
    ),
    postJson(
      `${sourceBaseUrl}/v1alpha1/admin/trusted-memories/${correctionRevocationRace.memoryId}/revocations`,
      ownerToken,
      {
        namespaceId: "ns_story4_alpha",
        expectedRevisionId: correctionRevocationRace.revisionId,
        reason: "Synthetic mixed revocation.",
        idempotencyKey: `request_${randomUUID()}`
      }
    )
  ]);
  assert.deepEqual(
    mixed.map((result) => result.status).sort(),
    [200, 409]
  );
  pass(
    "S4-RACE-01",
    "correction-correction and correction-revocation races each committed exactly one winner"
  );
}

async function protectedReadLifecycleProbes(): Promise<{
  process: CapturedChildProcess;
  baseUrl: string;
}> {
  assert(source);
  const probes: Array<{
    stage:
      | "before_receipt_and_audit_commit"
      | "before_receipt_consumption"
      | "after_receipt_consumption"
      | "before_response_write";
    mutation: "correction" | "revocation";
    expectedStatus: 200 | 503;
    marker: string;
  }> = [
    {
      stage: "before_receipt_and_audit_commit",
      mutation: "correction",
      expectedStatus: 503,
      marker: "before issue correction"
    },
    {
      stage: "before_receipt_consumption",
      mutation: "correction",
      expectedStatus: 503,
      marker: "before consumption correction"
    },
    {
      stage: "before_receipt_consumption",
      mutation: "revocation",
      expectedStatus: 503,
      marker: "before consumption revocation"
    },
    {
      stage: "after_receipt_consumption",
      mutation: "correction",
      expectedStatus: 200,
      marker: "after consumption correction"
    },
    {
      stage: "before_response_write",
      mutation: "revocation",
      expectedStatus: 200,
      marker: "before response write revocation"
    }
  ];

  for (const [index, probe] of probes.entries()) {
    const runtime = await startRuntime(source, probe.stage);
    sourceBaseUrl = runtime.baseUrl;
    const content = `Protected lifecycle ${probe.marker} marker ${index}.`;
    const memory = await createApprovedMemory(
      content,
      `Synthetic ${probe.marker} assertion.`
    );
    const searchPromise = postJson(
      `${sourceBaseUrl}/v1alpha1/trusted-memories/search`,
      harnessToken,
      {
        namespaceId: "ns_story4_alpha",
        query: `Protected lifecycle ${probe.marker} marker`,
        limit: 10
      }
    );
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    const mutation = await runProcess(
      lifecycleMutator,
      [],
      {
        ...runtimeEnvironment(source, 0),
        SOURCE_WIRE_CONFORMANCE_MODE: "story4",
        SOURCE_WIRE_OWNER_TOKEN: ownerToken,
        SOURCE_WIRE_STORY4_MUTATION: probe.mutation,
        SOURCE_WIRE_STORY4_MEMORY_ID: memory.memoryId,
        SOURCE_WIRE_STORY4_EXPECTED_REVISION_ID: memory.revisionId,
        SOURCE_WIRE_STORY4_NAMESPACE_ID: "ns_story4_alpha"
      },
      10_000
    );
    assert.equal(mutation.code, 0, mutation.stderr);
    const search = await searchPromise;
    assert.equal(search.status, probe.expectedStatus, search.text);
    if (probe.expectedStatus === 503) {
      assert.equal(search.text.includes(content), false);
      const expectedCode =
        probe.stage === "before_receipt_and_audit_commit"
          ? "operation_unavailable"
          : "release_binding_invalid";
      assertError(search, expectedCode);
    } else {
      assert.equal(search.text.includes(content), true);
    }
    const receiptResult: pg.QueryResult<{
      consumption_state: string;
      release_status: string;
    }> = await source.admin.query(
      `SELECT receipt.consumption_state, receipt.release_status
         FROM source_wire_memory.protected_read_receipts AS receipt
         JOIN source_wire_memory.protected_read_receipt_targets AS target
           ON target.receipt_id = receipt.receipt_id
        WHERE target.memory_id = $1
        ORDER BY receipt.issued_at DESC
        LIMIT 1`,
      [memory.memoryId]
    );
    if (probe.stage === "before_receipt_and_audit_commit") {
      assert.equal(receiptResult.rowCount, 0);
    } else if (probe.expectedStatus === 503) {
      assert.deepEqual(receiptResult.rows[0], {
        consumption_state: "issued",
        release_status: "release_authorized"
      });
    } else {
      assert.deepEqual(receiptResult.rows[0], {
        consumption_state: "consumed",
        release_status: "release_attempted"
      });
    }
    await stopServer(runtime.process);
  }
  pass(
    "S4-READ-RACE-01",
    "lifecycle commits before receipt issue or consumption released zero protected content"
  );
  pass(
    "S4-READ-RACE-02",
    "consumption winners recorded release attempted before later correction or revocation and performed only the bound write attempt"
  );
  return startRuntime(source);
}

async function exportProbes(): Promise<void> {
  const first = await postJson(
    `${sourceBaseUrl}/v1alpha1/admin/exports`,
    ownerToken,
    { namespaceIds: ["ns_story4_alpha", "ns_story4_beta"] }
  );
  const second = await postJson(
    `${sourceBaseUrl}/v1alpha1/admin/exports`,
    ownerToken,
    { namespaceIds: ["ns_story4_alpha", "ns_story4_beta"] }
  );
  assert.equal(first.status, 200, first.text);
  assert.equal(second.status, 200, second.text);
  const firstDigest = first.headers.get(
    "x-source-wire-logical-state-sha256"
  );
  const secondDigest = second.headers.get(
    "x-source-wire-logical-state-sha256"
  );
  assert(firstDigest);
  assert.equal(firstDigest, secondDigest);
  assert.notDeepEqual(first.bytes, second.bytes);
  const parsed = parsePortableBundle(first.bytes, firstDigest);
  validatePortableState(parsed);
  const forbidden = JSON.stringify(parsed.sections);
  for (const marker of [
    ownerToken,
    harnessToken,
    verifierKey,
    "displayPrefix",
    "credentialId",
    "protectedReadReceipt",
    "idempotencyKey"
  ]) {
    assert.equal(forbidden.includes(marker), false);
  }
  exportBundle = first.bytes;
  exportDigest = firstDigest;
  exportRecordCount = Number(
    first.headers.get("x-source-wire-governed-record-count")
  );
  assert.equal(exportRecordCount, parsed.governedRecordCount);
  const exportPath = join(tempDirectory, "source-wire-portable.ndjson");
  const ownerExport = await runProcess(
    ownerCli,
    [
      "export",
      "--base-url",
      sourceBaseUrl,
      "--namespace-id",
      "ns_story4_alpha",
      "--namespace-id",
      "ns_story4_beta",
      "--destination",
      exportPath
    ],
    ownerEnvironment(ownerToken)
  );
  assert.equal(ownerExport.code, 0, ownerExport.stderr);
  assert.equal(ownerExport.stdout.includes(ownerToken), false);
  assert.equal(
    parseJsonLine(ownerExport.stdout).logicalStateSha256,
    exportDigest
  );
  assert.equal(
    parsePortableBundle(await readFile(exportPath), exportDigest)
      .logicalStateSha256,
    exportDigest
  );
  pass(
    "S4-EXPORT-01",
    "equivalent snapshots produced one deterministic logical digest and a canonical secret-free bounded bundle"
  );
  pass(
    "S4-EXPORT-02",
    "owner CLI finalized the bundle atomically without writing the body or credential to stdout"
  );
}

async function portableRestoreWorkflow(): Promise<void> {
  assert(exportBundle);
  portable = await provisionDatabase("portable");
  const migrated = await runProcess(
    operatorCli,
    ["migrate"],
    operatorEnvironment(portable)
  );
  assert.equal(migrated.code, 0, migrated.stderr);
  const operatorPool = createOperatorPool(portable.migratorUrl, 120_000);
  const failureStages: PortableRestoreStage[] = [
    "before_manifest_verification",
    "after_manifest_verification",
    "after_governed_inserts",
    "before_credential_issue",
    "before_audit",
    "before_commit"
  ];
  try {
    for (const stage of failureStages) {
      await assert.rejects(
        initializeFromPortableExport(operatorPool, {
          bytes: exportBundle,
          expectedLogicalStateSha256: exportDigest,
          operationKey: `failure_${stage}`,
          verifierKey: Buffer.from(verifierKey, "base64url"),
          verifierKeyId,
          onStage: (current) => {
            if (current === stage) throw new Error("injected_restore_failure");
          }
        }),
        /injected_restore_failure/u
      );
      await assertPortableTargetEmpty(portable.admin);
    }
    const malformed = Buffer.from(exportBundle);
    malformed[Math.max(0, malformed.length - 10)] = 0;
    await assert.rejects(
      initializeFromPortableExport(operatorPool, {
        bytes: malformed,
        expectedLogicalStateSha256: exportDigest,
        operationKey: "failure_during_parse",
        verifierKey: Buffer.from(verifierKey, "base64url"),
        verifierKeyId
      }),
      /portable_bundle_invalid/u
    );
    await assertPortableTargetEmpty(portable.admin);
  } finally {
    await operatorPool.end();
  }
  pass(
    "S4-RESTORE-01",
    "parse, insert, credential, audit, and pre-commit failures each rolled back to the exact empty migrated target"
  );

  const bundlePath = join(tempDirectory, "portable-restore.ndjson");
  const secretPath = join(tempDirectory, "portable-owner.secret");
  await writeFile(bundlePath, exportBundle, { mode: 0o600 });
  const restore = await runProcess(
    operatorCli,
    [
      "initialize",
      "--from-export",
      bundlePath,
      "--expected-logical-state-sha256",
      exportDigest,
      "--operation-key",
      "portable_restore_primary",
      "--secret-output",
      secretPath
    ],
    operatorEnvironment(portable),
    130_000
  );
  assert.equal(restore.code, 0, restore.stderr);
  const restored = parseJsonLine(restore.stdout);
  assert.equal(restored.logicalStateSha256, exportDigest);
  assert.equal(restored.governedRecordCount, exportRecordCount);
  assert.equal(restored.verificationRequired, true);
  const restoredOwnerToken = (await readFile(secretPath, "utf8")).trimEnd();
  sensitiveValues.add(restoredOwnerToken);
  assert.equal(restore.stdout.includes(restoredOwnerToken), false);
  const restoredCredentialId = String(
    (
      restored.ownerAdminCredential as Record<string, unknown>
    ).credentialId
  );
  const startupBeforeVerification = await runProcess(
    serverEntry,
    [],
    runtimeEnvironment(portable, 0),
    5_000
  );
  assert.equal(startupBeforeVerification.code, 1);

  const replay = await runProcess(
    operatorCli,
    [
      "initialize",
      "--from-export",
      bundlePath,
      "--expected-logical-state-sha256",
      exportDigest,
      "--operation-key",
      "portable_restore_primary",
      "--secret-output",
      secretPath
    ],
    operatorEnvironment(portable),
    130_000
  );
  assert.equal(replay.code, 0, replay.stderr);
  assert.equal(parseJsonLine(replay.stdout).replayed, true);
  assert.equal(
    (
      parseJsonLine(replay.stdout)
        .ownerAdminCredential as Record<string, unknown>
    ).credentialId,
    restoredCredentialId
  );
  const changed = await runProcess(
    operatorCli,
    [
      "initialize",
      "--from-export",
      bundlePath,
      "--expected-logical-state-sha256",
      "0".repeat(64),
      "--operation-key",
      "portable_restore_primary",
      "--secret-output",
      secretPath
    ],
    operatorEnvironment(portable),
    130_000
  );
  assert.equal(changed.code, 1);
  assertApiError(parseJsonLine(changed.stdout), "idempotency_conflict");
  const secondRestore = await runProcess(
    operatorCli,
    [
      "initialize",
      "--from-export",
      bundlePath,
      "--expected-logical-state-sha256",
      exportDigest,
      "--operation-key",
      "portable_restore_second",
      "--secret-output",
      secretPath
    ],
    operatorEnvironment(portable),
    130_000
  );
  assert.equal(secondRestore.code, 1);
  assertApiError(parseJsonLine(secondRestore.stdout), "state_conflict");
  pass(
    "S4-RESTORE-02",
    "portable initialization preserved identifiers, issued one exact-replay owner credential, blocked changed input, and denied a second initialization"
  );

  const verify = await runProcess(
    operatorCli,
    [
      "verify-recovery",
      "--credential-file",
      secretPath,
      "--expected-logical-state-sha256",
      exportDigest
    ],
    operatorEnvironment(portable),
    130_000
  );
  assert.equal(verify.code, 0, verify.stderr);
  assert.equal(parseJsonLine(verify.stdout).status, "ready");
  const runtime = await startRuntime(portable);
  const newOwnerToken = restoredOwnerToken;
  const health = await postJson(
    `${runtime.baseUrl}/v1alpha1/health`,
    newOwnerToken,
    { namespaceId: "ns_story4_alpha" }
  );
  assert.equal(health.status, 200, health.text);
  const restoredCounts = await portable.admin.query<{
    active_owner_count: string;
    credential_count: string;
    harness_count: string;
    imported_candidate_count: string;
    imported_lifecycle_count: string;
    restore_receipt_count: string;
  }>(
    `SELECT
       (SELECT count(*) FROM source_wire_memory.credentials)::text
         AS credential_count,
       (SELECT count(*) FROM source_wire_memory.credentials
         WHERE status = 'active' AND credential_class = 'owner_admin')::text
         AS active_owner_count,
       (SELECT count(*) FROM source_wire_memory.credentials
         WHERE credential_class = 'harness')::text AS harness_count,
       (SELECT count(*) FROM source_wire_memory.memory_candidates)::text
         AS imported_candidate_count,
       (SELECT count(*) FROM source_wire_memory.trusted_memory_lifecycle_events)::text
         AS imported_lifecycle_count,
       (SELECT count(*) FROM source_wire_memory.restore_receipts)::text
         AS restore_receipt_count`
  );
  assert.equal(restoredCounts.rows[0]?.credential_count, "1");
  assert.equal(restoredCounts.rows[0]?.active_owner_count, "1");
  assert.equal(restoredCounts.rows[0]?.harness_count, "0");
  assert.notEqual(restoredCounts.rows[0]?.imported_candidate_count, "0");
  assert.notEqual(restoredCounts.rows[0]?.imported_lifecycle_count, "0");
  assert.equal(restoredCounts.rows[0]?.restore_receipt_count, "1");
  pass(
    "S4-VERIFY-01",
    "runtime stayed disabled until a separate process authenticated the fresh owner and verified restored invariants"
  );
  await stopServer(runtime.process);
}

async function physicalRecoveryWorkflow(): Promise<void> {
  assert(adminPool);
  assert(source);
  await source.admin.end();
  const physicalName = databaseName("physical");
  await executeFormatted(
    adminPool,
    "CREATE DATABASE %I WITH TEMPLATE %I",
    [physicalName, source.name]
  );
  createdDatabases.add(physicalName);
  await executeFormatted(
    adminPool,
    "GRANT CONNECT ON DATABASE %I TO source_wire_migrator, source_wire_runtime",
    [physicalName]
  );
  physical = targetFromName(physicalName);
  physical.admin = createTargetAdminPool(physicalName);
  const issuedReceiptsBeforeRecovery = await physical.admin.query<{
    count: string;
  }>(
    `SELECT count(*)::text AS count
       FROM source_wire_memory.protected_read_receipts
      WHERE consumption_state = 'issued'`
  );
  const previousEpoch = await physical.admin.query<{
    current_authentication_epoch_id: string;
  }>(
    `SELECT current_authentication_epoch_id
       FROM source_wire_memory.installation_state
      WHERE singleton = true`
  );
  const secretPath = join(tempDirectory, "physical-owner.secret");
  const liveRuntime = await startRuntime(physical);
  const overlappingRecovery = await runProcess(
    operatorCli,
    [
      "recover",
      "--operation-key",
      "physical_recovery_overlap",
      "--secret-output",
      secretPath
    ],
    operatorEnvironment(physical),
    10_000
  );
  assert.equal(overlappingRecovery.code, 1);
  assertApiError(
    parseJsonLine(overlappingRecovery.stdout),
    "operation_unavailable"
  );
  const unchangedAfterOverlap = await physical.admin.query<{
    current_authentication_epoch_id: string;
    restore_receipt_count: string;
  }>(
    `SELECT
       current_authentication_epoch_id,
       (
         SELECT count(*)::text
         FROM source_wire_memory.restore_receipts
       ) AS restore_receipt_count
       FROM source_wire_memory.installation_state
      WHERE singleton = true`
  );
  assert.equal(
    unchangedAfterOverlap.rows[0]?.current_authentication_epoch_id,
    previousEpoch.rows[0]?.current_authentication_epoch_id
  );
  assert.equal(unchangedAfterOverlap.rows[0]?.restore_receipt_count, "0");
  await stopServer(liveRuntime.process);
  pass(
    "S4-RECOVERY-GATE-01",
    "a live runtime held the shared recovery guard, so overlapping physical recovery failed without changing state"
  );
  const recover = await runProcess(
    operatorCli,
    [
      "recover",
      "--operation-key",
      "physical_recovery_primary",
      "--secret-output",
      secretPath
    ],
    operatorEnvironment(physical),
    130_000
  );
  assert.equal(recover.code, 0, recover.stderr);
  const recoveredOwnerToken = (await readFile(secretPath, "utf8")).trimEnd();
  sensitiveValues.add(recoveredOwnerToken);
  assert.equal(recover.stdout.includes(recoveredOwnerToken), false);
  const beforeVerification = await runProcess(
    serverEntry,
    [],
    runtimeEnvironment(physical, 0),
    5_000
  );
  assert.equal(beforeVerification.code, 1);
  const recoveryState = await physical.admin.query<{
    active_harness_count: string;
    current_authentication_epoch_id: string;
    invalidated_receipt_count: string;
    old_active_count: string;
  }>(
    `SELECT
       installation.current_authentication_epoch_id,
       (SELECT count(*) FROM source_wire_memory.credentials
         WHERE credential_id IN ($1::uuid, $2::uuid)
           AND status = 'active')::text AS old_active_count,
       (SELECT count(*) FROM source_wire_memory.credentials
         WHERE credential_class = 'harness' AND status = 'active')::text
         AS active_harness_count,
       (SELECT count(*) FROM source_wire_memory.protected_read_receipts
         WHERE consumption_state = 'invalidated'
           AND release_status = 'recovery_invalidated')::text
         AS invalidated_receipt_count
     FROM source_wire_memory.installation_state AS installation
     WHERE installation.singleton = true`,
    [ownerCredentialId, harnessCredentialId]
  );
  assert.notEqual(
    recoveryState.rows[0]?.current_authentication_epoch_id,
    previousEpoch.rows[0]?.current_authentication_epoch_id
  );
  assert.equal(recoveryState.rows[0]?.old_active_count, "0");
  assert.equal(recoveryState.rows[0]?.active_harness_count, "0");
  assert.equal(
    recoveryState.rows[0]?.invalidated_receipt_count,
    issuedReceiptsBeforeRecovery.rows[0]?.count
  );
  pass(
    "S4-RECOVERY-01",
    "isolated physical recovery changed the authentication epoch, revoked old credentials, and invalidated the issued receipt"
  );

  const verify = await runProcess(
    operatorCli,
    ["verify-recovery", "--credential-file", secretPath],
    operatorEnvironment(physical),
    130_000
  );
  assert.equal(verify.code, 0, verify.stderr);
  const runtime = await startRuntime(physical);
  const oldOwner = await postJson(
    `${runtime.baseUrl}/v1alpha1/health`,
    ownerToken,
    { namespaceId: "ns_story4_alpha" }
  );
  assertError(oldOwner, "credential_revoked");
  const newOwnerToken = recoveredOwnerToken;
  const newOwner = await postJson(
    `${runtime.baseUrl}/v1alpha1/health`,
    newOwnerToken,
    { namespaceId: "ns_story4_alpha" }
  );
  assert.equal(newOwner.status, 200, newOwner.text);
  pass(
    "S4-RECOVERY-02",
    "a separate verifier enabled runtime only for the new owner credential; the old owner token remained unusable"
  );
  await stopServer(runtime.process);
}

async function privilegeAndSecretProbes(): Promise<void> {
  assert(physical);
  const privileges = await physical.admin.query<{
    actor_update: boolean;
    epoch_update: boolean;
    provenance_delete: boolean;
    receipt_target_update: boolean;
    restore_insert: boolean;
    revision_delete: boolean;
  }>(
    `SELECT
       has_table_privilege(
         'source_wire_runtime',
         'source_wire_memory.actor_identities',
         'UPDATE'
       ) AS actor_update,
       has_table_privilege(
         'source_wire_runtime',
         'source_wire_memory.authentication_epochs',
         'UPDATE'
       ) AS epoch_update,
       has_table_privilege(
         'source_wire_runtime',
         'source_wire_memory.trusted_memory_provenance',
         'DELETE'
       ) AS provenance_delete,
       has_table_privilege(
         'source_wire_runtime',
         'source_wire_memory.protected_read_receipt_targets',
         'UPDATE'
       ) AS receipt_target_update,
       has_table_privilege(
         'source_wire_runtime',
         'source_wire_memory.restore_receipts',
         'INSERT'
       ) AS restore_insert,
       has_table_privilege(
         'source_wire_runtime',
         'source_wire_memory.trusted_memory_revisions',
         'DELETE'
       ) AS revision_delete`
  );
  assert.deepEqual(privileges.rows[0], {
    actor_update: false,
    epoch_update: false,
    provenance_delete: false,
    receipt_target_update: false,
    restore_insert: false,
    revision_delete: false
  });
  pass(
    "S4-PRIV-01",
    "runtime had no direct history deletion, actor mutation, epoch mutation, receipt-target mutation, or restore authority"
  );
  const scan = [
    ...capturedOutputs,
    ...apiLogs,
    JSON.stringify(cases)
  ].join("\n");
  let secretIndex = 0;
  for (const secret of sensitiveValues) {
    assert.equal(
      secret.length > 0 && scan.includes(secret),
      false,
      `forbidden_secret_marker_${secretIndex}`
    );
    secretIndex += 1;
  }
  assert.equal(
    scan.includes("postgresql://"),
    false,
    "database_locator_marker"
  );
  assert.equal(
    scan.includes(tempDirectory),
    false,
    "private_path_marker"
  );
  pass(
    "S4-SECRET-01",
    "redacted outputs, logs, and proof observations contained no token, verifier key, database locator, or private artifact path"
  );
}

async function createApprovedMemory(
  content: string,
  assertion: string
): Promise<{ candidateId: string; memoryId: string; revisionId: string }> {
  const proposal = await postJson(
    `${sourceBaseUrl}/v1alpha1/memory-candidates`,
    harnessToken,
    {
      namespaceId: "ns_story4_alpha",
      content,
      provenance: {
        kind: "owner_assertion",
        assertion
      },
      idempotencyKey: `proposal_${randomUUID()}`
    }
  );
  assert.equal(proposal.status, 201, proposal.text);
  const candidateId = String(
    (proposal.body.data as Record<string, unknown>).candidateId
  );
  const decision = await postJson(
    `${sourceBaseUrl}/v1alpha1/admin/memory-candidates/${candidateId}/decision`,
    ownerToken,
    {
      namespaceId: "ns_story4_alpha",
      decision: "approve",
      expectedState: "pending",
      reason: "Approved for synthetic Story 4 conformance.",
      idempotencyKey: `decision_${randomUUID()}`
    }
  );
  assert.equal(decision.status, 200, decision.text);
  const data = decision.body.data as Record<string, unknown>;
  return {
    candidateId,
    memoryId: String(data.memoryId),
    revisionId: String(data.revisionId)
  };
}

async function insertIssuedReceiptForPhysicalRecovery(): Promise<void> {
  assert(source);
  const credential = await source.admin.query<{
    actor_identity_id: string;
    authentication_epoch_id: string;
  }>(
    `SELECT actor_identity_id, authentication_epoch_id
       FROM source_wire_memory.credentials
      WHERE credential_id = $1`,
    [harnessCredentialId]
  );
  const actor = credential.rows[0];
  assert(actor);
  const receiptId = randomUUID();
  const auditEventId = randomUUID();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 5_000);
  const targetDigest = "a".repeat(64);
  await source.admin.query("BEGIN");
  try {
    await source.admin.query(
      `INSERT INTO source_wire_memory.audit_events (
         event_id,
         occurred_at,
         trace_id,
         operation,
         result,
         actor_credential_id,
         actor_identity_id,
         actor_reference,
         owner_id,
         namespace_id,
         metadata
       ) VALUES (
         $1, $2, $3, 'search_trusted_memory', 'allowed', $4, $5,
         $6, 'owner_story4', 'ns_story4_alpha', '{}'::jsonb
       )`,
      [
        auditEventId,
        issuedAt,
        randomUUID(),
        harnessCredentialId,
        actor.actor_identity_id,
        `credential:${harnessCredentialId}`
      ]
    );
    await source.admin.query(
      `INSERT INTO source_wire_memory.protected_read_receipts (
         receipt_id,
         format_version,
         trace_id,
         request_id,
         actor_reference,
         actor_credential_id,
         authentication_epoch_id,
         owner_id,
         namespace_id,
         operation,
         policy_decision,
         release_binding,
         request_digest,
         result_digest,
         target_order_digest,
         response_byte_count,
         covered_result_count,
         issued_at,
         expires_at,
         origin_process_verifier,
         audit_event_id
       ) VALUES (
         $1, 1, $2, $3, $4, $5, $6, 'owner_story4',
         'ns_story4_alpha', 'search_trusted_memory', 'allowed', $7,
         $8, $9, $10, 128, 1, $11, $12, $13, $14
       )`,
      [
        receiptId,
        randomUUID(),
        randomUUID(),
        `credential:${harnessCredentialId}`,
        harnessCredentialId,
        actor.authentication_epoch_id,
        randomBytes(32).toString("base64url"),
        "b".repeat(64),
        "c".repeat(64),
        targetDigest,
        issuedAt,
        expiresAt,
        "d".repeat(64),
        auditEventId
      ]
    );
    await source.admin.query(
      `INSERT INTO source_wire_memory.protected_read_receipt_targets (
         receipt_id,
         target_ordinal,
         memory_id,
         revision_id,
         target_order_digest
       ) VALUES ($1, 1, $2, $3, $4)`,
      [receiptId, activeMemoryId, activeRevisionId, targetDigest]
    );
    await source.admin.query("COMMIT");
  } catch (error) {
    await source.admin.query("ROLLBACK");
    throw error;
  }
}

async function installFirstThreeMigrations(
  target: DatabaseTarget
): Promise<void> {
  const migrations = (await readAlpha1Migrations()).slice(0, 3);
  const pool = createOperatorPool(target.migratorUrl, 120_000);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`SET LOCAL ROLE ${roleNames.schemaOwner}`);
    for (const migration of migrations) {
      await client.query(migration.sql);
      await client.query(
        `INSERT INTO source_wire_memory.schema_migrations (
           version, migration_name, checksum_sha256, state
         ) VALUES ($1, $2, $3, 'completed')`,
        [migration.version, migration.name, migration.checksumSha256]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function provisionDatabase(label: string): Promise<DatabaseTarget> {
  assert(adminPool);
  const name = databaseName(label);
  await executeFormatted(adminPool, "CREATE DATABASE %I", [name]);
  createdDatabases.add(name);
  await executeFormatted(
    adminPool,
    "REVOKE CONNECT ON DATABASE %I FROM PUBLIC",
    [name]
  );
  await executeFormatted(
    adminPool,
    "GRANT CONNECT ON DATABASE %I TO source_wire_migrator, source_wire_runtime",
    [name]
  );
  await executeFormatted(
    adminPool,
    "GRANT CREATE ON DATABASE %I TO source_wire_schema_owner",
    [name]
  );
  const target = targetFromName(name);
  target.admin = createTargetAdminPool(name);
  await target.admin.query("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
  return target;
}

function targetFromName(name: string): DatabaseTarget {
  const port = Number(process.env.PGPORT ?? "5432");
  return {
    name,
    admin: undefined as unknown as pg.Pool,
    migratorUrl: `postgresql://${roleNames.migrator}:${encodeURIComponent(
      migratorPassword
    )}@127.0.0.1:${port}/${name}`,
    runtimeUrl: `postgresql://${roleNames.runtime}:${encodeURIComponent(
      runtimePassword
    )}@127.0.0.1:${port}/${name}`
  };
}

function createTargetAdminPool(name: string): pg.Pool {
  const pool = new Pool({
    host: process.env.PGHOST ?? "/tmp",
    port: Number(process.env.PGPORT ?? "5432"),
    user: process.env.PGUSER ?? userInfo().username,
    database: name,
    password: process.env.PGPASSWORD,
    max: 2,
    application_name: "source_wire_story4_target_admin"
  });
  pool.on("error", () => undefined);
  return pool;
}

async function closeTarget(target: DatabaseTarget): Promise<void> {
  await target.admin.end().catch(() => undefined);
}

async function assertPortableTargetEmpty(pool: pg.Pool): Promise<void> {
  const result = await pool.query<Record<string, string>>(
    `SELECT
       (SELECT count(*) FROM source_wire_memory.owners)::text AS owners,
       (SELECT count(*) FROM source_wire_memory.credentials)::text AS credentials,
       (SELECT count(*) FROM source_wire_memory.memory_candidates)::text AS candidates,
       (SELECT count(*) FROM source_wire_memory.audit_events)::text AS audits,
       (SELECT count(*) FROM source_wire_memory.restore_receipts)::text AS receipts,
       (SELECT count(*) FROM source_wire_memory.operator_initialization_records)::text AS initialization_records`
  );
  assert.equal(
    Object.values(result.rows[0] ?? {}).every((value) => value === "0"),
    true
  );
}

async function startRuntime(
  target: DatabaseTarget,
  pauseStage?: string
): Promise<{ process: CapturedChildProcess; baseUrl: string }> {
  const port = await findAvailablePort();
  const child = spawn(process.execPath, [serverEntry], {
    cwd: repoRoot,
    env: {
      ...runtimeEnvironment(target, port),
      ...(pauseStage
        ? {
            SOURCE_WIRE_CONFORMANCE_MODE: "story4",
            SOURCE_WIRE_STORY4_PAUSE_STAGE: pauseStage,
            SOURCE_WIRE_STORY4_PAUSE_DURATION_MS: "1200"
          }
        : {})
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => apiLogs.push(chunk));
  child.stderr.on("data", (chunk: string) => apiLogs.push(chunk));
  activeServers.add(child);
  const baseUrl = `http://127.0.0.1:${port}`;
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
  return { process: child, baseUrl };
}

async function stopServer(process: CapturedChildProcess): Promise<void> {
  if (!activeServers.has(process)) return;
  activeServers.delete(process);
  if (process.exitCode === null) {
    process.kill("SIGTERM");
    await new Promise<void>((resolveExit) => {
      const timeout = setTimeout(() => {
        process.kill("SIGKILL");
        resolveExit();
      }, 3_000);
      process.once("exit", () => {
        clearTimeout(timeout);
        resolveExit();
      });
    });
  }
}

async function stopAllServers(): Promise<void> {
  await Promise.all([...activeServers].map((process) => stopServer(process)));
}

function operatorEnvironment(target: DatabaseTarget): NodeJS.ProcessEnv {
  return {
    ...process.env,
    SOURCE_WIRE_MIGRATOR_DATABASE_URL: target.migratorUrl,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY: verifierKey,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID: verifierKeyId
  };
}

function ownerEnvironment(token: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    SOURCE_WIRE_OWNER_TOKEN: token
  };
}

function runtimeEnvironment(
  target: DatabaseTarget,
  port: number
): NodeJS.ProcessEnv {
  return {
    ...process.env,
    SOURCE_WIRE_DATABASE_URL: target.runtimeUrl,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY: verifierKey,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID: verifierKeyId,
    SOURCE_WIRE_HOST: "127.0.0.1",
    SOURCE_WIRE_PORT: String(port)
  };
}

async function postJson(
  url: string,
  token: string | undefined,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {}
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
    signal: AbortSignal.timeout(10_000)
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  const text = bytes.toString("utf8");
  let parsed: Record<string, unknown> = {};
  if (
    response.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    parsed = JSON.parse(text) as Record<string, unknown>;
  }
  return {
    status: response.status,
    text,
    body: parsed,
    headers: response.headers,
    bytes
  };
}

function assertError(result: HttpResult, code: string): void {
  assert.equal(result.status >= 400, true, result.text);
  assertApiError(result.body, code);
}

function assertApiError(
  body: Record<string, unknown>,
  code: string
): void {
  const error = body.error as Record<string, unknown> | undefined;
  assert.equal(error?.code, code);
}

async function runProcess(
  entry: string,
  args: string[],
  environment: NodeJS.ProcessEnv,
  timeoutMs = 30_000
): Promise<ProcessResult> {
  const child = spawn(process.execPath, [entry, ...args], {
    cwd: repoRoot,
    env: environment,
    stdio: ["ignore", "pipe", "pipe"]
  });
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
  const code = await new Promise<number>((resolveCode, reject) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("process_timeout"));
    }, timeoutMs);
    child.once("error", reject);
    child.once("exit", (exitCode) => {
      clearTimeout(timeout);
      resolveCode(exitCode ?? 1);
    });
  });
  const authorizedInitialSecretResponse =
    entry === operatorCli &&
    args[0] === "initialize" &&
    args.includes("--owner-id");
  if (!authorizedInitialSecretResponse) {
    capturedOutputs.push(redact(stdout));
  }
  capturedOutputs.push(redact(stderr));
  return { code, stdout, stderr };
}

async function waitFor(
  predicate: () => Promise<boolean>,
  timeoutMs: number
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  throw new Error("wait_timeout");
}

async function findAvailablePort(): Promise<number> {
  return new Promise<number>((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("port_unavailable"));
        return;
      }
      server.close(() => resolvePort(address.port));
    });
  });
}

function parseJsonLine(value: string): Record<string, unknown> {
  const lines = value.trim().split("\n");
  assert.equal(lines.length, 1);
  const parsed = JSON.parse(lines[0]!) as unknown;
  assert(parsed && typeof parsed === "object" && !Array.isArray(parsed));
  return parsed as Record<string, unknown>;
}

function databaseName(label: string): string {
  return `source_wire_story4_${label}_${randomBytes(6).toString("hex")}`;
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
    `SELECT pg_catalog.format(
       $1::text,
       ${values.map((_, index) => `$${index + 2}::text`).join(", ")}
     ) AS sql`,
    [format, ...values]
  );
  const sql = formatted.rows[0]?.sql;
  assert(sql);
  await pool.query(sql);
}

async function cleanup(): Promise<boolean> {
  let passed = true;
  for (const target of [portable, physical]) {
    await target?.admin.end().catch(() => {
      passed = false;
    });
  }
  if (source) {
    await source.admin.end().catch(() => undefined);
  }
  if (adminPool) {
    for (const name of [...createdDatabases]) {
      try {
        await adminPool.query(
          `SELECT pg_catalog.pg_terminate_backend(pid)
             FROM pg_catalog.pg_stat_activity
            WHERE datname = $1
              AND pid <> pg_catalog.pg_backend_pid()`,
          [name]
        );
        await executeFormatted(adminPool, "DROP DATABASE IF EXISTS %I", [
          name
        ]);
      } catch {
        passed = false;
      }
    }
    for (const role of [
      roleNames.runtime,
      roleNames.migrator,
      roleNames.schemaOwner
    ]) {
      try {
        await adminPool.query(`DROP ROLE IF EXISTS ${role}`);
      } catch {
        passed = false;
      }
    }
  }
  if (tempDirectory) {
    await rm(tempDirectory, { recursive: true, force: true }).catch(() => {
      passed = false;
    });
  }
  return passed;
}

function pass(id: string, observation: string): void {
  cases.push({ id, status: "passed", observation });
}

function redact(value: string): string {
  let redacted = value;
  for (const secret of sensitiveValues) {
    if (secret) redacted = redacted.split(secret).join("[redacted]");
  }
  if (tempDirectory) {
    redacted = redacted.split(tempDirectory).join("[generated-path]");
  }
  redacted = redacted.replace(/postgresql:\/\/[^\s"]+/gu, "[database-locator]");
  return redacted;
}

async function writeReport(): Promise<void> {
  const report = {
    schema: "source-wire.alpha1.story4-conformance.v1",
    status: failure || !cleanupPassed ? "failed" : "passed",
    revision: 1,
    sourceCommit: "17cb84ac401db3bb50489ff00697269ad9644b4c",
    environment: {
      node: process.version,
      postgresqlMajor: 16,
      processBoundary: "fresh_child_processes",
      dataClass: "generated_disposable_only",
      listener: "loopback_only"
    },
    cases,
    secretScan: {
      passed:
        !failure &&
        !capturedOutputs.join("\n").includes("postgresql://"),
      scope:
        "portable_bundle_outputs_logs_errors_reports_and_generated_artifacts"
    },
    cleanup: {
      passed: cleanupPassed,
      scope: "generated_databases_roles_processes_and_local_artifacts_only"
    },
    ...(failure
      ? {
          failure: {
            kind:
              failure instanceof Error
                ? failure.name
                : "unknown_failure",
            message: redact(
              failure instanceof Error
                ? failure.message
                : "unknown conformance failure"
            )
          }
        }
      : {})
  };
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, serialized, { mode: 0o600 });
}
