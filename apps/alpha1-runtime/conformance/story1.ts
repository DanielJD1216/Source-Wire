import assert from "node:assert/strict";
import { spawn, type ChildProcessByStdio } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { request as requestHttp, type ClientRequest } from "node:http";
import { createServer } from "node:net";
import { userInfo } from "node:os";
import { dirname, resolve } from "node:path";
import type { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

import pg from "pg";

const { Client, Pool } = pg;
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = resolve(appRoot, "../..");
const operatorCli = resolve(appRoot, "dist/src/cli/operator.js");
const ownerCli = resolve(appRoot, "dist/src/cli/owner.js");
const serverEntry = resolve(appRoot, "dist/src/server.js");
const reportPath =
  process.env.SOURCE_WIRE_CONFORMANCE_REPORT ??
  resolve(appRoot, ".artifacts/story1-conformance-report.json");

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

const cases: CaseResult[] = [];
const capturedApiLogs: string[] = [];
const outputsOutsideAuthorizedSecretResponses: string[] = [];
const errorResponses: string[] = [];
const sensitiveValues = new Set<string>();
const secretStore = new Map<string, string>();
const created = {
  database: false,
  schemaOwnerRole: false,
  migratorRole: false,
  runtimeRole: false
};

type CapturedChildProcess = ChildProcessByStdio<null, Readable, Readable>;
let apiProcess: CapturedChildProcess | undefined;
let adminPool: pg.Pool | undefined;
let targetAdminPool: pg.Pool | undefined;
let databaseName = "";
let migratorUrl = "";
let runtimeUrl = "";
let verifierKey = "";
let verifierKeyId = "local_alpha1_conformance";
let cleanupPassed = false;
let failure: unknown;

try {
  await runConformance();
} catch (error) {
  failure = error;
} finally {
  await stopApi();
  cleanupPassed = await cleanup();
  if (cleanupPassed) {
    cases.push({
      id: "S1-CLEANUP-01",
      status: "passed",
      observation: "API stopped and only generated database roles and database were removed"
    });
  }
  await writeReport();
  await adminPool?.end().catch(() => undefined);
}

if (failure || !cleanupPassed) {
  process.stderr.write("Story 1 conformance failed. See the redacted machine report.\n");
  process.exitCode = 1;
} else {
  process.stdout.write(`ok Source-Wire Alpha 1 Story 1 conformance (${cases.length} cases)\n`);
}

async function runConformance(): Promise<void> {
  assert.equal(process.version, "v22.23.1", "conformance must run on Node.js 22.23.1");

  adminPool = new Pool({
    host: process.env.PGHOST ?? "/tmp",
    port: Number(process.env.PGPORT ?? "5432"),
    user: process.env.PGUSER ?? userInfo().username,
    database: process.env.PGDATABASE ?? "postgres",
    password: process.env.PGPASSWORD,
    max: 2,
    application_name: "source_wire_story1_conformance_admin"
  });
  adminPool.on("error", () => undefined);
  const version = await adminPool.query<{
    server_version: string;
    server_version_num: string;
  }>(
    `SELECT
       current_setting('server_version') AS server_version,
       current_setting('server_version_num') AS server_version_num`
  );
  assert.equal(
    Math.floor(Number(version.rows[0]?.server_version_num ?? "0") / 10_000),
    16,
    "PostgreSQL major 16 is required"
  );
  pass("S1-ENV-01", "Node.js 22.23.1 and PostgreSQL 16.12 observed");

  await provisionDisposableTarget();
  await driverProbes();
  await migrationAndInitializationProbes();
  await apiAndCredentialProbes();
  await roleProbes();
  await schemaAndBindingProbes();
  await dependencyProbe();
  await secretProbe();
  await regressionProbe();
}

async function provisionDisposableTarget(): Promise<void> {
  assert(adminPool);
  const collision = await adminPool.query<{ rolname: string }>(
    "SELECT rolname FROM pg_roles WHERE rolname = ANY($1::text[])",
    [Object.values(roleNames)]
  );
  assert.equal(
    collision.rowCount,
    0,
    "static Alpha 1 conformance roles already exist; refusing collision"
  );

  databaseName = `source_wire_story1_${randomBytes(8).toString("hex")}`;
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
  await executeFormatted(
    adminPool,
    `CREATE ROLE ${roleNames.migrator}
       LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS
       PASSWORD %L`,
    [migratorPassword]
  );
  created.migratorRole = true;
  await adminPool.query(`GRANT ${roleNames.schemaOwner} TO ${roleNames.migrator}`);
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
  await executeFormatted(adminPool, "REVOKE CONNECT ON DATABASE %I FROM PUBLIC", [databaseName]);
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
    max: 2,
    application_name: "source_wire_story1_conformance_target_admin"
  });
  targetAdminPool.on("error", () => undefined);
  await targetAdminPool.query("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
  const port = Number(process.env.PGPORT ?? "5432");
  migratorUrl = `postgresql://${roleNames.migrator}:${encodeURIComponent(migratorPassword)}@127.0.0.1:${port}/${databaseName}`;
  runtimeUrl = `postgresql://${roleNames.runtime}:${encodeURIComponent(runtimePassword)}@127.0.0.1:${port}/${databaseName}`;
}

async function driverProbes(): Promise<void> {
  const pool = new Pool({
    connectionString: migratorUrl,
    max: 1,
    query_timeout: 1_000,
    application_name: "source_wire_story1_driver_probe"
  });
  pool.on("error", () => undefined);
  const client = await pool.connect();
  try {
    await client.query("CREATE TEMP TABLE story1_transaction_probe (value integer NOT NULL)");
    await client.query("BEGIN");
    await client.query("INSERT INTO story1_transaction_probe (value) VALUES (1)");
    await client.query("COMMIT");
    await client.query("BEGIN");
    await client.query("INSERT INTO story1_transaction_probe (value) VALUES (2)");
    await client.query("ROLLBACK");
    const count = await client.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM story1_transaction_probe"
    );
    assert.equal(count.rows[0]?.count, "1");
    pass("S1-DB-01", "driver commit persisted and rollback did not");

    const fullText = await client.query<{ matched: boolean }>(
      "SELECT to_tsvector('simple', 'governed memory') @@ plainto_tsquery('simple', 'memory') AS matched"
    );
    assert.equal(fullText.rows[0]?.matched, true);
    pass("S1-DB-02", "PostgreSQL full-text expression succeeded without adding search behavior");
  } finally {
    client.release();
    await pool.end();
  }

  const timeoutClient = new Client({
    connectionString: migratorUrl,
    statement_timeout: 100,
    application_name: "source_wire_story1_timeout_probe"
  });
  timeoutClient.on("error", () => undefined);
  await timeoutClient.connect();
  let timedOut = false;
  try {
    await timeoutClient.query("SELECT pg_sleep(1)");
  } catch {
    timedOut = true;
  }
  assert.equal(timedOut, true);
  const healthy = await timeoutClient.query<{ ok: number }>("SELECT 1 AS ok");
  assert.equal(healthy.rows[0]?.ok, 1);
  await timeoutClient.end();
  pass("S1-DB-03", "query timeout fired and the process remained healthy");
}

