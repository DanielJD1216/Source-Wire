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
    database = createRuntimeDatabase(databaseUrl);
    const compatibility = await inspectSchemaCompatibility(database.pool);
    if (!compatibility.compatible) {
      throw new SafeError(compatibility.code, 503);
    }

    const app = createStory1App({
      database,
      verifierKey,
      verifierKeyId,
      getRemoteAddress: (context) => getConnInfo(context).remote.address
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

void main();
