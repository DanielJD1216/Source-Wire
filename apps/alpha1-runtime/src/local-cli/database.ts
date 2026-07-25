import pg from "pg";

import {
  ALPHA1_SCHEMA_VERSION,
  RUNTIME_CONNECTION_TIMEOUT_MS,
  RUNTIME_QUERY_TIMEOUT_MS
} from "../config.js";
import {
  applyAlpha1Migrations,
  assertMigratorRolePosture,
  readAlpha1Migrations,
  type ApplyAlpha1MigrationOptions
} from "../migration.js";
import {
  classifySchemaCompatibility,
  type SchemaMigrationRow
} from "../schema-compatibility.js";
import { SourceWireLocalCliError } from "./result.js";

const { Pool } = pg;

export type SourceWireLocalMigrationEntryV1 = Readonly<{
  version: number;
  name: string;
}>;

export type SourceWireLocalDatabasePlanV1 = Readonly<{
  state: "compatible" | "pending" | "incompatible";
  currentMigrations: readonly SourceWireLocalMigrationEntryV1[];
  targetMigrations: readonly SourceWireLocalMigrationEntryV1[];
  pendingMigrations: readonly SourceWireLocalMigrationEntryV1[];
  mutationApplied: false;
}>;

export type SourceWireLocalDatabaseMigrationResultV1 = Readonly<{
  state: "compatible" | "pending" | "incompatible";
  currentMigrations: readonly SourceWireLocalMigrationEntryV1[];
  targetMigrations: readonly SourceWireLocalMigrationEntryV1[];
  pendingMigrations: readonly SourceWireLocalMigrationEntryV1[];
  applyRequired: boolean;
  applyRequested: boolean;
  migrationResult: "not_applied" | "applied" | "already_applied";
  mutationApplied: boolean;
}>;

type StoredMigrationRow = SchemaMigrationRow & {
  migrationName: string;
};

export async function inspectLocalDatabaseStatus(
  databaseUrl: string
): Promise<SourceWireLocalDatabasePlanV1> {
  const pool = createLocalDatabasePool(
    databaseUrl,
    "source_wire_alpha1_local_status"
  );
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SET LOCAL lock_timeout = '2s'");
      await client.query("SET LOCAL statement_timeout = '2s'");
      await assertRuntimeStatusRolePosture(client);
      const result = await inspectMigrationPlan(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      if (error instanceof SourceWireLocalCliError) throw error;
      if (
        error instanceof Error &&
        error.message === "database_role_posture_invalid"
      ) {
        throw new SourceWireLocalCliError("database_authority_invalid");
      }
      throw new SourceWireLocalCliError("database_status_failed");
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof SourceWireLocalCliError) throw error;
    throw new SourceWireLocalCliError("database_unavailable");
  } finally {
    await pool.end().catch(() => undefined);
  }
}

export async function inspectLocalMigrationPlan(
  databaseUrl: string
): Promise<SourceWireLocalDatabasePlanV1> {
  const pool = createLocalDatabasePool(
    databaseUrl,
    "source_wire_alpha1_local_migration_plan"
  );
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SET LOCAL lock_timeout = '2s'");
      await client.query("SET LOCAL statement_timeout = '2s'");
      await assertMigratorRolePosture(client);
      await client.query("SET LOCAL ROLE source_wire_schema_owner");
      const result = await inspectMigrationPlan(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      if (error instanceof SourceWireLocalCliError) throw error;
      if (
        error instanceof Error &&
        error.message === "database_role_posture_invalid"
      ) {
        throw new SourceWireLocalCliError("database_authority_invalid");
      }
      throw new SourceWireLocalCliError("database_status_failed");
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof SourceWireLocalCliError) throw error;
    throw new SourceWireLocalCliError("database_unavailable");
  } finally {
    await pool.end().catch(() => undefined);
  }
}

export async function applyLocalMigrations(
  databaseUrl: string,
  plan: SourceWireLocalDatabasePlanV1,
  options: ApplyAlpha1MigrationOptions = {}
): Promise<SourceWireLocalDatabaseMigrationResultV1> {
  if (plan.state === "incompatible") {
    throw new SourceWireLocalCliError("database_incompatible");
  }
  const pool = createLocalDatabasePool(
    databaseUrl,
    "source_wire_alpha1_local_migration_apply"
  );
  try {
    const result = await applyAlpha1Migrations(pool, options);
    return {
      state: "compatible",
      currentMigrations: plan.currentMigrations,
      targetMigrations: plan.targetMigrations,
      pendingMigrations: plan.pendingMigrations,
      applyRequired: plan.state === "pending",
      applyRequested: true,
      migrationResult: result.status,
      mutationApplied: result.status === "applied"
    };
  } catch (error) {
    if (error instanceof SourceWireLocalCliError) throw error;
    if (
      error instanceof Error &&
      [
        "schema_incompatible",
        "schema_too_old",
        "schema_too_new",
        "database_role_posture_invalid"
      ].includes(error.message)
    ) {
      throw new SourceWireLocalCliError(
        error.message === "database_role_posture_invalid"
          ? "database_authority_invalid"
          : "database_incompatible"
      );
    }
    throw new SourceWireLocalCliError("database_migration_failed");
  } finally {
    await pool.end().catch(() => undefined);
  }
}