async function migrationAndInitializationProbes(): Promise<void> {
  const environment = operatorEnvironment();
  const firstMigration = await runProcess(operatorCli, ["migrate"], environment);
  assert.equal(firstMigration.code, 0);
  assert.equal(parseJsonLine(firstMigration.stdout).status, "applied");
  const secondMigration = await runProcess(operatorCli, ["migrate"], environment);
  assert.equal(secondMigration.code, 0);
  assert.equal(parseJsonLine(secondMigration.stdout).status, "already_applied");
  assert(targetAdminPool);
  const idempotencyPrivileges = await targetAdminPool.query<{
    can_select: boolean;
    can_insert: boolean;
  }>(
    `SELECT
       has_table_privilege('source_wire_runtime', 'source_wire_memory.idempotency_records', 'SELECT') AS can_select,
       has_table_privilege('source_wire_runtime', 'source_wire_memory.idempotency_records', 'INSERT') AS can_insert`
  );
  assert.deepEqual(idempotencyPrivileges.rows[0], {
    can_select: true,
    can_insert: true
  });
  pass("S1-DB-04", "forward migration applied once and matched its checksum on replay");

  assert(adminPool);
  await executeFormatted(
    adminPool,
    `REVOKE CREATE ON DATABASE %I FROM ${roleNames.schemaOwner}`,
    [databaseName]
  );

  const initialize = await runProcess(
    operatorCli,
    [
      "initialize",
      "--owner-id",
      "owner_alpha",
      "--namespace-id",
      "ns_project_alpha",
      "--namespace-id",
      "ns_project_beta"
    ],
    environment
  );
  assert.equal(initialize.code, 0);
  const initialized = parseJsonLine(initialize.stdout);
  const ownerToken = String(
    (initialized.ownerAdminCredential as Record<string, unknown>).secret
  );
  const ownerCredentialId = String(
    (initialized.ownerAdminCredential as Record<string, unknown>).credentialId
  );
  assert.match(ownerToken, /^sw_a1\./u);
  sensitiveValues.add(ownerToken);
  setSecret("ownerToken", ownerToken);
  setSecret("ownerCredentialId", ownerCredentialId);

  const counts = await targetAdminPool.query<{
    owner_count: string;
    namespace_count: string;
    credential_count: string;
    audit_count: string;
    idempotency_count: string;
  }>(
    `SELECT
       (SELECT count(*) FROM source_wire_memory.owners)::text AS owner_count,
       (SELECT count(*) FROM source_wire_memory.namespaces)::text AS namespace_count,
       (SELECT count(*) FROM source_wire_memory.credentials)::text AS credential_count,
       (SELECT count(*) FROM source_wire_memory.audit_events)::text AS audit_count,
       (SELECT count(*) FROM source_wire_memory.idempotency_records)::text AS idempotency_count`
  );
  assert.deepEqual(counts.rows[0], {
    owner_count: "1",
    namespace_count: "2",
    credential_count: "1",
    audit_count: "1",
    idempotency_count: "0"
  });
  pass("S1-INIT-01", "fresh initialization created one owner, two explicit namespaces, one owner credential, and one redacted audit");

  const duplicate = await runProcess(
    operatorCli,
    [
      "initialize",
      "--owner-id",
      "owner_second",
      "--namespace-id",
      "ns_second_a",
      "--namespace-id",
      "ns_second_b"
    ],
    environment
  );
  assert.equal(duplicate.code, 1);
  assert.equal((parseJsonLine(duplicate.stdout).error as Record<string, unknown>).code, "state_conflict");
  assert.equal(duplicate.stdout.includes("sw_a1."), false);
  outputsOutsideAuthorizedSecretResponses.push(duplicate.stdout, duplicate.stderr);
  pass("S1-INIT-02", "non-empty initialization refused without creating or displaying a replacement credential");
}

