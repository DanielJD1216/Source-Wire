import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type pg from "pg";

import { ALPHA1_SCHEMA_VERSION, STORY1_SCHEMA_VERSION } from "./config.js";
import {
  classifySchemaCompatibility,
  type SchemaCompatibility,
  type SchemaMigrationRow
} from "./schema-compatibility.js";

export const STORY1_MIGRATION_NAME = "0001_story1_bootstrap.sql";
export const STORY2_MIGRATION_NAME = "0002_story2_candidate_lifecycle.sql";
const MIGRATION_ADVISORY_LOCK = 1_913_770_101;

export type MigrationDefinition = {
  version: number;
  name: string;
  sql: string;
  checksumSha256: string;
};

export type MigrationResult = {
  status: "applied" | "already_applied";
  version: typeof ALPHA1_SCHEMA_VERSION;
  checksumSha256: string;
  migrations: Array<{
    version: number;
    name: string;
    checksumSha256: string;
  }>;
};

export async function readStory1Migration(): Promise<{ sql: string; checksumSha256: string }> {
  const [migration] = await readAlpha1Migrations();
  if (!migration || migration.version !== STORY1_SCHEMA_VERSION) {
    throw new Error("schema_incompatible");
  }
  return { sql: migration.sql, checksumSha256: migration.checksumSha256 };
}

export async function readAlpha1Migrations(): Promise<MigrationDefinition[]> {
  const definitions = [
    { version: STORY1_SCHEMA_VERSION, name: STORY1_MIGRATION_NAME },
    { version: ALPHA1_SCHEMA_VERSION, name: STORY2_MIGRATION_NAME }
  ] as const;

  return Promise.all(
    definitions.map(async ({ version, name }) => {
      const migrationUrl = new URL(`../../migrations/${name}`, import.meta.url);
      const sql = await readFile(fileURLToPath(migrationUrl), "utf8");
      return {
        version,
        name,
        sql,
        checksumSha256: createHash("sha256").update(sql, "utf8").digest("hex")
      };
    })
  );
}

export async function applyAlpha1Migrations(pool: pg.Pool): Promise<MigrationResult> {
  const migrations = await readAlpha1Migrations();
  const client = await pool.connect();
  let appliedCount = 0;

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '2s'");
    await client.query("SET LOCAL statement_timeout = '2s'");
    await client.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_ADVISORY_LOCK]);
    await assertDatabaseRolePosture(client);
    await client.query("SET LOCAL ROLE source_wire_schema_owner");
    await assertPostgresql16(client);

    const relation = await client.query<{ migration_table: string | null }>(
      "SELECT to_regclass('source_wire_memory.schema_migrations')::text AS migration_table"
    );
    let existingRows: SchemaMigrationRow[] = [];
    if (relation.rows[0]?.migration_table) {
      existingRows = await readMigrationRows(client);
      assertExactMigrationPrefix(existingRows, migrations);
    }

    for (const migration of migrations.slice(existingRows.length)) {
      await client.query(migration.sql);
      await client.query(
        `INSERT INTO source_wire_memory.schema_migrations
          (version, migration_name, checksum_sha256, state)
         VALUES ($1, $2, $3, 'completed')`,
        [migration.version, migration.name, migration.checksumSha256]
      );
      appliedCount += 1;
    }

    const completedRows = await readMigrationRows(client);
    const compatibility = classifySchemaCompatibility(completedRows, migrations);
    if (!compatibility.compatible) {
      throw new Error(compatibility.code);
    }
    await client.query("COMMIT");

    const latest = migrations.at(-1);
    if (!latest) throw new Error("schema_incompatible");
    return {
      status: appliedCount > 0 ? "applied" : "already_applied",
      version: ALPHA1_SCHEMA_VERSION,
      checksumSha256: latest.checksumSha256,
      migrations: migrations.map(({ version, name, checksumSha256 }) => ({
        version,
        name,
        checksumSha256
      }))
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export const applyStory1Migration = applyAlpha1Migrations;

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
  const migrations = await readAlpha1Migrations();

  try {
    const rows = await readMigrationRows(queryable);
    return classifySchemaCompatibility(rows, migrations);
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

function assertExactMigrationPrefix(
  rows: SchemaMigrationRow[],
  migrations: MigrationDefinition[]
): void {
  if (rows.length === 0) {
    throw new Error("schema_incompatible");
  }
  if (rows.length > migrations.length || (rows.at(-1)?.version ?? 0) > ALPHA1_SCHEMA_VERSION) {
    throw new Error("schema_too_new");
  }
  const exact = rows.every((row, index) => {
    const expected = migrations[index];
    return (
      expected !== undefined &&
      row.version === expected.version &&
      row.state === "completed" &&
      row.checksumSha256 === expected.checksumSha256
    );
  });
  if (!exact) {
    throw new Error("schema_incompatible");
  }
}

async function assertDatabaseRolePosture(client: pg.PoolClient): Promise<void> {
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
  const row = posture.rows[0];
  if (
    !row ||
    row.public_schema_create ||
    !row.migrator_can_assume_owner ||
    row.schema_owner_can_login ||
    !row.runtime_can_login ||
    row.runtime_inherits ||
    row.runtime_creates_database ||
    row.runtime_creates_role ||
    row.runtime_superuser ||
    row.runtime_bypasses_rls
  ) {
    throw new Error("database_role_posture_invalid");
  }
}

async function assertPostgresql16(client: pg.PoolClient): Promise<void> {
  const result = await client.query<{ server_version_num: string }>(
    "SELECT current_setting('server_version_num') AS server_version_num"
  );
  if (Math.floor(Number(result.rows[0]?.server_version_num ?? "0") / 10_000) !== 16) {
    throw new Error("postgresql_version_unsupported");
  }
}

async function readMigrationRows(
  queryable: Pick<pg.Pool, "query"> | Pick<pg.PoolClient, "query">
): Promise<SchemaMigrationRow[]> {
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
