import assert from "node:assert/strict";
import test from "node:test";

import {
  STORY5_KNOWLEDGE_PROVIDER_SECURITY_POLICY,
  assertNoCallerSelectableProviderAuthority,
  assertStory5KnowledgeProviderSecurityPolicy
} from "../src/knowledge-provider-security-policy.js";

test("Story 5 security policy freezes one immutable provider binding and caller-safe tools", () => {
  assert.doesNotThrow(() =>
    assertStory5KnowledgeProviderSecurityPolicy(
      STORY5_KNOWLEDGE_PROVIDER_SECURITY_POLICY
    )
  );

  assert.deepEqual(STORY5_KNOWLEDGE_PROVIDER_SECURITY_POLICY.mcpTools, [
    {
      name: "search_source_evidence",
      providerOperation: "search_evidence"
    },
    {
      name: "get_source_evidence",
      providerOperation: "get_evidence"
    }
  ]);
  assert.equal(
    STORY5_KNOWLEDGE_PROVIDER_SECURITY_POLICY.requiredCapability,
    "source_evidence.read"
  );
  assert.equal(
    STORY5_KNOWLEDGE_PROVIDER_SECURITY_POLICY.providerBinding,
    "optional_single_immutable"
  );
  assert.equal(
    STORY5_KNOWLEDGE_PROVIDER_SECURITY_POLICY.namespaceAuthority,
    "authenticated_credential"
  );
  assert.deepEqual(
    STORY5_KNOWLEDGE_PROVIDER_SECURITY_POLICY.callerSelectableAuthorityFields,
    []
  );
});

test("Story 5 security policy rejects broadened provider authority", () => {
  const unsafePolicy = {
    ...STORY5_KNOWLEDGE_PROVIDER_SECURITY_POLICY,
    callerSelectableAuthorityFields: ["providerId"]
  };

  assert.throws(
    () => assertStory5KnowledgeProviderSecurityPolicy(unsafePolicy),
    /story5_security_policy_invalid/u
  );
});

test("Story 5 rejects provider authority in caller-controlled input", () => {
  assert.doesNotThrow(() =>
    assertNoCallerSelectableProviderAuthority({
      namespaceId: "project_alpha",
      query: "synthetic release notes",
      limit: 5
    })
  );

  for (const field of [
    "providerId",
    "providerScopeId",
    "providerEndpoint",
    "providerCredentials",
    "ownerId",
    "aclDecision",
    "authority"
  ]) {
    assert.throws(
      () =>
        assertNoCallerSelectableProviderAuthority({
          namespaceId: "project_alpha",
          nested: {
            [field]: "caller-controlled"
          }
        }),
      /caller_provider_authority_forbidden/u,
      field
    );
  }
});
