CREATE SCHEMA source_wire_memory AUTHORIZATION source_wire_schema_owner;
REVOKE ALL ON SCHEMA source_wire_memory FROM PUBLIC;

CREATE TABLE source_wire_memory.schema_migrations (
  version integer PRIMARY KEY,
  migration_name text NOT NULL,
  checksum_sha256 character(64) NOT NULL CHECK (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  state text NOT NULL CHECK (state IN ('applying', 'completed')),
  applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE source_wire_memory.owners (
  owner_id varchar(64) PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE source_wire_memory.namespaces (
  namespace_id varchar(64) PRIMARY KEY,
  owner_id varchar(64) NOT NULL REFERENCES source_wire_memory.owners(owner_id),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (owner_id, namespace_id)
);

CREATE TABLE source_wire_memory.credentials (
  credential_id uuid PRIMARY KEY,
  display_prefix varchar(64) NOT NULL UNIQUE,
  credential_class text NOT NULL CHECK (credential_class IN ('owner_admin', 'harness')),
  owner_id varchar(64) NOT NULL REFERENCES source_wire_memory.owners(owner_id),
  status text NOT NULL CHECK (status IN ('active', 'rotated', 'revoked')),
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL CHECK (expires_at > issued_at),
  rotated_from uuid REFERENCES source_wire_memory.credentials(credential_id),
  rotated_to uuid REFERENCES source_wire_memory.credentials(credential_id),
  created_by uuid REFERENCES source_wire_memory.credentials(credential_id),
  verifier_algorithm varchar(32) NOT NULL,
  verifier_key_id varchar(64) NOT NULL,
  verifier bytea NOT NULL CHECK (octet_length(verifier) = 32),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE source_wire_memory.credential_namespace_grants (
  credential_id uuid NOT NULL REFERENCES source_wire_memory.credentials(credential_id),
  namespace_id varchar(64) NOT NULL REFERENCES source_wire_memory.namespaces(namespace_id),
  PRIMARY KEY (credential_id, namespace_id)
);

CREATE TABLE source_wire_memory.credential_capability_grants (
  credential_id uuid NOT NULL REFERENCES source_wire_memory.credentials(credential_id),
  capability varchar(64) NOT NULL,
  PRIMARY KEY (credential_id, capability)
);

CREATE TABLE source_wire_memory.audit_events (
  event_id uuid PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  trace_id uuid NOT NULL,
  operation varchar(64) NOT NULL,
  result varchar(32) NOT NULL,
  actor_credential_id uuid,
  actor_reference varchar(64) NOT NULL,
  owner_id varchar(64),
  namespace_id varchar(64),
  denial_code varchar(64),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE source_wire_memory.idempotency_records (
  actor_credential_id uuid NOT NULL REFERENCES source_wire_memory.credentials(credential_id),
  operation varchar(64) NOT NULL,
  idempotency_key varchar(64) NOT NULL,
  request_digest character(64) NOT NULL CHECK (request_digest ~ '^[0-9a-f]{64}$'),
  status varchar(16) NOT NULL CHECK (status = 'completed'),
  response_status integer NOT NULL CHECK (response_status BETWEEN 200 AND 299),
  safe_outcome jsonb NOT NULL,
  audit_event_id uuid NOT NULL REFERENCES source_wire_memory.audit_events(event_id),
  replay_expires_at timestamptz NOT NULL,
  secret_algorithm varchar(32),
  secret_nonce bytea,
  secret_ciphertext bytea,
  secret_auth_tag bytea,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (actor_credential_id, operation, idempotency_key),
  CHECK (replay_expires_at > created_at),
  CHECK (
    (
      secret_algorithm IS NULL
      AND secret_nonce IS NULL
      AND secret_ciphertext IS NULL
      AND secret_auth_tag IS NULL
    )
    OR
    (
      secret_algorithm = 'aes-256-gcm-hkdf-sha256-v1'
      AND octet_length(secret_nonce) = 12
      AND octet_length(secret_ciphertext) > 0
      AND octet_length(secret_auth_tag) = 16
    )
  )
);

CREATE FUNCTION source_wire_memory.reject_audit_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit history is immutable' USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER audit_events_immutable_update
BEFORE UPDATE OR DELETE ON source_wire_memory.audit_events
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_audit_history_mutation();

GRANT USAGE ON SCHEMA source_wire_memory TO source_wire_runtime;
GRANT SELECT ON source_wire_memory.schema_migrations TO source_wire_runtime;
GRANT SELECT ON source_wire_memory.owners TO source_wire_runtime;
GRANT SELECT ON source_wire_memory.namespaces TO source_wire_runtime;
GRANT SELECT, INSERT ON source_wire_memory.credentials TO source_wire_runtime;
GRANT UPDATE (status, rotated_to, updated_at) ON source_wire_memory.credentials TO source_wire_runtime;
GRANT SELECT, INSERT ON source_wire_memory.credential_namespace_grants TO source_wire_runtime;
GRANT SELECT, INSERT ON source_wire_memory.credential_capability_grants TO source_wire_runtime;
GRANT INSERT ON source_wire_memory.audit_events TO source_wire_runtime;
GRANT SELECT, INSERT ON source_wire_memory.idempotency_records TO source_wire_runtime;
