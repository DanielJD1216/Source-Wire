ALTER TABLE source_wire_memory.restore_receipts
  DROP CONSTRAINT restore_receipts_schema_version_check,
  ADD CONSTRAINT restore_receipts_schema_version_check
    CHECK (schema_version BETWEEN 4 AND 7);

CREATE TABLE source_wire_memory.gate_b_memory_clients (
  client_id varchar(64) PRIMARY KEY CHECK (
    client_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  owner_id varchar(64) NOT NULL REFERENCES source_wire_memory.owners(owner_id),
  principal_id varchar(64) NOT NULL CHECK (
    principal_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  adapter_id varchar(64) NOT NULL CHECK (
    adapter_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  state varchar(16) NOT NULL CHECK (state IN ('active', 'revoked')),
  created_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (
    (state = 'active' AND revoked_at IS NULL)
    OR (state = 'revoked' AND revoked_at IS NOT NULL)
  ),
  UNIQUE (owner_id, principal_id, client_id)
);

CREATE TABLE source_wire_memory.gate_b_memory_sessions (
  session_id varchar(64) PRIMARY KEY CHECK (
    session_id ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  client_id varchar(64) NOT NULL
    REFERENCES source_wire_memory.gate_b_memory_clients(client_id),
  credential_id uuid NOT NULL REFERENCES source_wire_memory.credentials(credential_id),
  credential_audience varchar(64) NOT NULL CHECK (
    credential_audience ~ '^[A-Za-z][A-Za-z0-9_-]{0,63}$'
  ),
  authorization_epoch bigint NOT NULL CHECK (authorization_epoch >= 0),
  deletion_epoch bigint NOT NULL CHECK (deletion_epoch >= 0),
  destination_digest varchar(64) NOT NULL CHECK (
    destination_digest ~ '^[0-9a-f]{64}$'
  ),
  audience_chain_digest varchar(64) NOT NULL CHECK (
    audience_chain_digest ~ '^[0-9a-f]{64}$'
  ),
  sender_binding_kind varchar(16) NOT NULL CHECK (sender_binding_kind = 'dpop'),
  sender_thumbprint_digest varchar(64) NOT NULL CHECK (
    sender_thumbprint_digest ~ '^[0-9a-f]{64}$'
  ),
  dpop_nonce_digest varchar(64) NOT NULL CHECK (
    dpop_nonce_digest ~ '^[0-9a-f]{64}$'
  ),
  state varchar(16) NOT NULL CHECK (state IN ('active', 'revoked')),
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK (expires_at > issued_at),
  CHECK (
    (state = 'active' AND revoked_at IS NULL)
    OR (state = 'revoked' AND revoked_at IS NOT NULL)
  )
);

CREATE TABLE source_wire_memory.gate_b_memory_grants (
  session_id varchar(64) NOT NULL
    REFERENCES source_wire_memory.gate_b_memory_sessions(session_id),
  namespace_id varchar(64) NOT NULL
    REFERENCES source_wire_memory.namespaces(namespace_id),
  capability varchar(64) NOT NULL CHECK (capability = 'trusted_memory.search'),
  authorization_epoch bigint NOT NULL CHECK (authorization_epoch >= 0),
  deletion_epoch bigint NOT NULL CHECK (deletion_epoch >= 0),
  state varchar(16) NOT NULL CHECK (state IN ('active', 'revoked')),
  granted_at timestamptz NOT NULL,
  revoked_at timestamptz,
  PRIMARY KEY (session_id, namespace_id, capability),
  CHECK (
    (state = 'active' AND revoked_at IS NULL)
    OR (state = 'revoked' AND revoked_at IS NOT NULL)
  )
);

CREATE TABLE source_wire_memory.gate_b_memory_replay_ids (
  replay_id_digest varchar(64) NOT NULL CHECK (
    replay_id_digest ~ '^[0-9a-f]{64}$'
  ),
  session_id varchar(64) NOT NULL
    REFERENCES source_wire_memory.gate_b_memory_sessions(session_id),
  sender_thumbprint_digest varchar(64) NOT NULL CHECK (
    sender_thumbprint_digest ~ '^[0-9a-f]{64}$'
  ),
  proof_issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NOT NULL,
  CHECK (expires_at > proof_issued_at),
  CHECK (consumed_at >= proof_issued_at - interval '30 seconds'),
  PRIMARY KEY (sender_thumbprint_digest, replay_id_digest)
);

CREATE INDEX gate_b_memory_replay_ids_expiry
  ON source_wire_memory.gate_b_memory_replay_ids (session_id, expires_at);

CREATE INDEX gate_b_memory_replay_ids_sender_expiry
  ON source_wire_memory.gate_b_memory_replay_ids (
    sender_thumbprint_digest,
    expires_at
  );

CREATE FUNCTION source_wire_memory.authorize_gate_b_memory_search(
  p_principal_id varchar,
  p_adapter_id varchar,
  p_client_id varchar,
  p_session_id varchar,
  p_credential_audience varchar,
  p_authorization_epoch bigint,
  p_deletion_epoch bigint,
  p_destination_digest varchar,
  p_audience_chain_digest varchar,
  p_sender_thumbprint_digest varchar,
  p_request_method varchar,
  p_request_uri varchar,
  p_dpop_nonce_digest varchar,
  p_replay_id_digest varchar,
  p_proof_issued_at_ms bigint,
  p_namespace_id varchar
)
RETURNS TABLE (
  credential_id uuid,
  credential_class varchar,
  owner_id varchar,
  actor_identity_id uuid,
  authentication_epoch_id uuid,
  namespace_ids varchar[],
  capabilities varchar[],
  issued_at timestamptz,
  expires_at timestamptz,
  session_id varchar,
  authorization_epoch bigint,
  deletion_epoch bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  authorized_record record;
  observed_at timestamptz := pg_catalog.clock_timestamp();
  proof_issued_at timestamptz;
  replay_count bigint;
  candidate_credential_id uuid;
  candidate_owner_id varchar;
BEGIN
  IF p_proof_issued_at_ms < 0 THEN
    RETURN;
  END IF;
  proof_issued_at := pg_catalog.to_timestamp(p_proof_issued_at_ms::numeric / 1000);
  IF
    p_request_method IS DISTINCT FROM 'POST'
    OR p_request_uri IS DISTINCT FROM '/v1alpha1/trusted-memories/search'
    OR proof_issued_at + interval '5 minutes' <= observed_at
    OR proof_issued_at > observed_at + interval '30 seconds'
  THEN
    RETURN;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock_shared(
    pg_catalog.hashtextextended(
      'source_wire_story4_authentication_epoch',
      1913770104
    )
  );

  SELECT session.credential_id, client.owner_id
    INTO candidate_credential_id, candidate_owner_id
    FROM source_wire_memory.gate_b_memory_clients AS client
    JOIN source_wire_memory.gate_b_memory_sessions AS session
      ON session.client_id = client.client_id
   WHERE client.client_id = p_client_id
     AND client.principal_id = p_principal_id
     AND client.adapter_id = p_adapter_id
     AND session.session_id = p_session_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM 1
    FROM source_wire_memory.credentials AS credential
    JOIN source_wire_memory.installation_state AS installation
      ON installation.singleton = true
     AND installation.current_authentication_epoch_id =
         credential.authentication_epoch_id
   WHERE credential.credential_id = candidate_credential_id
     AND credential.owner_id = candidate_owner_id
   FOR UPDATE OF credential, installation;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM 1
    FROM source_wire_memory.credential_namespace_grants AS credential_namespace
   WHERE credential_namespace.credential_id = candidate_credential_id
     AND credential_namespace.namespace_id = p_namespace_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM 1
    FROM source_wire_memory.credential_capability_grants AS credential_capability
   WHERE credential_capability.credential_id = candidate_credential_id
     AND credential_capability.capability = 'trusted_memory.search'
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM 1
    FROM source_wire_memory.gate_b_memory_clients AS client
   WHERE client.client_id = p_client_id
     AND client.owner_id = candidate_owner_id
     AND client.principal_id = p_principal_id
     AND client.adapter_id = p_adapter_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM 1
    FROM source_wire_memory.gate_b_memory_sessions AS session
   WHERE session.session_id = p_session_id
     AND session.client_id = p_client_id
     AND session.credential_id = candidate_credential_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM 1
    FROM source_wire_memory.gate_b_memory_grants AS grant_row
   WHERE grant_row.session_id = p_session_id
     AND grant_row.namespace_id = p_namespace_id
     AND grant_row.capability = 'trusted_memory.search'
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT
    credential.credential_id,
    credential.credential_class,
    credential.owner_id,
    credential.actor_identity_id,
    credential.authentication_epoch_id,
    credential.issued_at AS credential_issued_at,
    credential.expires_at AS credential_expires_at,
    session.session_id,
    session.authorization_epoch,
    session.deletion_epoch,
    session.issued_at AS session_issued_at,
    session.expires_at AS session_expires_at
  INTO authorized_record
  FROM source_wire_memory.gate_b_memory_clients AS client
  JOIN source_wire_memory.gate_b_memory_sessions AS session
    ON session.client_id = client.client_id
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
  WHERE client.client_id = p_client_id
    AND client.owner_id = candidate_owner_id
    AND client.principal_id = p_principal_id
    AND client.adapter_id = p_adapter_id
    AND client.state = 'active'
    AND session.session_id = p_session_id
    AND session.credential_id = candidate_credential_id
    AND session.credential_audience = p_credential_audience
    AND session.authorization_epoch = p_authorization_epoch
    AND session.deletion_epoch = p_deletion_epoch
    AND session.destination_digest = p_destination_digest
    AND session.audience_chain_digest = p_audience_chain_digest
    AND session.sender_binding_kind = 'dpop'
    AND session.sender_thumbprint_digest = p_sender_thumbprint_digest
    AND session.dpop_nonce_digest = p_dpop_nonce_digest
    AND session.state = 'active'
    AND session.issued_at <= observed_at
    AND session.expires_at > observed_at
    AND grant_row.namespace_id = p_namespace_id
    AND grant_row.capability = 'trusted_memory.search'
    AND grant_row.authorization_epoch = p_authorization_epoch
    AND grant_row.deletion_epoch = p_deletion_epoch
    AND grant_row.state = 'active'
    AND credential.credential_class = 'harness'
    AND credential.status = 'active'
    AND credential.issued_at <= observed_at
    AND credential.expires_at > observed_at;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  observed_at := pg_catalog.clock_timestamp();
  IF
    proof_issued_at + interval '5 minutes' <= observed_at
    OR proof_issued_at > observed_at + interval '30 seconds'
    OR authorized_record.session_issued_at > observed_at
    OR authorized_record.session_expires_at <= observed_at
    OR authorized_record.credential_issued_at > observed_at
    OR authorized_record.credential_expires_at <= observed_at
  THEN
    RETURN;
  END IF;

  DELETE FROM source_wire_memory.gate_b_memory_replay_ids AS replay
   WHERE replay.sender_thumbprint_digest = p_sender_thumbprint_digest
     AND replay.expires_at <= observed_at;
  SELECT pg_catalog.count(*)
    INTO replay_count
    FROM source_wire_memory.gate_b_memory_replay_ids AS replay
   WHERE replay.session_id = p_session_id;
  IF replay_count >= 4096 THEN
    RAISE EXCEPTION 'gate B replay capacity exhausted'
      USING ERRCODE = '54000';
  END IF;

  BEGIN
    INSERT INTO source_wire_memory.gate_b_memory_replay_ids (
      replay_id_digest,
      session_id,
      sender_thumbprint_digest,
      proof_issued_at,
      expires_at,
      consumed_at
    ) VALUES (
      p_replay_id_digest,
      p_session_id,
      p_sender_thumbprint_digest,
      proof_issued_at,
      proof_issued_at + interval '5 minutes',
      observed_at
    );
  EXCEPTION WHEN unique_violation THEN
    RETURN;
  END;

  RETURN QUERY SELECT
    authorized_record.credential_id,
    authorized_record.credential_class::varchar,
    authorized_record.owner_id,
    authorized_record.actor_identity_id,
    authorized_record.authentication_epoch_id,
    ARRAY[p_namespace_id]::varchar[],
    ARRAY['trusted_memory.search']::varchar[],
    authorized_record.credential_issued_at,
    authorized_record.credential_expires_at,
    authorized_record.session_id,
    authorized_record.authorization_epoch,
    authorized_record.deletion_epoch;
END;
$$;

CREATE FUNCTION source_wire_memory.lock_gate_b_memory_release(
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
  p_request_uri varchar
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  observed_at timestamptz := pg_catalog.clock_timestamp();
  release_record record;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock_shared(
    pg_catalog.hashtextextended(
      'source_wire_story4_authentication_epoch',
      1913770104
    )
  );

  PERFORM 1
    FROM source_wire_memory.credentials AS credential
    JOIN source_wire_memory.installation_state AS installation
      ON installation.singleton = true
     AND installation.current_authentication_epoch_id =
         credential.authentication_epoch_id
   WHERE credential.credential_id = p_credential_id
     AND credential.owner_id = p_owner_id
   FOR UPDATE OF credential, installation;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM 1
    FROM source_wire_memory.credential_namespace_grants AS credential_namespace
   WHERE credential_namespace.credential_id = p_credential_id
     AND credential_namespace.namespace_id = p_namespace_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM 1
    FROM source_wire_memory.credential_capability_grants AS credential_capability
   WHERE credential_capability.credential_id = p_credential_id
     AND credential_capability.capability = 'trusted_memory.search'
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM 1
    FROM source_wire_memory.gate_b_memory_clients AS client
   WHERE client.client_id = p_client_id
     AND client.owner_id = p_owner_id
     AND client.principal_id = p_principal_id
     AND client.adapter_id = p_adapter_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM 1
    FROM source_wire_memory.gate_b_memory_sessions AS session
   WHERE session.session_id = p_session_id
     AND session.client_id = p_client_id
     AND session.credential_id = p_credential_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM 1
    FROM source_wire_memory.gate_b_memory_grants AS grant_row
   WHERE grant_row.session_id = p_session_id
     AND grant_row.namespace_id = p_namespace_id
     AND grant_row.capability = 'trusted_memory.search'
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT
    session.issued_at AS session_issued_at,
    session.expires_at AS session_expires_at,
    credential.issued_at AS credential_issued_at,
    credential.expires_at AS credential_expires_at
    INTO release_record
    FROM source_wire_memory.gate_b_memory_clients AS client
    JOIN source_wire_memory.gate_b_memory_sessions AS session
      ON session.client_id = client.client_id
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
   WHERE credential.credential_id = p_credential_id
     AND credential.owner_id = p_owner_id
     AND credential.credential_class = 'harness'
     AND credential.status = 'active'
     AND credential.issued_at <= observed_at
     AND credential.expires_at > observed_at
     AND client.principal_id = p_principal_id
     AND client.adapter_id = p_adapter_id
     AND client.client_id = p_client_id
     AND client.state = 'active'
     AND session.session_id = p_session_id
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
     AND p_request_method = 'POST'
     AND p_request_uri = '/v1alpha1/trusted-memories/search'
     AND grant_row.namespace_id = p_namespace_id
     AND grant_row.capability = 'trusted_memory.search'
     AND grant_row.state = 'active'
     AND grant_row.authorization_epoch = p_authorization_epoch
     AND grant_row.deletion_epoch = p_deletion_epoch;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  observed_at := pg_catalog.clock_timestamp();
  RETURN
    release_record.session_issued_at <= observed_at
    AND release_record.session_expires_at > observed_at
    AND release_record.credential_issued_at <= observed_at
    AND release_record.credential_expires_at > observed_at;
END;
$$;

REVOKE ALL ON TABLE source_wire_memory.gate_b_memory_clients FROM PUBLIC;
REVOKE ALL ON TABLE source_wire_memory.gate_b_memory_clients FROM source_wire_runtime;
REVOKE ALL ON TABLE source_wire_memory.gate_b_memory_sessions FROM PUBLIC;
REVOKE ALL ON TABLE source_wire_memory.gate_b_memory_sessions FROM source_wire_runtime;
REVOKE ALL ON TABLE source_wire_memory.gate_b_memory_grants FROM PUBLIC;
REVOKE ALL ON TABLE source_wire_memory.gate_b_memory_grants FROM source_wire_runtime;
REVOKE ALL ON TABLE source_wire_memory.gate_b_memory_replay_ids FROM PUBLIC;
REVOKE ALL ON TABLE source_wire_memory.gate_b_memory_replay_ids FROM source_wire_runtime;
REVOKE ALL ON FUNCTION source_wire_memory.authorize_gate_b_memory_search(
  varchar, varchar, varchar, varchar, varchar, bigint, bigint, varchar,
  varchar, varchar, varchar, varchar, varchar, varchar, bigint, varchar
) FROM PUBLIC;
REVOKE ALL ON FUNCTION source_wire_memory.lock_gate_b_memory_release(
  uuid, varchar, varchar, varchar, varchar, varchar, varchar, bigint, bigint,
  varchar, varchar, varchar, varchar, varchar, varchar, varchar
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION source_wire_memory.authorize_gate_b_memory_search(
  varchar, varchar, varchar, varchar, varchar, bigint, bigint, varchar,
  varchar, varchar, varchar, varchar, varchar, varchar, bigint, varchar
) TO source_wire_runtime;
GRANT EXECUTE ON FUNCTION source_wire_memory.lock_gate_b_memory_release(
  uuid, varchar, varchar, varchar, varchar, varchar, varchar, bigint, bigint,
  varchar, varchar, varchar, varchar, varchar, varchar, varchar
) TO source_wire_runtime;
