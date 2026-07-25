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
    }),
    Object.freeze({
      capability: "get_evidence",
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
      const exactMatch =
        request.operation === "search_evidence" ||
        (request.get.sourceId === "source_synthetic_runbook" &&
          request.get.segmentId === "segment_release_gate");
      return {
        requestId: request.requestId,
        traceId: request.traceId,
        providerId: profile.providerId,
        contractVersion: profile.contractVersion,
        status: exactMatch ? "allowed" : "denied",
        evidence: exactMatch ? [syntheticEvidence(request)] : [],
        gaps: exactMatch
          ? []
          : [
              {
                code: "not_found",
                message: "Requested evidence is unavailable.",
                retryable: false
              }
            ],
        ...(exactMatch
          ? {}
          : {
              error: {
                code: "not_found" as const,
                message: "The requested item is not available.",
                traceId: request.traceId,
                retryable: false,
                detailsRedacted: true as const
              }
            }),
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

function syntheticEvidence(request: RuntimeKnowledgeProviderRequest) {
  return {
    providerId: profile.providerId,
    providerRecordId: "record_deployment_review",
    sourceId: "source_synthetic_runbook",
    segmentId: "segment_release_gate",
    ownerId: request.ownerId,
    namespaceId: request.namespaceId,
    aclDecision: "allowed" as const,
    sourceVersion: "synthetic-v1",
    contentDigest: {
      algorithm: "sha256" as const,
      value: createHash("sha256").update(EXCERPT, "utf8").digest("hex")
    },
    citationLocator: {
      value: "synthetic://runbook/release-gate",
      publicSafe: true as const
    },
    title: "Synthetic deployment review gate",
    excerpt: EXCERPT,
    mediaType: "text/markdown",
    truncated: false,
    sensitivity: "internal" as const,
    freshness: "fresh" as const,
    retrievedAt: "2026-07-24T00:00:00.000Z",
    sourceModifiedAt: "2026-07-23T00:00:00.000Z",
    instructionAuthority: "none" as const
  };
}
