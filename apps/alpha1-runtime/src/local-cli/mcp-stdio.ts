import {
  spawn,
  type ChildProcess,
  type SpawnOptions
} from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import {
  assertSourceWireIdentifier,
  parseVerifierKey,
  STORY1_API_SCHEMA
} from "../config.js";
import { assertCredentialIdentifier } from "../credentials.js";
import { createRuntimeDatabase } from "../database.js";
import { inspectSchemaCompatibility } from "../migration.js";
import { readAndValidateLocalConfig } from "./config.js";
import { SourceWireLocalCliError } from "./result.js";

const API_START_TIMEOUT_MS = 5_000;
const CHILD_STOP_TIMEOUT_MS = 3_000;
const PROCESS_CREDENTIAL_TTL_MS = 10 * 60 * 1_000;
const MAX_ADMIN_RESPONSE_BYTES = 16 * 1_024;
const OWNER_TOKEN_ENV = "SOURCE_WIRE_OWNER_TOKEN";
const API_ENTRY = fileURLToPath(new URL("../server.js", import.meta.url));
const MCP_ENTRY = fileURLToPath(new URL("../mcp/server.js", import.meta.url));
const STORY6_CONFORMANCE_FAULTS = new Set([
  "api_after_credential",
  "mcp_after_start"
] as const);

type IssuedProcessCredential = Readonly<{
  credentialId: string;
  secret: string;
}>;

type ChildOutcome = Readonly<{
  source: "api" | "mcp";
  code: number;
}>;

type Story6ConformanceFault =
  | "api_after_credential"
  | "mcp_after_start";

export async function runLocalMcpStdio(
  args: readonly string[],
  environment: NodeJS.ProcessEnv = process.env
): Promise<0 | 1> {
  const parsed = parseMcpArgs(args);
  const configPath = parsed.values.config;
  if (typeof configPath !== "string") {
    throw new SourceWireLocalCliError("invalid_arguments");
  }
  const config = await readAndValidateLocalConfig(configPath);
  if (config.knowledgeProvider && config.namespaces.length !== 1) {
    throw new SourceWireLocalCliError("provider_namespace_invalid");
  }
  const providerEnabled = config.knowledgeProvider !== undefined;
  const conformanceFault = parseStory6ConformanceFault(environment);

  const runtimeDatabaseUrl = requireReferencedEnvironment(
    config.memory.runtimeDatabaseUrlEnv,
    environment
  );
  const verifierKey = requireReferencedEnvironment(
    config.memory.verifierKeyEnv,
    environment
  );
  const ownerToken = requireReferencedEnvironment(OWNER_TOKEN_ENV, environment);
  let verifierKeyId: string;
  try {
    parseVerifierKey(verifierKey);
    verifierKeyId = assertSourceWireIdentifier(
      environment.SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID ?? "local_alpha1",
      "verifierKeyId"
    );
  } catch {
    throw new SourceWireLocalCliError("environment_invalid");
  }

  await verifyMigrationCompatibility(runtimeDatabaseUrl);
  const port =
    config.api.port === "auto"
      ? await findAvailablePort(config.api.host)
      : config.api.port;
  const baseUrl = `http://${formatHost(config.api.host)}:${port}`;
  let api: ChildProcess | undefined;
  let mcp: ChildProcess | undefined;
  let credential: IssuedProcessCredential | undefined;
  let interrupted = false;
  let executionError: unknown;
  let cleanupError: SourceWireLocalCliError | undefined;

  const interrupt = () => {
    interrupted = true;
    mcp?.kill("SIGTERM");
    api?.kill("SIGTERM");
  };
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);

  try {
    throwIfInterrupted(interrupted);
    api = startApi({
      runtimeDatabaseUrl,
      verifierKey,
      verifierKeyId,
      host: config.api.host,
      port,
      ...(config.knowledgeProvider
        ? {
            provider: {
              ...config.knowledgeProvider,
              ownerId: config.ownerId,
              namespaceId: config.namespaces[0] as string
            }
          }
        : {})
    });
    await waitForApi(baseUrl, port, api);
    throwIfInterrupted(interrupted);
    safeDiagnostic("api_ready");

    credential = await issueProcessCredential({
      baseUrl,
      ownerToken,
      namespaceIds: config.namespaces,
      sourceEvidenceRead: providerEnabled
    });
    throwIfInterrupted(interrupted);
    safeDiagnostic("process_credential_issued");

    if (conformanceFault === "api_after_credential") {
      api.kill("SIGKILL");
    }
    mcp = startMcp({
      baseUrl,
      token: credential.secret,
      providerEnabled
    });
    safeDiagnostic("mcp_stdio_ready");
    if (conformanceFault === "mcp_after_start") {
      mcp.kill("SIGKILL");
    }

    const outcome = await waitForComposition(api, mcp);
    if (outcome.source === "api") {
      throw new SourceWireLocalCliError("composition_failed");
    }
    if (outcome.code !== 0 && !interrupted) {
      throw new SourceWireLocalCliError("mcp_start_failed");
    }
  } catch (error) {
    executionError = error;
  } finally {
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
    await stopChild(mcp);
    if (credential) {
      await revokeProcessCredentialForCleanup({
        baseUrl,
        ownerToken,
        runtimeDatabaseUrl,
        credentialId: credential.credentialId,
        apiAvailable: childIsRunning(api)
      }).catch(() => {
        cleanupError = new SourceWireLocalCliError(
          "credential_revoke_failed"
        );
        safeDiagnostic("process_credential_revoke_failed");
      });
    }
    await stopChild(api);
    safeDiagnostic("composition_stopped");
  }
  if (executionError) throw executionError;
  if (cleanupError) throw cleanupError;
  return 0;
}

