import type { SourceWireCitation } from "./source-graph.js";

export type SourceWireSecondBrainIntent =
  | "answer_question"
  | "draw_diagram"
  | "update_sources"
  | "search_sources"
  | "summarize_context";

export type SourceWireSearchRadius = "project" | "source" | "global";

export type SourceWireSecondBrainRequest = {
  command: "/2nd-brain";
  prompt: string;
  radius?: SourceWireSearchRadius;
};

export type SourceWireEvidenceGap = {
  reason: string;
  nextAction?: string;
};

export type SourceWireSecondBrainResponse = {
  contractVersion: "second-brain.v1";
  intent: SourceWireSecondBrainIntent;
  radius: SourceWireSearchRadius;
  answer: string;
  citations: SourceWireCitation[];
  gaps: SourceWireEvidenceGap[];
  nextAction: string;
  maintenanceRan: boolean;
  noAutoPromotion: true;
};
