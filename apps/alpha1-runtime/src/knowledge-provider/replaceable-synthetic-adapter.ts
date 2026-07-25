import { createHash } from "node:crypto";

import {
  SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID,
  SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
  type SourceWireKnowledgeProviderProfileV1,
  type SourceWireKnowledgeProviderRequestV1,
  type SourceWireKnowledgeProviderResultV1,
  type SourceWireKnowledgeProviderV1
} from "@source-wire/contracts";

export const REPLACEABLE_PROVIDER_SCOPE_ID = "scope_replaceable_alpha";
export const REPLACEABLE_PROVIDER_RECORD_ID =
  "record:replaceable-adapter/2026-07-24#0001";
export const REPLACEABLE_SOURCE_ID =
  "kb://synthetic/runbooks/deployment review?revision=2#owner-gate";
export const REPLACEABLE_SEGMENT_ID =
  "section:release/gate[1]/approval?locale=en-CA";

export const REPLACEABLE_EXCERPT =
  "Synthetic replaceable evidence: deployment requires an owner-reviewed release gate.";
export const REPLACEABLE_LOCATOR =
  "synthetic://replaceable-adapter/release-gate";

export type ReplaceableSyntheticProviderFault =
  | "provider_scope_mismatch"
  | "acl_denied"
  | "provenance_missing"
  | "result_bound_exceeded"
  | "deadline_exceeded"
  | "provider_outage";

const profile: SourceWireKnowledgeProviderProfileV1 = Object.freeze({
  contractId: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID,
  contractVersion: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
  providerId: "replaceable_fixture_index",
  providerScopeId: REPLACEABLE_PROVIDER_SCOPE_ID,
  providerFamily: "custom",
  accessMode: "read_only",
  credentialMode: "out_of_band",
  capabilities: Object.freeze([
    {
      capability: "describe",
      requirement: "required",
      supported: true
    },
    {
      capability: "health",
      requirement: "required",
      supported: true
    },
    {
      capability: "search_evidence",
      requirement: "required",
      supported: true
    },
    {
      capability: "get_evidence",
      requirement: "required",
      supported: true
    }
  ]) as SourceWireKnowledgeProviderProfileV1["capabilities"],
  requiredProvenance: true,
  noAutoPromotion: true,
  arbitraryTableMappingSupported: false,
  maximumResultCount: 10,
  maximumExcerptBytes: 65_536
});

export function createReplaceableSyntheticProvider(options?: {
  fault?: ReplaceableSyntheticProviderFault;
}): SourceWireKnowledgeProviderV1 {
  const fault = options?.fault;
  return Object.freeze({
    profile,
    async execute(
      request: SourceWireKnowledgeProviderRequestV1
    ): Promise<SourceWireKnowledgeProviderResultV1> {
      if (fault === "provider_outage") {
        throw new Error("replaceable_adapter_failure");
      }
      if (fault === "deadline_exceeded") {
        await new Promise((resolve) => setTimeout(resolve, 1_100));
      }
      const readiness =
        request.operation === "describe" ||
        request.operation === "health";
      const exactMatch =
        readiness ||
        request.operation === "search_evidence" ||
        (request.operation === "get_evidence" &&
          request.get?.sourceId === REPLACEABLE_SOURCE_ID &&
          request.get.segmentId === REPLACEABLE_SEGMENT_ID);
      const baseEvidence = {
        providerId: profile.providerId,
        providerRecordId: REPLACEABLE_PROVIDER_RECORD_ID,
        sourceId: REPLACEABLE_SOURCE_ID,
        segmentId: REPLACEABLE_SEGMENT_ID,
        ownerId: request.ownerId,
        namespaceId: request.namespaceId,
        aclDecision: "allowed" as const,
        sourceVersion: "replaceable-synthetic-v1",
        contentDigest: {
          algorithm: "sha256" as const,
          value: createHash("sha256")
            .update(REPLACEABLE_EXCERPT, "utf8")
            .digest("hex")
        },
        citationLocator: {
          value: REPLACEABLE_LOCATOR,
          publicSafe: true as const
        },
        title: "Replaceable synthetic deployment gate",
        excerpt: REPLACEABLE_EXCERPT,
        mediaType: "text/markdown",
        truncated: false,
        sensitivity: request.search?.sensitivity ?? ("internal" as const),
        freshness: request.search?.freshness ?? ("fresh" as const),
        retrievedAt: "2026-07-24T00:00:00.000Z",
        sourceModifiedAt: "2026-07-23T00:00:00.000Z",
        instructionAuthority: "none" as const
      };
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
                  providerRecordId: `${REPLACEABLE_PROVIDER_RECORD_ID}:${index}`
                }))
              : [baseEvidence];
      return {
        requestId: request.requestId,
        traceId: request.traceId,
        providerId: profile.providerId,
        contractVersion: profile.contractVersion,
        status: exactMatch ? "allowed" : "denied",
        evidence:
          exactMatch && !readiness
            ? (evidence as SourceWireKnowledgeProviderResultV1["evidence"])
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
                  providerScopeId: "scope_replaceable_other",
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
