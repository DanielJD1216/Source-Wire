import { randomUUID } from "node:crypto";

import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";

import {
  assertIdempotencyKey,
  MAX_AUTHORIZATION_BYTES,
  MAX_JSON_BODY_BYTES,
  STORY1_API_SCHEMA
} from "./config.js";
import {
  decideMemoryCandidate,
  listMemoryCandidates,
  parseCandidateDecision,
  parseCandidateListQuery,
  parseCandidateProposal,
  proposeMemoryCandidate
} from "./candidate-lifecycle.js";
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
import { parseStrictJsonObject } from "./strict-json.js";
import {
  createTrustedMemorySearchResponse,
  executeTrustedMemorySearch,
  parseTrustedMemorySearch,
  serializeTrustedMemorySearchResponse,
  type ProtectedReadStageHook
} from "./trusted-memory-search.js";

type AppVariables = {
  traceId: string;
  operation: string;
  startedAt: number;
  actor: AuthenticatedCredential | undefined;
  namespaceId: string | undefined;
  safeResult: string;
  auditAvailability: "available" | "denial_audit_unavailable";
};

export type Story1AppOptions = {
  database: Story1Database;
  verifierKey: Buffer;
  verifierKeyId: string;
  getRemoteAddress: (
    context: Context<{ Variables: AppVariables }>
  ) => string | undefined;
  logger?: SafeLogger;
  processReleaseSecret: Buffer;
  onProtectedReadStage?: ProtectedReadStageHook;
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
    context.set("auditAvailability", "available");

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
        actorReference: context.get("actor")?.actorReference ?? "unknown",
        ...(context.get("auditAvailability") === "denial_audit_unavailable"
          ? { availabilityMarker: "denial_audit_unavailable" as const }
          : {})
      });
    }
  });

  app.use("/v1alpha1/*", async (context, next) => {
    const url = new URL(context.req.url);
    if (url.search.length > 0 && !isCandidateListRoute(context.req.method, context.req.path)) {
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

  app.post("/v1alpha1/memory-candidates", async (context) => {
    const body = await readStrictJson(context, [
      "namespaceId",
      "content",
      "provenance",
      "idempotencyKey"
    ]);
    const actor = await authenticateForContext(context, options);
    const proposal = parseCandidateProposal({
      namespaceId: body.namespaceId,
      content: body.content,
      provenance: body.provenance,
      idempotencyKey: body.idempotencyKey
    });
    context.set("namespaceId", proposal.namespaceId);
    const result = await proposeMemoryCandidate(
      options.database.pool,
      actor,
      proposal,
      context.get("traceId")
    );
    context.set("safeResult", "allowed");
    return context.json(
      {
        schema: STORY1_API_SCHEMA,
        traceId: context.get("traceId"),
        data: {
          candidateId: result.candidateId,
          state: result.state,
          createdAt: result.createdAt
        },
        audit: {
          eventId: result.auditEventId,
          releaseStatus: "not_applicable"
        }
      },
      201
    );
  });

  app.post("/v1alpha1/trusted-memories/search", async (context) => {
    const body = await readStrictJson(context, ["namespaceId", "query", "limit"]);
    const actor = await authenticateForContext(context, options);
    const input = parseTrustedMemorySearch(body);
    context.set("namespaceId", input.namespaceId);
    const execution = await executeTrustedMemorySearch(
      options.database.pool,
      actor,
      input,
      context.get("traceId"),
      {
        processReleaseSecret: options.processReleaseSecret,
        startedAtMs: context.get("startedAt"),
        signal: context.req.raw.signal,
        ...(options.onProtectedReadStage
          ? { onStage: options.onProtectedReadStage }
          : {})
      }
    );
    try {
      options.onProtectedReadStage?.("before_response_serialization");
      const serialized = serializeTrustedMemorySearchResponse(
        createTrustedMemorySearchResponse({
          traceId: context.get("traceId"),
          results: execution.results,
          auditEventId: execution.auditEventId,
          releaseStatus: execution.releaseStatus
        }),
        options.onProtectedReadStage
      );
      context.set("safeResult", "allowed");
      return context.body(serialized, 200, {
        "Content-Type": "application/json; charset=UTF-8"
      });
    } finally {
      execution.clear();
    }
  });

  app.get("/v1alpha1/admin/namespaces/:namespaceId/memory-candidates", async (context) => {
    const actor = await authenticateForContext(context, options);
    const namespaceId = requireNamespace(actor, context.req.param("namespaceId"));
    context.set("namespaceId", namespaceId);
    const result = await listMemoryCandidates(
      options.database.pool,
      actor,
      namespaceId,
      parseCandidateListQuery(new URL(context.req.url).searchParams),
      context.get("traceId"),
      options.verifierKey
    );
    context.set("safeResult", "allowed");
    return context.json({
      schema: STORY1_API_SCHEMA,
      traceId: context.get("traceId"),
      data: {
        items: result.items,
        ...(result.nextCursor ? { nextCursor: result.nextCursor } : {})
      },
      audit: {
        eventId: result.auditEventId,
        releaseStatus: "not_applicable"
      }
    });
  });

  app.post("/v1alpha1/admin/memory-candidates/:candidateId/decision", async (context) => {
    const body = await readStrictJson(context, [
      "namespaceId",
      "decision",
      "expectedState",
      "reason",
      "idempotencyKey"
    ]);
    const actor = await authenticateForContext(context, options);
    const decision = parseCandidateDecision(context.req.param("candidateId"), {
      namespaceId: body.namespaceId,
      decision: body.decision,
      expectedState: body.expectedState,
      reason: body.reason,
      idempotencyKey: body.idempotencyKey
    });
    context.set("namespaceId", decision.namespaceId);
    const result = await decideMemoryCandidate(
      options.database.pool,
      actor,
      decision,
      context.get("traceId")
    );
    context.set("safeResult", "allowed");
    return context.json({
      schema: STORY1_API_SCHEMA,
      traceId: context.get("traceId"),
      data: {
        candidateId: result.candidateId,
        state: result.state,
        decidedAt: result.decidedAt,
        ...(result.memoryId ? { memoryId: result.memoryId } : {}),
        ...(result.revisionId ? { revisionId: result.revisionId } : {})
      },
      audit: {
        eventId: result.auditEventId,
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
        context.set("auditAvailability", "denial_audit_unavailable");
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

  const body = parseStrictJsonObject(bytes);
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
  if (method === "POST" && path === "/v1alpha1/memory-candidates") {
    return "propose_memory_candidate";
  }
  if (method === "POST" && path === "/v1alpha1/trusted-memories/search") {
    return "search_trusted_memory";
  }
  if (method === "GET" && isCandidateListRoute(method, path)) {
    return "list_memory_candidates";
  }
  if (
    method === "POST" &&
    /^\/v1alpha1\/admin\/memory-candidates\/[^/]+\/decision$/u.test(path)
  ) {
    return "decide_memory_candidate";
  }
  if (method === "POST" && path === "/v1alpha1/admin/harness-credentials") {
    return "issue_harness_credential";
  }
  if (method === "POST" && path.endsWith("/rotate")) return "rotate_credential";
  if (method === "POST" && path.endsWith("/revoke")) return "revoke_credential";
  return "unsupported_operation";
}

function isCandidateListRoute(method: string, path: string): boolean {
  return (
    method === "GET" &&
    /^\/v1alpha1\/admin\/namespaces\/[^/]+\/memory-candidates$/u.test(path)
  );
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
