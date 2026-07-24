import { createHash, randomUUID } from "node:crypto";
import { parseArgs } from "node:util";

import {
  assertLoopbackHost,
  MAX_JSON_BODY_BYTES,
  MAX_PORTABLE_EXPORT_BYTES,
  MAX_PORTABLE_EXPORT_LINE_BYTES,
  PORTABLE_EXPORT_TIMEOUT_MS,
  requireEnvironment
} from "../config.js";
import {
  readBoundedRegularFile,
  writeSensitiveStreamAtomically
} from "../safe-local-file.js";
import { parseStrictJsonObject } from "../strict-json.js";

async function main(): Promise<void> {
  const command = process.argv[2];
  const parsed = parseArgs({
    args: process.argv.slice(3),
    options: {
      "base-url": { type: "string", default: "http://127.0.0.1:4318" },
      "namespace-id": { type: "string", multiple: true },
      capability: { type: "string", multiple: true },
      "expires-at": { type: "string" },
      "credential-id": { type: "string" },
      "candidate-id": { type: "string" },
      "memory-id": { type: "string" },
      "expected-revision-id": { type: "string" },
      "idempotency-key": { type: "string" },
      "input-file": { type: "string" },
      destination: { type: "string" },
      reason: { type: "string" },
      state: { type: "string" },
      cursor: { type: "string" },
      limit: { type: "string" },
      "include-content": { type: "boolean", default: false }
    },
    strict: true
  });
  const baseUrl = validateBaseUrl(parsed.values["base-url"]);
  const idempotencyKey = parsed.values["idempotency-key"] ?? `request_${randomUUID()}`;

  if (command === "health") {
    const namespaceId = parsed.values["namespace-id"]?.[0];
    const token = requireEnvironment("SOURCE_WIRE_TOKEN");
    await executeRequest(baseUrl, "/v1alpha1/health", token, { namespaceId });
    return;
  }

  const ownerToken = requireEnvironment("SOURCE_WIRE_OWNER_TOKEN");
  if (command === "export") {
    const destination = parsed.values.destination;
    const namespaceIds = parsed.values["namespace-id"] ?? [];
    if (!destination || namespaceIds.length < 1) {
      throw new Error("validation_failed");
    }
    await exportToLocalFile(baseUrl, ownerToken, namespaceIds, destination);
    return;
  }

  if (command === "list-candidates") {
    const namespaceId = parsed.values["namespace-id"]?.[0];
    if (!namespaceId) {
      throw new Error("validation_failed");
    }
    const query = new URLSearchParams();
    query.set("state", parsed.values.state ?? "pending");
    if (parsed.values.cursor) query.set("cursor", parsed.values.cursor);
    if (parsed.values.limit) query.set("limit", parsed.values.limit);
    if (parsed.values["include-content"]) query.set("includeContent", "true");
    await executeGetRequest(
      baseUrl,
      `/v1alpha1/admin/namespaces/${encodeURIComponent(namespaceId)}/memory-candidates?${query.toString()}`,
      ownerToken
    );
    return;
  }

  if (command === "approve-candidate" || command === "reject-candidate") {
    const namespaceId = parsed.values["namespace-id"]?.[0];
    const candidateId = parsed.values["candidate-id"];
    const reason = parsed.values.reason;
    if (!namespaceId || !candidateId || !reason) {
      throw new Error("validation_failed");
    }
    await executeRequest(
      baseUrl,
      `/v1alpha1/admin/memory-candidates/${encodeURIComponent(candidateId)}/decision`,
      ownerToken,
      {
        namespaceId,
        decision: command === "approve-candidate" ? "approve" : "reject",
        expectedState: "pending",
        reason,
        idempotencyKey
      }
    );
    return;
  }

  if (command === "correct-memory" || command === "revoke-memory") {
    const namespaceId = parsed.values["namespace-id"]?.[0];
    const memoryId = parsed.values["memory-id"];
    const expectedRevisionId = parsed.values["expected-revision-id"];
    const inputFile = parsed.values["input-file"];
    if (!namespaceId || !memoryId || !expectedRevisionId || !inputFile) {
      throw new Error("validation_failed");
    }
    const input = await readBoundedInputFile(inputFile);
    const allowed =
      command === "correct-memory"
        ? new Set(["content", "reason"])
        : new Set(["reason"]);
    if (
      Object.keys(input).length !== allowed.size ||
      Object.keys(input).some((key) => !allowed.has(key))
    ) {
      throw new Error("validation_failed");
    }
    await executeRequest(
      baseUrl,
      `/v1alpha1/admin/trusted-memories/${encodeURIComponent(memoryId)}/${
        command === "correct-memory" ? "corrections" : "revocations"
      }`,
      ownerToken,
      {
        namespaceId,
        expectedRevisionId,
        ...(command === "correct-memory" ? { content: input.content } : {}),
        reason: input.reason,
        idempotencyKey
      }
    );
    return;
  }

  if (command === "issue-harness") {
    await executeRequest(
      baseUrl,
      "/v1alpha1/admin/harness-credentials",
      ownerToken,
      {
        namespaceIds: parsed.values["namespace-id"] ?? [],
        capabilities: parsed.values.capability ?? [],
        expiresAt: parsed.values["expires-at"]
      },
      idempotencyKey
    );
    return;
  }

  const credentialId = parsed.values["credential-id"];
  if (!credentialId) {
    throw new Error("validation_failed");
  }

  if (command === "rotate-harness" || command === "rotate-credential") {
    const route =
      command === "rotate-harness"
        ? `/v1alpha1/admin/harness-credentials/${encodeURIComponent(credentialId)}/rotate`
        : `/v1alpha1/admin/credentials/${encodeURIComponent(credentialId)}/rotate`;
    await executeRequest(
      baseUrl,
      route,
      ownerToken,
      {},
      idempotencyKey
    );
    return;
  }

  if (command === "revoke-credential") {
    await executeRequest(
      baseUrl,
      `/v1alpha1/admin/credentials/${encodeURIComponent(credentialId)}/revoke`,
      ownerToken,
      { expectedStatus: "active" },
      idempotencyKey
    );
    return;
  }

  throw new Error("validation_failed");
}

