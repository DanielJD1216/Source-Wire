import assert from "node:assert/strict";
import test from "node:test";

import pg from "pg";

import * as databaseModule from "../src/local-cli/database.js";

type DatabasePlan = Readonly<{
  state: "compatible" | "pending" | "incompatible";
  currentMigrations: readonly Readonly<{ version: number; name: string }>[];
  targetMigrations: readonly Readonly<{ version: number; name: string }>[];
  pendingMigrations: readonly Readonly<{ version: number; name: string }>[];
  mutationApplied: false;
}>;

type ClassifyLocalDatabaseStatus = (input: Readonly<{
  postgresVersionNum: number;
  compatiblePostgresMajor?: 16;
  inRecovery: boolean;
  transactionReadOnly: boolean;
  plan: DatabasePlan;
}>) => unknown;

function classifier(): ClassifyLocalDatabaseStatus {
  const classify = (
    databaseModule as unknown as {
      classifyLocalDatabaseStatus?: ClassifyLocalDatabaseStatus;
    }
  ).classifyLocalDatabaseStatus;
  if (typeof classify !== "function") {
    assert.fail("classifyLocalDatabaseStatus must be implemented");
  }
  return classify;
}

const compatiblePlan: DatabasePlan = {
  state: "compatible",
  currentMigrations: [{ version: 8, name: "0008_gate_b_durable_receipt_handoff.sql" }],
  targetMigrations: [{ version: 8, name: "0008_gate_b_durable_receipt_handoff.sql" }],
  pendingMigrations: [],
  mutationApplied: false
};

test("unsupported PostgreSQL posture short-circuits before migration metadata", async (t) => {
  let migrationMetadataInspected = false;
  const client = {
    query: async (sql: string) => {
      if (sql.includes("pg_has_role")) {
        return {
          rows: [{
            current_user: "source_wire_runtime",
            can_login: true,
            inherits: false,
            creates_database: false,
            creates_role: false,
            superuser: false,
            replication: false,
            bypasses_rls: false,
            can_assume_owner: false
          }]
        };
      }
      if (sql.includes("server_version_num")) {
        return {
          rows: [{
            server_version_num: "180003",
            in_recovery: false,
            transaction_read_only: "on"
          }]
        };
      }
      if (sql.includes("schema_migrations")) {
        migrationMetadataInspected = true;
      }
      return { rows: [] };
    },
    release: () => undefined
  } as unknown as pg.PoolClient;
  const poolPrototype = pg.Pool.prototype as unknown as {
    connect(): Promise<pg.PoolClient>;
    end(): Promise<void>;
  };
  t.mock.method(poolPrototype, "connect", async () => client);
  t.mock.method(poolPrototype, "end", async () => undefined);

  const result = await databaseModule.inspectLocalDatabaseStatus(
    "postgresql://runtime:synthetic@127.0.0.1:1/disposable"
  );
  assert.equal(result.state, "incompatible");
  assert.equal(result.postgresqlSupport, "unsupported");
  assert.equal(migrationMetadataInspected, false);
});

test("standby and invalid read-only posture short-circuit before migration metadata", async (t) => {
  let migrationMetadataInspected = false;
  const postures = [
    {
      server_version_num: "180004",
      in_recovery: true,
      transaction_read_only: "on"
    },
    {
      server_version_num: "180004",
      in_recovery: false,
      transaction_read_only: "off"
    }
  ];
  const clients = postures.map((posture) => ({
    query: async (sql: string) => {
      if (sql.includes("pg_has_role")) {
        return {
          rows: [{
            current_user: "source_wire_runtime",
            can_login: true,
            inherits: false,
            creates_database: false,
            creates_role: false,
            superuser: false,
            replication: false,
            bypasses_rls: false,
            can_assume_owner: false
          }]
        };
      }
      if (sql.includes("server_version_num")) return { rows: [posture] };
      if (sql.includes("schema_migrations")) {
        migrationMetadataInspected = true;
      }
      return { rows: [] };
    },
    release: () => undefined
  })) as unknown as pg.PoolClient[];
  let clientIndex = 0;
  const poolPrototype = pg.Pool.prototype as unknown as {
    connect(): Promise<pg.PoolClient>;
    end(): Promise<void>;
  };
  t.mock.method(poolPrototype, "connect", async () => clients[clientIndex++]);
  t.mock.method(poolPrototype, "end", async () => undefined);

  for (const _posture of postures) {
    const result = await databaseModule.inspectLocalDatabaseStatus(
      "postgresql://runtime:***@127.0.0.1:1/disposable"
    );
    assert.equal(result.state, "incompatible");
  }
  assert.equal(migrationMetadataInspected, false);
});

