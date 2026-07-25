import assert from "node:assert/strict";
import test from "node:test";

import {
  SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID,
  SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
  type SourceWireKnowledgeProviderV1
} from "@source-wire/contracts";

import { createSyntheticKnowledgeProvider } from "../src/knowledge-provider/synthetic-provider.js";

test("the Alpha provider implements the authoritative public contract", () => {
  const provider: SourceWireKnowledgeProviderV1 =
    createSyntheticKnowledgeProvider();

  assert.equal(
    provider.profile.contractId,
    SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID
  );
  assert.equal(
    provider.profile.contractVersion,
    SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION
  );
  assert.equal(provider.profile.providerFamily, "document_index");
  assert.deepEqual(
    provider.profile.capabilities.map(({ capability }) => capability).sort(),
    ["describe", "get_evidence", "health", "search_evidence"]
  );
});
