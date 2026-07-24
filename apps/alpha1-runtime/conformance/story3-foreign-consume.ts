import { randomBytes } from "node:crypto";

import pg from "pg";

import {
  consumeProtectedReadReceipt,
  type ProtectedReadReceiptBinding
} from "../src/trusted-memory-search.js";

const databaseUrl = process.env.SOURCE_WIRE_STORY3_RUNTIME_URL;
const encodedBinding = process.env.SOURCE_WIRE_STORY3_RECEIPT_BINDING;
if (!databaseUrl || !encodedBinding) {
  throw new Error("story3_foreign_consume_input_missing");
}

const binding = JSON.parse(
  Buffer.from(encodedBinding, "base64url").toString("utf8")
) as ProtectedReadReceiptBinding;
const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 2_000,
  query_timeout: 2_000,
  statement_timeout: 2_000,
  lock_timeout: 2_000,
  application_name: "source_wire_story3_foreign_consume"
});

try {
  const consumed = await consumeProtectedReadReceipt(
    pool,
    randomBytes(32),
    binding
  );
  process.stdout.write(`${JSON.stringify({ consumed })}\n`);
} finally {
  await pool.end();
}
