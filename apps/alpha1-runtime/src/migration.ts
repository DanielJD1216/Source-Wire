import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type pg from "pg";

import { STORY1_SCHEMA_VERSION } from "./config.js";
import {
  classifySchemaCompatibility,
  type SchemaCompatibility,
  type SchemaMigrationRow
} from "./schema-compatibility.js";

export const STORY1_MIGRATION_NAME = "0001_story1_bootstrap.sql";
const MIGRATION_ADVISORY_LOCK = 1_913_770_101;

export type MigrationResult = {
  status: "applied" | "already_applied";
  version: typeof STORY1_SCHEMA_VERSION;
  checksumSha256: string;
};

export async function readStory1Migration(): Promise<{ sql: string; checksumSha256: string }> {
  const migrationUrl = new URL(`../../migrations/${STORY1_MIGRATION_NAME}`, import.meta.url);
  const sql = await readFile(fileURLToPath(migrationUrl), "utf8");
  const checksumSha256 = createHash("sha256").update(sql, "utf8").digest("hex");

  return { sql, checksumSha256 };
}

export async function applyStory1Migration(pool: pg.Pool): Promise<MigrationResult> {
  const migration = await readStory1Migration();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '2s'");
    await client.query("SET LOCAL statement_timeout = '2s'");
    await client.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_ADVISORY_LOCK]);
    const posture = await client.query<{
      public_schema_create: boolean;
      migrator_can_assume_owner: boolean;
      schema_owner_can_login: boolean;
      runtime_can_login: boolean;
      runtime_inherits: boolean;
      runtime_creates_database: boolean;
      runtime_creates_role: boolean;
      runtime_superuser: boolean;
      runtime_bypasses_rls: boolean;
    }>(
      `SELECT
         has_schema_privilege('public', 'CREATE') AS public_schema_create,
         pg_has_role(current_user, 'source_wire_schema_owner', 'MEMBER') AS migrator_can_assume_owner,
         (SELECT rolcanlogin FROM pg_roles WHERE rolname = 'source_wire_schema_owner') AS schema_owner_can_login,
         (SELECT rolcanlogin FROM pg_roles WHERE rolname = 'source_wire_runtime') AS runtime_can_login,
         (SELECT rolinherit FROM pg_roles WHERE rolname = 'source_wire_runtime') AS runtime_inherits,
         (SELECT rolcreatedb FROM pg_roles WHERE rolname = 'source_wire_runtime') AS runtime_creates_database,
         (SELECT rolcreaterole FROM pg_roles WHERE rolname = 'source_wire_runtime') AS runtime_creates_role,
         (SELECT rolsuper FROM pg_roles WHERE rolname = 'source_wire_runtime') AS runtime_superuser,
         (SELECT rolbypassrls FROM pg_roles WHERE rolname = 'source_wire_runtime') AS runtime_bypasses_rls`
    );
    const rolePosture = posture.rows[0];
    if (
      !rolePosture ||
      rolePosture.public_schema_create ||
      !rolePosture.migrator_can_assume_owner ||
      rolePosture.schema_owner_can_login ||
      !rolePosture.runtime_can_login ||
      rolePosture.runtime_inherits ||
      rolePosture.runtime_creates_database ||
      rolePosture.runtime_creates_role ||
      rolePosture.runtime_superuser ||
      rolePosture.runtime_bypasses_rls
    ) {
      throw new Error("database_role_posture_invalid");
    }
    await client.query("SET LOCAL ROLE source_wire_schema_owner");

    const server = await client.query<{ server_version_num: string }>(
      "SELECT current_setting('server_version_num') AS server_version_num"
    );
    const serverVersion = Number(server.rows[0]?.server_version_num ?? "0");
    if (Math.floor(serverVersion / 10_000) !== 16) {
      throw new Error("postgresql_version_unsupported");
    }

    const relation = await client.query<{ migration_table: string | null }>(
      "SELECT to_regclass('source_wire_memory.schema_migrations')::text AS migration_table"
    );

    if (relation.rows[0]?.migration_table) {
      const rows = await readMigrationRows(client);
      const compatibility = classifySchemaCompatibility(rows, migration.checksumSha256);
      if (!compatibility.compatible) {
        throw new Error(compatibility.code);
      }

      await client.query("COMMIT");
      return {
        status: "already_applied",
        version: STORY1_SCHEMA_VERSION,
        checksumSha256: migration.checksumSha256
      };
    }

    await client.query(migration.sql);
    await client.query(
      `INSERT INTO source_wire_memory.schema_migrations
        (version, migration_name, checksum_sha256, state)
       VALUES ($1, $2, $3, 'completed')`,
      [STORY1_SCHEMA_VERSION, STORY1_MIGRATION_NAME, migration.checksumSha256]
    );
    await client.query("COMMIT");

    return {
      status: "applied",
      version: STORY1_SCHEMA_VERSION,
      checksumSha256: migration.checksumSha256
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function inspectSchemaCompatibility(pool: pg.Pool): Promise<SchemaCompatibility> {
  return inspectSchemaCompatibilityWithQueryable(pool);
}

export async function inspectSchemaCompatibilityAsMigrator(
  pool: pg.Pool
): Promise<SchemaCompatibility> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE source_wire_schema_owner");
    const compatibility = await inspectSchemaCompatibilityWithQueryable(client);
    await client.query("COMMIT");
    return compatibility;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function inspectSchemaCompatibilityWithQueryable(
  queryable: Pick<pg.Pool, "query"> | Pick<pg.PoolClient, "query">
): Promise<SchemaCompatibility> {
  const migration = await readStory1Migration();

  try {
    const rows = await readMigrationRows(queryable);
    return classifySchemaCompatibility(rows, migration.checksumSha256);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    if (code !== "42P01" && code !== "3F000") {
      throw error;
    }
    return {
      compatible: false,
      code: "schema_incompatible"
    };
  }
}

async function readMigrationRows(queryable: Pick<pg.Pool, "query"> | Pick<pg.PoolClient, "query">): Promise<SchemaMigrationRow[]> {
  const result = await queryable.query<{
    version: number;
    checksum_sha256: string;
    state: string;
  }>(
    `SELECT version, checksum_sha256, state
       FROM source_wire_memory.schema_migrations
      ORDER BY version`
  );

  return result.rows.map((row) => ({
    version: row.version,
    checksumSha256: row.checksum_sha256,
    state: row.state
  }));
}