function parseMcpArgs(args: readonly string[]): ReturnType<typeof parseArgs> {
  try {
    return parseArgs({
      args: [...args],
      options: {
        config: { type: "string" }
      },
      allowPositionals: false,
      strict: true
    });
  } catch {
    throw new SourceWireLocalCliError("invalid_arguments");
  }
}

async function verifyMigrationCompatibility(
  databaseUrl: string
): Promise<void> {
  const database = createRuntimeDatabase(databaseUrl);
  try {
    const compatibility = await inspectSchemaCompatibility(database.pool);
    if (!compatibility.compatible) {
      throw new SourceWireLocalCliError("database_incompatible");
    }
  } catch (error) {
    if (error instanceof SourceWireLocalCliError) throw error;
    throw new SourceWireLocalCliError("database_unavailable");
  } finally {
    await database.pool.end().catch(() => undefined);
  }
}

function startApi(input: {
  runtimeDatabaseUrl: string;
  verifierKey: string;
  verifierKeyId: string;
  host: "127.0.0.1" | "::1";
  port: number;
  provider?: Readonly<{
    module: string;
    exportName: string;
    providerScopeId: string;
    timeoutMs: number;
    ownerId: string;
    namespaceId: string;
  }>;
}): ChildProcess {
  const child = spawn(process.execPath, [API_ENTRY], {
    env: {
      SOURCE_WIRE_DATABASE_URL: input.runtimeDatabaseUrl,
      SOURCE_WIRE_TOKEN_VERIFIER_KEY: input.verifierKey,
      SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID: input.verifierKeyId,
      SOURCE_WIRE_HOST: input.host,
      SOURCE_WIRE_PORT: String(input.port),
      ...(input.provider
        ? {
            SOURCE_WIRE_LOCAL_PROVIDER_MODE: "enabled",
            SOURCE_WIRE_LOCAL_PROVIDER_MODULE: input.provider.module,
            SOURCE_WIRE_LOCAL_PROVIDER_EXPORT:
              input.provider.exportName,
            SOURCE_WIRE_LOCAL_PROVIDER_OWNER_ID:
              input.provider.ownerId,
            SOURCE_WIRE_LOCAL_PROVIDER_NAMESPACE_ID:
              input.provider.namespaceId,
            SOURCE_WIRE_LOCAL_PROVIDER_SCOPE_ID:
              input.provider.providerScopeId,
            SOURCE_WIRE_LOCAL_PROVIDER_TIMEOUT_MS: String(
              input.provider.timeoutMs
            )
          }
        : {})
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"]
  });
  drainChildOutput(child);
  return child;
}

function startMcp(input: {
  baseUrl: string;
  token: string;
  providerEnabled: boolean;
}): ChildProcess {
  const options: SpawnOptions = {
    env: createMcpEnvironment(
      input.baseUrl,
      input.token,
      input.providerEnabled
    ),
    stdio: ["inherit", "inherit", "pipe"]
  };
  const child = spawn(process.execPath, [MCP_ENTRY], options);
  child.stderr?.setEncoding("utf8");
  child.stderr?.on("data", () => safeDiagnostic("mcp_diagnostic"));
  return child;
}

export function createMemoryOnlyMcpEnvironment(
  baseUrl: string,
  token: string
): Readonly<Record<string, string>> {
  return createMcpEnvironment(baseUrl, token, false);
}

export function createMcpEnvironment(
  baseUrl: string,
  token: string,
  providerEnabled: boolean
): Readonly<Record<string, string>> {
  return {
    SOURCE_WIRE_API_URL: baseUrl,
    SOURCE_WIRE_MCP_TOKEN: token,
    SOURCE_WIRE_MCP_TOOL_PROFILE: providerEnabled
      ? "provider"
      : "memory_only"
  };
}

function drainChildOutput(child: ChildProcess): void {
  child.stdout?.resume();
  child.stderr?.resume();
}

async function waitForApi(
  baseUrl: string,
  expectedPort: number,
  child: ChildProcess
): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new SourceWireLocalCliError("api_start_failed"));
      }, API_START_TIMEOUT_MS);
      const onMessage = (message: unknown) => {
        if (
          !message ||
          typeof message !== "object" ||
          Array.isArray(message) ||
          (message as Record<string, unknown>).kind !==
            "source_wire.api.ready"
        ) {
          return;
        }
        cleanup();
        if (
          (message as Record<string, unknown>).port !== expectedPort
        ) {
          reject(new SourceWireLocalCliError("api_start_failed"));
          return;
        }
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new SourceWireLocalCliError("api_start_failed"));
      };
      const onExit = () => {
        cleanup();
        reject(new SourceWireLocalCliError("api_start_failed"));
      };
      const cleanup = () => {
        clearTimeout(timeout);
        child.removeListener("message", onMessage);
        child.removeListener("error", onError);
        child.removeListener("exit", onExit);
      };
      child.on("message", onMessage);
      child.once("error", onError);
      child.once("exit", onExit);
    });
    const response = await fetch(`${baseUrl}/health/live`, {
      signal: AbortSignal.timeout(500)
    });
    if (
      response.status !== 200 ||
      response.headers.get("content-type")?.startsWith("application/json") !==
        true ||
      JSON.stringify(await response.json()) !== '{"status":"live"}'
    ) {
      throw new SourceWireLocalCliError("api_start_failed");
    }
  } catch (error) {
    if (error instanceof SourceWireLocalCliError) throw error;
    throw new SourceWireLocalCliError("api_start_failed");
  }
}

