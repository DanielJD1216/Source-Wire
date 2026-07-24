import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { parseCandidateProposal } from "../candidate-lifecycle.js";
import {
  assertLoopbackHost,
  MAX_CANDIDATE_CONTENT_BYTES,
  MAX_OWNER_ASSERTION_BYTES,
  requireEnvironment,
  STORY1_API_SCHEMA
} from "../config.js";
import { SafeError } from "../errors.js";
import { BoundedStdioInput } from "./bounded-stdio.js";

const identifier = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/u);
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

async function main(): Promise<void> {
  rejectForbiddenAuthority();
  const baseUrl = validateBaseUrl(requireEnvironment("SOURCE_WIRE_API_URL"));
  const token = requireEnvironment("SOURCE_WIRE_MCP_TOKEN");
  const server = new McpServer(
    {
      name: "source-wire-alpha1-story2",
      version: "0.0.0-alpha.2"
    },
    {
      capabilities: {
        tools: {}
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
          result.state !== "pending" ||
          typeof result.createdAt !== "string" ||
          typeof body.traceId !== "string" ||
          typeof auditResult.eventId !== "string"
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
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > 16 * 1_024) {
    throw new Error("invalid_api_response");
  }
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
            message: "The memory candidate proposal was not accepted.",
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