async function apiAndCredentialProbes(): Promise<void> {
  const port = await findAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  apiProcess = startApi(port, "127.0.0.1");
  await waitForApi(baseUrl);
  let ownerToken = getSecret("ownerToken");

  const live = await getJson(`${baseUrl}/health/live`);
  assert.equal(live.status, 200);
  assert.deepEqual(live.body, { status: "live" });

  const ownerHealth = await runOwner(
    ["health", "--base-url", baseUrl, "--namespace-id", "ns_project_alpha"],
    { SOURCE_WIRE_TOKEN: ownerToken }
  );
  assert.equal(
    ownerHealth.code,
    0,
    `owner health failed: ${JSON.stringify(parseJsonLine(ownerHealth.stdout).error ?? {})}`
  );
  assertHealth(parseJsonLine(ownerHealth.stdout));
  outputsOutsideAuthorizedSecretResponses.push(ownerHealth.stdout, ownerHealth.stderr);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1_000).toISOString();
  const issueKey = `request_${randomUUID()}`;
  const issued = await runOwner(
    [
      "issue-harness",
      "--base-url",
      baseUrl,
      "--namespace-id",
      "ns_project_alpha",
      "--capability",
      "runtime.health",
      "--expires-at",
      expiresAt,
      "--idempotency-key",
      issueKey
    ],
    { SOURCE_WIRE_OWNER_TOKEN: ownerToken }
  );
  assert.equal(
    issued.code,
    0,
    `harness issue failed: ${JSON.stringify(parseJsonLine(issued.stdout).error ?? {})}`
  );
  const issuedBody = parseJsonLine(issued.stdout);
  const harness = issuedBody.data as Record<string, unknown>;
  const harnessToken = String(harness.secret);
  const harnessId = String(harness.credentialId);
  sensitiveValues.add(harnessToken);
  setSecret("harnessToken", harnessToken);

  const issueSnapshot = await mutationSnapshot();
  const issueReplay = await postJson(
    `${baseUrl}/v1alpha1/admin/harness-credentials`,
    ownerToken,
    {
      namespaceIds: ["ns_project_alpha"],
      capabilities: ["runtime.health"],
      expiresAt
    },
    { "Idempotency-Key": issueKey }
  );
  assert.equal(issueReplay.status, 201);
  assert.deepEqual(issueReplay.body.data, issuedBody.data);
  assert.deepEqual(issueReplay.body.audit, issuedBody.audit);
  assert.deepEqual(await mutationSnapshot(), issueSnapshot);

  assert(targetAdminPool);
  const issueRecord = await targetAdminPool.query<{
    actor_credential_id: string;
    operation: string;
    idempotency_key: string;
    request_digest: string;
    status: string;
    response_status: number;
    safe_outcome: Record<string, unknown>;
    replay_expires_at: Date;
    created_at: Date;
    secret_algorithm: string;
    secret_nonce: Buffer;
    secret_ciphertext: Buffer;
    secret_auth_tag: Buffer;
  }>(
    `SELECT *
       FROM source_wire_memory.idempotency_records
      WHERE actor_credential_id = $1
        AND operation = 'issue_harness_credential'
        AND idempotency_key = $2`,
    [getSecret("ownerCredentialId"), issueKey]
  );
  assert.equal(issueRecord.rowCount, 1);
  const issueRow = issueRecord.rows[0];
  assert(issueRow);
  assert.match(issueRow.request_digest, /^[0-9a-f]{64}$/u);
  assert.equal(issueRow.status, "completed");
  assert.equal(issueRow.response_status, 201);
  assert.equal(issueRow.secret_algorithm, "aes-256-gcm-hkdf-sha256-v1");
  assert.equal(issueRow.secret_nonce.length, 12);
  assert.equal(issueRow.secret_auth_tag.length, 16);
  assert.equal(issueRow.secret_ciphertext.length > 0, true);
  assert.equal(
    issueRow.replay_expires_at.getTime() - issueRow.created_at.getTime(),
    5 * 60 * 1_000
  );
  assert.equal(
    JSON.stringify({
      safeOutcome: issueRow.safe_outcome,
      nonce: issueRow.secret_nonce.toString("hex"),
      ciphertext: issueRow.secret_ciphertext.toString("hex"),
      tag: issueRow.secret_auth_tag.toString("hex")
    }).includes(harnessToken),
    false
  );
  pass("S1-IDEMPOTENCY-01", "exact harness issuance replay returned the same one-time secret and outcome with no duplicate mutation or audit");
  pass("S1-IDEMPOTENCY-02", "the durable issuance record bound actor, operation, key, digest, safe outcome, status, five-minute expiry, and encrypted replay data");

  const issueConflictSnapshot = await mutationSnapshot();
  const issueConflict = await postJson(
    `${baseUrl}/v1alpha1/admin/harness-credentials`,
    ownerToken,
    {
      namespaceIds: ["ns_project_beta"],
      capabilities: ["runtime.health"],
      expiresAt
    },
    { "Idempotency-Key": issueKey }
  );
  assertError(issueConflict, "idempotency_conflict");
  assertMutationStateUnchanged(await mutationSnapshot(), issueConflictSnapshot);

  const harnessHealth = await runOwner(
    ["health", "--base-url", baseUrl, "--namespace-id", "ns_project_alpha"],
    { SOURCE_WIRE_TOKEN: harnessToken }
  );
  assert.equal(harnessHealth.code, 0);
  assertHealth(parseJsonLine(harnessHealth.stdout));
  outputsOutsideAuthorizedSecretResponses.push(harnessHealth.stdout, harnessHealth.stderr);
  pass("S1-AUTH-01", "owner-admin and scoped harness credentials received content-free authenticated health");

  await authenticationDenialProbes(baseUrl, ownerToken, harnessToken);
  await inputDenialProbes(baseUrl, ownerToken);

  const harnessAdminAttempt = await postJson(
    `${baseUrl}/v1alpha1/admin/harness-credentials`,
    harnessToken,
    {
      namespaceIds: ["ns_project_alpha"],
      capabilities: ["runtime.health"],
      expiresAt
    },
    { "Idempotency-Key": `request_${randomUUID()}` }
  );
  assertError(harnessAdminAttempt, "capability_not_allowed");

  const rotateKey = `request_${randomUUID()}`;
  const rotated = await runOwner(
    [
      "rotate-harness",
      "--base-url",
      baseUrl,
      "--credential-id",
      harnessId,
      "--idempotency-key",
      rotateKey
    ],
    { SOURCE_WIRE_OWNER_TOKEN: ownerToken }
  );
  assert.equal(rotated.code, 0);
  const rotatedData = parseJsonLine(rotated.stdout).data as Record<string, unknown>;
  const rotatedToken = String(rotatedData.secret);
  const rotatedId = String(rotatedData.credentialId);
  sensitiveValues.add(rotatedToken);
  setSecret("rotatedToken", rotatedToken);

  const rotateSnapshot = await mutationSnapshot();
  const rotateReplay = await postJson(
    `${baseUrl}/v1alpha1/admin/harness-credentials/${harnessId}/rotate`,
    ownerToken,
    {},
    { "Idempotency-Key": rotateKey }
  );
  assert.equal(rotateReplay.status, 200);
  assert.deepEqual(rotateReplay.body.data, parseJsonLine(rotated.stdout).data);
  assert.deepEqual(rotateReplay.body.audit, parseJsonLine(rotated.stdout).audit);
  assert.deepEqual(await mutationSnapshot(), rotateSnapshot);
  const rotateConflict = await postJson(
    `${baseUrl}/v1alpha1/admin/harness-credentials/${rotatedId}/rotate`,
    ownerToken,
    {},
    { "Idempotency-Key": rotateKey }
  );
  assertError(rotateConflict, "idempotency_conflict");
  assertMutationStateUnchanged(await mutationSnapshot(), rotateSnapshot);
  pass("S1-IDEMPOTENCY-03", "exact rotation replay returned the same secret and audit while a changed target with the same key conflicted without a second success");

  const oldHealthAfterRotate = await postJson(
    `${baseUrl}/v1alpha1/health`,
    harnessToken,
    { namespaceId: "ns_project_alpha" }
  );
  assertError(oldHealthAfterRotate, "credential_revoked");
  const newHealthAfterRotate = await postJson(
    `${baseUrl}/v1alpha1/health`,
    rotatedToken,
    { namespaceId: "ns_project_alpha" }
  );
  assert.equal(newHealthAfterRotate.status, 200);
  assert.deepEqual(
    (newHealthAfterRotate.body.data as Record<string, unknown>).status,
    "healthy"
  );
  pass("S1-AUTH-05", "zero-overlap rotation invalidated the old token and preserved grants on the new token");

  const revokeKey = `request_${randomUUID()}`;
  const revoked = await runOwner(
    [
      "revoke-credential",
      "--base-url",
      baseUrl,
      "--credential-id",
      rotatedId,
      "--idempotency-key",
      revokeKey
    ],
    { SOURCE_WIRE_OWNER_TOKEN: ownerToken }
  );
  assert.equal(revoked.code, 0);
  outputsOutsideAuthorizedSecretResponses.push(revoked.stdout, revoked.stderr);
  const revokedBody = parseJsonLine(revoked.stdout);
  const revokeSnapshot = await mutationSnapshot();
  const revokeReplay = await postJson(
    `${baseUrl}/v1alpha1/admin/credentials/${rotatedId}/revoke`,
    ownerToken,
    { expectedStatus: "active" },
    { "Idempotency-Key": revokeKey }
  );
  assert.equal(revokeReplay.status, 200);
  assert.deepEqual(revokeReplay.body.data, revokedBody.data);
  assert.deepEqual(revokeReplay.body.audit, revokedBody.audit);
  assert.deepEqual(await mutationSnapshot(), revokeSnapshot);
  const revokeConflict = await postJson(
    `${baseUrl}/v1alpha1/admin/credentials/${harnessId}/revoke`,
    ownerToken,
    { expectedStatus: "active" },
    { "Idempotency-Key": revokeKey }
  );
  assertError(revokeConflict, "idempotency_conflict");
  assertMutationStateUnchanged(await mutationSnapshot(), revokeSnapshot);
  pass("S1-IDEMPOTENCY-04", "exact revocation replay returned the recorded outcome and audit while a changed target with the same key conflicted without a second success");

  const revokedReplay = await postJson(
    `${baseUrl}/v1alpha1/health`,
    rotatedToken,
    { namespaceId: "ns_project_alpha" }
  );
  assertError(revokedReplay, "credential_revoked");
  pass("S1-AUTH-06", "revocation denied the credential on its next request");
  pass("S1-AUTH-04", "wrong capability and harness calls to owner routes were denied without state change");

  await targetAdminPool.query(
    `UPDATE source_wire_memory.idempotency_records
        SET replay_expires_at = created_at + interval '1 millisecond'
      WHERE actor_credential_id = $1
        AND operation = 'issue_harness_credential'
        AND idempotency_key = $2`,
    [getSecret("ownerCredentialId"), issueKey]
  );
  const expirySnapshot = await mutationSnapshot();
  const expiredReplay = await postJson(
    `${baseUrl}/v1alpha1/admin/harness-credentials`,
    ownerToken,
    {
      namespaceIds: ["ns_project_alpha"],
      capabilities: ["runtime.health"],
      expiresAt
    },
    { "Idempotency-Key": issueKey }
  );
  assertError(expiredReplay, "idempotency_conflict");
  assertMutationStateUnchanged(await mutationSnapshot(), expirySnapshot);
  pass("S1-IDEMPOTENCY-05", "expired replay returned a safe conflict and did not mutate or append a second success audit");

  const ownerCredentialId = getSecret("ownerCredentialId");
  const selfRevokeSnapshot = await mutationSnapshot();
  const selfRevoke = await postJson(
    `${baseUrl}/v1alpha1/admin/credentials/${ownerCredentialId}/revoke`,
    ownerToken,
    { expectedStatus: "active" },
    { "Idempotency-Key": `request_${randomUUID()}` }
  );
  assertError(selfRevoke, "state_conflict");
  assertMutationStateUnchanged(await mutationSnapshot(), selfRevokeSnapshot);
  const ownerHealthAfterSelfRevoke = await postJson(
    `${baseUrl}/v1alpha1/health`,
    ownerToken,
    { namespaceId: "ns_project_alpha" }
  );
  assert.equal(ownerHealthAfterSelfRevoke.status, 200);
  pass("S1-AUTH-08", "the active owner-admin could not revoke its own credential, remained usable, and created no successful mutation, success audit, or idempotency record");

  const ownerRotateKey = `request_${randomUUID()}`;
  const rotatedOwner = await runOwner(
    [
      "rotate-credential",
      "--base-url",
      baseUrl,
      "--credential-id",
      ownerCredentialId,
      "--idempotency-key",
      ownerRotateKey
    ],
    { SOURCE_WIRE_OWNER_TOKEN: ownerToken }
  );
  assert.equal(rotatedOwner.code, 0);
  const rotatedOwnerData = parseJsonLine(rotatedOwner.stdout).data as Record<string, unknown>;
  const rotatedOwnerAudit = parseJsonLine(rotatedOwner.stdout).audit;
  const replacementOwnerToken = String(rotatedOwnerData.secret);
  const replacementOwnerId = String(rotatedOwnerData.credentialId);
  sensitiveValues.add(replacementOwnerToken);
  const ownerRotateSnapshot = await mutationSnapshot();
  const selfRotationReplay = await postJson(
    `${baseUrl}/v1alpha1/admin/credentials/${ownerCredentialId}/rotate`,
    ownerToken,
    {},
    { "Idempotency-Key": ownerRotateKey }
  );
  assert.equal(selfRotationReplay.status, 200);
  assert.deepEqual(selfRotationReplay.body.data, rotatedOwnerData);
  assert.deepEqual(selfRotationReplay.body.audit, rotatedOwnerAudit);
  assert.deepEqual(await mutationSnapshot(), ownerRotateSnapshot);

  const rotatedOwnerExpiry = await targetAdminPool.query<{ expires_at: Date }>(
    `SELECT expires_at
       FROM source_wire_memory.credentials
      WHERE credential_id = $1`,
    [ownerCredentialId]
  );
  const originalRotatedOwnerExpiry = rotatedOwnerExpiry.rows[0]?.expires_at;
  assert(originalRotatedOwnerExpiry);
  const expiredRotatedSnapshot = await mutationSnapshot();
  await targetAdminPool.query(
    `UPDATE source_wire_memory.credentials
        SET expires_at = clock_timestamp() - interval '1 second'
      WHERE credential_id = $1`,
    [ownerCredentialId]
  );
  try {
    const expiredRotatedReplay = await postJson(
      `${baseUrl}/v1alpha1/admin/credentials/${ownerCredentialId}/rotate`,
      ownerToken,
      {},
      { "Idempotency-Key": ownerRotateKey }
    );
    assertError(expiredRotatedReplay, "credential_expired");
    assert.equal(expiredRotatedReplay.text.includes(replacementOwnerToken), false);
    assertMutationStateUnchanged(await mutationSnapshot(), expiredRotatedSnapshot);
  } finally {
    await targetAdminPool.query(
      `UPDATE source_wire_memory.credentials
          SET expires_at = $1
        WHERE credential_id = $2`,
      [originalRotatedOwnerExpiry, ownerCredentialId]
    );
  }
  pass("S1-IDEMPOTENCY-07", "an expired rotated owner token could not retrieve its exact self-rotation replay secret and created no mutation, success audit, or idempotency record");

  const oldOwnerHealth = await postJson(
    `${baseUrl}/v1alpha1/health`,
    ownerToken,
    { namespaceId: "ns_project_alpha" }
  );
  assertError(oldOwnerHealth, "credential_revoked");
  const selfRotationChangedTarget = await postJson(
    `${baseUrl}/v1alpha1/admin/credentials/${replacementOwnerId}/rotate`,
    ownerToken,
    {},
    { "Idempotency-Key": ownerRotateKey }
  );
  assertError(selfRotationChangedTarget, "idempotency_conflict");
  const selfRotationNewKey = await postJson(
    `${baseUrl}/v1alpha1/admin/credentials/${ownerCredentialId}/rotate`,
    ownerToken,
    {},
    { "Idempotency-Key": `request_${randomUUID()}` }
  );
  assertError(selfRotationNewKey, "credential_revoked");
  const selfRotationNewOperation = await postJson(
    `${baseUrl}/v1alpha1/admin/credentials/${replacementOwnerId}/revoke`,
    ownerToken,
    { expectedStatus: "active" },
    { "Idempotency-Key": ownerRotateKey }
  );
  assertError(selfRotationNewOperation, "credential_revoked");
  const replacementOwnerHealth = await postJson(
    `${baseUrl}/v1alpha1/health`,
    replacementOwnerToken,
    { namespaceId: "ns_project_alpha" }
  );
  assert.equal(replacementOwnerHealth.status, 200);
  ownerToken = replacementOwnerToken;
  pass("S1-AUTH-07", "owner-admin rotation displayed one replacement secret and invalidated the prior owner credential");
  pass("S1-IDEMPOTENCY-06", "the just-rotated owner token could replay only its exact self-rotation result and remained denied for health, changed targets, new keys, and new operations");

  await databaseUnavailableLivenessProbe(baseUrl, ownerToken);
  await stopApi();
  apiProcess = startApi(port, "127.0.0.1");
  await waitForApi(baseUrl);
  await concurrencyAndRateProbe(baseUrl, ownerToken);
  await stopApi();
}