test("database status destroys a client when rollback cleanup fails", async (t) => {
  const operationError = new Error("synthetic_status_query_failed");
  const cleanupError = new Error("synthetic_status_cleanup_failed");
  let releasedWith: Error | boolean | undefined;
  const client = {
    query: (sql: string) => {
      if (sql === "ROLLBACK") throw cleanupError;
      throw operationError;
    },
    release: (error?: Error | boolean) => {
      releasedWith = error;
    }
  } as unknown as pg.PoolClient;
  const poolPrototype = pg.Pool.prototype as unknown as {
    connect(): Promise<pg.PoolClient>;
    end(): Promise<void>;
  };
  t.mock.method(poolPrototype, "connect", async () => client);
  t.mock.method(poolPrototype, "end", async () => undefined);

  await assert.rejects(
    databaseModule.inspectLocalDatabaseStatus(
      "postgresql://runtime:synthetic@127.0.0.1:1/disposable"
    )
  );
  assert.equal(releasedWith, cleanupError);
});

test("database status bounds a stalled successful rollback and destroys the client", async (t) => {
  let releasedWith: Error | boolean | undefined;
  const client = {
    query: async (sql: string) => {
      if (sql.includes("pg_has_role")) {
        return {
          rows: [{
            current_user: "source_wire_runtime",
            can_login: true,
            inherits: false,
            creates_database: false,
            creates_role: false,
            superuser: false,
            replication: false,
            bypasses_rls: false,
            can_assume_owner: false
          }]
        };
      }
      if (sql.includes("server_version_num")) {
        return {
          rows: [{
            server_version_num: "180004",
            in_recovery: false,
            transaction_read_only: "on"
          }]
        };
      }
      if (sql === "ROLLBACK") {
        return await new Promise<{ rows: never[] }>((resolve) => {
          setTimeout(() => resolve({ rows: [] }), 500);
        });
      }
      return { rows: [] };
    },
    release: (error?: Error | boolean) => {
      releasedWith = error;
    }
  } as unknown as pg.PoolClient;
  const poolPrototype = pg.Pool.prototype as unknown as {
    connect(): Promise<pg.PoolClient>;
    end(): Promise<void>;
  };
  t.mock.method(poolPrototype, "connect", async () => client);
  t.mock.method(poolPrototype, "end", async () => undefined);

  await assert.rejects(
    databaseModule.inspectLocalDatabaseStatus(
      "postgresql://runtime:***@127.0.0.1:1/disposable"
    )
  );
  assert.ok(releasedWith instanceof Error);
  assert.equal(releasedWith.message, "local_database_transaction_cleanup_timeout");
});

test("classifies exact PostgreSQL 18.4 as authoritative read-only primary status", () => {
  const result = classifier()({
    postgresVersionNum: 180004,
    inRecovery: false,
    transactionReadOnly: true,
    plan: compatiblePlan
  });
  assert.deepEqual(result, {
    schema: "source-wire.local-database-status.v1",
    state: "compatible",
    schemaState: "compatible",
    postgresqlVersionNum: 180004,
    postgresqlSupport: "authoritative_18_4",
    recoveryState: "primary",
    inspectionMode: "read_only",
    currentMigrations: compatiblePlan.currentMigrations,
    targetMigrations: compatiblePlan.targetMigrations,
    pendingMigrations: [],
    mutationApplied: false
  });
});

test("classifies PostgreSQL 16 only with explicit compatibility selection", () => {
  const selected = classifier()({
    postgresVersionNum: 160014,
    compatiblePostgresMajor: 16,
    inRecovery: false,
    transactionReadOnly: true,
    plan: compatiblePlan
  }) as { state: string; postgresqlSupport: string };
  assert.equal(selected.state, "compatible");
  assert.equal(selected.postgresqlSupport, "compatibility_16");

  const unselected = classifier()({
    postgresVersionNum: 160014,
    inRecovery: false,
    transactionReadOnly: true,
    plan: compatiblePlan
  }) as { state: string; postgresqlSupport: string };
  assert.equal(unselected.state, "incompatible");
  assert.equal(unselected.postgresqlSupport, "unsupported");
});

test("rejects nearby PostgreSQL 18 patches and unsupported majors", () => {
  for (const postgresVersionNum of [180003, 180005, 190000]) {
    const result = classifier()({
      postgresVersionNum,
      inRecovery: false,
      transactionReadOnly: true,
      plan: compatiblePlan
    }) as { state: string; postgresqlSupport: string };
    assert.equal(result.state, "incompatible");
    assert.equal(result.postgresqlSupport, "unsupported");
  }
});

test("classifies standby recovery state as incompatible", () => {
  const result = classifier()({
    postgresVersionNum: 180004,
    inRecovery: true,
    transactionReadOnly: true,
    plan: compatiblePlan
  }) as { state: string; recoveryState: string };
  assert.equal(result.state, "incompatible");
  assert.equal(result.recoveryState, "standby");
});

test("refuses a non-read-only inspection invariant", () => {
  const result = classifier()({
    postgresVersionNum: 180004,
    inRecovery: false,
    transactionReadOnly: false,
    plan: compatiblePlan
  }) as { state: string; inspectionMode: string };
  assert.equal(result.state, "incompatible");
  assert.equal(result.inspectionMode, "invalid");
});
