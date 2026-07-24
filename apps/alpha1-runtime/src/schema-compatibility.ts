import { STORY1_SCHEMA_VERSION } from "./config.js";

export type SchemaMigrationRow = {
  version: number;
  checksumSha256: string;
  state: string;
};

export type SchemaCompatibility =
  | {
      compatible: true;
      version: typeof STORY1_SCHEMA_VERSION;
    }
  | {
      compatible: false;
      code: "schema_incompatible" | "schema_too_old" | "schema_too_new";
    };

export function classifySchemaCompatibility(
  rows: SchemaMigrationRow[],
  expectedChecksum: string
): SchemaCompatibility {
  if (rows.length !== 1) {
    return { compatible: false, code: "schema_incompatible" };
  }

  const row = rows[0];
  if (!row || !Number.isInteger(row.version)) {
    return { compatible: false, code: "schema_incompatible" };
  }

  if (row.version < STORY1_SCHEMA_VERSION) {
    return { compatible: false, code: "schema_too_old" };
  }

  if (row.version > STORY1_SCHEMA_VERSION) {
    return { compatible: false, code: "schema_too_new" };
  }

  if (row.state !== "completed" || row.checksumSha256 !== expectedChecksum) {
    return { compatible: false, code: "schema_incompatible" };
  }

  return {
    compatible: true,
    version: STORY1_SCHEMA_VERSION
  };
}
