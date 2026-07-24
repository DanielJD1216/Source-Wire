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
  "during_response_serialization"
]);

async function main(): Promise<void> {
  const traceId = crypto.randomUUID();
  const startedAt = Date.now();
  let database: ReturnType<typeof createRuntimeDatabase> | undefined;

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
    const processReleaseSecret = createProcessReleaseSecret();
    database = createRuntimeDatabase(databaseUrl);
    const compatibility = await inspectSchemaCompatibility(database.pool);
    if (!compatibility.compatible) {
      throw new SafeError(compatibility.code, 503);
    }

    const app = createStory1App({
      database,
      verifierKey,
      verifierKeyId,
      getRemoteAddress: (context) => getConnInfo(context).remote.address,
      processReleaseSecret,
      ...(crashPoint
        ? {
            onProtectedReadStage: (stage: ProtectedReadStage) => {
              if (stage === crashPoint) {
                process.exit(86);
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
      await database?.pool.end();
    };
    process.once("SIGTERM", () => {
      void close().then(() => process.exit(0));
    });
    process.once("SIGINT", () => {
      void close().then(() => process.exit(0));
    });
  } catch (error) {
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

void main();
