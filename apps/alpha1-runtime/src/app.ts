import { randomUUID } from "node:crypto";

import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";

import {
  assertIdempotencyKey,
  MAX_AUTHORIZATION_BYTES,
  MAX_JSON_BODY_BYTES,
  STORY1_API_SCHEMA
} from "./config.js";
import type { Story1Database } from "./database.js";
import { asSafeError, SafeError } from "./errors.js";
import { inspectSchemaCompatibility } from "./migration.js";
import { LocalProtectedRequestGate } from "./rate-gate.js";
import {
  authenticateCredential,
  issueHarnessCredential,
  recordAudit,
  requireCapability,
  requireNamespace,
  revokeCredential,
  rotateCredential,
  rotateHarnessCredential,
  type AuthenticatedCredential
} from "./repository.js";
import { stdoutSafeLogger, type SafeLogger } from "./safe-log.js";

type AppVariables = {
  traceId: string;
  operation: string;
  startedAt: number;
  actor: AuthenticatedCredential | undefined;
  namespaceId: string | undefined;
  safeResult: string;
};

export type Story1AppOptions = {
  database: Story1Database;
  verifierKey: Buffer;
  verifierKeyId: string;
  getRemoteAddress: (
    context: Context<{ Variables: AppVariables }>
  ) => string | undefined;
  logger?: SafeLogger;
};

export function createStory1App(options: Story1AppOptions): Hono<{ Variables: AppVariables }> {
  const app = new Hono<{ Variables: AppVariables }>();
  const gate = new LocalProtectedRequestGate();
  const logger = options.logger ?? stdoutSafeLogger;

  app.use("*", async (context, next) => {
    context.set("traceId", randomUUID());
    context.set("operation", operationFor(context.req.method, context.req.path));
    context.set("startedAt", Date.now());
    context.set("actor", undefined);
    context.set("namespaceId", undefined);
    context.set("safeResult", "operation_unavailable");

    try {
      await next();
    } finally {
      context.header("Cache-Control", "no-store");
      context.header("X-Content-Type-Options", "nosniff");
      logger({
        traceId: context.get("traceId"),
        operation: context.get("operation"),
        result: context.get("safeResult"),
        durationMs: Math.max(0, Date.now() - context.get("startedAt")),
        actorReference: context.get("actor")?.actorReference ?? "unknown"
      });
    }
  });

  app.use("/v1alpha1/*", async (context, next) => {
    const url = new URL(context.req.url);
    if (url.search.length > 0) {
      throw new SafeError("validation_failed", 400);
    }

    const authorization = context.req.header("Authorization");
    if (
      authorization &&
      Buffer.byteLength(authorization, "utf8") > MAX_AUTHORIZATION_BYTES
    ) {
      throw new SafeError("validation_failed", 400);
    }

    await next();
  });

  app.use("/v1alpha1/*", async (context, next) => {
    await gate.run(options.getRemoteAddress(context), next);
  });

  app.use(
    "/v1alpha1/*",
    bodyLimit({
      maxSize: MAX_JSON_BODY_BYTES,
      onError: () => {
        throw new SafeError("validation_failed", 413);
      }
    })
  );

  app.get("/health/live", (context) => {
    context.set("safeResult", "live");
    return context.json({ status: "live" } as const);
  });

  app.post("/v1alpha1/health", async (context) => {
    const body = await readStrictJson(context, ["namespaceId"]);
    const actor = await authenticateForContext(context, options);
    const namespaceId = requireNamespace(actor, body.namespaceId);
    context.set("namespaceId", namespaceId);
    requireCapability(actor, "runtime.health");

    const compatibility = await inspectSchemaCompatibility(options.database.pool);
    if (!compatibility.compatible) {
      throw new SafeError(compatibility.code, 503);
    }
    const auditEventId = await recordAudit(options.database.pool, {
      traceId: context.get("traceId"),
      operation: context.get("operation"),
      result: "allowed",
      actor,
      namespaceId
    });
    context.set("safeResult", "allowed");
    return context.json({
      schema: STORY1_API_SCHEMA,
      traceId: context.get("traceId"),
      data: {
        status: "healthy",
        schemaCompatibility: "compatible"
      },
      audit: {
        eventId: auditEventId,
        releaseStatus: "not_applicable"
      }
    });
  });

  app.post("/v1alpha1/admin/harness-credentials", async (context) => {
    const body = await readStrictJson(context, [
      "namespaceIds",
      "capabilities",
      "expiresAt"
    ]);
    const idempotencyKey = requireIdempotencyHeader(context);
    const actor = await authenticateForContext(context, options, true);
    const result = await issueHarnessCredential(
      options.database.pool,
      actor,
      options.verifierKey,
      options.verifierKeyId,
      {
        namespaceIds: body.namespaceIds,
        capabilities: body.capabilities,
        expiresAt: body.expiresAt
      },
      idempotencyKey,
      context.get("traceId")
    );
    context.set("safeResult", "allowed");
    return context.json(
      {
        schema: STORY1_API_SCHEMA,
        traceId: context.get("traceId"),
        data: result.credential,
        audit: {
          eventId: result.auditEventId,
          releaseStatus: "not_applicable"
        }
      },
      201
    );
  });

  app.post("/v1alpha1/admin/harness-credentials/:credentialId/rotate", async (context) => {
    await readStrictJson(context, []);
    const idempotencyKey = requireIdempotencyHeader(context);
    const actor = await authenticateForContext(context, options, true);
    const result = await rotateHarnessCredential(
      options.database.pool,
      actor,
      options.verifierKey,
      options.verifierKeyId,
      context.req.param("credentialId"),
      idempotencyKey,
      context.get("traceId")
    );
    context.set("safeResult", "allowed");
    return context.json({
      schema: STORY1_API_SCHEMA,
      traceId: context.get("traceId"),
      data: result.credential,
      audit: {
        eventId: result.auditEventId,
        releaseStatus: "not_applicable"
      }
    });
  });

  app.post("/v1alpha1/admin/credentials/:credentialId/rotate", async (context) => {
    await readStrictJson(context, []);
    const idempotencyKey = requireIdempotencyHeader(context);
    const actor = await authenticateForContext(context, options, true);
    const result = await rotateCredential(
      options.database.pool,
      actor,
      options.verifierKey,
      options.verifierKeyId,
      context.req.param("credentialId"),
      idempotencyKey,
      context.get("traceId")
    );
    context.set("safeResult", "allowed");
    return context.json({
      schema: STORY1_API_SCHEMA,
      traceId: context.get("traceId"),
      data: result.credential,
      audit: {
        eventId: result.auditEventId,
        releaseStatus: "not_applicable"
      }
    });
  });

  app.post("/v1alpha1/admin/credentials/:credentialId/revoke", async (context) => {
    const body = await readStrictJson(context, ["expectedStatus"]);
    const idempotencyKey = requireIdempotencyHeader(context);
    if (body.expectedStatus !== "active") {
      throw new SafeError("validation_failed", 400);
    }
    const actor = await authenticateForContext(context, options, true);
    const result = await revokeCredential(
      options.database.pool,
      actor,
      options.verifierKey,
      context.req.param("credentialId"),
      idempotencyKey,
      context.get("traceId")
    );
    context.set("safeResult", "allowed");
    return context.json({
      schema: STORY1_API_SCHEMA,
      traceId: context.get("traceId"),
      data: {
        credentialId: result.credentialId,
        status: result.status
      },
      audit: {
        eventId: result.auditEventId,
        releaseStatus: "not_applicable"
      }
    });
  });

  app.notFound((context) => {
    context.set("safeResult", "validation_failed");
    return context.json(safeErrorEnvelope(context.get("traceId"), new SafeError("validation_failed", 404)), 404);
  });

  app.onError(async (error, context) => {
    const safeError = asSafeError(error);
    context.set("safeResult", safeError.code);
    let auditEventId: string | undefined;

    if (context.req.path.startsWith("/v1alpha1/")) {
      try {
        const auditInput: Parameters<typeof recordAudit>[1] = {
          traceId: context.get("traceId"),
          operation: context.get("operation"),
          result: "denied",
          denialCode: safeError.code
        };
        const actor = context.get("actor");
        const namespaceId = context.get("namespaceId");
        if (actor) auditInput.actor = actor;
        if (namespaceId) auditInput.namespaceId = namespaceId;
        auditEventId = await recordAudit(options.database.pool, auditInput);
      } catch {
        auditEventId = undefined;
      }
    }

    const envelope = safeErrorEnvelope(context.get("traceId"), safeError);
    if (auditEventId) {
      return context.json(
        {
          ...envelope,
          audit: {
            eventId: auditEventId,
            releaseStatus: "not_applicable"
          }
        },
        safeError.status as 400
      );
    }
    return context.json(envelope, safeError.status as 400);
  });

  return app;
}

