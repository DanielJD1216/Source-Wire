import { createHash } from "node:crypto";

import type {
  RuntimeKnowledgeProvider,
  RuntimeKnowledgeProviderProfile,
  RuntimeKnowledgeProviderRequest,
  RuntimeKnowledgeProviderResult
} from "../knowledge-provider-host.js";

const EXCERPT =
  "Synthetic evidence: deployment requires an owner-reviewed release gate.";

const profile: RuntimeKnowledgeProviderProfile = Object.freeze({
  contractId: "source-wire.knowledge-provider",
  contractVersion: "knowledge-provider.v1",
  providerId: "synthetic_document_index",
  providerScopeId: "scope_docs_alpha",
  accessMode: "read_only",
  credentialMode: "out_of_band",
  capabilities: Object.freeze([
    Object.freeze({
      capability: "search_evidence",
      requirement: "required",
      supported: true
    })
  ]),
  requiredProvenance: true,
  noAutoPromotion: true,
  arbitraryTableMappingSupported: false,
  maximumResultCount: 10,
  maximumExcerptBytes: 65_536
});

export function createSyntheticKnowledgeProvider(): RuntimeKnowledgeProvider {
  return Object.freeze({
    profile,
    async execute(
      request: RuntimeKnowledgeProviderRequest
    ): Promise<RuntimeKnowledgeProviderResult> {
      if (request.operation !== "search_evidence") {
        throw new Error("unsupported_operation");
      }
      return {
        requestId: request.requestId,
        traceId: request.traceId,
        providerId: profile.providerId,
        contractVersion: profile.contractVersion,
        status: "allowed",
        evidence: [
          {
            providerId: profile.providerId,
            providerRecordId: "record_deployment_review",
            sourceId: "source_synthetic_runbook",
            segmentId: "segment_release_gate",
            ownerId: request.ownerId,
            namespaceId: request.namespaceId,
            aclDecision: "allowed",
            sourceVersion: "synthetic-v1",
            contentDigest: {
              algorithm: "sha256",
              value: createHash("sha256").update(EXCERPT, "utf8").digest("hex")
            },
            citationLocator: {
              value: "synthetic://runbook/release-gate",
              publicSafe: true
            },
            title: "Synthetic deployment review gate",
            excerpt: EXCERPT,
            mediaType: "text/markdown",
            truncated: false,
            sensitivity: "internal",
            freshness: "fresh",
            retrievedAt: "2026-07-24T00:00:00.000Z",
            sourceModifiedAt: "2026-07-23T00:00:00.000Z",
            instructionAuthority: "none"
          }
        ],
        gaps: [],
        providerMutationAttempted: false,
        memoryMutationAttempted: false,
        trustedMemoryCreated: false,
        noAutoPromotion: true,
        readAuditRequired: true,
        releaseState: "internal_unreleased"
      };
    }
  });
}