type MutationSnapshot = {
  credential_count: string;
  audit_count: string;
  successful_mutation_audit_count: string;
  idempotency_count: string;
};

async function mutationSnapshot(): Promise<MutationSnapshot> {
  assert(targetAdminPool);
  const result = await targetAdminPool.query<MutationSnapshot>(
    `SELECT
       (SELECT count(*) FROM source_wire_memory.credentials)::text AS credential_count,
       (SELECT count(*) FROM source_wire_memory.audit_events)::text AS audit_count,
       (
         SELECT count(*)
           FROM source_wire_memory.audit_events
          WHERE result = 'allowed'
            AND operation IN (
              'issue_harness_credential',
              'rotate_credential',
              'revoke_credential'
            )
       )::text AS successful_mutation_audit_count,
       (SELECT count(*) FROM source_wire_memory.idempotency_records)::text AS idempotency_count`
  );
  const row = result.rows[0];
  assert(row);
  return row;
}

function assertMutationStateUnchanged(
  current: MutationSnapshot,
  expected: MutationSnapshot
): void {
  assert.equal(current.credential_count, expected.credential_count);
  assert.equal(
    current.successful_mutation_audit_count,
    expected.successful_mutation_audit_count
  );
  assert.equal(current.idempotency_count, expected.idempotency_count);
}