async function authenticateForContext(
  context: Context<{ Variables: AppVariables }>,
  options: Story1AppOptions,
  allowRotatedCredential = false
): Promise<AuthenticatedCredential> {
  const actor = await authenticateCredential(
    options.database,
    options.verifierKey,
    options.verifierKeyId,
    context.req.header("Authorization"),
    { allowRotatedCredential }
  );
  context.set("actor", actor);
  return actor;
}

async function readStrictJson(
  context: Context<{ Variables: AppVariables }>,
  allowedFields: string[]
): Promise<Record<string, unknown>> {
  const contentType = context.req.header("Content-Type")?.toLowerCase() ?? "";
  if (!/^application\/json(?:;\s*charset=utf-8)?$/u.test(contentType)) {
    throw new SafeError("validation_failed", 415);
  }

  const declaredLength = Number(context.req.header("Content-Length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BODY_BYTES) {
    throw new SafeError("validation_failed", 413);
  }
  const bytes = Buffer.from(await context.req.arrayBuffer());
  if (bytes.length > MAX_JSON_BODY_BYTES) {
    throw new SafeError("validation_failed", 413);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new SafeError("validation_failed", 400);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SafeError("validation_failed", 400);
  }

  const body = parsed as Record<string, unknown>;
  if (Object.keys(body).some((field) => !allowedFields.includes(field))) {
    throw new SafeError("validation_failed", 400);
  }
  return body;
}

function requireIdempotencyHeader(context: Context<{ Variables: AppVariables }>): string {
  try {
    return assertIdempotencyKey(context.req.header("Idempotency-Key"));
  } catch {
    throw new SafeError("validation_failed", 400);
  }
}

function operationFor(method: string, path: string): string {
  if (method === "GET" && path === "/health/live") return "public_liveness";
  if (method === "POST" && path === "/v1alpha1/health") return "runtime_health";
  if (method === "POST" && path === "/v1alpha1/admin/harness-credentials") {
    return "issue_harness_credential";
  }
  if (method === "POST" && path.endsWith("/rotate")) return "rotate_credential";
  if (method === "POST" && path.endsWith("/revoke")) return "revoke_credential";
  return "unsupported_operation";
}

function safeErrorEnvelope(traceId: string, error: SafeError) {
  return {
    schema: STORY1_API_SCHEMA,
    traceId,
    error: {
      code: error.code,
      message: "The requested operation is not allowed.",
      retryable: error.retryable
    }
  };
}
