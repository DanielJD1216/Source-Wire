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
