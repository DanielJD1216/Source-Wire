export type SourceWireMcpToolGroup =
  | "memory_search"
  | "source_search"
  | "source_maintenance"
  | "second_brain"
  | "context_assembly"
  | "handoff";

export type SourceWireMcpToolBehavior = {
  name: string;
  group: SourceWireMcpToolGroup;
  description: string;
  requiresExplicitUserAction: boolean;
  returnsCitations: boolean;
  canCreateTrustedMemory: false;
  preservesNamespaceBoundary: true;
  noAutoPromotion: true;
};
