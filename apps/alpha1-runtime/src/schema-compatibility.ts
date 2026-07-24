import { ALPHA1_SCHEMA_VERSION } from "./config.js";

export type SchemaMigrationRow = {
  version: number;
  checksumSha256: string;
  state: string;
};

export type SchemaCompatibility =
  | {
      compatible: true;
      version: typeof ALPHA1_SCHEMA_VERSION;
    }
  | {
      compatible: false;
      code: "schema_incompatible" | "schema_too_old" | "schema_too_new";
    };

export function classifySchemaCompatibility(
  rows: SchemaMigrationRow[],
  expectedMigrations: ReadonlyArray<{
    version: number;
    checksumSha256: string;
  }>
): SchemaCompatibility {
  if (rows.length === 0 || expectedMigrations.length === 0) {
    return { compatible: false, code: "schema_incompatible" };
  }

  const highestVersion = rows.at(-1)?.version;
  if (!Number.isInteger(highestVersion)) {
    return { compatible: false, code: "schema_incompatible" };
  }

  if ((highestVersion as number) > ALPHA1_SCHEMA_VERSION || rows.length > expectedMigrations.length) {
    return { compatible: false, code: "schema_too_new" };
  }

  if (rows.length < expectedMigrations.length) {
    const exactPrefix = rows.every((row, index) => {
      const expected = expectedMigrations[index];
      return (
        expected !== undefined &&
        row.version === expected.version &&
        row.state === "completed" &&
        row.checksumSha256 === expected.checksumSha256
      );
    });
    return exactPrefix
      ? { compatible: false, code: "schema_too_old" }
      : { compatible: false, code: "schema_incompatible" };
  }

  if (rows.length !== expectedMigrations.length) {
    return { compatible: false, code: "schema_incompatible" };
  }

  if (
    rows.some((row, index) => {
      const expected = expectedMigrations[index];
      return (
        !expected ||
        !Number.isInteger(row.version) ||
        row.version !== expected.version ||
        row.state !== "completed" ||
        row.checksumSha256 !== expected.checksumSha256
      );
    })
  ) {
    return { compatible: false, code: "schema_incompatible" };
  }

  if ((highestVersion as number) < ALPHA1_SCHEMA_VERSION) {
    return { compatible: false, code: "schema_too_old" };
  }

  if ((highestVersion as number) > ALPHA1_SCHEMA_VERSION) {
    return { compatible: false, code: "schema_too_new" };
  }

  return {
    compatible: true,
    version: ALPHA1_SCHEMA_VERSION
  };
}