async function issueProcessCredential(input: {
  baseUrl: string;
  ownerToken: string;
  namespaceIds: readonly string[];
  sourceEvidenceRead: boolean;
}): Promise<IssuedProcessCredential> {
  const response = await postAdminJson(
    `${input.baseUrl}/v1alpha1/admin/harness-credentials`,
    input.ownerToken,
    {
      namespaceIds: input.namespaceIds,
      capabilities: [
        "memory_candidate.propose",
        "trusted_memory.search",
        ...(input.sourceEvidenceRead ? ["source_evidence.read"] : [])
      ],
      expiresAt: new Date(
        Date.now() + PROCESS_CREDENTIAL_TTL_MS
      ).toISOString()
    }
  );
  if (response.status !== 201) {
    throw new SourceWireLocalCliError("credential_issue_failed");
  }
  const data = requireRecord(response.body.data);
  if (
    typeof data.credentialId !== "string" ||
    typeof data.secret !== "string" ||
    data.secret.length < 1 ||
    data.secret.length > 512
  ) {
    throw new SourceWireLocalCliError("credential_issue_failed");
  }
  try {
    assertCredentialIdentifier(data.credentialId);
  } catch {
    throw new SourceWireLocalCliError("credential_issue_failed");
  }
  return {
    credentialId: data.credentialId,
    secret: data.secret
  };
}

async function revokeProcessCredentialForCleanup(input: {
  baseUrl: string;
  ownerToken: string;
  runtimeDatabaseUrl: string;
  credentialId: string;
  apiAvailable: boolean;
}): Promise<void> {
  if (input.apiAvailable) {
    try {
      await revokeProcessCredential({
        baseUrl: input.baseUrl,
        ownerToken: input.ownerToken,
        credentialId: input.credentialId
      });
      return;
    } catch {
      // The API may fail between the liveness check and this request.
    }
  }
  await revokeProcessCredentialDirectly(
    input.runtimeDatabaseUrl,
    input.credentialId
  );
}

async function revokeProcessCredential(input: {
  baseUrl: string;
  ownerToken: string;
  credentialId: string;
}): Promise<void> {
  const response = await postAdminJson(
    `${input.baseUrl}/v1alpha1/admin/credentials/${encodeURIComponent(
      input.credentialId
    )}/revoke`,
    input.ownerToken,
    {
      expectedStatus: "active"
    }
  );
  if (response.status !== 200) {
    throw new SourceWireLocalCliError("credential_revoke_failed");
  }
}

