import {
  canonicalTrustedMemoryRequestDigest,
  canonicalTrustedMemoryResultDigest
} from "../src/trusted-memory-search.js";

const requestDigest = canonicalTrustedMemoryRequestDigest({
  apiSchema: "source-wire.api.v1alpha1",
  method: "POST",
  operation: "search_trusted_memory",
  actorCredentialId: "11111111-1111-4111-8111-111111111111",
  ownerId: "owner_story3",
  namespaceId: "ns_story3_alpha",
  query: "synthetic deterministic heliotrope",
  limit: 7
});

const resultDigest = canonicalTrustedMemoryResultDigest([
  {
    memoryId: "22222222-2222-4222-8222-222222222222",
    revisionId: "33333333-3333-4333-8333-333333333333",
    content: "Synthetic deterministic heliotrope memory.",
    rank: "0.125000",
    provenance: {
      kind: "owner_assertion"
    }
  }
]);

process.stdout.write(`${JSON.stringify({ requestDigest, resultDigest })}\n`);
