import {
  SOURCE_WIRE_SCHEMA_EXPORT_LIST,
  SOURCE_WIRE_SCHEMA_EXPORTS
} from "@source-wire/contracts";

export const schemaPackageSubpaths = SOURCE_WIRE_SCHEMA_EXPORT_LIST.map((schemaExport) => ({
  name: schemaExport.name,
  packageSubpath: schemaExport.packageSubpath
}));

export const projectContextPackSchema = SOURCE_WIRE_SCHEMA_EXPORTS.projectContextPack;

export const supportedSchemaIds = SOURCE_WIRE_SCHEMA_EXPORT_LIST.map((schemaExport) => schemaExport.schemaId);
