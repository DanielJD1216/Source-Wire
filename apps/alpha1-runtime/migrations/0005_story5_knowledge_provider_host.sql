ALTER TABLE source_wire_memory.restore_receipts
  DROP CONSTRAINT restore_receipts_schema_version_check,
  ADD CONSTRAINT restore_receipts_schema_version_check
    CHECK (schema_version = 5);

CREATE TABLE source_wire_memory.provider_read_receipts (
  receipt_id uuid PRIMARY KEY,
  format_version smallint NOT NULL CHECK (format_version = 1),
  trace_id uuid NOT NULL,
  request_id uuid NOT NULL UNIQUE,
  actor_reference varchar(64) NOT NULL,
  actor_credential_id uuid NOT NULL
    REFERENCES source_wire_memory.credentials(credential_id),
  actor_identity_id uuid NOT NULL,
  owner_id varchar(64) NOT NULL,
  namespace_id varchar(64) NOT NULL,
  provider_id varchar(64) NOT NULL CHECK (
    provider_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  provider_scope_id varchar(64) NOT NULL CHECK (
    provider_scope_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  operation varchar(64) NOT NULL CHECK (operation = 'search_evidence'),
  policy_decision varchar(16) NOT NULL CHECK (policy_decision = 'allowed'),
  release_binding varchar(43) NOT NULL UNIQUE CHECK (
    release_binding ~ '^[A-Za-z0-9_-]{43}$'
  ),
  request_digest varchar(64) NOT NULL CHECK (
    request_digest ~ '^[0-9a-f]{64}$'
  ),
  result_digest varchar(64) NOT NULL CHECK (
    result_digest ~ '^[0-9a-f]{64}$'
  ),
  target_order_digest varchar(64) NOT NULL CHECK (
    target_order_digest ~ '^[0-9a-f]{64}$'
  ),
  response_byte_count integer NOT NULL CHECK (
    response_byte_count BETWEEN 1 AND 98304
  ),
  covered_result_count smallint NOT NULL CHECK (
    covered_result_count BETWEEN 0 AND 10
  ),
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL CHECK (
    expires_at > issued_at
    AND expires_at <= issued_at + interval '5 seconds'
  ),
  origin_process_id uuid NOT NULL,
  origin_process_verifier varchar(64) NOT NULL CHECK (
    origin_process_verifier ~ '^[0-9a-f]{64}$'
  ),
  consumption_state varchar(16) NOT NULL DEFAULT 'issued' CHECK (
    consumption_state IN ('issued', 'consumed')
  ),
  release_status varchar(32) NOT NULL DEFAULT 'release_authorized' CHECK (
    release_status IN ('release_authorized', 'release_attempted')
  ),
  consumed_at timestamptz,
  audit_event_id uuid NOT NULL UNIQUE
    REFERENCES source_wire_memory.audit_events(event_id),
  FOREIGN KEY (owner_id, namespace_id)
    REFERENCES source_wire_memory.namespaces(owner_id, namespace_id),
  FOREIGN KEY (owner_id, actor_identity_id)
    REFERENCES source_wire_memory.actor_identities(owner_id, actor_identity_id),
  CHECK (
    (
      consumption_state = 'issued'
      AND release_status = 'release_authorized'
      AND consumed_at IS NULL
    )
    OR
    (
      consumption_state = 'consumed'
      AND release_status = 'release_attempted'
      AND consumed_at IS NOT NULL
    )
  )
);

CREATE INDEX provider_read_receipts_expiry
  ON source_wire_memory.provider_read_receipts(expires_at, receipt_id);

CREATE FUNCTION source_wire_memory.reject_provider_read_receipt_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'provider read receipt history is append-only'
      USING ERRCODE = '42501';
  END IF;

  IF
    OLD.receipt_id IS DISTINCT FROM NEW.receipt_id
    OR OLD.format_version IS DISTINCT FROM NEW.format_version
    OR OLD.trace_id IS DISTINCT FROM NEW.trace_id
    OR OLD.request_id IS DISTINCT FROM NEW.request_id
    OR OLD.actor_reference IS DISTINCT FROM NEW.actor_reference
    OR OLD.actor_credential_id IS DISTINCT FROM NEW.actor_credential_id
    OR OLD.actor_identity_id IS DISTINCT FROM NEW.actor_identity_id
    OR OLD.owner_id IS DISTINCT FROM NEW.owner_id
    OR OLD.namespace_id IS DISTINCT FROM NEW.namespace_id
    OR OLD.provider_id IS DISTINCT FROM NEW.provider_id
    OR OLD.provider_scope_id IS DISTINCT FROM NEW.provider_scope_id
    OR OLD.operation IS DISTINCT FROM NEW.operation
    OR OLD.policy_decision IS DISTINCT FROM NEW.policy_decision
    OR OLD.release_binding IS DISTINCT FROM NEW.release_binding
    OR OLD.request_digest IS DISTINCT FROM NEW.request_digest
    OR OLD.result_digest IS DISTINCT FROM NEW.result_digest
    OR OLD.target_order_digest IS DISTINCT FROM NEW.target_order_digest
    OR OLD.response_byte_count IS DISTINCT FROM NEW.response_byte_count
    OR OLD.covered_result_count IS DISTINCT FROM NEW.covered_result_count
    OR OLD.issued_at IS DISTINCT FROM NEW.issued_at
    OR OLD.expires_at IS DISTINCT FROM NEW.expires_at
    OR OLD.origin_process_id IS DISTINCT FROM NEW.origin_process_id
    OR OLD.origin_process_verifier IS DISTINCT FROM NEW.origin_process_verifier
    OR OLD.audit_event_id IS DISTINCT FROM NEW.audit_event_id
    OR OLD.consumption_state <> 'issued'
    OR NEW.consumption_state <> 'consumed'
    OR OLD.release_status <> 'release_authorized'
    OR NEW.release_status <> 'release_attempted'
    OR OLD.consumed_at IS NOT NULL
    OR NEW.consumed_at IS NULL
  THEN
    RAISE EXCEPTION 'provider read receipt mutation is not allowed'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER provider_read_receipts_append_only
BEFORE UPDATE OR DELETE ON source_wire_memory.provider_read_receipts
FOR EACH ROW EXECUTE FUNCTION
  source_wire_memory.reject_provider_read_receipt_history_mutation();

CREATE FUNCTION source_wire_memory.issue_provider_read_receipt(
  p_receipt_id uuid,
  p_format_version smallint,
  p_trace_id uuid,
  p_request_id uuid,
  p_actor_reference varchar,
  p_actor_credential_id uuid,
  p_actor_identity_id uuid,
  p_owner_id varchar,
  p_namespace_id varchar,
  p_provider_id varchar,
  p_provider_scope_id varchar,
  p_operation varchar,
  p_policy_decision varchar,
  p_release_binding varchar,
  p_request_digest varchar,
  p_result_digest varchar,
  p_target_order_digest varchar,
  p_response_byte_count integer,
  p_covered_result_count smallint,
  p_issued_at timestamptz,
  p_expires_at timestamptz,
  p_origin_process_id uuid,
  p_origin_process_verifier varchar,
  p_audit_event_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF
    p_format_version <> 1
    OR p_operation <> 'search_evidence'
    OR p_policy_decision <> 'allowed'
    OR p_actor_reference <> 'credential:' || p_actor_credential_id::text
    OR p_provider_id !~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
    OR p_provider_scope_id !~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
    OR p_response_byte_count NOT BETWEEN 1 AND 98304
    OR p_covered_result_count NOT BETWEEN 0 AND 10
    OR p_issued_at < pg_catalog.clock_timestamp() - interval '2 seconds'
    OR p_issued_at > pg_catalog.clock_timestamp() + interval '2 seconds'
    OR p_expires_at <= p_issued_at
    OR p_expires_at > p_issued_at + interval '5 seconds'
    OR p_expires_at > pg_catalog.clock_timestamp() + interval '5 seconds'
  THEN
    RAISE EXCEPTION 'provider read receipt validation failed'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM source_wire_memory.credentials AS credential
      JOIN source_wire_memory.installation_state AS installation
        ON installation.singleton = true
      JOIN source_wire_memory.credential_namespace_grants AS namespace_grant
        ON namespace_grant.credential_id = credential.credential_id
      JOIN source_wire_memory.credential_capability_grants AS capability_grant
        ON capability_grant.credential_id = credential.credential_id
     WHERE credential.credential_id = p_actor_credential_id
       AND credential.actor_identity_id = p_actor_identity_id
       AND credential.authentication_epoch_id =
           installation.current_authentication_epoch_id
       AND credential.owner_id = p_owner_id
       AND credential.credential_class = 'harness'
       AND credential.status = 'active'
       AND credential.expires_at > pg_catalog.clock_timestamp()
       AND namespace_grant.namespace_id = p_namespace_id
       AND capability_grant.capability = 'source_evidence.read'
  ) THEN
    RAISE EXCEPTION 'provider read authority denied' USING ERRCODE = '42501';
  END IF;

  INSERT INTO source_wire_memory.audit_events (
    event_id,
    trace_id,
    operation,
    result,
    actor_credential_id,
    actor_identity_id,
    actor_reference,
    owner_id,
    namespace_id,
    metadata
  ) VALUES (
    p_audit_event_id,
    p_trace_id,
    p_operation,
    'allowed',
    p_actor_credential_id,
    p_actor_identity_id,
    p_actor_reference,
    p_owner_id,
    p_namespace_id,
    pg_catalog.jsonb_build_object(
      'receiptId', p_receipt_id::text,
      'requestId', p_request_id::text,
      'providerId', p_provider_id,
      'providerScopeId', p_provider_scope_id,
      'requestDigest', p_request_digest,
      'resultDigest', p_result_digest,
      'targetOrderDigest', p_target_order_digest,
      'responseByteCount', p_response_byte_count,
      'coveredResultCount', p_covered_result_count,
      'releaseStatus', 'release_authorized'
    )
  );

  INSERT INTO source_wire_memory.provider_read_receipts (
    receipt_id,
    format_version,
    trace_id,
    request_id,
    actor_reference,
    actor_credential_id,
    actor_identity_id,
    owner_id,
    namespace_id,
    provider_id,
    provider_scope_id,
    operation,
    policy_decision,
    release_binding,
    request_digest,
    result_digest,
    target_order_digest,
    response_byte_count,
    covered_result_count,
    issued_at,
    expires_at,
    origin_process_id,
    origin_process_verifier,
    audit_event_id
  ) VALUES (
    p_receipt_id,
    p_format_version,
    p_trace_id,
    p_request_id,
    p_actor_reference,
    p_actor_credential_id,
    p_actor_identity_id,
    p_owner_id,
    p_namespace_id,
    p_provider_id,
    p_provider_scope_id,
    p_operation,
    p_policy_decision,
    p_release_binding,
    p_request_digest,
    p_result_digest,
    p_target_order_digest,
    p_response_byte_count,
    p_covered_result_count,
    p_issued_at,
    p_expires_at,
    p_origin_process_id,
    p_origin_process_verifier,
    p_audit_event_id
  );

  RETURN p_audit_event_id;
END;
$$;

CREATE FUNCTION source_wire_memory.consume_provider_read_receipt(
  p_receipt_id uuid,
  p_format_version smallint,
  p_trace_id uuid,
  p_request_id uuid,
  p_actor_reference varchar,
  p_actor_credential_id uuid,
  p_actor_identity_id uuid,
  p_owner_id varchar,
  p_namespace_id varchar,
  p_provider_id varchar,
  p_provider_scope_id varchar,
  p_operation varchar,
  p_policy_decision varchar,
  p_release_binding varchar,
  p_request_digest varchar,
  p_result_digest varchar,
  p_target_order_digest varchar,
  p_response_byte_count integer,
  p_covered_result_count smallint,
  p_issued_at timestamptz,
  p_expires_at timestamptz,
  p_origin_process_id uuid,
  p_origin_process_verifier varchar,
  p_audit_event_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  consumed boolean := false;
BEGIN
  UPDATE source_wire_memory.provider_read_receipts
     SET consumption_state = 'consumed',
         release_status = 'release_attempted',
         consumed_at = pg_catalog.clock_timestamp()
   WHERE receipt_id = p_receipt_id
     AND format_version = p_format_version
     AND trace_id = p_trace_id
     AND request_id = p_request_id
     AND actor_reference = p_actor_reference
     AND actor_credential_id = p_actor_credential_id
     AND actor_identity_id = p_actor_identity_id
     AND owner_id = p_owner_id
     AND namespace_id = p_namespace_id
     AND provider_id = p_provider_id
     AND provider_scope_id = p_provider_scope_id
     AND operation = p_operation
     AND policy_decision = p_policy_decision
     AND release_binding = p_release_binding
     AND request_digest = p_request_digest
     AND result_digest = p_result_digest
     AND target_order_digest = p_target_order_digest
     AND response_byte_count = p_response_byte_count
     AND covered_result_count = p_covered_result_count
     AND issued_at = p_issued_at
     AND expires_at = p_expires_at
     AND origin_process_id = p_origin_process_id
     AND origin_process_verifier = p_origin_process_verifier
     AND audit_event_id = p_audit_event_id
     AND consumption_state = 'issued'
     AND release_status = 'release_authorized'
     AND consumed_at IS NULL
     AND expires_at > pg_catalog.clock_timestamp()
  RETURNING true INTO consumed;

  RETURN COALESCE(consumed, false);
END;
$$;

REVOKE ALL ON TABLE source_wire_memory.provider_read_receipts FROM PUBLIC;
REVOKE ALL ON TABLE source_wire_memory.provider_read_receipts
  FROM source_wire_runtime;
REVOKE ALL ON FUNCTION source_wire_memory.issue_provider_read_receipt(
  uuid, smallint, uuid, uuid, varchar, uuid, uuid, varchar, varchar, varchar,
  varchar, varchar, varchar, varchar, varchar, varchar, varchar, integer,
  smallint, timestamptz, timestamptz, uuid, varchar, uuid
) FROM PUBLIC;
REVOKE ALL ON FUNCTION source_wire_memory.consume_provider_read_receipt(
  uuid, smallint, uuid, uuid, varchar, uuid, uuid, varchar, varchar, varchar,
  varchar, varchar, varchar, varchar, varchar, varchar, varchar, integer,
  smallint, timestamptz, timestamptz, uuid, varchar, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION source_wire_memory.issue_provider_read_receipt(
  uuid, smallint, uuid, uuid, varchar, uuid, uuid, varchar, varchar, varchar,
  varchar, varchar, varchar, varchar, varchar, varchar, varchar, integer,
  smallint, timestamptz, timestamptz, uuid, varchar, uuid
) TO source_wire_runtime;
GRANT EXECUTE ON FUNCTION source_wire_memory.consume_provider_read_receipt(
  uuid, smallint, uuid, uuid, varchar, uuid, uuid, varchar, varchar, varchar,
  varchar, varchar, varchar, varchar, varchar, varchar, varchar, integer,
  smallint, timestamptz, timestamptz, uuid, varchar, uuid
) TO source_wire_runtime;
