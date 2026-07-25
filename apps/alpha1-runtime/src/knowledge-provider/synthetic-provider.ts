import { createHash } from "node:crypto";

import type {
  RuntimeKnowledgeProvider,
  RuntimeKnowledgeProviderProfile,
  RuntimeKnowledgeProviderRequest,
  RuntimeKnowledgeProviderResult
} from "../knowledge-provider-host.js";

const EXCERPT =
  "Synthetic evidence: deployment requires an owner-reviewed release gate.";

export type SyntheticKnowledgeProviderFault =
  | "provider_scope_mismatch"
  | "acl_denied"
  | "provenance_missing"
  | "result_bound_exceeded"
  | "deadline_exceeded"
  | "provider_outage";

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

export function createSyntheticKnowledgeProvider(options?: {
  fault?: SyntheticKnowledgeProviderFault;
}): RuntimeKnowledgeProvider {
  const fault = options?.fault;
  return Object.freeze({
    profile,
    async execute(
      request: RuntimeKnowledgeProviderRequest
    ): Promise<RuntimeKnowledgeProviderResult> {
      if (fault === "provider_outage") {
        throw new Error("synthetic_provider_outage");
      }
      if (fault === "deadline_exceeded") {
        await new Promise((resolve) => setTimeout(resolve, 1_100));
      }
      const exactMatch =
        request.operation === "search_evidence" ||
        (request.get.sourceId === "source_synthetic_runbook" &&
          request.get.segmentId === "segment_release_gate");
      const baseEvidence = syntheticEvidence(request);
      const evidence =
        fault === "acl_denied"
          ? [{ ...baseEvidence, aclDecision: "denied" as const }]
          : fault === "provenance_missing"
            ? [
                Object.fromEntries(
                  Object.entries(baseEvidence).filter(
                    ([key]) => key !== "sourceVersion"
                  )
                )
              ]
            : fault === "result_bound_exceeded"
              ? Array.from({ length: 11 }, (_, index) => ({
                  ...baseEvidence,
                  providerRecordId: `record_deployment_review_${index}`,
                  sourceId: `source_synthetic_runbook_${index}`,
                  segmentId: `segment_release_gate_${index}`
                }))
              : [baseEvidence];
      return {
        requestId: request.requestId,
        traceId: request.traceId,
        providerId: profile.providerId,
        contractVersion: profile.contractVersion,
        status: exactMatch ? "allowed" : "denied",
        evidence: exactMatch
          ? (evidence as RuntimeKnowledgeProviderResult["evidence"])
          : [],
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
          ? fault === "provider_scope_mismatch" &&
            request.operation === "search_evidence"
            ? {
                nextCursor: {
                  providerId: profile.providerId,
                  providerScopeId: "scope_docs_other",
                  value: "cursor_fault"
                }
              }
            : {}
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
