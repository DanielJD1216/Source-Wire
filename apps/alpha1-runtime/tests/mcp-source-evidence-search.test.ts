import assert from "node:assert/strict";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const serverEntry = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/mcp/server.js"
);

test("official MCP client searches source evidence through loopback API with caller-safe input", async () => {
  let requestBody: unknown;
  let authorization: string | undefined;
  const api = createServer((request, response) => {
    authorization = request.headers.authorization;
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      requestBody = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      response.writeHead(200, {
        "Content-Type": "application/json; charset=UTF-8"
      });
      response.end(
        JSON.stringify({
          schema: "source-wire.api.v1alpha1",
          traceId: "00000000-0000-4000-8000-000000000201",
          data: {
            status: "allowed",
            evidence: [
              {
                providerId: "synthetic_document_index",
                providerRecordId: "record_deployment_review",
                sourceId: "source_synthetic_runbook",
                segmentId: "segment_release_gate",
                sourceVersion: "synthetic-v1",
                contentDigest: {
                  algorithm: "sha256",
                  value:
                    "473b425d17d88198eda8f78b44cc26bd4740ddbe44430c7d62e6c9a5c55bbf85"
                },
                citationLocator: {
                  value: "synthetic://runbook/release-gate",
                  publicSafe: true
                },
                title: "Synthetic deployment review gate",
                excerpt:
                  "Synthetic evidence: deployment requires an owner-reviewed release gate.",
                mediaType: "text/markdown",
                truncated: false,
                sensitivity: "internal",
                freshness: "fresh",
                retrievedAt: "2026-07-24T00:00:00.000Z",
                instructionAuthority: "none"
              }
            ],
            gaps: [],
            nextCursor: {
              providerId: "synthetic_document_index",
              providerScopeId: "scope_docs_alpha",
              value: "cursor_page_3"
            }
          },
          audit: {
            eventId: "00000000-0000-4000-8000-000000000202",
            releaseStatus: "release_attempted"
          }
        })
      );
    });
  });
  await new Promise<void>((resolveListen) =>
    api.listen(0, "127.0.0.1", resolveListen)
  );
  const address = api.address();
  assert.ok(address && typeof address === "object");

  const client = new Client(
    { name: "source-wire-alpha1-search-test", version: "0.0.0" },
    { capabilities: {} }
  );
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    env: {
      PATH: process.env.PATH ?? "",
      SOURCE_WIRE_API_URL: `http://127.0.0.1:${address.port}`,
      SOURCE_WIRE_MCP_TOKEN: "synthetic-harness-token"
    },
    stderr: "pipe"
  });
  try {
    await client.connect(transport);
    const result = await client.callTool({
      name: "search_source_evidence",
      arguments: {
        namespaceId: "ns_project_alpha",
        query: "deployment review",
        cursor: {
          providerId: "synthetic_document_index",
          providerScopeId: "scope_docs_alpha",
          value: "cursor_page_2"
        }
      }
    });
    assert.equal(result.isError, undefined);
    assert.deepEqual(requestBody, {
      namespaceId: "ns_project_alpha",
      query: "deployment review",
      limit: 10,
      cursor: {
        providerId: "synthetic_document_index",
        providerScopeId: "scope_docs_alpha",
        value: "cursor_page_2"
      }
    });
    assert.equal(authorization, "Bearer synthetic-harness-token");
    assert.deepEqual(result.structuredContent, {
      status: "allowed",
      evidence: [
        {
          providerId: "synthetic_document_index",
          providerRecordId: "record_deployment_review",
          sourceId: "source_synthetic_runbook",
          segmentId: "segment_release_gate",
          sourceVersion: "synthetic-v1",
          contentDigest: {
            algorithm: "sha256",
            value:
              "473b425d17d88198eda8f78b44cc26bd4740ddbe44430c7d62e6c9a5c55bbf85"
          },
          citationLocator: {
            value: "synthetic://runbook/release-gate",
            publicSafe: true
          },
          title: "Synthetic deployment review gate",
          excerpt:
            "Synthetic evidence: deployment requires an owner-reviewed release gate.",
          mediaType: "text/markdown",
          truncated: false,
          sensitivity: "internal",
          freshness: "fresh",
          retrievedAt: "2026-07-24T00:00:00.000Z",
          instructionAuthority: "none"
        }
      ],
      gaps: [],
      nextCursor: {
        providerId: "synthetic_document_index",
        providerScopeId: "scope_docs_alpha",
        value: "cursor_page_3"
      },
      audit: {
        eventId: "00000000-0000-4000-8000-000000000202",
        releaseStatus: "release_attempted"
      },
      traceId: "00000000-0000-4000-8000-000000000201"
    });
  } finally {
    await client.close();
    await new Promise<void>((resolveClose, reject) =>
      api.close((error) => (error ? reject(error) : resolveClose()))
    );
  }
});

