import type {
  SourceWireMcpToolBehavior,
  SourceWireProjectContextPack,
  SourceWireSecondBrainResponse,
  SourceWireSourceConnection,
  SourceWireSourceGraph
} from "@source-wire/contracts";

export const syntheticProjectContextPack: SourceWireProjectContextPack = {
  fixtureType: "source-wire-public-project-context-pack",
  fixtureSafety: "synthetic",
  project: {
    key: "demo-workspace",
    name: "Demo Workspace",
    status: "planning",
    summary: "Synthetic project used to demonstrate Source-Wire contract shapes."
  },
  goals: ["Keep imported source evidence citeable.", "Require review before trusted memory promotion."],
  constraints: ["Use synthetic data only.", "Do not imply backend runtime availability."],
  decisions: [
    {
      id: "decision-001",
      title: "Keep Source-Wire contracts only",
      content: "The public package describes shapes before shipping runtime behavior."
    }
  ],
  risks: [
    {
      id: "risk-001",
      title: "Confusing source evidence with trusted memory",
      content: "Imported source text should remain evidence until a review path promotes it."
    }
  ]
};

export const syntheticSourceGraph: SourceWireSourceGraph = {
  collections: [
    {
      id: "collection-demo",
      sourceClass: "project_context_pack",
      title: "Demo Context Pack",
      fixtureSafety: "synthetic"
    }
  ],
  items: [
    {
      id: "item-demo-context",
      collectionId: "collection-demo",
      sourceClass: "project_context_pack",
      title: "Demo Context",
      sensitivity: "public",
      freshness: "fresh",
      metadata: {
        source: "synthetic-example"
      }
    }
  ],
  segments: [
    {
      id: "segment-demo-decision",
      sourceItemId: "item-demo-context",
      title: "Decision",
      locator: "decisions[0]",
      content: "The public package describes shapes before shipping runtime behavior.",
      citation: {
        type: "source_segment",
        sourceTitle: "Demo Context",
        locator: "decisions[0]"
      }
    }
  ],
  edges: [
    {
      id: "edge-demo-belongs-to",
      fromId: "segment-demo-decision",
      toId: "item-demo-context",
      kind: "belongs_to",
      label: "segment belongs to item"
    }
  ]
};

export const syntheticSourceConnection: SourceWireSourceConnection = {
  id: "connection-demo",
  sourceClass: "project_context_pack",
  displayName: "Demo Context Pack",
  namespace: "demo",
  syncMode: "manual",
  pathPrivacy: "public_safe",
  candidatePolicy: "prepare_for_review",
  latestSync: {
    connectionId: "connection-demo",
    status: "synced",
    importedCount: 1,
    changedCount: 0,
    staleCount: 0,
    skippedCount: 0,
    errorCount: 0,
    pendingCandidateCount: 1,
    noAutoPromotion: true
  }
};

export const syntheticMcpToolBehavior: SourceWireMcpToolBehavior = {
  name: "search_sources",
  group: "source_search",
  description: "Search source-backed evidence and return citations.",
  requiresExplicitUserAction: true,
  returnsCitations: true,
  canCreateTrustedMemory: false,
  preservesNamespaceBoundary: true,
  noAutoPromotion: true
};

export const syntheticSecondBrainResponse: SourceWireSecondBrainResponse = {
  contractVersion: "second-brain.v1",
  intent: "draw_diagram",
  radius: "project",
  answer: "The workflow starts with source import, then evidence search, then owner-reviewed memory promotion.",
  citations: [
    {
      type: "source_segment",
      sourceTitle: "Demo Context",
      locator: "decisions[0]"
    }
  ],
  gaps: [
    {
      reason: "No trusted memory record has been approved for this synthetic workflow yet.",
      nextAction: "Review the source-backed candidate before promotion."
    }
  ],
  nextAction: "Run a review step before saving trusted memory.",
  maintenanceRan: false,
  noAutoPromotion: true
};
