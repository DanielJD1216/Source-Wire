import type { SourceWireSecondBrainRequest, SourceWireSecondBrainResponse } from "./second-brain.js";

export type SourceWireFixtureSafety = "synthetic" | "fake" | "redacted";

export type SourceWireFixtureMetadata = {
  fixtureType: string;
  fixtureSafety: SourceWireFixtureSafety;
};

export type SourceWireProjectContextPack = SourceWireFixtureMetadata & {
  fixtureType: "source-wire-public-project-context-pack";
  fixtureSafety: "synthetic";
  project: {
    key: string;
    name: string;
    status: string;
    summary: string;
  };
  goals: string[];
  constraints: string[];
  decisions: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  risks: Array<{
    id: string;
    title: string;
    content: string;
  }>;
};

export type SourceWireSecondBrainFixture = SourceWireFixtureMetadata & {
  fixtureType: "source-wire-public-second-brain-example";
  fixtureSafety: "synthetic";
  request: SourceWireSecondBrainRequest;
  response: SourceWireSecondBrainResponse;
};

export type SourceWireChatExportMessage = {
  provider: string;
  conversationId: string;
  messageId: string;
  role: "user" | "assistant" | "system" | "tool";
  createdAt: string;
  content: string;
};

export type SourceWireOwnerHostedApiMcpBoundaryFixture = SourceWireFixtureMetadata & {
  fixtureType: "source-wire-owner-hosted-api-mcp-boundary-proof-cases";
  fixtureSafety: "synthetic";
  schemaValidated: true;
  boundary: {
    hosting: "owner_hosted";
    sourceWireHostsUserMemory: false;
    runtimeIncludedInPackage: false;
    noAutoPromotion: true;
  };
  syntheticOwner: {
    ownerId: string;
    displayName: string;
  };
  syntheticNamespaces: Array<{
    namespaceId: string;
    label: string;
  }>;
  proofCases: SourceWireOwnerHostedApiMcpProofCase[];
  nonGoals: string[];
};

export type SourceWireOwnerHostedApiMcpProofCase = {
  caseId: string;
  actor: {
    kind: "mcp_tool" | "owner_hosted_api" | "owner_controlled_application";
    syntheticTokenRef: string;
    allowedNamespaceIds: string[];
    capabilities: string[];
  };
  request: {
    namespaceId: string;
    tool?: string;
    apiRoute?: string;
    query?: string;
    sourceConnectionId?: string;
    payloadMode?: string;
    sourceSegmentId?: string;
    reviewReason?: string;
  };
  expectedResult: {
    status: "allowed" | "denied" | "partial_success";
    trustedMemoryReturned?: boolean;
    sourceEvidenceReturned?: boolean;
    omittedCount?: number;
    citationCount?: number;
    denialReason?: string;
    importedCount?: number;
    changedCount?: number;
    staleCount?: number;
    skippedCount?: number;
    errorCount?: number;
    pendingCandidateCount?: number;
    pendingCandidateCreated?: boolean;
    pendingCandidateClosed?: boolean;
    trustedMemoryCreatedCount?: number;
    requiresOwnerReview?: boolean;
    approvalPath?: "owner_or_application_controlled";
    citations?: Array<{
      sourceId: string;
      segmentId: string;
      address: string;
    }>;
    noAutoPromotion: boolean;
  };
  audit: {
    eventType: string;
    result: "allowed" | "denied" | "partial_success";
    syntheticTraceId: string;
  };
};
