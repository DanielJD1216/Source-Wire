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
  acquireRuntimeRecoveryGuard,
  inspectRuntimeRecoveryGate
} from "./portable-recovery.js";
import { stdoutSafeLogger } from "./safe-log.js";
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

    const app = createStory1App({
      database,
      verifierKey,
      verifierKeyId,
      getRemoteAddress: (context) => getConnInfo(context).remote.address,
      processReleaseSecret,
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
