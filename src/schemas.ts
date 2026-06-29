export type SourceWireSchemaName = "projectContextPack" | "secondBrainV1" | "chatExportMessage";

export type SourceWireSchemaExport = {
  name: SourceWireSchemaName;
  schemaId: string;
  title: string;
  packageSubpath: string;
  filePath: string;
};

export const SOURCE_WIRE_SCHEMA_EXPORTS = {
  projectContextPack: {
    name: "projectContextPack",
    schemaId: "project-context-pack.schema.json",
    title: "Source-Wire Public Project Context Pack",
    packageSubpath: "@source-wire/contracts/schemas/project-context-pack",
    filePath: "schemas/project-context-pack.schema.json"
  },
  secondBrainV1: {
    name: "secondBrainV1",
    schemaId: "second-brain-v1.schema.json",
    title: "Source-Wire second-brain.v1 Fixture",
    packageSubpath: "@source-wire/contracts/schemas/second-brain-v1",
    filePath: "schemas/second-brain-v1.schema.json"
  },
  chatExportMessage: {
    name: "chatExportMessage",
    schemaId: "chat-export-message.schema.json",
    title: "Source-Wire Chat Export Message",
    packageSubpath: "@source-wire/contracts/schemas/chat-export-message",
    filePath: "schemas/chat-export-message.schema.json"
  }
} as const satisfies Record<SourceWireSchemaName, SourceWireSchemaExport>;

export const SOURCE_WIRE_SCHEMA_EXPORT_LIST = [
  SOURCE_WIRE_SCHEMA_EXPORTS.projectContextPack,
  SOURCE_WIRE_SCHEMA_EXPORTS.secondBrainV1,
  SOURCE_WIRE_SCHEMA_EXPORTS.chatExportMessage
] as const satisfies readonly SourceWireSchemaExport[];
