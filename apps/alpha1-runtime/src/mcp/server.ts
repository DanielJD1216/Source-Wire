import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { parseCandidateProposal } from "../candidate-lifecycle.js";
import {
  assertLoopbackHost,
  MAX_CANDIDATE_CONTENT_BYTES,
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
      .optional()
  })
  .strict();
const sourceEvidenceGetInput = z
  .object({
    namespaceId: identifier,
    sourceId: identifier,
    segmentId: identifier
  })
  .strict();

async function main(): Promise<void> {
  rejectForbiddenAuthority();
  const baseUrl = validateBaseUrl(requireEnvironment("SOURCE_WIRE_API_URL"));
  const token = requireEnvironment("SOURCE_WIRE_MCP_TOKEN");
  const server = new McpServer(
    {
      name: "source-wire-alpha1-story3",
      version: "0.0.0-alpha.3"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

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
        const safeResult = readSourceEvidenceSearchResult(body);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(safeResult) }],
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
        const response = await fetch(`${baseUrl}/v1alpha1/source-evidence/search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            namespaceId: input.namespaceId,
            query: input.query,
            limit: input.limit ?? MAX_SOURCE_EVIDENCE_SEARCH_RESULTS
          }),
          signal: AbortSignal.timeout(5_000)
        });
        const body = await readSafeApiBody(response);
        if (!response.ok) {
          return safeToolError(readSafeErrorCode(body));
        }
        const safeResult = readSourceEvidenceSearchResult(body);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(safeResult) }],
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
          content: [{ type: "text" as const, text: JSON.stringify(safeResult) }],
          structuredContent: safeResult
        };
      } catch (error) {
        const code = error instanceof SafeError ? error.code : "operation_unavailable";
        return safeToolError(code);
      }
    }
  );

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

function readSourceEvidenceSearchResult(body: Record<string, unknown>) {
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
    dataValue.evidence.length > MAX_SOURCE_EVIDENCE_SEARCH_RESULTS ||
    !Array.isArray(dataValue.gaps) ||
    (dataValue.status !== "allowed" &&
      dataValue.status !== "partial_success" &&
      dataValue.status !== "unavailable") ||
    typeof auditValue.eventId !== "string" ||
    !uuid.test(auditValue.eventId) ||
    auditValue.releaseStatus !== "release_attempted"
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
      typeof record.providerId !== "string" ||
      typeof record.providerRecordId !== "string" ||
      typeof record.sourceId !== "string" ||
      typeof record.segmentId !== "string" ||
      typeof record.sourceVersion !== "string" ||
      !digest ||
      typeof digest !== "object" ||
      Array.isArray(digest) ||
      (digest as Record<string, unknown>).algorithm !== "sha256" ||
      typeof (digest as Record<string, unknown>).value !== "string" ||
      !/^[0-9a-f]{64}$/u.test(
        (digest as Record<string, unknown>).value as string
      ) ||
      !locator ||
      typeof locator !== "object" ||
      Array.isArray(locator) ||
      typeof (locator as Record<string, unknown>).value !== "string" ||
      (locator as Record<string, unknown>).publicSafe !== true ||
      typeof record.title !== "string" ||
      typeof record.excerpt !== "string" ||
      typeof record.mediaType !== "string" ||
      typeof record.truncated !== "boolean" ||
      (record.sensitivity !== "public" &&
        record.sensitivity !== "internal" &&
        record.sensitivity !== "confidential" &&
        record.sensitivity !== "restricted") ||
      (record.freshness !== "fresh" &&
        record.freshness !== "stale" &&
        record.freshness !== "unknown") ||
      typeof record.retrievedAt !== "string" ||
      record.instructionAuthority !== "none"
    ) {
      throw new Error("invalid_api_response");
    }
    aggregateExcerptBytes += Buffer.byteLength(record.excerpt, "utf8");
    if (aggregateExcerptBytes > MAX_SOURCE_EVIDENCE_EXCERPT_BYTES) {
      throw new Error("invalid_api_response");
    }
    return record;
  });

  return {
    status: dataValue.status,
    evidence,
    gaps: dataValue.gaps,
    audit: {
      eventId: auditValue.eventId,
      releaseStatus: "release_attempted" as const
    },
    traceId: body.traceId
  };
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
