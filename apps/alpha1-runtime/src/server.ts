import { serve } from "@hono/node-server";
import { getConnInfo } from "@hono/node-server/conninfo";

import {
  assertLoopbackHost,
  assertSourceWireIdentifier,
  parsePort,
  parseVerifierKey,
  requireEnvironment,
  STORY1_CONNECTION_CHECK_INTERVAL_MS,
  STORY1_HEADERS_TIMEOUT_MS,
  STORY1_REQUEST_TIMEOUT_MS
} from "./config.js";
import { createStory1App } from "./app.js";
import { createRuntimeDatabase } from "./database.js";
import { asSafeError, SafeError } from "./errors.js";
import { inspectSchemaCompatibility } from "./migration.js";
import {
  type ProviderReadStage,
  type ProviderReadStageHook
} from "./knowledge-provider-host.js";
import {
  createSyntheticKnowledgeProvider,
  type SyntheticKnowledgeProviderFault
} from "./knowledge-provider/synthetic-provider.js";
import {
  createReplaceableSyntheticProvider,
  REPLACEABLE_PROVIDER_SCOPE_ID
} from "./knowledge-provider/replaceable-synthetic-adapter.js";
import {
  acquireRuntimeRecoveryGuard,
  inspectRuntimeRecoveryGate
} from "./portable-recovery.js";
import { stdoutSafeLogger } from "./safe-log.js";
import { PostgresProviderReadAuditStore } from "./provider-read-audit-store.js";
import {
  createAlphaRuntimeComposition,
  createComposedKnowledgeProviderHost,
  type AlphaRuntimeComposition
} from "./runtime-composition.js";
import {
  validateLocalKnowledgeProviderConfig
} from "./local-cli/config.js";
import {
  loadKnowledgeProviderBinding
} from "./local-cli/provider.js";
import {
  createProcessReleaseSecret,
  type ProtectedReadStage
} from "./trusted-memory-search.js";

const STORY3_CRASH_POINTS = new Set<ProtectedReadStage>([
  "before_query",
  "after_query",
  "before_receipt_and_audit_commit",
  "after_durable_commit",
  "before_receipt_consumption",
  "after_receipt_consumption",
  "before_response_serialization",
  "during_response_serialization",
  "before_response_write"
]);

const STORY5_PROVIDER_CRASH_POINTS = new Set<ProviderReadStage>([
  "after_provider_return",
  "before_response_serialization",
  "during_response_serialization",
  "after_response_serialization",
  "before_audit_commit",
  "after_audit_commit",
  "before_receipt_consumption",
  "after_receipt_consumption",
  "before_response_write",
  "after_response_write"
]);

const STORY5_PROVIDER_FAULTS = new Set<SyntheticKnowledgeProviderFault>([
  "provider_scope_mismatch",
  "acl_denied",
  "provenance_missing",
  "result_bound_exceeded",
  "deadline_exceeded",
  "never_settles",
  "provider_outage"
]);

