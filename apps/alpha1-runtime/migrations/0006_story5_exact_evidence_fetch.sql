ALTER TABLE source_wire_memory.restore_receipts
  DROP CONSTRAINT restore_receipts_schema_version_check,
  ADD CONSTRAINT restore_receipts_schema_version_check
    CHECK (schema_version = 6);

ALTER TABLE source_wire_memory.provider_read_receipts
  DROP CONSTRAINT provider_read_receipts_operation_check,
  ADD CONSTRAINT provider_read_receipts_operation_check
    CHECK (operation IN ('search_evidence', 'get_evidence'));

CREATE OR REPLACE FUNCTION source_wire_memory.issue_provider_read_receipt(
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
    OR p_operation NOT IN ('search_evidence', 'get_evidence')
    OR p_policy_decision <> 'allowed'
    OR p_actor_reference <> 'credential:' || p_actor_credential_id::text
    OR p_provider_id !~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
    OR p_provider_scope_id !~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
    OR p_response_byte_count NOT BETWEEN 1 AND 98304
    OR p_covered_result_count NOT BETWEEN 0 AND 10
    OR (p_operation = 'get_evidence' AND p_covered_result_count > 1)
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