export function migrationPlanResult(
  plan: SourceWireLocalDatabasePlanV1
): SourceWireLocalDatabaseMigrationResultV1 {
  return {
    state: plan.state === "compatible" ? "compatible" : plan.state,
    currentMigrations: plan.currentMigrations,
    targetMigrations: plan.targetMigrations,
    pendingMigrations: plan.pendingMigrations,
    applyRequired: plan.state === "pending",
    applyRequested: false,
    migrationResult: "not_applied",
    mutationApplied: false
  };
}

async function inspectMigrationPlan(
  client: pg.PoolClient
): Promise<SourceWireLocalDatabasePlanV1> {
  const target = await readAlpha1Migrations();
  const relation = await client.query<{ migration_table: string | null }>(
    "SELECT to_regclass('source_wire_memory.schema_migrations')::text AS migration_table"
  );
  const migrationTableExists =
    relation.rows[0]?.migration_table !== null &&
    relation.rows[0]?.migration_table !== undefined;
  const rows = migrationTableExists
    ? await readStoredMigrationRows(client)
    : [];
  const compatibility =
    !migrationTableExists
      ? { compatible: false as const, code: "schema_too_old" as const }
      : classifySchemaCompatibility(rows, target);
  const exactPrefix =
    !compatibility.compatible &&
    compatibility.code === "schema_too_old";
  const state = compatibility.compatible
    ? "compatible"
    : exactPrefix
      ? "pending"
      : "incompatible";
  const safeCurrent = rows.map((row) => {
    const expected = target.find(
      (migration) =>
        migration.version === row.version &&
        migration.checksumSha256 === row.checksumSha256 &&
        row.state === "completed"
    );
    return {
      version: row.version,
      name: expected?.name ?? "unrecognized"
    };
  });
  const safeTarget = target.map(({ version, name }) => ({ version, name }));
  return {
    state,
    currentMigrations: safeCurrent,
    targetMigrations: safeTarget,
    pendingMigrations:
      state === "pending" ? safeTarget.slice(rows.length) : [],
    mutationApplied: false
  };
}

async function readStoredMigrationRows(
  client: pg.PoolClient
): Promise<StoredMigrationRow[]> {
  const result = await client.query<{
    version: number;
    migration_name: string;
    checksum_sha256: string;
    state: string;
  }>(
    `SELECT version, migration_name, checksum_sha256, state
       FROM source_wire_memory.schema_migrations
      ORDER BY version`
  );
  return result.rows.map((row) => ({
    version: row.version,
    migrationName: row.migration_name,
    checksumSha256: row.checksum_sha256,
    state: row.state
  }));
}

async function assertRuntimeStatusRolePosture(
  client: pg.PoolClient
): Promise<void> {
  const result = await client.query<{
    current_user: string;
    can_login: boolean;
    inherits: boolean;
    creates_database: boolean;
    creates_role: boolean;
    superuser: boolean;
    replication: boolean;
    bypasses_rls: boolean;
    can_assume_owner: boolean;
  }>(
    `SELECT
       current_user,
       (SELECT rolcanlogin FROM pg_roles WHERE rolname = current_user) AS can_login,
       (SELECT rolinherit FROM pg_roles WHERE rolname = current_user) AS inherits,
       (SELECT rolcreatedb FROM pg_roles WHERE rolname = current_user) AS creates_database,
       (SELECT rolcreaterole FROM pg_roles WHERE rolname = current_user) AS creates_role,
       (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS superuser,
       (SELECT rolreplication FROM pg_roles WHERE rolname = current_user) AS replication,
       (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS bypasses_rls,
       pg_has_role(current_user, 'source_wire_schema_owner', 'MEMBER') AS can_assume_owner`
  );
  const row = result.rows[0];
  if (
    !row ||
    row.current_user !== "source_wire_runtime" ||
    !row.can_login ||
    row.inherits ||
    row.creates_database ||
    row.creates_role ||
    row.superuser ||
    row.replication ||
    row.bypasses_rls ||
    row.can_assume_owner
  ) {
    throw new SourceWireLocalCliError("database_authority_invalid");
  }
}

function createLocalDatabasePool(
  databaseUrl: string,
  applicationName: string
): pg.Pool {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: RUNTIME_CONNECTION_TIMEOUT_MS,
    query_timeout: RUNTIME_QUERY_TIMEOUT_MS,
    statement_timeout: RUNTIME_QUERY_TIMEOUT_MS,
    application_name: applicationName
  });
  pool.on("error", () => undefined);
  return pool;
}