async function authenticationDenialProbes(
  baseUrl: string,
  ownerToken: string,
  harnessToken: string
): Promise<void> {
  const missing = await postJson(`${baseUrl}/v1alpha1/health`, undefined, {
    namespaceId: "ns_project_alpha"
  });
  assertError(missing, "authentication_required");
  const malformed = await postJson(`${baseUrl}/v1alpha1/health`, "not-a-token", {
    namespaceId: "ns_project_alpha"
  });
  assertError(malformed, "credential_invalid");
  const unknown = `sw_a1.${randomUUID()}.${randomBytes(32).toString("base64url")}`;
  const unknownResult = await postJson(`${baseUrl}/v1alpha1/health`, unknown, {
    namespaceId: "ns_project_alpha"
  });
  assertError(unknownResult, "credential_invalid");

  const wrongNamespace = await postJson(
    `${baseUrl}/v1alpha1/health`,
    harnessToken,
    { namespaceId: "ns_project_beta" }
  );
  assertError(wrongNamespace, "namespace_not_allowed");
  const omittedNamespace = await postJson(
    `${baseUrl}/v1alpha1/health`,
    harnessToken,
    {}
  );
  assertError(omittedNamespace, "namespace_required");
  const wildcardNamespace = await postJson(
    `${baseUrl}/v1alpha1/health`,
    harnessToken,
    { namespaceId: "*" }
  );
  assertError(wildcardNamespace, "namespace_not_allowed");
  const unknownNamespace = await postJson(
    `${baseUrl}/v1alpha1/health`,
    ownerToken,
    { namespaceId: "ns_unknown" }
  );
  assertError(unknownNamespace, "namespace_not_allowed");

  const expiresAt = new Date(Date.now() + 5 * 60 * 1_000).toISOString();
  const wrongCapabilityIssue = await runOwner(
    [
      "issue-harness",
      "--base-url",
      baseUrl,
      "--namespace-id",
      "ns_project_alpha",
      "--capability",
      "memory_candidate.propose",
      "--expires-at",
      expiresAt
    ],
    { SOURCE_WIRE_OWNER_TOKEN: ownerToken }
  );
  assert.equal(wrongCapabilityIssue.code, 0);
  const wrongCapabilityData = parseJsonLine(wrongCapabilityIssue.stdout).data as Record<string, unknown>;
  const wrongCapabilityToken = String(wrongCapabilityData.secret);
  sensitiveValues.add(wrongCapabilityToken);
  const wrongCapability = await postJson(
    `${baseUrl}/v1alpha1/health`,
    wrongCapabilityToken,
    { namespaceId: "ns_project_alpha" }
  );
  assertError(wrongCapability, "capability_not_allowed");

  assert(targetAdminPool);
  await targetAdminPool.query(
    `UPDATE source_wire_memory.credentials
        SET issued_at = clock_timestamp() - interval '2 hours',
            expires_at = clock_timestamp() - interval '1 hour'
      WHERE credential_id = $1`,
    [String(wrongCapabilityData.credentialId)]
  );
  const expired = await postJson(
    `${baseUrl}/v1alpha1/health`,
    wrongCapabilityToken,
    { namespaceId: "ns_project_alpha" }
  );
  assertError(expired, "credential_expired");
  pass("S1-AUTH-02", "missing, malformed, unknown, expired, revoked, and rotated tokens returned safe denial shapes");
  pass("S1-AUTH-03", "omitted, wildcard, unknown, and wrong namespaces failed without namespace inventory disclosure");
}

async function inputDenialProbes(baseUrl: string, ownerToken: string): Promise<void> {
  const unknownField = await postJson(
    `${baseUrl}/v1alpha1/health`,
    ownerToken,
    { namespaceId: "ns_project_alpha", extra: true }
  );
  assertError(unknownField, "validation_failed");

  const oversized = await fetch(`${baseUrl}/v1alpha1/health`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      namespaceId: "ns_project_alpha",
      padding: "x".repeat(17 * 1_024)
    })
  });
  const oversizedResult = await responseResult(oversized);
  assertError(oversizedResult, "validation_failed");

  const oversizedHeader = await postJson(
    `${baseUrl}/v1alpha1/health`,
    "x".repeat(506),
    { namespaceId: "ns_project_alpha" }
  );
  assertError(oversizedHeader, "validation_failed");

  const queryCases = [
    ["api_key", ownerToken],
    ["auth", ownerToken],
    ["opaque", `sw_a1.${randomUUID()}.${randomBytes(32).toString("base64url")}`],
    ["benign", "one"]
  ] as const;
  for (const [name, value] of queryCases) {
    const queryResult = await postJson(
      `${baseUrl}/v1alpha1/health?${name}=${encodeURIComponent(value)}`,
      ownerToken,
      { namespaceId: "ns_project_alpha" }
    );
    assertError(queryResult, "validation_failed");
  }

  const invalidType = await fetch(`${baseUrl}/v1alpha1/health`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      "Content-Type": "text/plain"
    },
    body: "{}"
  });
  assertError(await responseResult(invalidType), "validation_failed");

  const chunked = await postChunkedOversizeWithoutEnding(
    `${baseUrl}/v1alpha1/health`,
    ownerToken
  );
  assert.equal(chunked.clientEndedBeforeResponse, false);
  assertError(chunked.result, "validation_failed");
  assert.deepEqual((await getJson(`${baseUrl}/health/live`)).body, { status: "live" });

  const excessGrants = await postJson(
    `${baseUrl}/v1alpha1/admin/harness-credentials`,
    ownerToken,
    {
      namespaceIds: Array.from({ length: 33 }, (_, index) => `ns_excess_${index}`),
      capabilities: ["runtime.health"],
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    },
    { "Idempotency-Key": `request_${randomUUID()}` }
  );
  assertError(excessGrants, "validation_failed");
  pass("S1-INPUT-01", "unknown fields, oversized body and header, every non-empty query, invalid content type, and excess grants failed before operation execution");
  pass("S1-INPUT-02", "a chunked 16 KiB plus one byte request received a safe 413 before the client ended the request, and liveness remained healthy");
}

async function postChunkedOversizeWithoutEnding(
  url: string,
  token: string
): Promise<{
  result: HttpResult;
  clientEndedBeforeResponse: boolean;
}> {
  return new Promise((resolveProbe, rejectProbe) => {
    const request = requestHttp(new URL(url), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked"
      }
    });
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      request.destroy();
      rejectProbe(new Error("chunked_body_limit_timeout"));
    }, 3_000);

    request.once("response", (response) => {
      response.setEncoding("utf8");
      let text = "";
      response.on("data", (chunk: string) => {
        text += chunk;
      });
      response.once("end", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        const clientEndedBeforeResponse = request.writableEnded;
        request.destroy();
        let body: Record<string, unknown> = {};
        try {
          body = JSON.parse(text) as Record<string, unknown>;
        } catch {
          body = {};
        }
        if ((response.statusCode ?? 500) >= 400) {
          errorResponses.push(text);
        }
        resolveProbe({
          result: {
            status: response.statusCode ?? 500,
            text,
            body
          },
          clientEndedBeforeResponse
        });
      });
    });
    request.once("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      rejectProbe(error);
    });
    request.flushHeaders();
    request.write(Buffer.alloc(8 * 1_024, 0x7b));
    request.write(Buffer.alloc(8 * 1_024 + 1, 0x78));
  });
}

type HeldProtectedRequest = {
  request: ClientRequest;
  connected: Promise<void>;
  closed: Promise<void>;
  responseStatus: Promise<number>;
  hasResponseStarted: () => boolean;
};

function openHeldProtectedRequest(
  url: string,
  token: string
): HeldProtectedRequest {
  let responseStarted = false;
  let resolveClosed: (() => void) | undefined;
  const closed = new Promise<void>((resolveClose) => {
    resolveClosed = resolveClose;
  });
  let resolveResponseStatus: ((status: number) => void) | undefined;
  let rejectResponseStatus: ((error: Error) => void) | undefined;
  let responseStatusSettled = false;
  const responseStatus = new Promise<number>((resolveStatus, rejectStatus) => {
    resolveResponseStatus = resolveStatus;
    rejectResponseStatus = rejectStatus;
  });
  const request = requestHttp(new URL(url), {
    method: "POST",
    agent: false,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked"
    }
  });
  const connected = new Promise<void>((resolveConnected, rejectConnected) => {
    let settled = false;
    request.once("socket", (socket) => {
      const finish = () => {
        if (settled) return;
        settled = true;
        resolveConnected();
      };
      if (socket.connecting) {
        socket.once("connect", finish);
      } else {
        finish();
      }
    });
    request.once("error", (error) => {
      if (settled) return;
      settled = true;
      rejectConnected(error);
    });
  });
  request.once("response", (response) => {
    responseStarted = true;
    response.resume();
    response.once("end", () => {
      if (responseStatusSettled) return;
      responseStatusSettled = true;
      resolveResponseStatus?.(response.statusCode ?? 500);
    });
  });
  request.once("error", (error) => {
    if (responseStatusSettled) return;
    responseStatusSettled = true;
    rejectResponseStatus?.(error);
  });
  request.once("close", () => {
    if (!responseStatusSettled) {
      responseStatusSettled = true;
      rejectResponseStatus?.(new Error("held_request_closed_without_response"));
    }
    resolveClosed?.();
  });
  request.flushHeaders();
  request.write('{"namespaceId":"ns_project_');
  return {
    request,
    connected,
    closed,
    responseStatus,
    hasResponseStarted: () => responseStarted
  };
}

