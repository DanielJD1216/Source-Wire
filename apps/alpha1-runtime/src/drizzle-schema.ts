import {
  customType,
  jsonb,
  pgSchema,
  primaryKey,
  smallint,
  timestamp,
  unique,
  uuid,
  varchar,
  integer
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  }
});

export const sourceWireMemory = pgSchema("source_wire_memory");

export const schemaMigrations = sourceWireMemory.table("schema_migrations", {
  version: integer("version").primaryKey(),
  migrationName: varchar("migration_name", { length: 255 }).notNull(),
  checksumSha256: varchar("checksum_sha256", { length: 64 }).notNull(),
  state: varchar("state", { length: 16 }).notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true, mode: "date" }).notNull()
});

export const owners = sourceWireMemory.table("owners", {
  ownerId: varchar("owner_id", { length: 64 }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
});

export const namespaces = sourceWireMemory.table(
  "namespaces",
  {
    namespaceId: varchar("namespace_id", { length: 64 }).primaryKey(),
    ownerId: varchar("owner_id", { length: 64 })
      .notNull()
      .references(() => owners.ownerId),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [unique("namespaces_owner_namespace_unique").on(table.ownerId, table.namespaceId)]
);

export const credentials = sourceWireMemory.table("credentials", {
  credentialId: uuid("credential_id").primaryKey(),
  displayPrefix: varchar("display_prefix", { length: 64 }).notNull().unique(),
  credentialClass: varchar("credential_class", { length: 32 }).notNull(),
  ownerId: varchar("owner_id", { length: 64 })
    .notNull()
    .references(() => owners.ownerId),
  status: varchar("status", { length: 16 }).notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true, mode: "date" }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  rotatedFrom: uuid("rotated_from"),
  rotatedTo: uuid("rotated_to"),
  createdBy: uuid("created_by"),
  verifierAlgorithm: varchar("verifier_algorithm", { length: 32 }).notNull(),
  verifierKeyId: varchar("verifier_key_id", { length: 64 }).notNull(),
  verifier: bytea("verifier").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
});

export const credentialNamespaceGrants = sourceWireMemory.table(
  "credential_namespace_grants",
  {
    credentialId: uuid("credential_id")
      .notNull()
      .references(() => credentials.credentialId),
    namespaceId: varchar("namespace_id", { length: 64 })
      .notNull()
      .references(() => namespaces.namespaceId)
  },
  (table) => [primaryKey({ columns: [table.credentialId, table.namespaceId] })]
);

export const credentialCapabilityGrants = sourceWireMemory.table(
  "credential_capability_grants",
  {
    credentialId: uuid("credential_id")
      .notNull()
      .references(() => credentials.credentialId),
    capability: varchar("capability", { length: 64 }).notNull()
  },
  (table) => [primaryKey({ columns: [table.credentialId, table.capability] })]
);

export const auditEvents = sourceWireMemory.table("audit_events", {
  eventId: uuid("event_id").primaryKey(),
  occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
  traceId: uuid("trace_id").notNull(),
  operation: varchar("operation", { length: 64 }).notNull(),
  result: varchar("result", { length: 32 }).notNull(),
  actorCredentialId: uuid("actor_credential_id"),
  actorReference: varchar("actor_reference", { length: 64 }).notNull(),
  ownerId: varchar("owner_id", { length: 64 }),
  namespaceId: varchar("namespace_id", { length: 64 }),
  denialCode: varchar("denial_code", { length: 64 }),
  metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>().notNull()
});

export const idempotencyRecords = sourceWireMemory.table(
  "idempotency_records",
  {
    actorCredentialId: uuid("actor_credential_id")
      .notNull()
      .references(() => credentials.credentialId),
    operation: varchar("operation", { length: 64 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 64 }).notNull(),
    requestDigest: varchar("request_digest", { length: 64 }).notNull(),
    status: varchar("status", { length: 16 }).notNull(),
    responseStatus: integer("response_status").notNull(),
    safeOutcome: jsonb("safe_outcome").$type<Record<string, unknown>>().notNull(),
    auditEventId: uuid("audit_event_id")
      .notNull()
      .references(() => auditEvents.eventId),
    replayExpiresAt: timestamp("replay_expires_at", {
      withTimezone: true,
      mode: "date"
    }).notNull(),
    secretAlgorithm: varchar("secret_algorithm", { length: 32 }),
    secretNonce: bytea("secret_nonce"),
    secretCiphertext: bytea("secret_ciphertext"),
    secretAuthTag: bytea("secret_auth_tag"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    primaryKey({
      columns: [table.actorCredentialId, table.operation, table.idempotencyKey]
    })
  ]
);

export const protectedReadReceipts = sourceWireMemory.table("protected_read_receipts", {
  receiptId: uuid("receipt_id").primaryKey(),
  formatVersion: smallint("format_version").notNull(),
  traceId: uuid("trace_id").notNull(),
  requestId: uuid("request_id").notNull().unique(),
  actorReference: varchar("actor_reference", { length: 64 }).notNull(),
  actorCredentialId: uuid("actor_credential_id")
    .notNull()
    .references(() => credentials.credentialId),
  ownerId: varchar("owner_id", { length: 64 }).notNull(),
  namespaceId: varchar("namespace_id", { length: 64 }).notNull(),
  operation: varchar("operation", { length: 64 }).notNull(),
  policyDecision: varchar("policy_decision", { length: 16 }).notNull(),
  releaseBinding: varchar("release_binding", { length: 43 }).notNull().unique(),
  requestDigest: varchar("request_digest", { length: 64 }).notNull(),
  resultDigest: varchar("result_digest", { length: 64 }).notNull(),
  coveredResultCount: smallint("covered_result_count").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true, mode: "date" }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
  originProcessVerifier: varchar("origin_process_verifier", { length: 64 }).notNull(),
  consumptionState: varchar("consumption_state", { length: 16 }).notNull(),
  releaseStatus: varchar("release_status", { length: 32 }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true, mode: "date" }),
  auditEventId: uuid("audit_event_id")
    .notNull()
    .unique()
    .references(() => auditEvents.eventId)
});

export const story1DrizzleSchema = {
  schemaMigrations,
  owners,
  namespaces,
  credentials,
  credentialNamespaceGrants,
  credentialCapabilityGrants,
  auditEvents,
  idempotencyRecords,
  protectedReadReceipts
};
