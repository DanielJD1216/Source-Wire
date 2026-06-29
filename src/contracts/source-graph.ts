export type SourceWireSourceClass =
  | "markdown_vault"
  | "chat_export"
  | "project_context_pack"
  | "second_brain_example"
  | "custom";

export type SourceWireSensitivity = "public" | "internal" | "private" | "unknown";

export type SourceWireFreshness = "fresh" | "changed" | "stale" | "unknown";

export type SourceWireCitation = {
  type: "source_segment";
  sourceTitle: string;
  locator: string;
};

export type SourceWireSourceCollection = {
  id: string;
  sourceClass: SourceWireSourceClass;
  title: string;
  description?: string;
  fixtureSafety?: "synthetic" | "fake" | "redacted";
};

export type SourceWireSourceItem = {
  id: string;
  collectionId: string;
  sourceClass: SourceWireSourceClass;
  title: string;
  sensitivity: SourceWireSensitivity;
  freshness: SourceWireFreshness;
  metadata?: Record<string, string | number | boolean | string[]>;
};

export type SourceWireSourceSegment = {
  id: string;
  sourceItemId: string;
  title?: string;
  locator: string;
  content: string;
  citation: SourceWireCitation;
};

export type SourceWireSourceEdgeKind =
  | "links_to"
  | "belongs_to"
  | "has_tag"
  | "has_alias"
  | "supersedes"
  | "marks_stale";

export type SourceWireSourceEdge = {
  id: string;
  fromId: string;
  toId: string;
  kind: SourceWireSourceEdgeKind;
  label?: string;
};

export type SourceWireSourceGraph = {
  collections: SourceWireSourceCollection[];
  items: SourceWireSourceItem[];
  segments: SourceWireSourceSegment[];
  edges: SourceWireSourceEdge[];
};
