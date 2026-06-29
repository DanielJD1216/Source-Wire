import type { SourceWireSourceClass } from "./source-graph.js";

export type SourceWireSyncMode = "manual" | "scheduled" | "external_trigger";

export type SourceWireSyncStatus = "never_synced" | "synced" | "partial" | "failed";

export type SourceWireCandidatePolicy = "disabled" | "prepare_for_review";

export type SourceWireSourceConnection = {
  id: string;
  sourceClass: SourceWireSourceClass;
  displayName: string;
  namespace: string;
  syncMode: SourceWireSyncMode;
  pathPrivacy: "hidden" | "placeholder" | "public_safe";
  candidatePolicy: SourceWireCandidatePolicy;
  latestSync?: SourceWireSourceSyncResult;
};

export type SourceWireSourceSyncResult = {
  connectionId: string;
  status: SourceWireSyncStatus;
  importedCount: number;
  changedCount: number;
  staleCount: number;
  skippedCount: number;
  errorCount: number;
  pendingCandidateCount: number;
  noAutoPromotion: true;
};