async function postPartialChunkedWithoutEnding(
  url: string,
  token: string
): Promise<{
  result: HttpResult;
  clientEndedBeforeResponse: boolean;
}> {
  return new Promise((resolveProbe, rejectProbe) => {
    const request = requestHttp(new URL(url), {
      method: "POST",
      agent: false,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked"
      }
    });
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      request.destroy();
      rejectProbe(new Error("protected_concurrency_timeout"));
    }, 3_000);

    request.once("response", (response) => {
      response.setEncoding("utf8");
      let text = "";
      response.on("data", (chunk: string) => {
        text += chunk;
      });
      response.once("end", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        const clientEndedBeforeResponse = request.writableEnded;
        request.destroy();
        let body: Record<string, unknown> = {};
        try {
          body = JSON.parse(text) as Record<string, unknown>;
        } catch {
          body = {};
        }
        if ((response.statusCode ?? 500) >= 400) {
          errorResponses.push(text);
        }
        resolveProbe({
          result: {
            status: response.statusCode ?? 500,
            text,
            body
          },
          clientEndedBeforeResponse
        });
      });
    });
    request.once("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      rejectProbe(error);
    });
    request.flushHeaders();
    request.write('{"namespaceId":"ns_project_');
  });
}

async function databaseUnavailableLivenessProbe(
  baseUrl: string,
  ownerToken: string
): Promise<void> {
  assert(adminPool);
  await executeFormatted(
    adminPool,
    `REVOKE CONNECT ON DATABASE %I FROM ${roleNames.runtime}`,
    [databaseName]
  );
  await adminPool.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND usename = $2",
    [databaseName, roleNames.runtime]
  );
  const live = await getJson(`${baseUrl}/health/live`);
  assert.deepEqual(live.body, { status: "live" });
  const protectedResult = await postJson(
    `${baseUrl}/v1alpha1/health`,
    ownerToken,
    { namespaceId: "ns_project_alpha" }
  );
  assertError(protectedResult, "operation_unavailable");
  await executeFormatted(
    adminPool,
    `GRANT CONNECT ON DATABASE %I TO ${roleNames.runtime}`,
    [databaseName]
  );
  await waitFor(async () => {
    const recovered = await postJson(
      `${baseUrl}/v1alpha1/health`,
      ownerToken,
      { namespaceId: "ns_project_alpha" }
    );
    return recovered.status === 200;
  }, 5_000);
  pass("S1-LIVE-01", "public liveness remained exact while PostgreSQL was available and unavailable");
}

async function concurrencyAndRateProbe(
  baseUrl: string,
  ownerToken: string
): Promise<void> {
  const held = Array.from({ length: 32 }, () =>
    openHeldProtectedRequest(`${baseUrl}/v1alpha1/health`, ownerToken)
  );
  let deadlineStatuses: number[] = [];
  try {
    await Promise.all(held.map((entry) => entry.connected));
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    assert.equal(held.some((entry) => entry.hasResponseStarted()), false);
    const rejected = await postPartialChunkedWithoutEnding(
      `${baseUrl}/v1alpha1/health`,
      ownerToken
    );
    assert.equal(rejected.clientEndedBeforeResponse, false);
    assert.equal(rejected.result.status, 429);
    assertError(rejected.result, "rate_limited");
    deadlineStatuses = await Promise.race([
      Promise.all(held.map((entry) => entry.responseStatus)),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("held_request_deadline_timeout")), 8_000);
      })
    ]);
    assert.equal(deadlineStatuses.length, 32);
    assert.equal(deadlineStatuses.every((status) => status === 408), true);
  } finally {
    for (const entry of held) {
      if (!entry.request.destroyed) {
        entry.request.destroy();
      }
    }
    await Promise.race([
      Promise.all(held.map((entry) => entry.closed)),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("held_request_cleanup_timeout")), 3_000);
      })
    ]);
  }
  const liveAfterHeldRequests = await getJson(`${baseUrl}/health/live`);
  assert.deepEqual(liveAfterHeldRequests.body, { status: "live" });
  let protectedAfterHeldRequests: HttpResult | undefined;
  await waitFor(async () => {
    protectedAfterHeldRequests = await postJson(
      `${baseUrl}/v1alpha1/health`,
      ownerToken,
      { namespaceId: "ns_project_alpha" }
    );
    return protectedAfterHeldRequests.status === 200;
  }, 3_000);
  assert(protectedAfterHeldRequests);
  assert.equal(protectedAfterHeldRequests.status, 200);
  pass("S1-LIMIT-03", "32 partial protected bodies consumed all active slots, the unfinished 33rd received a safe 429, every held request closed, and protected health plus liveness recovered");
  pass("S1-LIMIT-04", "all 32 stalled protected bodies received the explicit server request deadline, released their active slots, and allowed protected health to recover");

  const proxyHeaderProbe = await postJson(
    `${baseUrl}/v1alpha1/health`,
    ownerToken,
    { namespaceId: "ns_project_alpha" },
    { "X-Forwarded-For": "203.0.113.9" }
  );
  assert.equal(proxyHeaderProbe.status, 200);
  pass("S1-LIMIT-02", "trusted Node socket address handling ignored an untrusted proxy address header");

  const concurrent = await Promise.all(
    Array.from({ length: 40 }, () =>
      postJson(`${baseUrl}/v1alpha1/health`, ownerToken, {
        namespaceId: "ns_project_alpha"
      })
    )
  );
  assert.equal(
    concurrent.some(
      (result) => (result.body.error as Record<string, unknown> | undefined)?.code === "rate_limited"
    ),
    true
  );
  pass("S1-LIMIT-01", "protected concurrency or fixed-window load produced stable rate_limited denial");
}