async function main(): Promise<void> {
  const traceId = crypto.randomUUID();
  const startedAt = Date.now();
  let database: ReturnType<typeof createRuntimeDatabase> | undefined;
  let releaseRecoveryGuard: (() => Promise<void>) | undefined;

  try {
    const host = assertLoopbackHost(process.env.SOURCE_WIRE_HOST ?? "127.0.0.1");
    const port = parsePort(process.env.SOURCE_WIRE_PORT);
    const databaseUrl = requireEnvironment("SOURCE_WIRE_DATABASE_URL");
    const verifierKey = parseVerifierKey(process.env.SOURCE_WIRE_TOKEN_VERIFIER_KEY);
    const verifierKeyId = assertSourceWireIdentifier(
      process.env.SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID ?? "local_alpha1",
      "verifierKeyId"
    );
    const crashPoint = parseConformanceCrashPoint(process.env);
    const pausePoint = parseStory4ConformancePause(process.env);
    const providerCrashPoint = parseStory5ProviderCrashPoint(process.env);
    const providerStageHook: ProviderReadStageHook | undefined =
      providerCrashPoint
        ? (stage) => {
            if (stage === providerCrashPoint) process.exit(87);
          }
        : undefined;
    const processReleaseSecret = createProcessReleaseSecret();
    database = createRuntimeDatabase(databaseUrl);
    const compatibility = await inspectSchemaCompatibility(database.pool);
    if (!compatibility.compatible) {
      throw new SafeError(compatibility.code, 503);
    }
    releaseRecoveryGuard = await acquireRuntimeRecoveryGuard(database.pool);
    if (
      (await inspectRuntimeRecoveryGate(database.pool)) !== "ready"
    ) {
      throw new SafeError("operation_unavailable", 503);
    }
    const runtimeComposition = await createRuntimeComposition(process.env);
    const knowledgeProviderHost = createComposedKnowledgeProviderHost({
      composition: runtimeComposition,
      auditStore: new PostgresProviderReadAuditStore(database.pool),
      processReleaseSecret,
      ...(providerStageHook ? { onStage: providerStageHook } : {})
    });

    const app = createStory1App({
      database,
      verifierKey,
      verifierKeyId,
      getRemoteAddress: (context) => getConnInfo(context).remote.address,
      processReleaseSecret,
      knowledgeProviderHost,
      ...(providerStageHook
        ? { onProviderReadStage: providerStageHook }
        : {}),
      ...(crashPoint || pausePoint
        ? {
            onProtectedReadStage: (stage: ProtectedReadStage) => {
              if (stage === crashPoint) {
                process.exit(86);
              }
              if (stage === pausePoint?.stage) {
                Atomics.wait(
                  new Int32Array(new SharedArrayBuffer(4)),
                  0,
                  0,
                  pausePoint.durationMs
                );
              }
            }
          }
        : {})
    });
    const server = serve({
      fetch: app.fetch,
      hostname: host,
      port,
      serverOptions: {
        requestTimeout: STORY1_REQUEST_TIMEOUT_MS,
        headersTimeout: STORY1_HEADERS_TIMEOUT_MS,
        connectionsCheckingInterval: STORY1_CONNECTION_CHECK_INTERVAL_MS
      }
    });
    await waitForListening(server);
    if (process.send) {
      process.send({
        kind: "source_wire.api.ready",
        port
      });
    }
    stdoutSafeLogger({
      traceId,
      operation: "server_start",
      result: "listening_loopback",
      durationMs: Date.now() - startedAt,
      actorReference: "operator"
    });

    const close = async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await releaseRecoveryGuard?.();
      releaseRecoveryGuard = undefined;
      await database?.pool.end();
    };
    process.once("SIGTERM", () => {
      void close().then(() => process.exit(0));
    });
    process.once("SIGINT", () => {
      void close().then(() => process.exit(0));
    });
  } catch (error) {
    await releaseRecoveryGuard?.().catch(() => undefined);
    releaseRecoveryGuard = undefined;
    await database?.pool.end().catch(() => undefined);
    const safeError = asSafeError(error);
    stdoutSafeLogger({
      traceId,
      operation: "server_start",
      result: safeError.code,
      durationMs: Date.now() - startedAt,
      actorReference: "operator"
    });
    process.exitCode = 1;
  }
}

function waitForListening(
  server: ReturnType<typeof serve>
): Promise<void> {
  if (server.listening) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const onListening = () => {
      server.removeListener("error", onError);
      resolve();
    };
    const onError = (error: Error) => {
      server.removeListener("listening", onListening);
      reject(error);
    };
    server.once("listening", onListening);
    server.once("error", onError);
  });
}

function parseStory5ProviderCrashPoint(
  environment: NodeJS.ProcessEnv
): ProviderReadStage | undefined {
  const value = environment.SOURCE_WIRE_STORY5_PROVIDER_CRASH_POINT;
  if (!value) return undefined;
  if (
    environment.SOURCE_WIRE_CONFORMANCE_MODE !== "story5" ||
    !STORY5_PROVIDER_CRASH_POINTS.has(value as ProviderReadStage)
  ) {
    throw new Error("story5_provider_crash_injection_refused");
  }
  return value as ProviderReadStage;
}

function createStory5RuntimeComposition(
  environment: NodeJS.ProcessEnv
): AlphaRuntimeComposition {
  const enabled = environment.SOURCE_WIRE_STORY5_SYNTHETIC_PROVIDER;
  if (!enabled) return createAlphaRuntimeComposition();
  if (
    enabled !== "enabled" ||
    environment.SOURCE_WIRE_CONFORMANCE_MODE !== "story5"
  ) {
    throw new Error("story5_provider_binding_refused");
  }
  const fault = parseStory5SyntheticProviderFault(environment);
  const adapter = parseStory5ProviderAdapter(environment);
  return createAlphaRuntimeComposition({
    provider:
      adapter === "replaceable"
        ? createReplaceableSyntheticProvider(
            fault === undefined ? undefined : { fault }
          )
        : createSyntheticKnowledgeProvider(
            fault === undefined ? undefined : { fault }
          ),
    ownerId: assertSourceWireIdentifier(
      requireEnvironment("SOURCE_WIRE_STORY5_OWNER_ID", environment),
      "ownerId"
    ),
    namespaceId: assertSourceWireIdentifier(
      requireEnvironment("SOURCE_WIRE_STORY5_NAMESPACE_ID", environment),
      "namespaceId"
    ),
    providerScopeId:
      adapter === "replaceable"
        ? REPLACEABLE_PROVIDER_SCOPE_ID
        : "scope_docs_alpha",
    timeoutMs: 1_000
  });
}