async function revokeProcessCredentialDirectly(
  databaseUrl: string,
  credentialId: string
): Promise<void> {
  const database = createRuntimeDatabase(databaseUrl);
  const client = await database.pool.connect().catch(() => {
    throw new SourceWireLocalCliError("credential_revoke_failed");
  });
  try {
    await client.query("BEGIN");
    const update = await client.query<{ owner_id: string }>(
      `UPDATE source_wire_memory.credentials
          SET status = 'revoked', updated_at = clock_timestamp()
        WHERE credential_id = $1
          AND credential_class = 'harness'
          AND status = 'active'
      RETURNING owner_id`,
      [credentialId]
    );
    if (update.rowCount === 0) {
      const current = await client.query<{ status: string }>(
        `SELECT status
           FROM source_wire_memory.credentials
          WHERE credential_id = $1
            AND credential_class = 'harness'`,
        [credentialId]
      );
      if (current.rowCount !== 1 || current.rows[0]?.status !== "revoked") {
        throw new SourceWireLocalCliError("credential_revoke_failed");
      }
      await client.query("COMMIT");
      return;
    }
    await client.query(
      `INSERT INTO source_wire_memory.audit_events (
         event_id,
         trace_id,
         operation,
         result,
         actor_reference,
         owner_id,
         metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        randomUUID(),
        randomUUID(),
        "revoke_process_credential",
        "allowed",
        "local_runner",
        update.rows[0]?.owner_id,
        JSON.stringify({
          credentialScope: "local_process",
          detailsRedacted: true
        })
      ]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    if (error instanceof SourceWireLocalCliError) throw error;
    throw new SourceWireLocalCliError("credential_revoke_failed");
  } finally {
    client.release();
    await database.pool.end().catch(() => undefined);
  }
}

async function postAdminJson(
  url: string,
  token: string,
  body: Record<string, unknown>
): Promise<{ status: number; body: Record<string, unknown> }> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `local_${randomUUID()}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3_000)
    });
  } catch {
    throw new SourceWireLocalCliError("api_unavailable");
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_ADMIN_RESPONSE_BYTES) {
    throw new SourceWireLocalCliError("api_unavailable");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new SourceWireLocalCliError("api_unavailable");
  }
  const envelope = requireRecord(parsed);
  if (envelope.schema !== STORY1_API_SCHEMA) {
    throw new SourceWireLocalCliError("api_unavailable");
  }
  return { status: response.status, body: envelope };
}

async function waitForComposition(
  api: ChildProcess,
  mcp: ChildProcess
): Promise<ChildOutcome> {
  return Promise.race([
    waitForExit(api).then((code) => ({ source: "api" as const, code })),
    waitForExit(mcp).then((code) => ({ source: "mcp" as const, code }))
  ]);
}

async function waitForExit(child: ChildProcess): Promise<number> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return child.exitCode ?? 1;
  }
  return new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

async function stopChild(child: ChildProcess | undefined): Promise<void> {
  if (!child || !childIsRunning(child)) return;
  child.kill("SIGTERM");
  const stopped = await Promise.race([
    waitForExit(child).then(
      () => true,
      () => false
    ),
    delay(CHILD_STOP_TIMEOUT_MS).then(() => false)
  ]);
  if (!stopped && childIsRunning(child)) {
    child.kill("SIGKILL");
    await waitForExit(child).catch(() => undefined);
  }
}

function childIsRunning(child: ChildProcess | undefined): boolean {
  return Boolean(
    child &&
      child.exitCode === null &&
      child.signalCode === null
  );
}

async function findAvailablePort(
  host: "127.0.0.1" | "::1"
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      const port =
        address && typeof address === "object" ? address.port : undefined;
      server.close((error) => {
        if (error) {
          reject(error);
        } else if (port === undefined) {
          reject(new Error("port_unavailable"));
        } else {
          resolve(port);
        }
      });
    });
  }).catch(() => {
    throw new SourceWireLocalCliError("api_start_failed");
  });
}

function requireReferencedEnvironment(
  name: string,
  environment: NodeJS.ProcessEnv
): string {
  const value = environment[name];
  if (!value) {
    throw new SourceWireLocalCliError("environment_missing");
  }
  return value;
}

function parseStory6ConformanceFault(
  environment: NodeJS.ProcessEnv
): Story6ConformanceFault | undefined {
  const value = environment.SOURCE_WIRE_STORY6_LOCAL_FAULT;
  if (value === undefined) return undefined;
  if (
    environment.SOURCE_WIRE_CONFORMANCE_MODE !== "story6" ||
    !STORY6_CONFORMANCE_FAULTS.has(value as Story6ConformanceFault)
  ) {
    throw new SourceWireLocalCliError("environment_invalid");
  }
  return value as Story6ConformanceFault;
}

function throwIfInterrupted(interrupted: boolean): void {
  if (interrupted) {
    throw new SourceWireLocalCliError("composition_failed");
  }
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SourceWireLocalCliError("api_unavailable");
  }
  return value as Record<string, unknown>;
}

function formatHost(host: "127.0.0.1" | "::1"): string {
  return host === "::1" ? "[::1]" : host;
}

function safeDiagnostic(code: string): void {
  process.stderr.write(
    `${JSON.stringify({
      operation: "local.mcp.stdio",
      result: code,
      detailsRedacted: true
    })}\n`
  );
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