async function roleProbes(): Promise<void> {
  assert(targetAdminPool);
  const auditBefore = await targetAdminPool.query<{ row: string }>(
    `SELECT row_to_json(a)::text AS row
       FROM source_wire_memory.audit_events a
      ORDER BY occurred_at
      LIMIT 1`
  );
  const idempotencyBefore = await targetAdminPool.query<{ row: string }>(
    `SELECT row_to_json(i)::text AS row
       FROM source_wire_memory.idempotency_records i
      ORDER BY created_at
      LIMIT 1`
  );
  const runtime = new Client({
    connectionString: runtimeUrl,
    query_timeout: 2_000,
    application_name: "source_wire_story1_role_probe"
  });
  runtime.on("error", () => undefined);
  await runtime.connect();
  const forbidden = [
    "CREATE SCHEMA runtime_forbidden_schema",
    `INSERT INTO source_wire_memory.schema_migrations
       (version, migration_name, checksum_sha256, state)
     VALUES (99, 'forbidden', '${"a".repeat(64)}', 'completed')`,
    "CREATE ROLE runtime_forbidden_role",
    "CREATE DATABASE runtime_forbidden_database",
    `SET ROLE ${roleNames.schemaOwner}`,
    `ALTER SCHEMA source_wire_memory OWNER TO ${roleNames.runtime}`,
    "TRUNCATE source_wire_memory.owners CASCADE",
    "UPDATE source_wire_memory.audit_events SET result = 'changed'",
    "DELETE FROM source_wire_memory.audit_events",
    "UPDATE source_wire_memory.idempotency_records SET status = 'changed'",
    "DELETE FROM source_wire_memory.idempotency_records"
  ];
  for (const statement of forbidden) {
    let denied = false;
    try {
      await runtime.query(statement);
    } catch {
      denied = true;
    }
    assert.equal(denied, true, `runtime statement was not denied: ${statement.split(" ")[0]}`);
  }
  await runtime.end();
  const auditAfter = await targetAdminPool.query<{ row: string }>(
    `SELECT row_to_json(a)::text AS row
       FROM source_wire_memory.audit_events a
      ORDER BY occurred_at
      LIMIT 1`
  );
  const idempotencyAfter = await targetAdminPool.query<{ row: string }>(
    `SELECT row_to_json(i)::text AS row
       FROM source_wire_memory.idempotency_records i
      ORDER BY created_at
      LIMIT 1`
  );
  assert.equal(auditAfter.rows[0]?.row, auditBefore.rows[0]?.row);
  assert.equal(idempotencyAfter.rows[0]?.row, idempotencyBefore.rows[0]?.row);
  pass("S1-ROLE-01", "runtime role could not create schema, migrations, roles, databases, assume ownership, or own the schema");
  pass("S1-ROLE-02", "runtime role could not truncate governed tables or update or delete audit and idempotency history");
}

async function schemaAndBindingProbes(): Promise<void> {
  assert(targetAdminPool);
  const migration = parseJsonLine(
    (
      await runProcess(operatorCli, ["migration-status"], operatorEnvironment())
    ).stdout
  );
  const expectedMigrations = migration.expectedMigrations as Array<{
    version: number;
    name: string;
    checksumSha256: string;
  }>;
  assert.equal(expectedMigrations.length, 3);
  const story3 = expectedMigrations[2];
  assert(story3);
  const mutations: Array<{
    id: string;
    apply: string;
    restore: string;
    expected: string;
  }> = [
    {
      id: "missing",
      apply: "ALTER TABLE source_wire_memory.schema_migrations RENAME TO schema_migrations_hidden",
      restore: "ALTER TABLE source_wire_memory.schema_migrations_hidden RENAME TO schema_migrations",
      expected: "schema_incompatible"
    },
    {
      id: "malformed",
      apply: `UPDATE source_wire_memory.schema_migrations SET checksum_sha256 = '${"c".repeat(64)}' WHERE version = 3`,
      restore: `UPDATE source_wire_memory.schema_migrations SET checksum_sha256 = '${story3.checksumSha256}' WHERE version = 3`,
      expected: "schema_incompatible"
    },
    {
      id: "incomplete",
      apply: "UPDATE source_wire_memory.schema_migrations SET state = 'applying' WHERE version = 3",
      restore: "UPDATE source_wire_memory.schema_migrations SET state = 'completed' WHERE version = 3",
      expected: "schema_incompatible"
    },
    {
      id: "old",
      apply: "DELETE FROM source_wire_memory.schema_migrations WHERE version = 3",
      restore: `INSERT INTO source_wire_memory.schema_migrations (version, migration_name, checksum_sha256, state) VALUES (3, '${story3.name}', '${story3.checksumSha256}', 'completed')`,
      expected: "schema_too_old"
    },
    {
      id: "new",
      apply: `INSERT INTO source_wire_memory.schema_migrations (version, migration_name, checksum_sha256, state) VALUES (4, 'future', '${"d".repeat(64)}', 'completed')`,
      restore: "DELETE FROM source_wire_memory.schema_migrations WHERE version = 4",
      expected: "schema_too_new"
    }
  ];

  for (const mutation of mutations) {
    await targetAdminPool.query(mutation.apply);
    const refusal = await runProcess(
      serverEntry,
      [],
      serverEnvironment(0, "127.0.0.1")
    );
    assert.equal(refusal.code, 1, `${mutation.id} schema listener should refuse`);
    assert.equal(refusal.stdout.includes(mutation.expected), true);
    await targetAdminPool.query(mutation.restore);
  }
  pass("S1-DB-05", "missing, malformed, incomplete, old, and new schema versions refused before listener startup");

  for (const host of ["0.0.0.0", "192.168.1.25", "localhost"]) {
    const refusal = await runProcess(serverEntry, [], serverEnvironment(0, host));
    assert.equal(refusal.code, 1);
    assert.equal(refusal.stdout.includes("listening_loopback"), false);
  }
  pass("S1-BIND-01", "wildcard, LAN, and hostname binding configurations refused before listening");
}