async function createRuntimeComposition(
  environment: NodeJS.ProcessEnv
): Promise<AlphaRuntimeComposition> {
  const localProviderMode =
    environment.SOURCE_WIRE_LOCAL_PROVIDER_MODE;
  if (localProviderMode === undefined) {
    return createStory5RuntimeComposition(environment);
  }
  if (
    localProviderMode !== "enabled" ||
    environment.SOURCE_WIRE_CONFORMANCE_MODE !== undefined ||
    Object.keys(environment).some((key) =>
      key.startsWith("SOURCE_WIRE_STORY5_")
    )
  ) {
    throw new Error("local_provider_binding_refused");
  }
  const providerConfig = validateLocalKnowledgeProviderConfig({
    module: requireEnvironment(
      "SOURCE_WIRE_LOCAL_PROVIDER_MODULE",
      environment
    ),
    exportName: requireEnvironment(
      "SOURCE_WIRE_LOCAL_PROVIDER_EXPORT",
      environment
    ),
    providerScopeId: requireEnvironment(
      "SOURCE_WIRE_LOCAL_PROVIDER_SCOPE_ID",
      environment
    ),
    timeoutMs: Number(
      requireEnvironment(
        "SOURCE_WIRE_LOCAL_PROVIDER_TIMEOUT_MS",
        environment
      )
    )
  });
  const loaded = await loadKnowledgeProviderBinding({
    providerConfig,
    ownerId: assertSourceWireIdentifier(
      requireEnvironment(
        "SOURCE_WIRE_LOCAL_PROVIDER_OWNER_ID",
        environment
      ),
      "ownerId"
    ),
    namespaceId: assertSourceWireIdentifier(
      requireEnvironment(
        "SOURCE_WIRE_LOCAL_PROVIDER_NAMESPACE_ID",
        environment
      ),
      "namespaceId"
    )
  });
  return createAlphaRuntimeComposition(loaded.binding);
}

function parseStory5ProviderAdapter(
  environment: NodeJS.ProcessEnv
): "baseline" | "replaceable" {
  const value =
    environment.SOURCE_WIRE_STORY5_PROVIDER_ADAPTER ?? "baseline";
  if (
    environment.SOURCE_WIRE_CONFORMANCE_MODE !== "story5" ||
    (value !== "baseline" && value !== "replaceable")
  ) {
    throw new Error("story5_provider_adapter_refused");
  }
  return value;
}

function parseStory5SyntheticProviderFault(
  environment: NodeJS.ProcessEnv
): SyntheticKnowledgeProviderFault | undefined {
  const value = environment.SOURCE_WIRE_STORY5_SYNTHETIC_FAULT;
  if (!value) return undefined;
  if (
    environment.SOURCE_WIRE_CONFORMANCE_MODE !== "story5" ||
    !STORY5_PROVIDER_FAULTS.has(value as SyntheticKnowledgeProviderFault)
  ) {
    throw new Error("story5_provider_fault_injection_refused");
  }
  return value as SyntheticKnowledgeProviderFault;
}

function parseConformanceCrashPoint(
  environment: NodeJS.ProcessEnv
): ProtectedReadStage | undefined {
  const value = environment.SOURCE_WIRE_STORY3_CRASH_POINT;
  if (!value) return undefined;
  if (
    environment.SOURCE_WIRE_CONFORMANCE_MODE !== "story3" ||
    !STORY3_CRASH_POINTS.has(value as ProtectedReadStage)
  ) {
    throw new Error("story3_crash_injection_refused");
  }
  return value as ProtectedReadStage;
}

function parseStory4ConformancePause(
  environment: NodeJS.ProcessEnv
): { stage: ProtectedReadStage; durationMs: number } | undefined {
  const stage = environment.SOURCE_WIRE_STORY4_PAUSE_STAGE;
  if (!stage) return undefined;
  const durationMs = Number(
    environment.SOURCE_WIRE_STORY4_PAUSE_DURATION_MS
  );
  if (
    environment.SOURCE_WIRE_CONFORMANCE_MODE !== "story4" ||
    !STORY3_CRASH_POINTS.has(stage as ProtectedReadStage) ||
    !Number.isSafeInteger(durationMs) ||
    durationMs < 100 ||
    durationMs > 2_000
  ) {
    throw new Error("story4_pause_injection_refused");
  }
  return {
    stage: stage as ProtectedReadStage,
    durationMs
  };
}

void main();
