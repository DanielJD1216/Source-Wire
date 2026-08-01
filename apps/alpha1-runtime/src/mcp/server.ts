import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { parseCandidateProposal } from "../candidate-lifecycle.js";
import {
  assertLoopbackHost,
  MAX_CANDIDATE_CONTENT_BYTES,
  MAX_LIST_CURSOR_BYTES,
  MAX_OWNER_ASSERTION_BYTES,
  MAX_PROTECTED_READ_RESPONSE_BYTES,
  MAX_SOURCE_EVIDENCE_EXCERPT_BYTES,
  MAX_SOURCE_EVIDENCE_QUERY_BYTES,
  MAX_SOURCE_EVIDENCE_SEARCH_RESULTS,
  MAX_TRUSTED_MEMORY_QUERY_BYTES,
  MAX_TRUSTED_MEMORY_RESULT_CONTENT_BYTES,
  MAX_TRUSTED_MEMORY_SEARCH_RESULTS,
  requireEnvironment,
  STORY1_API_SCHEMA
} from "../config.js";
import { SafeError } from "../errors.js";
import {
  parseTrustedMemorySearch,
  type TrustedMemorySearchResult
} from "../trusted-memory-search.js";
import { BoundedStdioInput } from "./bounded-stdio.js";
import {
  createProfileRestrictedMcpServer,
  readToolProfile
} from "./tool-profile.js";

const identifier = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/u);
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const boundedText = (maximumBytes: number) =>
  z
    .string()
    .min(1)
    .refine((value) => !value.includes("\0"), "invalid text")
    .refine((value) => !hasUnpairedSurrogate(value), "invalid Unicode")
    .refine((value) => Buffer.byteLength(value, "utf8") <= maximumBytes, "text too large");
const opaqueProviderKey = z
  .string()
  .min(1)
  .refine((value) => !hasUnpairedSurrogate(value), "invalid Unicode")
  .refine(
    (value) => !/[\u0000-\u001F\u007F]/u.test(value),
    "control character not allowed"
  )
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 512,
    "provider key too large"
  );
const provenance = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("owner_assertion"),
      assertion: boundedText(MAX_OWNER_ASSERTION_BYTES)
    })
    .strict(),
  z
    .object({
      kind: z.literal("prior_memory"),
      memoryId: z.string().uuid(),
      revisionId: z.string().uuid()
    })
    .strict()
]);
const proposalInput = z
  .object({
    namespaceId: identifier,
    content: boundedText(MAX_CANDIDATE_CONTENT_BYTES),
    provenance,
    idempotencyKey: identifier
  })
  .strict();
const searchInput = z
  .object({
    namespaceId: identifier,
    query: boundedText(MAX_TRUSTED_MEMORY_QUERY_BYTES).refine(
      (value) => value.trim().length > 0,
      "query required"
    ),
    limit: z.number().int().min(1).max(MAX_TRUSTED_MEMORY_SEARCH_RESULTS).optional()
  })
  .strict();