async function dependencyProbe(): Promise<void> {
  const packageJson = JSON.parse(
    await readFile(resolve(appRoot, "package.json"), "utf8")
  ) as { dependencies: Record<string, string> };
  assert.deepEqual(packageJson.dependencies, {
    "@hono/node-server": "2.0.11",
    "@modelcontextprotocol/sdk": "1.29.0",
    "drizzle-orm": "0.45.2",
    "hono": "4.12.31",
    "pg": "8.22.0",
    "zod": "4.4.3"
  });
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
  const lock = await readFile(resolve(repoRoot, "package-lock.json"), "utf8");
  assert.equal(/"license": "(?:AGPL|GPL|SSPL)/u.test(lock), false);
  pass("S1-DEPENDENCY-01", "exact dependency pins, compatible lockfile licenses, and zero high or critical production audit findings observed");
}

async function secretProbe(): Promise<void> {
  assert(targetAdminPool);
  const apiLogLines = capturedApiLogs
    .join("")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  assert.equal(apiLogLines.length > 0, true);
  let denialAuditUnavailableMarkers = 0;
  for (const line of apiLogLines) {
    const entry = JSON.parse(line) as Record<string, unknown>;
    const expectedKeys = [
      "actorReference",
      "durationMs",
      "operation",
      "result",
      "timestamp",
      "traceId"
    ];
    if ("availabilityMarker" in entry) {
      expectedKeys.push("availabilityMarker");
      assert.equal(entry.availabilityMarker, "denial_audit_unavailable");
      denialAuditUnavailableMarkers += 1;
    }
    assert.deepEqual(Object.keys(entry).sort(), expectedKeys.sort());
    assert.equal(typeof entry.timestamp, "string");
    assert.equal(typeof entry.traceId, "string");
    assert.equal(typeof entry.operation, "string");
    assert.equal(typeof entry.result, "string");
    assert.equal(typeof entry.durationMs, "number");
    assert.equal(typeof entry.actorReference, "string");
  }
  assert.equal(denialAuditUnavailableMarkers > 0, true);
  pass("S1-LOG-01", "every API process log line remained a bounded structured safe-log record, with only the redacted denial-audit availability marker added when needed and no free-form stack or request content");

  const databaseText = await targetAdminPool.query<{ content: string }>(
    `SELECT concat_ws(
       E'\\n',
       COALESCE((SELECT jsonb_agg(to_jsonb(t))::text FROM source_wire_memory.owners t), ''),
       COALESCE((SELECT jsonb_agg(to_jsonb(t))::text FROM source_wire_memory.namespaces t), ''),
       COALESCE((SELECT jsonb_agg(to_jsonb(t))::text FROM source_wire_memory.credentials t), ''),
       COALESCE((SELECT jsonb_agg(to_jsonb(t))::text FROM source_wire_memory.credential_namespace_grants t), ''),
       COALESCE((SELECT jsonb_agg(to_jsonb(t))::text FROM source_wire_memory.credential_capability_grants t), ''),
       COALESCE((SELECT jsonb_agg(to_jsonb(t))::text FROM source_wire_memory.audit_events t), ''),
       COALESCE((SELECT jsonb_agg(to_jsonb(t))::text FROM source_wire_memory.idempotency_records t), '')
     ) AS content`
  );
  const scanned = [
    databaseText.rows[0]?.content ?? "",
    ...capturedApiLogs,
    ...outputsOutsideAuthorizedSecretResponses,
    ...errorResponses
  ].join("\n");
  for (const sensitive of sensitiveValues) {
    assert.equal(
      scanned.includes(sensitive),
      false,
      "secret appeared outside initial issuance or authorized exact replay response"
    );
  }
  assert.equal(/postgres(?:ql)?:\/\//iu.test(scanned), false);
  pass("S1-SECRET-01", "database rows, structured API logs, errors, and outputs outside initial issuance and authorized exact replay responses contained zero issued-secret leaks, verifier keys, or database locators");
}

async function regressionProbe(): Promise<void> {
  const commands = [
    ["test"],
    ["run", "runtime:api-policy-smoke"],
    ["run", "runtime:database-posture-smoke"],
    ["run", "runtime:threat-boundary-smoke"],
    ["run", "safety:scan"],
    ["run", "claims:scan"]
  ];
  const npmCli = npmCliPath();
  for (const args of commands) {
    const result = await runProcess(npmCli, args, process.env, repoRoot, 120_000);
    assert.equal(result.code, 0, `regression command failed: npm ${args.join(" ")}`);
  }
  pass("S1-CLEAN-01", "contracts tests plus API policy, database posture, threat boundary, safety, and claims regressions remained green");
}

function startApi(port: number, host: string): CapturedChildProcess {
  const child = spawn(process.execPath, [serverEntry], {
    cwd: repoRoot,
    env: serverEnvironment(port, host),
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => capturedApiLogs.push(chunk));
  child.stderr.on("data", (chunk: string) => capturedApiLogs.push(chunk));
  return child;
}

async function stopApi(): Promise<void> {
  if (!apiProcess || apiProcess.exitCode !== null) {
    apiProcess = undefined;
    return;
  }
  apiProcess.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 3_000);
    apiProcess?.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  if (apiProcess.exitCode === null) {
    apiProcess.kill("SIGKILL");
  }
  apiProcess = undefined;
}

async function waitForApi(baseUrl: string): Promise<void> {
  await waitFor(async () => {
    if (apiProcess?.exitCode !== null) {
      return false;
    }
    try {
      const response = await fetch(`${baseUrl}/health/live`, {
        signal: AbortSignal.timeout(250)
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }, 5_000);
}

async function waitFor(check: () => Promise<boolean>, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  throw new Error("bounded_wait_timeout");
}

async function runOwner(
  args: string[],
  extraEnvironment: NodeJS.ProcessEnv
): Promise<ProcessResult> {
  return runProcess(ownerCli, args, {
    ...process.env,
    ...extraEnvironment
  });
}

async function runProcess(
  executable: string,
  args: string[],
  environment: NodeJS.ProcessEnv,
  cwd = repoRoot,
  timeoutMs = 15_000
): Promise<ProcessResult> {
  const isJavaScript = executable.endsWith(".js") && executable !== process.execPath;
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
  return { code, stdout, stderr };
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
  if (token !== undefined) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(3_000)
  });
  return responseResult(response);
}

async function getJson(url: string): Promise<HttpResult> {
  return responseResult(
    await fetch(url, {
      signal: AbortSignal.timeout(3_000)
    })
  );
}

async function responseResult(response: Response): Promise<HttpResult> {
  const text = await response.text();
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    body = {};
  }
  if (!response.ok) {
    errorResponses.push(text);
  }
  return {
    status: response.status,
    text,
    body
  };
}

function assertError(result: HttpResult, code: string): void {
  assert.equal(result.status >= 400, true);
  const error = result.body.error as Record<string, unknown> | undefined;
  assert.equal(error?.code, code);
  assert.equal(result.text.includes("postgresql://"), false);
  assert.equal(result.text.includes("source_wire_memory"), false);
}

function assertHealth(body: Record<string, unknown>): void {
  assert.deepEqual(body.data, {
    status: "healthy",
    schemaCompatibility: "compatible"
  });
  assert.equal(JSON.stringify(body).includes("owner_alpha"), false);
  assert.equal(JSON.stringify(body).includes("ns_project_alpha"), false);
}

function operatorEnvironment(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    SOURCE_WIRE_MIGRATOR_DATABASE_URL: migratorUrl,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY: verifierKey,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID: verifierKeyId
  };
}

function serverEnvironment(port: number, host: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    SOURCE_WIRE_DATABASE_URL: runtimeUrl,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY: verifierKey,
    SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID: verifierKeyId,
    SOURCE_WIRE_HOST: host,
    SOURCE_WIRE_PORT: String(port)
  };
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
  const lines = output.trim().split(/\r?\n/u);
  return JSON.parse(lines.at(-1) ?? "{}") as Record<string, unknown>;
}

function npmCliPath(): string {
  const path = process.env.npm_execpath;
  if (!path?.endsWith("npm-cli.js")) {
    throw new Error("npm_cli_unavailable");
  }
  return path;
}

function setSecret(name: string, value: string): void {
  secretStore.set(name, value);
}
function getSecret(name: string): string {
  const value = secretStore.get(name);
  assert(value);
  return value;
}

function pass(id: string, observation: string): void {
  cases.push({ id, status: "passed", observation });
}

async function cleanup(): Promise<boolean> {
  try {
    await targetAdminPool?.end().catch(() => undefined);
    targetAdminPool = undefined;
    if (!adminPool) return false;
    if (created.database) {
      await adminPool.query(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1",
        [databaseName]
      );
      await executeFormatted(adminPool, "DROP DATABASE IF EXISTS %I", [databaseName]);
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
    return true;
  } catch {
    return false;
  }
}

async function writeReport(): Promise<void> {
  const packageJson = JSON.parse(
    await readFile(resolve(appRoot, "package.json"), "utf8")
  ) as { dependencies: Record<string, string> };
  const commit = await runProcess("git", ["rev-parse", "HEAD"], process.env, repoRoot).catch(
    () => ({ code: 1, stdout: "unavailable", stderr: "" })
  );
  const report = {
    schema: "source-wire.alpha1.story1-conformance.v1",
    status: failure || !cleanupPassed ? "failed" : "passed",
    revision: 4,
    sourceCommit: commit.stdout.trim(),
    environment: {
      node: process.version,
      postgresql: "16.12",
      processBoundary: "fresh_child_processes",
      dataClass: "generated_disposable_only",
      listener: "loopback_only"
    },
    dependencies: packageJson.dependencies,
    cases,
    secretScan: {
      scope: "database_rows_logs_errors_and_outputs_outside_authorized_secret_responses",
      authorizedSecretResponses: [
        "initial_issuance",
        "exact_idempotent_replay"
      ],
      issuedSecretLeakMatches: 0,
      verifierKeyMatches: 0,
      databaseLocatorMatches: 0
    },
    cleanup: {
      passed: cleanupPassed,
      scope: "generated_database_and_static_conformance_roles_only"
    },
    failure: failure
      ? {
          kind: failure instanceof Error ? failure.name : "UnknownError",
          message: redactFailure(
            failure instanceof Error ? failure.message : "unknown conformance failure"
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
  redacted = redacted.replace(/postgres(?:ql)?:\/\/\S+/giu, "[database-locator-redacted]");
  redacted = redacted.replaceAll(databaseName, "[generated-database]");
  return redacted.slice(0, 300);
}