async function exportToLocalFile(
  baseUrl: string,
  token: string,
  namespaceIds: string[],
  destination: string
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/v1alpha1/admin/exports`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ namespaceIds }),
      signal: AbortSignal.timeout(PORTABLE_EXPORT_TIMEOUT_MS)
    });
  } catch {
    writeUnavailable();
    return;
  }
  if (!response.ok) {
    await writeResponse(response);
    return;
  }
  const logicalStateSha256 = response.headers.get(
    "x-source-wire-logical-state-sha256"
  );
  const expectedFileSha256 = response.headers.get(
    "x-source-wire-file-sha256"
  );
  const governedRecordCount = response.headers.get(
    "x-source-wire-governed-record-count"
  );
  const auditEventId = response.headers.get(
    "x-source-wire-audit-event-id"
  );
  if (
    !response.body ||
    !logicalStateSha256 ||
    !expectedFileSha256 ||
    !/^[0-9a-f]{64}$/u.test(logicalStateSha256) ||
    !/^[0-9a-f]{64}$/u.test(expectedFileSha256) ||
    !governedRecordCount ||
    !/^(?:0|[1-9][0-9]{0,5})$/u.test(governedRecordCount) ||
    !auditEventId ||
    !/^[0-9a-f-]{36}$/u.test(auditEventId)
  ) {
    throw new Error("validation_failed");
  }

  const fileHash = createHash("sha256");
  let currentLineBytes = 0;
  const result = await writeSensitiveStreamAtomically(
    destination,
    response.body as unknown as AsyncIterable<Uint8Array>,
    MAX_PORTABLE_EXPORT_BYTES,
    (chunk) => {
      fileHash.update(chunk);
      for (const byte of chunk) {
        if (byte === 0 || byte === 13) throw new Error("validation_failed");
        if (byte === 10) {
          if (currentLineBytes === 0) throw new Error("validation_failed");
          currentLineBytes = 0;
        } else {
          currentLineBytes += 1;
          if (currentLineBytes > MAX_PORTABLE_EXPORT_LINE_BYTES) {
            throw new Error("validation_failed");
          }
        }
      }
    },
    () => {
      if (
        currentLineBytes !== 0 ||
        fileHash.digest("hex") !== expectedFileSha256
      ) {
        throw new Error("validation_failed");
      }
    }
  );
  process.stdout.write(
    `${JSON.stringify({
      schema: "source-wire.owner-export.v1",
      status: "exported",
      logicalStateSha256,
      fileSha256: expectedFileSha256,
      governedRecordCount: Number(governedRecordCount),
      byteCount: result.byteCount,
      auditEventId
    })}\n`
  );
}

async function executeGetRequest(
  baseUrl: string,
  path: string,
  token: string
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal: AbortSignal.timeout(3_000)
    });
  } catch {
    writeUnavailable();
    return;
  }
  await writeResponse(response);
}

async function executeRequest(
  baseUrl: string,
  path: string,
  token: string,
  body: Record<string, unknown>,
  idempotencyKey?: string
): Promise<void> {
  let response: Response;
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3_000)
    });
  } catch {
    writeUnavailable();
    return;
  }

  await writeResponse(response);
}

async function writeResponse(response: Response): Promise<void> {
  const text = await response.text();
  process.stdout.write(`${text}\n`);
  if (!response.ok) {
    process.exitCode = 1;
  }
}

function writeUnavailable(): void {
  process.stdout.write(
    `${JSON.stringify({
      error: {
        code: "operation_unavailable",
        message: "The local Source-Wire API is unavailable.",
        retryable: true
      }
    })}\n`
  );
  process.exitCode = 1;
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
    throw new Error("validation_failed");
  }
  assertLoopbackHost(url.hostname.replace(/^\[|\]$/gu, ""));
  return url.origin;
}

async function readBoundedInputFile(
  path: string
): Promise<Record<string, unknown>> {
  const bytes = await readBoundedRegularFile(path, MAX_JSON_BODY_BYTES);
  return parseStrictJsonObject(bytes);
}

void main().catch(() => {
  process.stdout.write(
    `${JSON.stringify({
      error: {
        code: "validation_failed",
        message: "The requested owner action is invalid.",
        retryable: false
      }
    })}\n`
  );
  process.exitCode = 1;
});