const sourceEvidenceSearchInput = z
  .object({
    namespaceId: identifier,
    query: boundedText(MAX_SOURCE_EVIDENCE_QUERY_BYTES).refine(
      (value) => value.trim().length > 0,
      "query required"
    ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(MAX_SOURCE_EVIDENCE_SEARCH_RESULTS)
      .optional(),
    cursor: z
      .object({
        providerId: identifier,
        providerScopeId: identifier,
        value: z
          .string()
          .min(1)
          .max(MAX_LIST_CURSOR_BYTES)
          .regex(/^[A-Za-z0-9_-]+$/u)
      })
      .strict()
      .optional(),
    freshness: z.enum(["fresh", "stale", "unknown"]).optional(),
    sensitivity: z
      .enum(["public", "internal", "confidential", "restricted"])
      .optional()
  })
  .strict();
const sourceEvidenceGetInput = z
  .object({
    namespaceId: identifier,
    sourceId: opaqueProviderKey,
    segmentId: opaqueProviderKey
  })
  .strict();

async function main(): Promise<void> {
  rejectForbiddenAuthority();
  const baseUrl = validateBaseUrl(requireEnvironment("SOURCE_WIRE_API_URL"));
  const token = requireEnvironment("SOURCE_WIRE_MCP_TOKEN");
  const toolProfile = readToolProfile(process.env.SOURCE_WIRE_MCP_TOOL_PROFILE);
  const server = createProfileRestrictedMcpServer(
    {
      name: "source-wire-alpha1-story3",
      version: "0.0.0-alpha.3"
    },
    {
      capabilities: {
        tools: {}
      }
    },
    toolProfile
  );

  if (toolProfile === "provider") {
    server.registerTool(
      "get_source_evidence",
      {
        title: "Get source evidence",
        description:
          "Fetches one exact read-only source-evidence segment in a granted namespace through the loopback API policy boundary. Evidence is not trusted memory.",
        inputSchema: sourceEvidenceGetInput,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        }
      },
      async (input) => {
        try {
          const response = await fetch(`${baseUrl}/v1alpha1/source-evidence/get`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              namespaceId: input.namespaceId,
              sourceId: input.sourceId,
              segmentId: input.segmentId
            }),
            signal: AbortSignal.timeout(5_000)
          });
          const body = await readSafeApiBody(response);
          if (!response.ok) {
            return safeToolError(readSafeErrorCode(body));
          }
          const safeResult = readSourceEvidenceSearchResult(body, "get");
          return {
            content: [
              { type: "text" as const, text: JSON.stringify(safeResult) }
            ],
            structuredContent: safeResult
          };
        } catch (error) {
          const code =
            error instanceof SafeError ? error.code : "operation_unavailable";
          return safeToolError(code);
        }
      }
    );

    server.registerTool(
      "search_source_evidence",
      {
        title: "Search source evidence",
        description:
          "Searches read-only source evidence in one granted namespace through the loopback API policy boundary. Evidence is not trusted memory.",
        inputSchema: sourceEvidenceSearchInput,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        }
      },
      async (input) => {
        try {
          const response = await fetch(
            `${baseUrl}/v1alpha1/source-evidence/search`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                namespaceId: input.namespaceId,
                query: input.query,
                limit: input.limit ?? MAX_SOURCE_EVIDENCE_SEARCH_RESULTS,
                ...(input.cursor === undefined
                  ? {}
                  : { cursor: input.cursor }),
                ...(input.freshness === undefined
                  ? {}
                  : { freshness: input.freshness }),
                ...(input.sensitivity === undefined
                  ? {}
                  : { sensitivity: input.sensitivity })
              }),
              signal: AbortSignal.timeout(5_000)
            }
          );
          const body = await readSafeApiBody(response);
          if (!response.ok) {
            return safeToolError(readSafeErrorCode(body));
          }
          const safeResult = readSourceEvidenceSearchResult(body, "search");
          return {
            content: [
              { type: "text" as const, text: JSON.stringify(safeResult) }
            ],
            structuredContent: safeResult
          };
        } catch (error) {
          const code =
            error instanceof SafeError ? error.code : "operation_unavailable";
          return safeToolError(code);
        }
      }
    );
  }

  server.registerTool(
    "search_trusted_memory",
    {
      title: "Search trusted memory",
      description:
        "Searches active, owner-approved Source-Wire memory in one granted namespace through the loopback API policy boundary.",
      inputSchema: searchInput,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => {
      try {
        const parsed = parseTrustedMemorySearch(input);
        const response = await fetch(`${baseUrl}/v1alpha1/trusted-memories/search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            namespaceId: parsed.namespaceId,
            query: parsed.query,
            limit: parsed.limit
          }),
          signal: AbortSignal.timeout(5_000)
        });
        const body = await readSafeApiBody(response);
        if (!response.ok) {
          return safeToolError(readSafeErrorCode(body));
        }
        const safeResult = readTrustedMemorySearchResult(body);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(safeResult) }],
          structuredContent: safeResult
        };
      } catch (error) {
        const code = error instanceof SafeError ? error.code : "operation_unavailable";
        return safeToolError(code);
      }
    }
  );

  if (toolProfile === "provider") {
    server.registerTool(
      "propose_memory_candidate",
      {
        title: "Propose a memory candidate",
        description:
          "Creates one pending Source-Wire memory candidate through the loopback API. It cannot approve trusted memory.",
        inputSchema: proposalInput,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        }
      },
      async (input) => {
        try {
          const parsed = parseCandidateProposal(input);
          const response = await fetch(`${baseUrl}/v1alpha1/memory-candidates`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              namespaceId: parsed.namespaceId,
              content: parsed.content,
              provenance: parsed.provenance,
              idempotencyKey: parsed.idempotencyKey
            }),
            signal: AbortSignal.timeout(3_000)
          });
          const body = await readSafeApiBody(response);
          if (!response.ok) {
            return safeToolError(readSafeErrorCode(body));
          }
          const data = body.data;
          if (!data || typeof data !== "object" || Array.isArray(data)) {
            return safeToolError("operation_unavailable");
          }
          const audit = body.audit;
          if (!audit || typeof audit !== "object" || Array.isArray(audit)) {
            return safeToolError("operation_unavailable");
          }
          const result = data as Record<string, unknown>;
          const auditResult = audit as Record<string, unknown>;
          if (
            typeof result.candidateId !== "string" ||
            !uuid.test(result.candidateId) ||
            result.state !== "pending" ||
            typeof result.createdAt !== "string" ||
            typeof body.traceId !== "string" ||
            !uuid.test(body.traceId) ||
            typeof auditResult.eventId !== "string" ||
            !uuid.test(auditResult.eventId)
          ) {
            return safeToolError("operation_unavailable");
          }
          const safeResult = {
            candidateId: result.candidateId,
            state: "pending" as const,
            createdAt: result.createdAt,
            traceId: body.traceId,
            auditEventId: auditResult.eventId
          };
          return {
            content: [
              { type: "text" as const, text: JSON.stringify(safeResult) }
            ],
            structuredContent: safeResult
          };
        } catch (error) {
          const code =
            error instanceof SafeError ? error.code : "operation_unavailable";
          return safeToolError(code);
        }
      }
    );
  }

  const boundedInput = new BoundedStdioInput();
  const transport = new StdioServerTransport(boundedInput, process.stdout);
  let closing = false;
  const close = async (exitCode: number) => {
    if (closing) return;
    closing = true;
    process.stdin.unpipe(boundedInput);
    await server.close().catch(() => undefined);
    process.exitCode = exitCode;
  };
  boundedInput.once("error", () => {
    safeStderr("stdio_frame_rejected");
    void close(1);
  });
  process.once("SIGTERM", () => void close(0));
  process.once("SIGINT", () => void close(0));
  process.stdin.pipe(boundedInput);
  await server.connect(transport);
}

function rejectForbiddenAuthority(): void {
  for (const name of [
    "SOURCE_WIRE_OWNER_TOKEN",
    "SOURCE_WIRE_DATABASE_URL",
    "SOURCE_WIRE_MIGRATOR_DATABASE_URL",
    "DATABASE_URL"
  ]) {
    if (process.env[name]) {
      throw new Error("forbidden_mcp_authority");
    }
  }
}

function validateBaseUrl(value: string): string {
  const url = new URL(value);
  if (
    url.protocol !== "http:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("loopback_api_required");
  }
  assertLoopbackHost(url.hostname.replace(/^\[|\]$/gu, ""));
  return url.origin;
}

async function readSafeApiBody(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new Error("invalid_api_response");
  }
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_PROTECTED_READ_RESPONSE_BYTES
  ) {
    throw new Error("invalid_api_response");
  }
  const text = await readBoundedResponseText(
    response,
    MAX_PROTECTED_READ_RESPONSE_BYTES
  );
  const parsed = JSON.parse(text) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("invalid_api_response");
  }
  const body = parsed as Record<string, unknown>;
  if (body.schema !== STORY1_API_SCHEMA) {
    throw new Error("invalid_api_response");
  }
  return body;
}

function readSourceEvidenceSearchResult(
  body: Record<string, unknown>,
  operation: "search" | "get"
) {
  const data = body.data;
  const audit = body.audit;
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !audit ||
    typeof audit !== "object" ||
    Array.isArray(audit) ||
    typeof body.traceId !== "string" ||
    !uuid.test(body.traceId)
  ) {
    throw new Error("invalid_api_response");
  }
  const dataValue = data as Record<string, unknown>;
  const auditValue = audit as Record<string, unknown>;
  if (
    !Array.isArray(dataValue.evidence) ||
    dataValue.evidence.length >
      (operation === "get" ? 1 : MAX_SOURCE_EVIDENCE_SEARCH_RESULTS) ||
    !Array.isArray(dataValue.gaps) ||
    (dataValue.status !== "allowed" &&
      dataValue.status !== "partial_success" &&
      dataValue.status !== "denied" &&
      dataValue.status !== "unavailable") ||
    ((dataValue.status === "denied" ||
      dataValue.status === "unavailable") &&
      dataValue.evidence.length !== 0) ||
    typeof auditValue.eventId !== "string" ||
    !uuid.test(auditValue.eventId) ||
    auditValue.releaseStatus !== "release_attempted"
  ) {
    throw new Error("invalid_api_response");
  }
  const gaps = readSafeProviderGaps(dataValue.gaps);
  const providerError = readSafeProviderError(
    dataValue.error,
    body.traceId
  );
  if (
    ((dataValue.status === "allowed" ||
      dataValue.status === "partial_success") &&
      providerError !== undefined) ||
    ((dataValue.status === "denied" ||
      dataValue.status === "unavailable") &&
      providerError === undefined)
  ) {
    throw new Error("invalid_api_response");
  }

  let aggregateExcerptBytes = 0;
  const evidence = dataValue.evidence.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("invalid_api_response");
    }
    const record = value as Record<string, unknown>;
    const digest = record.contentDigest;
    const locator = record.citationLocator;
    if (
      Object.keys(record).some(
        (key) =>
          key !== "providerId" &&
          key !== "providerRecordId" &&
          key !== "sourceId" &&
          key !== "segmentId" &&
          key !== "sourceVersion" &&
          key !== "contentDigest" &&
          key !== "citationLocator" &&
          key !== "title" &&
          key !== "excerpt" &&
          key !== "mediaType" &&
          key !== "truncated" &&
          key !== "sensitivity" &&
          key !== "freshness" &&
          key !== "retrievedAt" &&
          key !== "sourceModifiedAt" &&
          key !== "instructionAuthority"
      ) ||
      !identifier.safeParse(record.providerId).success ||
      !opaqueProviderKey.safeParse(record.providerRecordId).success ||
      !opaqueProviderKey.safeParse(record.sourceId).success ||
      !opaqueProviderKey.safeParse(record.segmentId).success ||
      !boundedText(256).safeParse(record.sourceVersion).success ||
      !digest ||
      typeof digest !== "object" ||
      Array.isArray(digest) ||
      Object.keys(digest).some(
        (key) => key !== "algorithm" && key !== "value"
      ) ||
      (digest as Record<string, unknown>).algorithm !== "sha256" ||
      typeof (digest as Record<string, unknown>).value !== "string" ||
      !/^[0-9a-f]{64}$/u.test(
        (digest as Record<string, unknown>).value as string
      ) ||
      !locator ||
      typeof locator !== "object" ||
      Array.isArray(locator) ||
      Object.keys(locator).some(
        (key) => key !== "value" && key !== "publicSafe"
      ) ||
      !boundedText(2_048).safeParse(
        (locator as Record<string, unknown>).value
      ).success ||
      (locator as Record<string, unknown>).publicSafe !== true ||
      !boundedText(1_024).safeParse(record.title).success ||
      !boundedText(MAX_SOURCE_EVIDENCE_EXCERPT_BYTES).safeParse(
        record.excerpt
      ).success ||
      !boundedText(128).safeParse(record.mediaType).success ||
      typeof record.truncated !== "boolean" ||
      (record.sensitivity !== "public" &&
        record.sensitivity !== "internal" &&
        record.sensitivity !== "confidential" &&
        record.sensitivity !== "restricted") ||
      (record.freshness !== "fresh" &&
        record.freshness !== "stale" &&
        record.freshness !== "unknown") ||
      !isExactIsoDate(record.retrievedAt) ||
      (record.sourceModifiedAt !== undefined &&
        !isExactIsoDate(record.sourceModifiedAt)) ||
      record.instructionAuthority !== "none"
    ) {
      throw new Error("invalid_api_response");
    }
    aggregateExcerptBytes += Buffer.byteLength(
      record.excerpt as string,
      "utf8"
    );
    if (aggregateExcerptBytes > MAX_SOURCE_EVIDENCE_EXCERPT_BYTES) {
      throw new Error("invalid_api_response");
    }
    return {
      providerId: record.providerId,
      providerRecordId: record.providerRecordId,
      sourceId: record.sourceId,
      segmentId: record.segmentId,
      sourceVersion: record.sourceVersion,
      contentDigest: {
        algorithm: "sha256" as const,
        value: (digest as Record<string, unknown>).value
      },
      citationLocator: {
        value: (locator as Record<string, unknown>).value,
        publicSafe: true as const
      },
      title: record.title,
      excerpt: record.excerpt,
      mediaType: record.mediaType,
      truncated: record.truncated,
      sensitivity: record.sensitivity,
      freshness: record.freshness,
      retrievedAt: record.retrievedAt,
      ...(record.sourceModifiedAt === undefined
        ? {}
        : { sourceModifiedAt: record.sourceModifiedAt }),
      instructionAuthority: "none" as const
    };
  });
  const nextCursor = dataValue.nextCursor;
  if (
    nextCursor !== undefined &&
    (operation !== "search" ||
      (dataValue.status !== "allowed" &&
      dataValue.status !== "partial_success") ||
      !nextCursor ||
      typeof nextCursor !== "object" ||
      Array.isArray(nextCursor) ||
      Object.keys(nextCursor).some(
        (key) =>
          key !== "providerId" &&
          key !== "providerScopeId" &&
          key !== "value"
      ) ||
      typeof (nextCursor as Record<string, unknown>).providerId !== "string" ||
      !identifier.safeParse(
        (nextCursor as Record<string, unknown>).providerId
      ).success ||
      typeof (nextCursor as Record<string, unknown>).providerScopeId !==
        "string" ||
      !identifier.safeParse(
        (nextCursor as Record<string, unknown>).providerScopeId
      ).success ||
      typeof (nextCursor as Record<string, unknown>).value !== "string" ||
      !/^[A-Za-z0-9_-]+$/u.test(
        (nextCursor as Record<string, unknown>).value as string
      ) ||
      Buffer.byteLength(
        (nextCursor as Record<string, unknown>).value as string,
        "utf8"
      ) > MAX_LIST_CURSOR_BYTES)
  ) {
    throw new Error("invalid_api_response");
  }
  const safeNextCursor =
    nextCursor === undefined
      ? undefined
      : {
          providerId: (nextCursor as Record<string, unknown>).providerId,
          providerScopeId: (nextCursor as Record<string, unknown>)
            .providerScopeId,
          value: (nextCursor as Record<string, unknown>).value
        };

  return {
    status: dataValue.status,
    evidence,
    gaps,
    ...(safeNextCursor === undefined
      ? {}
      : { nextCursor: safeNextCursor }),
    ...(providerError === undefined ? {} : { error: providerError }),
    audit: {
      eventId: auditValue.eventId,
      releaseStatus: "release_attempted" as const
    },
    traceId: body.traceId
  };
}

function readSafeProviderError(value: unknown, traceId: string) {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("invalid_api_response");
  }
  const record = value as Record<string, unknown>;
  const safeMessages = {
    invalid_request: "The request is not valid for this contract.",
    unsupported_contract_version:
      "The requested contract version is not supported.",
    unsupported_operation: "The requested operation is not supported.",
    incompatible_provider_authority:
      "The provider authority is incompatible with this contract.",
    scope_not_mapped: "The requested provider scope is not available.",
    scope_violation: "The request is not allowed for this scope.",
    not_found: "The requested item is not available.",
    provenance_incomplete: "Required provenance is incomplete.",
    rate_limited: "The request cannot be completed at this time.",
    deadline_exceeded: "The request deadline was exceeded.",
    temporarily_unavailable: "The service is temporarily unavailable.",
    provider_failure: "The provider could not complete the request."
  } as const;
  if (
    Object.keys(record).some(
      (key) =>
        key !== "code" &&
        key !== "message" &&
        key !== "traceId" &&
        key !== "retryable" &&
        key !== "retryAfterMs" &&
        key !== "detailsRedacted"
    ) ||
    typeof record.code !== "string" ||
    !(record.code in safeMessages) ||
    record.message !==
      safeMessages[record.code as keyof typeof safeMessages] ||
    record.traceId !== traceId ||
    typeof record.retryable !== "boolean" ||
    record.detailsRedacted !== true ||
    (record.retryAfterMs !== undefined &&
      (!Number.isInteger(record.retryAfterMs) ||
        (record.retryAfterMs as number) < 0 ||
        (record.retryAfterMs as number) > 30_000))
  ) {
    throw new Error("invalid_api_response");
  }
  return {
    code: record.code,
    message: record.message,
    traceId,
    retryable: record.retryable,
    ...(record.retryAfterMs === undefined
      ? {}
      : { retryAfterMs: record.retryAfterMs }),
    detailsRedacted: true as const
  };
}

function readSafeProviderGaps(value: unknown) {
  if (
    !Array.isArray(value) ||
    value.length > MAX_SOURCE_EVIDENCE_SEARCH_RESULTS
  ) {
    throw new Error("invalid_api_response");
  }
  const safeMessages = {
    no_evidence: "No evidence matched the request.",
    partial_evidence: "Some evidence could not be returned.",
    provider_unavailable: "Source evidence is temporarily unavailable.",
    rate_limited: "Source evidence is temporarily unavailable.",
    not_found: "Requested evidence is unavailable.",
    invalid_evidence: "Some evidence was withheld."
  } as const;
  return value.map((gap) => {
    if (!gap || typeof gap !== "object" || Array.isArray(gap)) {
      throw new Error("invalid_api_response");
    }
    const record = gap as Record<string, unknown>;
    if (
      typeof record.code !== "string" ||
      !(record.code in safeMessages) ||
      record.message !==
        safeMessages[record.code as keyof typeof safeMessages] ||
      typeof record.retryable !== "boolean"
    ) {
      throw new Error("invalid_api_response");
    }
    return {
      code: record.code,
      message: record.message,
      retryable: record.retryable
    };
  });
}

function readTrustedMemorySearchResult(body: Record<string, unknown>) {
  const data = body.data;
  const audit = body.audit;
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !audit ||
    typeof audit !== "object" ||
    Array.isArray(audit) ||
    typeof body.traceId !== "string" ||
    !uuid.test(body.traceId)
  ) {
    throw new Error("invalid_api_response");
  }
  const resultsValue = (data as Record<string, unknown>).results;
  const auditValue = audit as Record<string, unknown>;
  if (
    !Array.isArray(resultsValue) ||
    resultsValue.length > MAX_TRUSTED_MEMORY_SEARCH_RESULTS ||
    typeof auditValue.eventId !== "string" ||
    !uuid.test(auditValue.eventId) ||
    auditValue.releaseStatus !== "release_attempted"
  ) {
    throw new Error("invalid_api_response");
  }

  let aggregateContentBytes = 0;
  const results: TrustedMemorySearchResult[] = resultsValue.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("invalid_api_response");
    }
    const record = value as Record<string, unknown>;
    const provenanceValue = record.provenance;
    if (
      typeof record.memoryId !== "string" ||
      !uuid.test(record.memoryId) ||
      typeof record.revisionId !== "string" ||
      !uuid.test(record.revisionId) ||
      typeof record.content !== "string" ||
      typeof record.rank !== "string" ||
      !/^[0-9]+\.[0-9]{6}$/u.test(record.rank) ||
      !provenanceValue ||
      typeof provenanceValue !== "object" ||
      Array.isArray(provenanceValue)
    ) {
      throw new Error("invalid_api_response");
    }
    const provenance = provenanceValue as Record<string, unknown>;
    if (
      (provenance.kind !== "owner_assertion" &&
        provenance.kind !== "prior_memory") ||
      Object.keys(provenance).length !== 1
    ) {
      throw new Error("invalid_api_response");
    }
    const contentBytes = Buffer.byteLength(record.content, "utf8");
    aggregateContentBytes += contentBytes;
    if (
      contentBytes < 1 ||
      contentBytes > MAX_CANDIDATE_CONTENT_BYTES ||
      aggregateContentBytes > MAX_TRUSTED_MEMORY_RESULT_CONTENT_BYTES
    ) {
      throw new Error("invalid_api_response");
    }
    return {
      memoryId: record.memoryId,
      revisionId: record.revisionId,
      content: record.content,
      rank: record.rank,
      provenance: {
        kind: provenance.kind
      }
    };
  });

  return {
    results,
    audit: {
      eventId: auditValue.eventId,
      releaseStatus: "release_attempted" as const
    },
    traceId: body.traceId
  };
}

async function readBoundedResponseText(
  response: Response,
  maximumBytes: number
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maximumBytes) {
      await reader.cancel().catch(() => undefined);
      throw new Error("invalid_api_response");
    }
    chunks.push(Buffer.from(value));
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Buffer.concat(chunks, totalBytes)
    );
  } catch {
    throw new Error("invalid_api_response");
  }
}

function readSafeErrorCode(body: Record<string, unknown>): string {
  if (!body.error || typeof body.error !== "object" || Array.isArray(body.error)) {
    return "operation_unavailable";
  }
  const code = (body.error as Record<string, unknown>).code;
  return typeof code === "string" && /^[a-z_]{1,64}$/u.test(code)
    ? code
    : "operation_unavailable";
}

function safeToolError(code: string) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          error: {
            code,
            message: "The Source-Wire memory operation was not accepted.",
            retryable: code === "operation_unavailable"
          }
        })
      }
    ]
  };
}

function safeStderr(result: string): void {
  process.stderr.write(
    `${JSON.stringify({
      operation: "mcp_stdio",
      result
    })}\n`
  );
}

function isExactIsoDate(value: unknown): value is string {
  return (
    boundedText(64).safeParse(value).success &&
    Number.isFinite(Date.parse(value as string)) &&
    new Date(value as string).toISOString() === value
  );
}

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

void main().catch(() => {
  safeStderr("startup_refused");
  process.exitCode = 1;
});