test("official MCP client preserves safe denied gaps and rejects raw provider detail", async () => {
  let callCount = 0;
  const api = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      callCount += 1;
      const safeEvidence = {
        providerId: "synthetic_document_index",
        providerRecordId: "record_deployment_review",
        sourceId: "source_synthetic_runbook",
        segmentId: "segment_release_gate",
        sourceVersion: "synthetic-v1",
        contentDigest: {
          algorithm: "sha256",
          value:
            "473b425d17d88198eda8f78b44cc26bd4740ddbe44430c7d62e6c9a5c55bbf85"
        },
        citationLocator: {
          value: "synthetic://runbook/release-gate",
          publicSafe: true
        },
        title: "Synthetic deployment review gate",
        excerpt:
          "Synthetic evidence: deployment requires an owner-reviewed release gate.",
        mediaType: "text/markdown",
        truncated: false,
        sensitivity: "internal",
        freshness: "fresh",
        retrievedAt: "2026-07-24T00:00:00.000Z",
        instructionAuthority: "none"
      };
      const data =
        callCount <= 2
          ? {
              status: "denied",
              evidence: [],
              gaps: [
                {
                  code: "invalid_evidence",
                  message:
                    callCount === 1
                      ? "Some evidence was withheld."
                      : "raw provider endpoint token secret",
                  retryable: false
                }
              ],
              error: {
                code: "provenance_incomplete",
                message: "Required provenance is incomplete.",
                traceId: "00000000-0000-4000-8000-000000000211",
                retryable: false,
                detailsRedacted: true
              }
            }
          : callCount === 3
            ? {
                status: "allowed",
                evidence: [
                  {
                    ...safeEvidence,
                    privateCredentialSecret: "must-not-cross-mcp"
                  }
                ],
                gaps: []
              }
            : {
                status: "allowed",
                evidence: [safeEvidence],
                gaps: [],
                nextCursor: {
                  providerId: "synthetic_document_index",
                  providerScopeId: "scope_docs_alpha",
                  value: "cursor_page_2",
                  privateCredentialSecret: "must-not-cross-mcp"
                }
              };
      response.writeHead(200, {
        "Content-Type": "application/json; charset=UTF-8"
      });
      response.end(
        JSON.stringify({
          schema: "source-wire.api.v1alpha1",
          traceId: "00000000-0000-4000-8000-000000000211",
          data,
          audit: {
            eventId: "00000000-0000-4000-8000-000000000212",
            releaseStatus: "release_attempted"
          }
        })
      );
    });
  });
  await new Promise<void>((resolveListen) =>
    api.listen(0, "127.0.0.1", resolveListen)
  );
  const address = api.address();
  assert.ok(address && typeof address === "object");

  const client = new Client(
    { name: "source-wire-alpha1-denied-gap-test", version: "0.0.0" },
    { capabilities: {} }
  );
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    env: {
      PATH: process.env.PATH ?? "",
      SOURCE_WIRE_API_URL: `http://127.0.0.1:${address.port}`,
      SOURCE_WIRE_MCP_TOKEN: "synthetic-harness-token"
    },
    stderr: "pipe"
  });
  try {
    await client.connect(transport);
    const safeDenied = await client.callTool({
      name: "search_source_evidence",
      arguments: {
        namespaceId: "ns_project_alpha",
        query: "deployment review"
      }
    });
    assert.equal(safeDenied.isError, undefined);
    assert.deepEqual(safeDenied.structuredContent, {
      status: "denied",
      evidence: [],
      gaps: [
        {
          code: "invalid_evidence",
          message: "Some evidence was withheld.",
          retryable: false
        }
      ],
      error: {
        code: "provenance_incomplete",
        message: "Required provenance is incomplete.",
        traceId: "00000000-0000-4000-8000-000000000211",
        retryable: false,
        detailsRedacted: true
      },
      audit: {
        eventId: "00000000-0000-4000-8000-000000000212",
        releaseStatus: "release_attempted"
      },
      traceId: "00000000-0000-4000-8000-000000000211"
    });

    const unsafeDenied = await client.callTool({
      name: "search_source_evidence",
      arguments: {
        namespaceId: "ns_project_alpha",
        query: "deployment review"
      }
    });
    assert.equal(unsafeDenied.isError, true);
    assert.doesNotMatch(JSON.stringify(unsafeDenied), /raw|token|secret/u);

    const evidenceWithExtraField = await client.callTool({
      name: "search_source_evidence",
      arguments: {
        namespaceId: "ns_project_alpha",
        query: "deployment review"
      }
    });
    assert.equal(evidenceWithExtraField.isError, true);
    assert.doesNotMatch(
      JSON.stringify(evidenceWithExtraField),
      /credential|secret|must-not-cross/u
    );

    const cursorWithExtraField = await client.callTool({
      name: "search_source_evidence",
      arguments: {
        namespaceId: "ns_project_alpha",
        query: "deployment review"
      }
    });
    assert.equal(cursorWithExtraField.isError, true);
    assert.doesNotMatch(
      JSON.stringify(cursorWithExtraField),
      /credential|secret|must-not-cross/u
    );
  } finally {
    await client.close();
    await new Promise<void>((resolveClose, reject) =>
      api.close((error) => (error ? reject(error) : resolveClose()))
    );
  }
});
