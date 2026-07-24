import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

import {
  RUNTIME_CONNECTION_TIMEOUT_MS,
  RUNTIME_POOL_MAX,
  RUNTIME_QUERY_TIMEOUT_MS
} from "./config.js";
import { story1DrizzleSchema } from "./drizzle-schema.js";

const { Pool } = pg;

export type Story1Database = {
  pool: pg.Pool;
  drizzle: NodePgDatabase<typeof story1DrizzleSchema>;
};

export function createRuntimeDatabase(databaseUrl: string): Story1Database {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: RUNTIME_POOL_MAX,
    connectionTimeoutMillis: RUNTIME_CONNECTION_TIMEOUT_MS,
    query_timeout: RUNTIME_QUERY_TIMEOUT_MS,
    statement_timeout: RUNTIME_QUERY_TIMEOUT_MS,
    lock_timeout: RUNTIME_QUERY_TIMEOUT_MS,
    options: "-c search_path=source_wire_memory,pg_catalog",
    application_name: "source_wire_alpha1_runtime"
  });
  pool.on("error", () => {
    // A terminated idle connection must not crash the loopback runtime.
  });

  return {
    pool,
    drizzle: drizzle(pool, { schema: story1DrizzleSchema })
  };
}

export function createOperatorPool(
  databaseUrl: string,
  timeoutMs = 10_000
): pg.Pool {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 2_000,
    query_timeout: timeoutMs,
    statement_timeout: timeoutMs,
    application_name: "source_wire_alpha1_operator"
  });
  pool.on("error", () => {
    // Operator callers receive the query failure through their active command.
  });
  return pool;
}
