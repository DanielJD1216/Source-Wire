ALTER TABLE source_wire_memory.restore_receipts
  DROP CONSTRAINT restore_receipts_schema_version_check,
  ADD CONSTRAINT restore_receipts_schema_version_check
    CHECK (schema_version BETWEEN 4 AND 8);

CREATE TABLE source_wire_memory.gate_b_memory_authorization_events (
  authorization_id uuid PRIMARY KEY,
  decision varchar(16) NOT NULL CHECK (decision = 'allowed'),
  decided_at timestamptz NOT NULL,
  credential_id uuid NOT NULL
    REFERENCES source_wire_memory.credentials(credential_id),
  actor_identity_id uuid NOT NULL
    REFERENCES source_wire_memory.actor_identities(actor_identity_id),
  authentication_epoch_id uuid NOT NULL
    REFERENCES source_wire_memory.authentication_epochs(authentication_epoch_id),
  owner_id varchar(64) NOT NULL CHECK (
    owner_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  principal_id varchar(64) NOT NULL CHECK (
    principal_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  adapter_id varchar(64) NOT NULL CHECK (
    adapter_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  client_id varchar(64) NOT NULL
    REFERENCES source_wire_memory.gate_b_memory_clients(client_id),
  session_id varchar(64) NOT NULL
    REFERENCES source_wire_memory.gate_b_memory_sessions(session_id),
  credential_audience varchar(64) NOT NULL CHECK (
    credential_audience ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  namespace_id varchar(64) NOT NULL CHECK (
    namespace_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  capability varchar(64) NOT NULL CHECK (
    capability = 'trusted_memory.search'
  ),
  authorization_epoch bigint NOT NULL CHECK (authorization_epoch >= 0),
  deletion_epoch bigint NOT NULL CHECK (deletion_epoch >= 0),
  credential_issued_at timestamptz NOT NULL,
  credential_expires_at timestamptz NOT NULL,
  session_issued_at timestamptz NOT NULL,
  session_expires_at timestamptz NOT NULL,
  credential_status varchar(16) NOT NULL CHECK (credential_status = 'active'),
  client_state varchar(16) NOT NULL CHECK (client_state = 'active'),
  session_state varchar(16) NOT NULL CHECK (session_state = 'active'),
  grant_state varchar(16) NOT NULL CHECK (grant_state = 'active'),
  destination_digest varchar(64) NOT NULL CHECK (
    destination_digest ~ '^[0-9a-f]{64}$'
  ),
  audience_chain_digest varchar(64) NOT NULL CHECK (
    audience_chain_digest ~ '^[0-9a-f]{64}$'
  ),
  sender_binding_kind varchar(16) NOT NULL CHECK (
    sender_binding_kind = 'dpop'
  ),
  sender_thumbprint_digest varchar(64) NOT NULL CHECK (
    sender_thumbprint_digest ~ '^[0-9a-f]{64}$'
  ),
  dpop_nonce_digest varchar(64) NOT NULL CHECK (
    dpop_nonce_digest ~ '^[0-9a-f]{64}$'
  ),
  replay_id_digest varchar(64) NOT NULL CHECK (
    replay_id_digest ~ '^[0-9a-f]{64}$'
  ),
  proof_issued_at timestamptz NOT NULL,
  request_method varchar(8) NOT NULL CHECK (request_method = 'POST'),
  request_uri varchar(128) NOT NULL CHECK (
    request_uri = '/v1alpha1/trusted-memories/search'
  ),
  authorization_context_digest varchar(64) NOT NULL CHECK (
    authorization_context_digest ~ '^[0-9a-f]{64}$'
  ),
  UNIQUE (sender_thumbprint_digest, replay_id_digest),
  FOREIGN KEY (sender_thumbprint_digest, replay_id_digest)
    REFERENCES source_wire_memory.gate_b_memory_replay_ids (
      sender_thumbprint_digest,
      replay_id_digest
    ),
  CHECK (credential_issued_at <= decided_at),
  CHECK (credential_expires_at > decided_at),
  CHECK (session_issued_at <= decided_at),
  CHECK (session_expires_at > decided_at),
  CHECK (proof_issued_at <= decided_at)
);

CREATE TRIGGER gate_b_memory_authorization_events_immutable
BEFORE UPDATE OR DELETE ON source_wire_memory.gate_b_memory_authorization_events
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_memory_history_mutation();

REVOKE ALL ON TABLE source_wire_memory.gate_b_memory_authorization_events FROM PUBLIC;
REVOKE ALL ON TABLE source_wire_memory.gate_b_memory_authorization_events
  FROM source_wire_runtime;

ALTER TABLE source_wire_memory.protected_read_receipts
  DROP CONSTRAINT protected_read_receipts_format_version_check,
  ADD COLUMN authorization_binding_kind varchar(32) NOT NULL
    DEFAULT 'legacy_unbound' CHECK (
      authorization_binding_kind IN ('legacy_unbound', 'gate_b_authorization_v1')
    ),
  ADD COLUMN response_handoff_state varchar(32) CHECK (
    response_handoff_state IN ('pending', 'accepted_in_process', 'failed')
  ),
  ADD COLUMN response_handoff_recorded_at timestamptz,
  ADD COLUMN gate_b_authorization_id uuid
    REFERENCES source_wire_memory.gate_b_memory_authorization_events(authorization_id),
  ADD COLUMN gate_b_authorization_context_digest varchar(64) CHECK (
    gate_b_authorization_context_digest ~ '^[0-9a-f]{64}$'
  ),
  ADD COLUMN gate_b_actor_identity_id uuid
    REFERENCES source_wire_memory.actor_identities(actor_identity_id),
  ADD COLUMN gate_b_principal_id varchar(64) CHECK (
    gate_b_principal_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  ADD COLUMN gate_b_adapter_id varchar(64) CHECK (
    gate_b_adapter_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  ADD COLUMN gate_b_client_id varchar(64) CHECK (
    gate_b_client_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  ADD COLUMN gate_b_session_id varchar(64) CHECK (
    gate_b_session_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  ADD COLUMN gate_b_credential_audience varchar(64) CHECK (
    gate_b_credential_audience ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  ADD COLUMN gate_b_authorization_epoch bigint CHECK (
    gate_b_authorization_epoch >= 0
  ),
  ADD COLUMN gate_b_deletion_epoch bigint CHECK (
    gate_b_deletion_epoch >= 0
  ),
  ADD COLUMN gate_b_capability varchar(64) CHECK (
    gate_b_capability = 'trusted_memory.search'
  ),
  ADD COLUMN gate_b_credential_issued_at timestamptz,
  ADD COLUMN gate_b_credential_expires_at timestamptz,
  ADD COLUMN gate_b_session_issued_at timestamptz,
  ADD COLUMN gate_b_session_expires_at timestamptz,
  ADD COLUMN gate_b_credential_status varchar(16) CHECK (
    gate_b_credential_status = 'active'
  ),
  ADD COLUMN gate_b_client_state varchar(16) CHECK (
    gate_b_client_state = 'active'
  ),
  ADD COLUMN gate_b_session_state varchar(16) CHECK (
    gate_b_session_state = 'active'
  ),
  ADD COLUMN gate_b_grant_state varchar(16) CHECK (
    gate_b_grant_state = 'active'
  ),
  ADD COLUMN gate_b_destination_digest varchar(64) CHECK (
    gate_b_destination_digest ~ '^[0-9a-f]{64}$'
  ),
  ADD COLUMN gate_b_audience_chain_digest varchar(64) CHECK (
    gate_b_audience_chain_digest ~ '^[0-9a-f]{64}$'
  ),
  ADD COLUMN gate_b_sender_binding_kind varchar(16) CHECK (
    gate_b_sender_binding_kind = 'dpop'
  ),
  ADD COLUMN gate_b_sender_thumbprint_digest varchar(64) CHECK (
    gate_b_sender_thumbprint_digest ~ '^[0-9a-f]{64}$'
  ),
  ADD COLUMN gate_b_dpop_nonce_digest varchar(64) CHECK (
    gate_b_dpop_nonce_digest ~ '^[0-9a-f]{64}$'
  ),
  ADD COLUMN gate_b_replay_id_digest varchar(64) CHECK (
    gate_b_replay_id_digest ~ '^[0-9a-f]{64}$'
  ),
  ADD COLUMN gate_b_proof_issued_at timestamptz,
  ADD COLUMN gate_b_request_method varchar(8) CHECK (
    gate_b_request_method = 'POST'
  ),
  ADD COLUMN gate_b_request_uri varchar(128) CHECK (
    gate_b_request_uri = '/v1alpha1/trusted-memories/search'
  ),
  ADD CONSTRAINT protected_read_receipts_format_version_check CHECK (
    format_version IN (1, 2)
  ),
  ADD CONSTRAINT protected_read_receipts_gate_b_shape_check CHECK (
    (
      format_version = 1
      AND authorization_binding_kind = 'legacy_unbound'
      AND pg_catalog.num_nonnulls(
        gate_b_authorization_id,
        gate_b_authorization_context_digest,
        gate_b_actor_identity_id,
        gate_b_principal_id,
        gate_b_adapter_id,
        gate_b_client_id,
        gate_b_session_id,
        gate_b_credential_audience,
        gate_b_authorization_epoch,
        gate_b_deletion_epoch,
        gate_b_capability,
        gate_b_credential_issued_at,
        gate_b_credential_expires_at,
        gate_b_session_issued_at,
        gate_b_session_expires_at,
        gate_b_credential_status,
        gate_b_client_state,
        gate_b_session_state,
        gate_b_grant_state,
        gate_b_destination_digest,
        gate_b_audience_chain_digest,
        gate_b_sender_binding_kind,
        gate_b_sender_thumbprint_digest,
        gate_b_dpop_nonce_digest,
        gate_b_replay_id_digest,
        gate_b_proof_issued_at,
        gate_b_request_method,
        gate_b_request_uri
      ) = 0
    )
    OR
    (
      format_version = 2
      AND authorization_binding_kind = 'gate_b_authorization_v1'
      AND pg_catalog.num_nonnulls(
        gate_b_authorization_id,
        gate_b_authorization_context_digest,
        gate_b_actor_identity_id,
        gate_b_principal_id,
        gate_b_adapter_id,
        gate_b_client_id,
        gate_b_session_id,
        gate_b_credential_audience,
        gate_b_authorization_epoch,
        gate_b_deletion_epoch,
        gate_b_capability,
        gate_b_credential_issued_at,
        gate_b_credential_expires_at,
        gate_b_session_issued_at,
        gate_b_session_expires_at,
        gate_b_credential_status,
        gate_b_client_state,
        gate_b_session_state,
        gate_b_grant_state,
        gate_b_destination_digest,
        gate_b_audience_chain_digest,
        gate_b_sender_binding_kind,
        gate_b_sender_thumbprint_digest,
        gate_b_dpop_nonce_digest,
        gate_b_replay_id_digest,
        gate_b_proof_issued_at,
        gate_b_request_method,
        gate_b_request_uri
      ) = 28
      AND gate_b_proof_issued_at <= issued_at
      AND gate_b_credential_issued_at <= issued_at
      AND gate_b_credential_expires_at > issued_at
      AND gate_b_session_issued_at <= issued_at
      AND gate_b_session_expires_at > issued_at
    )
  ),
  ADD CONSTRAINT protected_read_receipts_handoff_shape_check CHECK (
    (
      format_version = 1
      AND response_handoff_state IS NULL
      AND response_handoff_recorded_at IS NULL
    )
    OR
    (
      format_version = 2
      AND (
        (
          response_handoff_state = 'pending'
          AND response_handoff_recorded_at IS NULL
        )
        OR
        (
          response_handoff_state IN ('accepted_in_process', 'failed')
          AND response_handoff_recorded_at IS NOT NULL
        )
      )
    )
  );

DROP TRIGGER protected_read_receipts_append_only
  ON source_wire_memory.protected_read_receipts;

CREATE OR REPLACE FUNCTION source_wire_memory.reject_protected_read_receipt_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  state_immutable boolean;
  enrichment_immutable boolean;
  handoff_immutable boolean;
  recovery_handoff_immutable boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'protected read receipt history is append-only'
      USING ERRCODE = '42501';
  END IF;

  state_immutable :=
    (pg_catalog.to_jsonb(OLD) - ARRAY[
      'consumption_state', 'release_status', 'consumed_at'
    ]) =
    (pg_catalog.to_jsonb(NEW) - ARRAY[
      'consumption_state', 'release_status', 'consumed_at'
    ]);
  IF
    state_immutable
    AND OLD.consumption_state = 'issued'
    AND OLD.release_status = 'release_authorized'
    AND OLD.consumed_at IS NULL
    AND NEW.consumed_at IS NOT NULL
    AND (
      (
        NEW.consumption_state = 'consumed'
        AND NEW.release_status = 'release_attempted'
      )
      OR
      (
        NEW.consumption_state = 'invalidated'
        AND NEW.release_status = 'recovery_invalidated'
      )
    )
  THEN
    RETURN NEW;
  END IF;

  recovery_handoff_immutable :=
    (pg_catalog.to_jsonb(OLD) - ARRAY[
      'consumption_state',
      'release_status',
      'consumed_at',
      'response_handoff_state',
      'response_handoff_recorded_at'
    ]) =
    (pg_catalog.to_jsonb(NEW) - ARRAY[
      'consumption_state',
      'release_status',
      'consumed_at',
      'response_handoff_state',
      'response_handoff_recorded_at'
    ]);
  IF
    recovery_handoff_immutable
    AND OLD.format_version = 2
    AND OLD.authorization_binding_kind = 'gate_b_authorization_v1'
    AND OLD.response_handoff_state = 'pending'
    AND OLD.response_handoff_recorded_at IS NULL
    AND NEW.response_handoff_state = 'failed'
    AND NEW.response_handoff_recorded_at IS NOT NULL
    AND (
      (
        OLD.consumption_state = 'issued'
        AND OLD.release_status = 'release_authorized'
        AND OLD.consumed_at IS NULL
        AND NEW.consumption_state = 'invalidated'
        AND NEW.release_status = 'recovery_invalidated'
        AND NEW.consumed_at IS NOT NULL
        AND NEW.response_handoff_recorded_at = NEW.consumed_at
      )
      OR
      (
        OLD.consumption_state = 'consumed'
        AND NEW.consumption_state = OLD.consumption_state
        AND OLD.release_status = 'release_attempted'
        AND NEW.release_status = OLD.release_status
        AND OLD.consumed_at IS NOT NULL
        AND NEW.consumed_at = OLD.consumed_at
      )
    )
  THEN
    RETURN NEW;
  END IF;

  handoff_immutable :=
    (pg_catalog.to_jsonb(OLD) - ARRAY[
      'response_handoff_state', 'response_handoff_recorded_at'
    ]) =
    (pg_catalog.to_jsonb(NEW) - ARRAY[
      'response_handoff_state', 'response_handoff_recorded_at'
    ]);
  IF
    handoff_immutable
    AND OLD.format_version = 2
    AND OLD.authorization_binding_kind = 'gate_b_authorization_v1'
    AND OLD.consumption_state = 'consumed'
    AND NEW.consumption_state = OLD.consumption_state
    AND OLD.release_status = 'release_attempted'
    AND NEW.release_status = OLD.release_status
    AND OLD.consumed_at IS NOT NULL
    AND NEW.consumed_at = OLD.consumed_at
    AND OLD.response_handoff_state = 'pending'
    AND OLD.response_handoff_recorded_at IS NULL
    AND NEW.response_handoff_state IN ('accepted_in_process', 'failed')
    AND NEW.response_handoff_recorded_at IS NOT NULL
  THEN
    RETURN NEW;
  END IF;

  enrichment_immutable :=
    (pg_catalog.to_jsonb(OLD) - ARRAY[
      'format_version',
      'authorization_binding_kind',
      'response_handoff_state',
      'response_handoff_recorded_at',
      'gate_b_authorization_id',
      'gate_b_authorization_context_digest',
      'gate_b_actor_identity_id',
      'gate_b_principal_id',
      'gate_b_adapter_id',
      'gate_b_client_id',
      'gate_b_session_id',
      'gate_b_credential_audience',
      'gate_b_authorization_epoch',
      'gate_b_deletion_epoch',
      'gate_b_capability',
      'gate_b_credential_issued_at',
      'gate_b_credential_expires_at',
      'gate_b_session_issued_at',
      'gate_b_session_expires_at',
      'gate_b_credential_status',
      'gate_b_client_state',
      'gate_b_session_state',
      'gate_b_grant_state',
      'gate_b_destination_digest',
      'gate_b_audience_chain_digest',
      'gate_b_sender_binding_kind',
      'gate_b_sender_thumbprint_digest',
      'gate_b_dpop_nonce_digest',
      'gate_b_replay_id_digest',
      'gate_b_proof_issued_at',
      'gate_b_request_method',
      'gate_b_request_uri'
    ]) =
    (pg_catalog.to_jsonb(NEW) - ARRAY[
      'format_version',
      'authorization_binding_kind',
      'response_handoff_state',
      'response_handoff_recorded_at',
      'gate_b_authorization_id',
      'gate_b_authorization_context_digest',
      'gate_b_actor_identity_id',
      'gate_b_principal_id',
      'gate_b_adapter_id',
      'gate_b_client_id',
      'gate_b_session_id',
      'gate_b_credential_audience',
      'gate_b_authorization_epoch',
      'gate_b_deletion_epoch',
      'gate_b_capability',
      'gate_b_credential_issued_at',
      'gate_b_credential_expires_at',
      'gate_b_session_issued_at',
      'gate_b_session_expires_at',
      'gate_b_credential_status',
      'gate_b_client_state',
      'gate_b_session_state',
      'gate_b_grant_state',
      'gate_b_destination_digest',
      'gate_b_audience_chain_digest',
      'gate_b_sender_binding_kind',
      'gate_b_sender_thumbprint_digest',
      'gate_b_dpop_nonce_digest',
      'gate_b_replay_id_digest',
      'gate_b_proof_issued_at',
      'gate_b_request_method',
      'gate_b_request_uri'
    ]);
  IF
    enrichment_immutable
    AND OLD.format_version = 1
    AND OLD.authorization_binding_kind = 'legacy_unbound'
    AND NEW.format_version = 2
    AND NEW.authorization_binding_kind = 'gate_b_authorization_v1'
    AND OLD.response_handoff_state IS NULL
    AND NEW.response_handoff_state = 'pending'
    AND OLD.response_handoff_recorded_at IS NULL
    AND NEW.response_handoff_recorded_at IS NULL
    AND OLD.consumption_state = 'issued'
    AND NEW.consumption_state = OLD.consumption_state
    AND OLD.release_status = 'release_authorized'
    AND NEW.release_status = OLD.release_status
    AND OLD.consumed_at IS NULL
    AND NEW.consumed_at IS NULL
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'protected read receipt mutation is not allowed'
    USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER protected_read_receipts_append_only
BEFORE UPDATE OR DELETE ON source_wire_memory.protected_read_receipts
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_protected_read_receipt_history_mutation();

CREATE FUNCTION source_wire_memory.record_gate_b_memory_authorization(
  p_authorization_id uuid,
  p_authorization_context_digest varchar,
  p_credential_id uuid,
  p_owner_id varchar,
  p_principal_id varchar,
  p_adapter_id varchar,
  p_client_id varchar,
  p_session_id varchar,
  p_credential_audience varchar,
  p_authorization_epoch bigint,
  p_deletion_epoch bigint,
  p_namespace_id varchar,
  p_destination_digest varchar,
  p_audience_chain_digest varchar,
  p_sender_thumbprint_digest varchar,
  p_dpop_nonce_digest varchar,
  p_replay_id_digest varchar,
  p_proof_issued_at timestamptz,
  p_request_method varchar,
  p_request_uri varchar
)
RETURNS TABLE (
  authorization_id uuid,
  actor_identity_id uuid,
  authentication_epoch_id uuid,
  credential_issued_at timestamptz,
  credential_expires_at timestamptz,
  session_issued_at timestamptz,
  session_expires_at timestamptz,
  authorization_context_digest varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  observed_at timestamptz := pg_catalog.clock_timestamp();
BEGIN
  RETURN QUERY
  WITH inserted AS (
    INSERT INTO source_wire_memory.gate_b_memory_authorization_events (
      authorization_id,
      decision,
      decided_at,
      credential_id,
      actor_identity_id,
      authentication_epoch_id,
      owner_id,
      principal_id,
      adapter_id,
      client_id,
      session_id,
      credential_audience,
      namespace_id,
      capability,
      authorization_epoch,
      deletion_epoch,
      credential_issued_at,
      credential_expires_at,
      session_issued_at,
      session_expires_at,
      credential_status,
      client_state,
      session_state,
      grant_state,
      destination_digest,
      audience_chain_digest,
      sender_binding_kind,
      sender_thumbprint_digest,
      dpop_nonce_digest,
      replay_id_digest,
      proof_issued_at,
      request_method,
      request_uri,
      authorization_context_digest
    )
    SELECT
      p_authorization_id,
      'allowed',
      observed_at,
      credential.credential_id,
      credential.actor_identity_id,
      credential.authentication_epoch_id,
      client.owner_id,
      client.principal_id,
      client.adapter_id,
      client.client_id,
      session.session_id,
      session.credential_audience,
      grant_row.namespace_id,
      grant_row.capability,
      session.authorization_epoch,
      session.deletion_epoch,
      credential.issued_at,
      credential.expires_at,
      session.issued_at,
      session.expires_at,
      credential.status,
      client.state,
      session.state,
      grant_row.state,
      session.destination_digest,
      session.audience_chain_digest,
      session.sender_binding_kind,
      session.sender_thumbprint_digest,
      session.dpop_nonce_digest,
      replay.replay_id_digest,
      replay.proof_issued_at,
      p_request_method,
      p_request_uri,
      p_authorization_context_digest
    FROM source_wire_memory.gate_b_memory_replay_ids AS replay
    JOIN source_wire_memory.gate_b_memory_sessions AS session
      ON session.session_id = replay.session_id
    JOIN source_wire_memory.gate_b_memory_clients AS client
      ON client.client_id = session.client_id
    JOIN source_wire_memory.gate_b_memory_grants AS grant_row
      ON grant_row.session_id = session.session_id
    JOIN source_wire_memory.credentials AS credential
      ON credential.credential_id = session.credential_id
     AND credential.owner_id = client.owner_id
    JOIN source_wire_memory.installation_state AS installation
      ON installation.singleton = true
     AND installation.current_authentication_epoch_id =
         credential.authentication_epoch_id
    JOIN source_wire_memory.credential_namespace_grants AS credential_namespace
      ON credential_namespace.credential_id = credential.credential_id
     AND credential_namespace.namespace_id = grant_row.namespace_id
    JOIN source_wire_memory.credential_capability_grants AS credential_capability
      ON credential_capability.credential_id = credential.credential_id
     AND credential_capability.capability = grant_row.capability
    WHERE replay.replay_id_digest = p_replay_id_digest
      AND replay.session_id = p_session_id
      AND replay.sender_thumbprint_digest = p_sender_thumbprint_digest
      AND replay.proof_issued_at = p_proof_issued_at
      AND replay.consumed_at <= observed_at
      AND replay.expires_at > observed_at
      AND credential.credential_id = p_credential_id
      AND credential.owner_id = p_owner_id
      AND credential.credential_class = 'harness'
      AND credential.status = 'active'
      AND credential.issued_at <= observed_at
      AND credential.expires_at > observed_at
      AND client.principal_id = p_principal_id
      AND client.adapter_id = p_adapter_id
      AND client.client_id = p_client_id
      AND client.state = 'active'
      AND session.credential_audience = p_credential_audience
      AND session.state = 'active'
      AND session.issued_at <= observed_at
      AND session.expires_at > observed_at
      AND session.authorization_epoch = p_authorization_epoch
      AND session.deletion_epoch = p_deletion_epoch
      AND session.destination_digest = p_destination_digest
      AND session.audience_chain_digest = p_audience_chain_digest
      AND session.sender_binding_kind = 'dpop'
      AND session.sender_thumbprint_digest = p_sender_thumbprint_digest
      AND session.dpop_nonce_digest = p_dpop_nonce_digest
      AND grant_row.namespace_id = p_namespace_id
      AND grant_row.capability = 'trusted_memory.search'
      AND grant_row.state = 'active'
      AND grant_row.authorization_epoch = p_authorization_epoch
      AND grant_row.deletion_epoch = p_deletion_epoch
      AND p_request_method = 'POST'
      AND p_request_uri = '/v1alpha1/trusted-memories/search'
    RETURNING
      gate_b_memory_authorization_events.authorization_id,
      gate_b_memory_authorization_events.actor_identity_id,
      gate_b_memory_authorization_events.authentication_epoch_id,
      gate_b_memory_authorization_events.credential_issued_at,
      gate_b_memory_authorization_events.credential_expires_at,
      gate_b_memory_authorization_events.session_issued_at,
      gate_b_memory_authorization_events.session_expires_at,
      gate_b_memory_authorization_events.authorization_context_digest
  )
  SELECT
    inserted.authorization_id,
    inserted.actor_identity_id,
    inserted.authentication_epoch_id,
    inserted.credential_issued_at,
    inserted.credential_expires_at,
    inserted.session_issued_at,
    inserted.session_expires_at,
    inserted.authorization_context_digest
  FROM inserted;
END;
$$;

CREATE FUNCTION source_wire_memory.issue_gate_b_memory_protected_read_receipt(
  p_credential_id uuid,
  p_owner_id varchar,
  p_principal_id varchar,
  p_adapter_id varchar,
  p_client_id varchar,
  p_session_id varchar,
  p_credential_audience varchar,
  p_authorization_epoch bigint,
  p_deletion_epoch bigint,
  p_namespace_id varchar,
  p_destination_digest varchar,
  p_audience_chain_digest varchar,
  p_sender_thumbprint_digest varchar,
  p_dpop_nonce_digest varchar,
  p_request_method varchar,
  p_request_uri varchar,
  p_authorization_id uuid,
  p_authorization_context_digest varchar,
  p_receipt_id uuid,
  p_format_version smallint,
  p_trace_id uuid,
  p_request_id uuid,
  p_actor_reference varchar,
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
  p_origin_process_verifier varchar,
  p_audit_event_id uuid,
  p_target_memory_ids uuid[],
  p_target_revision_ids uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  release_locked boolean := false;
  authorization_record source_wire_memory.gate_b_memory_authorization_events%ROWTYPE;
  issued_audit_event_id uuid;
  enriched boolean := false;
BEGIN
  IF p_format_version IS DISTINCT FROM 2 THEN
    RAISE EXCEPTION 'protected read receipt format invalid' USING ERRCODE = '22023';
  END IF;

  SELECT source_wire_memory.lock_gate_b_memory_release(
    p_credential_id, p_owner_id, p_principal_id, p_adapter_id, p_client_id,
    p_session_id, p_credential_audience, p_authorization_epoch,
    p_deletion_epoch, p_namespace_id, p_destination_digest,
    p_audience_chain_digest, p_sender_thumbprint_digest, p_dpop_nonce_digest,
    p_request_method, p_request_uri
  ) INTO release_locked;
  IF NOT release_locked THEN
    RAISE EXCEPTION 'gate B protected receipt authority denied'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO authorization_record
  FROM source_wire_memory.gate_b_memory_authorization_events AS authorization_event
  WHERE authorization_event.authorization_id = p_authorization_id
    AND authorization_event.authorization_context_digest = p_authorization_context_digest
    AND authorization_event.credential_id = p_credential_id
    AND authorization_event.owner_id = p_owner_id
    AND authorization_event.principal_id = p_principal_id
    AND authorization_event.adapter_id = p_adapter_id
    AND authorization_event.client_id = p_client_id
    AND authorization_event.session_id = p_session_id
    AND authorization_event.credential_audience = p_credential_audience
    AND authorization_event.authorization_epoch = p_authorization_epoch
    AND authorization_event.deletion_epoch = p_deletion_epoch
    AND authorization_event.namespace_id = p_namespace_id
    AND authorization_event.capability = 'trusted_memory.search'
    AND authorization_event.destination_digest = p_destination_digest
    AND authorization_event.audience_chain_digest = p_audience_chain_digest
    AND authorization_event.sender_binding_kind = 'dpop'
    AND authorization_event.sender_thumbprint_digest = p_sender_thumbprint_digest
    AND authorization_event.dpop_nonce_digest = p_dpop_nonce_digest
    AND authorization_event.request_method = p_request_method
    AND authorization_event.request_uri = p_request_uri
    AND authorization_event.decision = 'allowed';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'gate B authorization event mismatch' USING ERRCODE = '42501';
  END IF;

  SELECT source_wire_memory.issue_protected_read_receipt(
    p_receipt_id, 1::smallint, p_trace_id, p_request_id, p_actor_reference,
    p_credential_id, p_owner_id, p_namespace_id, p_operation,
    p_policy_decision, p_release_binding, p_request_digest, p_result_digest,
    p_target_order_digest, p_response_byte_count, p_covered_result_count,
    p_issued_at, p_expires_at, p_origin_process_verifier, p_audit_event_id,
    p_target_memory_ids, p_target_revision_ids
  ) INTO issued_audit_event_id;

  UPDATE source_wire_memory.protected_read_receipts
     SET format_version = 2,
         authorization_binding_kind = 'gate_b_authorization_v1',
         response_handoff_state = 'pending',
         response_handoff_recorded_at = NULL,
         gate_b_authorization_id = authorization_record.authorization_id,
         gate_b_authorization_context_digest =
           authorization_record.authorization_context_digest,
         gate_b_actor_identity_id = authorization_record.actor_identity_id,
         gate_b_principal_id = authorization_record.principal_id,
         gate_b_adapter_id = authorization_record.adapter_id,
         gate_b_client_id = authorization_record.client_id,
         gate_b_session_id = authorization_record.session_id,
         gate_b_credential_audience = authorization_record.credential_audience,
         gate_b_authorization_epoch = authorization_record.authorization_epoch,
         gate_b_deletion_epoch = authorization_record.deletion_epoch,
         gate_b_capability = authorization_record.capability,
         gate_b_credential_issued_at = authorization_record.credential_issued_at,
         gate_b_credential_expires_at = authorization_record.credential_expires_at,
         gate_b_session_issued_at = authorization_record.session_issued_at,
         gate_b_session_expires_at = authorization_record.session_expires_at,
         gate_b_credential_status = authorization_record.credential_status,
         gate_b_client_state = authorization_record.client_state,
         gate_b_session_state = authorization_record.session_state,
         gate_b_grant_state = authorization_record.grant_state,
         gate_b_destination_digest = authorization_record.destination_digest,
         gate_b_audience_chain_digest = authorization_record.audience_chain_digest,
         gate_b_sender_binding_kind = authorization_record.sender_binding_kind,
         gate_b_sender_thumbprint_digest =
           authorization_record.sender_thumbprint_digest,
         gate_b_dpop_nonce_digest = authorization_record.dpop_nonce_digest,
         gate_b_replay_id_digest = authorization_record.replay_id_digest,
         gate_b_proof_issued_at = authorization_record.proof_issued_at,
         gate_b_request_method = authorization_record.request_method,
         gate_b_request_uri = authorization_record.request_uri
   WHERE receipt_id = p_receipt_id
     AND format_version = 1
     AND authorization_binding_kind = 'legacy_unbound'
     AND consumption_state = 'issued'
     AND release_status = 'release_authorized'
  RETURNING true INTO enriched;
  IF NOT coalesce(enriched, false) THEN
    RAISE EXCEPTION 'gate B protected receipt enrichment failed'
      USING ERRCODE = '40001';
  END IF;

  RETURN issued_audit_event_id;
END;
$$;

CREATE FUNCTION source_wire_memory.consume_gate_b_memory_protected_read_receipt(
  p_credential_id uuid,
  p_owner_id varchar,
  p_principal_id varchar,
  p_adapter_id varchar,
  p_client_id varchar,
  p_session_id varchar,
  p_credential_audience varchar,
  p_authorization_epoch bigint,
  p_deletion_epoch bigint,
  p_namespace_id varchar,
  p_destination_digest varchar,
  p_audience_chain_digest varchar,
  p_sender_thumbprint_digest varchar,
  p_dpop_nonce_digest varchar,
  p_request_method varchar,
  p_request_uri varchar,
  p_authorization_id uuid,
  p_authorization_context_digest varchar,
  p_receipt_id uuid,
  p_format_version smallint,
  p_trace_id uuid,
  p_request_id uuid,
  p_actor_reference varchar,
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
  p_origin_process_verifier varchar
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  release_locked boolean := false;
  consumed boolean := false;
BEGIN
  IF p_format_version IS DISTINCT FROM 2 THEN
    RETURN false;
  END IF;

  SELECT source_wire_memory.lock_gate_b_memory_release(
    p_credential_id, p_owner_id, p_principal_id, p_adapter_id, p_client_id,
    p_session_id, p_credential_audience, p_authorization_epoch,
    p_deletion_epoch, p_namespace_id, p_destination_digest,
    p_audience_chain_digest, p_sender_thumbprint_digest, p_dpop_nonce_digest,
    p_request_method, p_request_uri
  ) INTO release_locked;
  IF NOT release_locked THEN
    RETURN false;
  END IF;

  PERFORM 1
  FROM source_wire_memory.gate_b_memory_authorization_events AS authorization_event
  JOIN source_wire_memory.protected_read_receipts AS receipt
    ON receipt.gate_b_authorization_id = authorization_event.authorization_id
   AND receipt.gate_b_authorization_context_digest =
       authorization_event.authorization_context_digest
   AND receipt.gate_b_actor_identity_id = authorization_event.actor_identity_id
   AND receipt.authentication_epoch_id = authorization_event.authentication_epoch_id
   AND receipt.gate_b_principal_id = authorization_event.principal_id
   AND receipt.gate_b_adapter_id = authorization_event.adapter_id
   AND receipt.gate_b_client_id = authorization_event.client_id
   AND receipt.gate_b_session_id = authorization_event.session_id
   AND receipt.gate_b_credential_audience = authorization_event.credential_audience
   AND receipt.gate_b_authorization_epoch = authorization_event.authorization_epoch
   AND receipt.gate_b_deletion_epoch = authorization_event.deletion_epoch
   AND receipt.gate_b_capability = authorization_event.capability
   AND receipt.gate_b_credential_issued_at = authorization_event.credential_issued_at
   AND receipt.gate_b_credential_expires_at = authorization_event.credential_expires_at
   AND receipt.gate_b_session_issued_at = authorization_event.session_issued_at
   AND receipt.gate_b_session_expires_at = authorization_event.session_expires_at
   AND receipt.gate_b_credential_status = authorization_event.credential_status
   AND receipt.gate_b_client_state = authorization_event.client_state
   AND receipt.gate_b_session_state = authorization_event.session_state
   AND receipt.gate_b_grant_state = authorization_event.grant_state
   AND receipt.gate_b_destination_digest = authorization_event.destination_digest
   AND receipt.gate_b_audience_chain_digest = authorization_event.audience_chain_digest
   AND receipt.gate_b_sender_binding_kind = authorization_event.sender_binding_kind
   AND receipt.gate_b_sender_thumbprint_digest =
       authorization_event.sender_thumbprint_digest
   AND receipt.gate_b_dpop_nonce_digest = authorization_event.dpop_nonce_digest
   AND receipt.gate_b_replay_id_digest = authorization_event.replay_id_digest
   AND receipt.gate_b_proof_issued_at = authorization_event.proof_issued_at
   AND receipt.gate_b_request_method = authorization_event.request_method
   AND receipt.gate_b_request_uri = authorization_event.request_uri
  WHERE authorization_event.authorization_id = p_authorization_id
    AND authorization_event.authorization_context_digest = p_authorization_context_digest
    AND authorization_event.credential_id = p_credential_id
    AND authorization_event.owner_id = p_owner_id
    AND authorization_event.principal_id = p_principal_id
    AND authorization_event.adapter_id = p_adapter_id
    AND authorization_event.client_id = p_client_id
    AND authorization_event.session_id = p_session_id
    AND authorization_event.credential_audience = p_credential_audience
    AND authorization_event.authorization_epoch = p_authorization_epoch
    AND authorization_event.deletion_epoch = p_deletion_epoch
    AND authorization_event.namespace_id = p_namespace_id
    AND authorization_event.destination_digest = p_destination_digest
    AND authorization_event.audience_chain_digest = p_audience_chain_digest
    AND authorization_event.sender_thumbprint_digest = p_sender_thumbprint_digest
    AND authorization_event.dpop_nonce_digest = p_dpop_nonce_digest
    AND authorization_event.request_method = p_request_method
    AND authorization_event.request_uri = p_request_uri
    AND receipt.receipt_id = p_receipt_id
    AND receipt.format_version = 2
    AND receipt.authorization_binding_kind = 'gate_b_authorization_v1'
  FOR UPDATE OF receipt;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT source_wire_memory.consume_protected_read_receipt(
    p_receipt_id, p_format_version, p_trace_id, p_request_id,
    p_actor_reference, p_credential_id, p_owner_id, p_namespace_id,
    p_operation, p_policy_decision, p_release_binding, p_request_digest,
    p_result_digest, p_target_order_digest, p_response_byte_count,
    p_covered_result_count, p_issued_at, p_expires_at,
    p_origin_process_verifier
  ) INTO consumed;

  RETURN coalesce(consumed, false);
END;
$$;

CREATE FUNCTION source_wire_memory.finalize_gate_b_memory_protected_read_handoff(
  p_receipt_id uuid,
  p_authorization_id uuid,
  p_authorization_context_digest varchar,
  p_origin_process_verifier varchar,
  p_outcome varchar
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  finalized boolean := false;
BEGIN
  IF p_outcome NOT IN ('accepted_in_process', 'failed') THEN
    RETURN false;
  END IF;

  UPDATE source_wire_memory.protected_read_receipts AS receipt
     SET response_handoff_state = p_outcome,
         response_handoff_recorded_at = pg_catalog.clock_timestamp()
   WHERE receipt.receipt_id = p_receipt_id
     AND receipt.format_version = 2
     AND receipt.authorization_binding_kind = 'gate_b_authorization_v1'
     AND receipt.gate_b_authorization_id = p_authorization_id
     AND receipt.gate_b_authorization_context_digest =
         p_authorization_context_digest
     AND receipt.origin_process_verifier = p_origin_process_verifier
     AND receipt.consumption_state = 'consumed'
     AND receipt.release_status = 'release_attempted'
     AND receipt.consumed_at IS NOT NULL
     AND receipt.response_handoff_state = 'pending'
     AND receipt.response_handoff_recorded_at IS NULL
  RETURNING true INTO finalized;

  RETURN coalesce(finalized, false);
END;
$$;

REVOKE ALL ON FUNCTION source_wire_memory.record_gate_b_memory_authorization(
  uuid, varchar, uuid, varchar, varchar, varchar, varchar, varchar, varchar,
  bigint, bigint, varchar, varchar, varchar, varchar, varchar, varchar,
  timestamptz, varchar, varchar
) FROM PUBLIC;
REVOKE ALL ON FUNCTION source_wire_memory.issue_gate_b_memory_protected_read_receipt(
  uuid, varchar, varchar, varchar, varchar, varchar, varchar, bigint, bigint,
  varchar, varchar, varchar, varchar, varchar, varchar, varchar, uuid, varchar,
  uuid, smallint, uuid, uuid, varchar, varchar, varchar, varchar, varchar,
  varchar, varchar, integer, smallint, timestamptz, timestamptz, varchar, uuid,
  uuid[], uuid[]
) FROM PUBLIC;
REVOKE ALL ON FUNCTION source_wire_memory.consume_gate_b_memory_protected_read_receipt(
  uuid, varchar, varchar, varchar, varchar, varchar, varchar, bigint, bigint,
  varchar, varchar, varchar, varchar, varchar, varchar, varchar, uuid, varchar,
  uuid, smallint, uuid, uuid, varchar, varchar, varchar, varchar, varchar,
  varchar, varchar, integer, smallint, timestamptz, timestamptz, varchar
) FROM PUBLIC;
REVOKE ALL ON FUNCTION source_wire_memory.finalize_gate_b_memory_protected_read_handoff(
  uuid, uuid, varchar, varchar, varchar
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION source_wire_memory.record_gate_b_memory_authorization(
  uuid, varchar, uuid, varchar, varchar, varchar, varchar, varchar, varchar,
  bigint, bigint, varchar, varchar, varchar, varchar, varchar, varchar,
  timestamptz, varchar, varchar
) TO source_wire_runtime;
GRANT EXECUTE ON FUNCTION source_wire_memory.issue_gate_b_memory_protected_read_receipt(
  uuid, varchar, varchar, varchar, varchar, varchar, varchar, bigint, bigint,
  varchar, varchar, varchar, varchar, varchar, varchar, varchar, uuid, varchar,
  uuid, smallint, uuid, uuid, varchar, varchar, varchar, varchar, varchar,
  varchar, varchar, integer, smallint, timestamptz, timestamptz, varchar, uuid,
  uuid[], uuid[]
) TO source_wire_runtime;
GRANT EXECUTE ON FUNCTION source_wire_memory.consume_gate_b_memory_protected_read_receipt(
  uuid, varchar, varchar, varchar, varchar, varchar, varchar, bigint, bigint,
  varchar, varchar, varchar, varchar, varchar, varchar, varchar, uuid, varchar,
  uuid, smallint, uuid, uuid, varchar, varchar, varchar, varchar, varchar,
  varchar, varchar, integer, smallint, timestamptz, timestamptz, varchar
) TO source_wire_runtime;
GRANT EXECUTE ON FUNCTION source_wire_memory.finalize_gate_b_memory_protected_read_handoff(
  uuid, uuid, varchar, varchar, varchar
) TO source_wire_runtime;
