import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";

import { assertLoopbackHost, requireEnvironment } from "../config.js";

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
      "idempotency-key": { type: "string" },
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
