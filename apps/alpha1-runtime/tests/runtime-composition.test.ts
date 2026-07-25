import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import test from "node:test";

import type { SourceWireKnowledgeProviderRequestV1 } from "@source-wire/contracts";

import { SafeError } from "../src/errors.js";
import {
  createAlphaRuntimeComposition,
  createComposedKnowledgeProviderHost
} from "../src/runtime-composition.js";
import { createSyntheticKnowledgeProvider } from "../src/knowledge-provider/synthetic-provider.js";
import type {
  ProviderReadAuditStore,
  ProviderReadReceiptBinding
} from "../src/knowledge-provider-host.js";
import type { AuthenticatedCredential } from "../src/repository.js";

const actor: AuthenticatedCredential = {
  credentialId: "00000000-0000-4000-8000-000000000501",
  credentialClass: "harness",
  status: "active",
  ownerId: "owner_alpha",
  actorIdentityId: "00000000-0000-4000-8000-000000000502",
  authenticationEpochId: "00000000-0000-4000-8000-000000000503",
  namespaceIds: ["ns_project_alpha"],
  capabilities: ["source_evidence.read"],
  issuedAt: new Date("2026-07-24T00:00:00.000Z"),
  expiresAt: new Date("2026-07-25T00:00:00.000Z"),
  actorReference: "credential:00000000-0000-4000-8000-000000000501"
};

class AcceptingAuditStore implements ProviderReadAuditStore {
  async issue(
    _receipt: ProviderReadReceiptBinding,
    _originProcessVerifier: string
  ): Promise<boolean> {
    return true;
  }

  async consume(
    _receipt: ProviderReadReceiptBinding,
    _originProcessVerifier: string
  ): Promise<boolean> {
    return true;
  }
}

test("startup composition freezes exactly one bounded provider binding", () => {
  const provider = createSyntheticKnowledgeProvider();
  const composition = createAlphaRuntimeComposition({
    provider,
    ownerId: "owner_alpha",
    namespaceId: "ns_project_alpha",
    providerScopeId: "scope_docs_alpha",
    timeoutMs: 1_000
  });

  assert(Object.isFrozen(composition));
  assert(Object.isFrozen(composition.knowledgeProvider));
  assert.deepEqual(Object.keys(composition), ["knowledgeProvider"]);
  assert.deepEqual(Object.keys(composition.knowledgeProvider ?? {}).sort(), [
    "namespaceId",
    "ownerId",
    "provider",
    "providerScopeId",
    "timeoutMs"
  ]);
  assert.equal(composition.knowledgeProvider?.provider, provider);
});

test("absent provider composition preserves memory-only startup and safe unavailability", async () => {
  const composition = createAlphaRuntimeComposition();
  assert.deepEqual(composition, {});
  assert(Object.isFrozen(composition));

  const host = createComposedKnowledgeProviderHost({
    composition,
    auditStore: new AcceptingAuditStore(),
    processReleaseSecret: randomBytes(32)
  });

  await assert.rejects(
    host.execute(
      {
        actor,
        traceId: randomUUID(),
        startedAtMs: Date.now()
      },
      {
        operation: "search_evidence",
        namespaceId: "ns_project_alpha",
        query: "deployment review",
        queryByteCount: 17,
        limit: 10
      }
    ),
    (error: unknown) =>
      error instanceof SafeError &&
      error.code === "operation_unavailable" &&
      error.status === 503
  );
});

test("malformed startup composition fails before provider invocation", () => {
  const synthetic = createSyntheticKnowledgeProvider();
  let invocationCount = 0;
  const composition = createAlphaRuntimeComposition({
    provider: {
      profile: {
        ...synthetic.profile,
        providerScopeId: "scope_docs_other"
      },
      async execute(request) {
        invocationCount += 1;
        return synthetic.execute(request);
      }
    },
    ownerId: "owner_alpha",
    namespaceId: "ns_project_alpha",
    providerScopeId: "scope_docs_alpha",
    timeoutMs: 1_000
  });

  assert.throws(
    () =>
      createComposedKnowledgeProviderHost({
        composition,
        auditStore: new AcceptingAuditStore(),
        processReleaseSecret: randomBytes(32)
      }),
    /knowledge_provider_binding_invalid/u
  );
  assert.equal(invocationCount, 0);
});

test("provider execution receives only the public request envelope", async () => {
  const synthetic = createSyntheticKnowledgeProvider();
  let observed: SourceWireKnowledgeProviderRequestV1 | undefined;
  const composition = createAlphaRuntimeComposition({
    provider: {
      profile: synthetic.profile,
      async execute(request) {
        observed = structuredClone(request);
        return synthetic.execute(request);
      }
    },
    ownerId: "owner_alpha",
    namespaceId: "ns_project_alpha",
    providerScopeId: "scope_docs_alpha",
    timeoutMs: 1_000
  });
  const host = createComposedKnowledgeProviderHost({
    composition,
    auditStore: new AcceptingAuditStore(),
    processReleaseSecret: randomBytes(32)
  });

  const release = await host.execute(
    {
      actor,
      traceId: randomUUID(),
      startedAtMs: Date.now()
    },
    {
      operation: "search_evidence",
      namespaceId: "ns_project_alpha",
      query: "deployment review",
      queryByteCount: 17,
      limit: 10
    }
  );
  release.clear();

  assert(observed);
  const serialized = JSON.stringify(observed);
  for (const forbidden of [
    "credentialId",
    "actorIdentityId",
    "auditStore",
    "receipt",
    "processReleaseSecret",
    "database",
    "memoryMutation"
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});
