CREATE TABLE source_wire_memory.authentication_epochs (
  authentication_epoch_id uuid PRIMARY KEY,
  activated_at timestamptz NOT NULL,
  activation_reason varchar(32) NOT NULL CHECK (
    activation_reason IN ('migration', 'portable_restore', 'physical_recovery')
  )
);

CREATE TABLE source_wire_memory.installation_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton = true),
  current_authentication_epoch_id uuid NOT NULL
    REFERENCES source_wire_memory.authentication_epochs(authentication_epoch_id),
  updated_at timestamptz NOT NULL
);

WITH epoch AS (
  INSERT INTO source_wire_memory.authentication_epochs (
    authentication_epoch_id,
    activated_at,
    activation_reason
  ) VALUES (
    pg_catalog.gen_random_uuid(),
    pg_catalog.clock_timestamp(),
    'migration'
  )
  RETURNING authentication_epoch_id, activated_at
)
INSERT INTO source_wire_memory.installation_state (
  singleton,
  current_authentication_epoch_id,
  updated_at
)
SELECT true, authentication_epoch_id, activated_at
FROM epoch;

CREATE TABLE source_wire_memory.actor_identities (
  actor_identity_id uuid PRIMARY KEY,
  owner_id varchar(64) NOT NULL REFERENCES source_wire_memory.owners(owner_id),
  actor_class varchar(32) NOT NULL CHECK (
    actor_class IN ('owner_admin', 'harness')
  ),
  created_at timestamptz NOT NULL,
  UNIQUE (owner_id, actor_identity_id)
);

INSERT INTO source_wire_memory.actor_identities (
  actor_identity_id,
  owner_id,
  actor_class,
  created_at
)
SELECT
  credential_id,
  owner_id,
  credential_class,
  issued_at
FROM source_wire_memory.credentials
ORDER BY credential_id;

ALTER TABLE source_wire_memory.credentials
  ADD COLUMN actor_identity_id uuid,
  ADD COLUMN authentication_epoch_id uuid;

UPDATE source_wire_memory.credentials
SET actor_identity_id = credential_id,
    authentication_epoch_id = (
      SELECT current_authentication_epoch_id
      FROM source_wire_memory.installation_state
      WHERE singleton = true
    );

ALTER TABLE source_wire_memory.credentials
  ALTER COLUMN actor_identity_id SET NOT NULL,
  ALTER COLUMN authentication_epoch_id SET NOT NULL,
  ADD CONSTRAINT credentials_actor_identity_fkey
    FOREIGN KEY (owner_id, actor_identity_id)
    REFERENCES source_wire_memory.actor_identities(owner_id, actor_identity_id),
  ADD CONSTRAINT credentials_authentication_epoch_fkey
    FOREIGN KEY (authentication_epoch_id)
    REFERENCES source_wire_memory.authentication_epochs(authentication_epoch_id);

DROP TRIGGER audit_events_immutable_update
  ON source_wire_memory.audit_events;

ALTER TABLE source_wire_memory.audit_events
  ADD COLUMN actor_identity_id uuid;

UPDATE source_wire_memory.audit_events AS audit
SET actor_identity_id = credential.actor_identity_id
FROM source_wire_memory.credentials AS credential
WHERE audit.actor_credential_id = credential.credential_id;

ALTER TABLE source_wire_memory.audit_events
  ADD CONSTRAINT audit_events_actor_identity_fkey
    FOREIGN KEY (owner_id, actor_identity_id)
    REFERENCES source_wire_memory.actor_identities(owner_id, actor_identity_id);

CREATE TRIGGER audit_events_immutable_update
BEFORE UPDATE OR DELETE ON source_wire_memory.audit_events
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_audit_history_mutation();

ALTER TABLE source_wire_memory.memory_candidates
  ADD COLUMN proposed_by_actor_id uuid,
  ADD COLUMN decided_by_actor_id uuid;

UPDATE source_wire_memory.memory_candidates AS candidate
SET proposed_by_actor_id = credential.actor_identity_id
FROM source_wire_memory.credentials AS credential
WHERE candidate.proposed_by_credential_id = credential.credential_id;

UPDATE source_wire_memory.memory_candidates AS candidate
SET decided_by_actor_id = credential.actor_identity_id
FROM source_wire_memory.credentials AS credential
WHERE candidate.decided_by_credential_id = credential.credential_id;

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname
    INTO constraint_name
    FROM pg_catalog.pg_constraint
   WHERE conrelid = 'source_wire_memory.memory_candidates'::pg_catalog.regclass
     AND contype = 'c'
     AND pg_catalog.pg_get_constraintdef(oid) LIKE '%decided_by_credential_id%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE pg_catalog.format(
      'ALTER TABLE source_wire_memory.memory_candidates DROP CONSTRAINT %I',
      constraint_name
    );
  END IF;
END;
$$;

ALTER TABLE source_wire_memory.memory_candidates
  ALTER COLUMN proposed_by_actor_id SET NOT NULL,
  ALTER COLUMN proposed_by_credential_id DROP NOT NULL,
  ADD CONSTRAINT memory_candidates_proposed_actor_fkey
    FOREIGN KEY (owner_id, proposed_by_actor_id)
    REFERENCES source_wire_memory.actor_identities(owner_id, actor_identity_id),
  ADD CONSTRAINT memory_candidates_decided_actor_fkey
    FOREIGN KEY (owner_id, decided_by_actor_id)
    REFERENCES source_wire_memory.actor_identities(owner_id, actor_identity_id),
  ADD CONSTRAINT memory_candidates_state_actor_check CHECK (
    (
      state = 'pending'
      AND decided_at IS NULL
      AND decided_by_actor_id IS NULL
      AND decided_by_credential_id IS NULL
    )
    OR
    (
      state IN ('approved', 'rejected')
      AND decided_at IS NOT NULL
      AND decided_by_actor_id IS NOT NULL
    )
  );

ALTER TABLE source_wire_memory.candidate_decisions
  ADD COLUMN decided_by_actor_id uuid;

UPDATE source_wire_memory.candidate_decisions AS decision
SET decided_by_actor_id = credential.actor_identity_id
FROM source_wire_memory.credentials AS credential
WHERE decision.decided_by_credential_id = credential.credential_id;

ALTER TABLE source_wire_memory.candidate_decisions
  ALTER COLUMN decided_by_actor_id SET NOT NULL,
  ALTER COLUMN decided_by_credential_id DROP NOT NULL,
  ADD CONSTRAINT candidate_decisions_actor_fkey
    FOREIGN KEY (owner_id, decided_by_actor_id)
    REFERENCES source_wire_memory.actor_identities(owner_id, actor_identity_id);

ALTER TABLE source_wire_memory.trusted_memory_revisions
  ADD COLUMN created_by_actor_id uuid;

UPDATE source_wire_memory.trusted_memory_revisions AS revision
SET created_by_actor_id = credential.actor_identity_id
FROM source_wire_memory.credentials AS credential
WHERE revision.created_by_credential_id = credential.credential_id;

ALTER TABLE source_wire_memory.trusted_memory_revisions
  ALTER COLUMN created_by_actor_id SET NOT NULL,
  ALTER COLUMN created_by_credential_id DROP NOT NULL,
  ADD CONSTRAINT trusted_memory_revisions_actor_fkey
    FOREIGN KEY (owner_id, created_by_actor_id)
    REFERENCES source_wire_memory.actor_identities(owner_id, actor_identity_id);

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT constraint_row.conname
    INTO constraint_name
    FROM pg_catalog.pg_constraint AS constraint_row
    JOIN pg_catalog.pg_attribute AS attribute_row
      ON attribute_row.attrelid = constraint_row.conrelid
     AND attribute_row.attnum = ANY(constraint_row.conkey)
   WHERE constraint_row.conrelid =
         'source_wire_memory.trusted_memory_revisions'::pg_catalog.regclass
     AND constraint_row.contype = 'u'
     AND attribute_row.attname = 'origin_candidate_id'
   LIMIT 1;
  IF constraint_name IS NOT NULL THEN
    EXECUTE pg_catalog.format(
      'ALTER TABLE source_wire_memory.trusted_memory_revisions DROP CONSTRAINT %I',
      constraint_name
    );
  END IF;
END;
$$;

DROP TRIGGER trusted_memory_revisions_immutable
  ON source_wire_memory.trusted_memory_revisions;
DROP TRIGGER trusted_memory_provenance_immutable
  ON source_wire_memory.trusted_memory_provenance;

ALTER TABLE source_wire_memory.trusted_memory_provenance
  ADD COLUMN provenance_id uuid DEFAULT pg_catalog.gen_random_uuid(),
  ADD COLUMN provenance_key varchar(160);

UPDATE source_wire_memory.trusted_memory_provenance
SET provenance_key =
  'origin:' || origin_candidate_id::text || ':' || provenance_kind;

ALTER TABLE source_wire_memory.trusted_memory_provenance
  ALTER COLUMN provenance_id SET NOT NULL,
  ALTER COLUMN provenance_key SET NOT NULL,
  DROP CONSTRAINT trusted_memory_provenance_pkey,
  ADD CONSTRAINT trusted_memory_provenance_pkey PRIMARY KEY (provenance_id),
  ADD CONSTRAINT trusted_memory_provenance_revision_key_unique
    UNIQUE (revision_id, provenance_key);

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname
      FROM pg_catalog.pg_constraint
     WHERE conrelid =
           'source_wire_memory.trusted_memory_provenance'::pg_catalog.regclass
       AND contype = 'c'
       AND (
         pg_catalog.pg_get_constraintdef(oid) LIKE '%provenance_kind%'
         OR pg_catalog.pg_get_constraintdef(oid) LIKE '%owner_assertion%'
       )
  LOOP
    EXECUTE pg_catalog.format(
      'ALTER TABLE source_wire_memory.trusted_memory_provenance DROP CONSTRAINT %I',
      constraint_name
    );
  END LOOP;
END;
$$;

ALTER TABLE source_wire_memory.trusted_memory_provenance
  ADD CONSTRAINT trusted_memory_provenance_kind_check CHECK (
    provenance_kind IN (
      'owner_assertion',
      'prior_memory',
      'correction_lineage'
    )
  ),
  ADD CONSTRAINT trusted_memory_provenance_shape_check CHECK (
    (
      provenance_kind = 'owner_assertion'
      AND owner_assertion IS NOT NULL
      AND octet_length(owner_assertion) BETWEEN 1 AND 1024
      AND prior_memory_id IS NULL
      AND prior_revision_id IS NULL
    )
    OR
    (
      provenance_kind IN ('prior_memory', 'correction_lineage')
      AND owner_assertion IS NULL
      AND prior_memory_id IS NOT NULL
      AND prior_revision_id IS NOT NULL
    )
  );

CREATE FUNCTION source_wire_memory.set_trusted_memory_provenance_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.provenance_key IS NULL THEN
    NEW.provenance_key :=
      'origin:' || NEW.origin_candidate_id::text || ':' || NEW.provenance_kind;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trusted_memory_provenance_key
BEFORE INSERT ON source_wire_memory.trusted_memory_provenance
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.set_trusted_memory_provenance_key();

CREATE FUNCTION source_wire_memory.guard_trusted_memory_revision_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'trusted memory revision history is immutable'
      USING ERRCODE = '42501';
  END IF;
  IF
    OLD.status <> 'active'
    OR NEW.status NOT IN ('superseded', 'revoked')
    OR OLD.revision_id IS DISTINCT FROM NEW.revision_id
    OR OLD.memory_id IS DISTINCT FROM NEW.memory_id
    OR OLD.owner_id IS DISTINCT FROM NEW.owner_id
    OR OLD.namespace_id IS DISTINCT FROM NEW.namespace_id
    OR OLD.revision_number IS DISTINCT FROM NEW.revision_number
    OR OLD.content IS DISTINCT FROM NEW.content
    OR OLD.content_byte_count IS DISTINCT FROM NEW.content_byte_count
    OR OLD.origin_candidate_id IS DISTINCT FROM NEW.origin_candidate_id
    OR OLD.created_by_credential_id IS DISTINCT FROM NEW.created_by_credential_id
    OR OLD.created_by_actor_id IS DISTINCT FROM NEW.created_by_actor_id
    OR OLD.created_at IS DISTINCT FROM NEW.created_at
  THEN
    RAISE EXCEPTION 'trusted memory revision mutation is not allowed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trusted_memory_revisions_one_way
BEFORE UPDATE OR DELETE ON source_wire_memory.trusted_memory_revisions
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.guard_trusted_memory_revision_mutation();

CREATE TRIGGER trusted_memory_provenance_immutable
BEFORE UPDATE OR DELETE ON source_wire_memory.trusted_memory_provenance
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_memory_history_mutation();

CREATE FUNCTION source_wire_memory.guard_trusted_memory_identity_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'trusted memory identity history is immutable'
      USING ERRCODE = '42501';
  END IF;
  IF
    OLD.state <> 'active'
    OR NEW.state <> 'revoked'
    OR OLD.memory_id IS DISTINCT FROM NEW.memory_id
    OR OLD.owner_id IS DISTINCT FROM NEW.owner_id
    OR OLD.namespace_id IS DISTINCT FROM NEW.namespace_id
    OR OLD.origin_candidate_id IS DISTINCT FROM NEW.origin_candidate_id
    OR OLD.created_at IS DISTINCT FROM NEW.created_at
  THEN
    RAISE EXCEPTION 'trusted memory identity mutation is not allowed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trusted_memories_one_way
BEFORE UPDATE OR DELETE ON source_wire_memory.trusted_memories
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.guard_trusted_memory_identity_mutation();

CREATE TRIGGER actor_identities_immutable
BEFORE UPDATE OR DELETE ON source_wire_memory.actor_identities
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_memory_history_mutation();

CREATE TABLE source_wire_memory.trusted_memory_lifecycle_events (
  lifecycle_event_id uuid PRIMARY KEY,
  owner_id varchar(64) NOT NULL,
  namespace_id varchar(64) NOT NULL,
  memory_id uuid NOT NULL,
  event_type varchar(16) NOT NULL CHECK (
    event_type IN ('correction', 'revocation')
  ),
  expected_revision_id uuid NOT NULL,
  resulting_revision_id uuid NOT NULL,
  reason text NOT NULL CHECK (octet_length(reason) BETWEEN 1 AND 512),
  actor_identity_id uuid NOT NULL,
  actor_credential_id uuid REFERENCES source_wire_memory.credentials(credential_id),
  occurred_at timestamptz NOT NULL,
  UNIQUE (owner_id, namespace_id, memory_id, lifecycle_event_id),
  FOREIGN KEY (owner_id, namespace_id, memory_id)
    REFERENCES source_wire_memory.trusted_memories(owner_id, namespace_id, memory_id),
  FOREIGN KEY (owner_id, namespace_id, memory_id, expected_revision_id)
    REFERENCES source_wire_memory.trusted_memory_revisions(
      owner_id,
      namespace_id,
      memory_id,
      revision_id
    ),
  FOREIGN KEY (owner_id, namespace_id, memory_id, resulting_revision_id)
    REFERENCES source_wire_memory.trusted_memory_revisions(
      owner_id,
      namespace_id,
      memory_id,
      revision_id
    ),
  FOREIGN KEY (owner_id, actor_identity_id)
    REFERENCES source_wire_memory.actor_identities(owner_id, actor_identity_id),
  CHECK (
    (event_type = 'correction' AND expected_revision_id <> resulting_revision_id)
    OR
    (event_type = 'revocation' AND expected_revision_id = resulting_revision_id)
  )
);

CREATE TRIGGER trusted_memory_lifecycle_events_immutable
BEFORE UPDATE OR DELETE ON source_wire_memory.trusted_memory_lifecycle_events
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_memory_history_mutation();

CREATE TABLE source_wire_memory.restore_receipts (
  restore_receipt_id uuid PRIMARY KEY,
  operation varchar(32) NOT NULL CHECK (
    operation IN ('portable_restore', 'physical_recovery')
  ),
  schema_version integer NOT NULL CHECK (schema_version = 4),
  portable_format_version smallint,
  owner_id varchar(64) NOT NULL,
  authentication_epoch_id uuid NOT NULL
    REFERENCES source_wire_memory.authentication_epochs(authentication_epoch_id),
  logical_state_sha256 character(64) CHECK (
    logical_state_sha256 IS NULL
    OR logical_state_sha256 ~ '^[0-9a-f]{64}$'
  ),
  governed_record_count integer NOT NULL CHECK (governed_record_count >= 0),
  result varchar(16) NOT NULL CHECK (result = 'accepted'),
  occurred_at timestamptz NOT NULL,
  CHECK (
    (operation = 'portable_restore' AND portable_format_version = 1)
    OR
    (operation = 'physical_recovery' AND portable_format_version IS NULL)
  )
);

CREATE TRIGGER restore_receipts_immutable
BEFORE UPDATE OR DELETE ON source_wire_memory.restore_receipts
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_memory_history_mutation();

CREATE TABLE source_wire_memory.operator_initialization_records (
  operation varchar(32) NOT NULL CHECK (
    operation IN ('portable_restore', 'physical_recovery')
  ),
  operation_key varchar(64) NOT NULL,
  request_digest character(64) NOT NULL CHECK (
    request_digest ~ '^[0-9a-f]{64}$'
  ),
  owner_admin_credential_id uuid NOT NULL
    REFERENCES source_wire_memory.credentials(credential_id),
  restore_receipt_id uuid NOT NULL
    REFERENCES source_wire_memory.restore_receipts(restore_receipt_id),
  secret_algorithm varchar(32) NOT NULL CHECK (
    secret_algorithm = 'aes-256-gcm-hkdf-sha256-v1'
  ),
  secret_nonce bytea NOT NULL CHECK (octet_length(secret_nonce) = 12),
  secret_ciphertext bytea NOT NULL CHECK (octet_length(secret_ciphertext) > 0),
  secret_auth_tag bytea NOT NULL CHECK (octet_length(secret_auth_tag) = 16),
  replay_expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY (operation, operation_key),
  CHECK (replay_expires_at > created_at)
);

CREATE TRIGGER operator_initialization_records_immutable
BEFORE UPDATE OR DELETE ON source_wire_memory.operator_initialization_records
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_memory_history_mutation();

ALTER TABLE source_wire_memory.installation_state
  ADD COLUMN runtime_state varchar(32) NOT NULL DEFAULT 'ready' CHECK (
    runtime_state IN ('ready', 'verification_required')
  ),
  ADD COLUMN pending_restore_receipt_id uuid
    REFERENCES source_wire_memory.restore_receipts(restore_receipt_id),
  ADD COLUMN runtime_verified_at timestamptz,
  ADD CONSTRAINT installation_state_runtime_shape_check CHECK (
    (
      runtime_state = 'ready'
      AND pending_restore_receipt_id IS NULL
    )
    OR
    (
      runtime_state = 'verification_required'
      AND pending_restore_receipt_id IS NOT NULL
      AND runtime_verified_at IS NULL
    )
  );

CREATE FUNCTION source_wire_memory.apply_trusted_memory_correction(
  p_actor_credential_id uuid,
  p_owner_id varchar,
  p_namespace_id varchar,
  p_memory_id uuid,
  p_expected_revision_id uuid,
  p_new_revision_id uuid,
  p_content text,
  p_content_byte_count integer,
  p_reason text,
  p_lifecycle_event_id uuid,
  p_occurred_at timestamptz
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  actor_id uuid;
  origin_candidate uuid;
  next_revision_number integer;
  memory_state varchar;
  revision_status varchar;
BEGIN
  IF
    p_content IS NULL
    OR p_content_byte_count <> pg_catalog.octet_length(p_content)
    OR p_content_byte_count NOT BETWEEN 1 AND 8192
    OR p_reason IS NULL
    OR pg_catalog.octet_length(p_reason) NOT BETWEEN 1 AND 512
  THEN
    RETURN 0;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock_shared(
    pg_catalog.hashtextextended(
      'source_wire_story4_authentication_epoch',
      1913770104
    )
  );

  SELECT credential.actor_identity_id
    INTO actor_id
    FROM source_wire_memory.credentials AS credential
    JOIN source_wire_memory.installation_state AS installation
      ON installation.singleton = true
     AND installation.current_authentication_epoch_id =
         credential.authentication_epoch_id
   WHERE credential.credential_id = p_actor_credential_id
     AND credential.owner_id = p_owner_id
     AND credential.credential_class = 'owner_admin'
     AND credential.status = 'active'
     AND credential.expires_at > pg_catalog.clock_timestamp()
   FOR UPDATE OF credential;
  IF actor_id IS NULL THEN
    RETURN 0;
  END IF;

  PERFORM 1
    FROM source_wire_memory.credential_namespace_grants
   WHERE credential_id = p_actor_credential_id
     AND namespace_id = p_namespace_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  PERFORM 1
    FROM source_wire_memory.credential_capability_grants
   WHERE credential_id = p_actor_credential_id
     AND capability = 'trusted_memory.correct'
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  SELECT state
    INTO memory_state
    FROM source_wire_memory.trusted_memories
   WHERE memory_id = p_memory_id
     AND owner_id = p_owner_id
     AND namespace_id = p_namespace_id
   FOR UPDATE;
  IF memory_state IS DISTINCT FROM 'active' THEN
    RETURN 0;
  END IF;

  SELECT status, origin_candidate_id, revision_number + 1
    INTO revision_status, origin_candidate, next_revision_number
    FROM source_wire_memory.trusted_memory_revisions
   WHERE revision_id = p_expected_revision_id
     AND memory_id = p_memory_id
     AND owner_id = p_owner_id
     AND namespace_id = p_namespace_id
   FOR UPDATE;
  IF revision_status IS DISTINCT FROM 'active' THEN
    RETURN 0;
  END IF;

  UPDATE source_wire_memory.trusted_memory_revisions
     SET status = 'superseded'
   WHERE revision_id = p_expected_revision_id
     AND status = 'active';
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  INSERT INTO source_wire_memory.trusted_memory_revisions (
    revision_id,
    memory_id,
    owner_id,
    namespace_id,
    revision_number,
    status,
    content,
    content_byte_count,
    origin_candidate_id,
    created_by_credential_id,
    created_by_actor_id,
    created_at
  ) VALUES (
    p_new_revision_id,
    p_memory_id,
    p_owner_id,
    p_namespace_id,
    next_revision_number,
    'active',
    p_content,
    p_content_byte_count,
    origin_candidate,
    p_actor_credential_id,
    actor_id,
    p_occurred_at
  );

  INSERT INTO source_wire_memory.trusted_memory_provenance (
    provenance_id,
    provenance_key,
    revision_id,
    memory_id,
    owner_id,
    namespace_id,
    origin_candidate_id,
    provenance_kind,
    owner_assertion,
    prior_memory_id,
    prior_revision_id,
    created_at
  )
  SELECT
    pg_catalog.gen_random_uuid(),
    provenance.provenance_key,
    p_new_revision_id,
    p_memory_id,
    p_owner_id,
    p_namespace_id,
    provenance.origin_candidate_id,
    provenance.provenance_kind,
    provenance.owner_assertion,
    provenance.prior_memory_id,
    provenance.prior_revision_id,
    p_occurred_at
  FROM source_wire_memory.trusted_memory_provenance AS provenance
  WHERE provenance.revision_id = p_expected_revision_id
  ORDER BY provenance.provenance_key;

  INSERT INTO source_wire_memory.trusted_memory_provenance (
    provenance_id,
    provenance_key,
    revision_id,
    memory_id,
    owner_id,
    namespace_id,
    origin_candidate_id,
    provenance_kind,
    prior_memory_id,
    prior_revision_id,
    created_at
  ) VALUES (
    pg_catalog.gen_random_uuid(),
    'correction-lineage:' || p_expected_revision_id::text,
    p_new_revision_id,
    p_memory_id,
    p_owner_id,
    p_namespace_id,
    origin_candidate,
    'correction_lineage',
    p_memory_id,
    p_expected_revision_id,
    p_occurred_at
  );

  INSERT INTO source_wire_memory.trusted_memory_provenance (
    provenance_id,
    provenance_key,
    revision_id,
    memory_id,
    owner_id,
    namespace_id,
    origin_candidate_id,
    provenance_kind,
    owner_assertion,
    created_at
  ) VALUES (
    pg_catalog.gen_random_uuid(),
    'correction-owner-assertion:' || p_new_revision_id::text,
    p_new_revision_id,
    p_memory_id,
    p_owner_id,
    p_namespace_id,
    origin_candidate,
    'owner_assertion',
    p_reason,
    p_occurred_at
  );

  INSERT INTO source_wire_memory.trusted_memory_lifecycle_events (
    lifecycle_event_id,
    owner_id,
    namespace_id,
    memory_id,
    event_type,
    expected_revision_id,
    resulting_revision_id,
    reason,
    actor_identity_id,
    actor_credential_id,
    occurred_at
  ) VALUES (
    p_lifecycle_event_id,
    p_owner_id,
    p_namespace_id,
    p_memory_id,
    'correction',
    p_expected_revision_id,
    p_new_revision_id,
    p_reason,
    actor_id,
    p_actor_credential_id,
    p_occurred_at
  );

  RETURN next_revision_number;
END;
$$;

CREATE FUNCTION source_wire_memory.apply_trusted_memory_revocation(
  p_actor_credential_id uuid,
  p_owner_id varchar,
  p_namespace_id varchar,
  p_memory_id uuid,
  p_expected_revision_id uuid,
  p_reason text,
  p_lifecycle_event_id uuid,
  p_occurred_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  actor_id uuid;
  memory_state varchar;
  revision_status varchar;
BEGIN
  IF
    p_reason IS NULL
    OR pg_catalog.octet_length(p_reason) NOT BETWEEN 1 AND 512
  THEN
    RETURN false;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock_shared(
    pg_catalog.hashtextextended(
      'source_wire_story4_authentication_epoch',
      1913770104
    )
  );

  SELECT credential.actor_identity_id
    INTO actor_id
    FROM source_wire_memory.credentials AS credential
    JOIN source_wire_memory.installation_state AS installation
      ON installation.singleton = true
     AND installation.current_authentication_epoch_id =
         credential.authentication_epoch_id
   WHERE credential.credential_id = p_actor_credential_id
     AND credential.owner_id = p_owner_id
     AND credential.credential_class = 'owner_admin'
     AND credential.status = 'active'
     AND credential.expires_at > pg_catalog.clock_timestamp()
   FOR UPDATE OF credential;
  IF actor_id IS NULL THEN
    RETURN false;
  END IF;

  PERFORM 1
    FROM source_wire_memory.credential_namespace_grants
   WHERE credential_id = p_actor_credential_id
     AND namespace_id = p_namespace_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM 1
    FROM source_wire_memory.credential_capability_grants
   WHERE credential_id = p_actor_credential_id
     AND capability = 'trusted_memory.revoke'
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT state
    INTO memory_state
    FROM source_wire_memory.trusted_memories
   WHERE memory_id = p_memory_id
     AND owner_id = p_owner_id
     AND namespace_id = p_namespace_id
   FOR UPDATE;
  IF memory_state IS DISTINCT FROM 'active' THEN
    RETURN false;
  END IF;

  SELECT status
    INTO revision_status
    FROM source_wire_memory.trusted_memory_revisions
   WHERE revision_id = p_expected_revision_id
     AND memory_id = p_memory_id
     AND owner_id = p_owner_id
     AND namespace_id = p_namespace_id
   FOR UPDATE;
  IF revision_status IS DISTINCT FROM 'active' THEN
    RETURN false;
  END IF;

  UPDATE source_wire_memory.trusted_memory_revisions
     SET status = 'revoked'
   WHERE revision_id = p_expected_revision_id
     AND status = 'active';
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE source_wire_memory.trusted_memories
     SET state = 'revoked'
   WHERE memory_id = p_memory_id
     AND state = 'active';
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO source_wire_memory.trusted_memory_lifecycle_events (
    lifecycle_event_id,
    owner_id,
    namespace_id,
    memory_id,
    event_type,
    expected_revision_id,
    resulting_revision_id,
    reason,
    actor_identity_id,
    actor_credential_id,
    occurred_at
  ) VALUES (
    p_lifecycle_event_id,
    p_owner_id,
    p_namespace_id,
    p_memory_id,
    'revocation',
    p_expected_revision_id,
    p_expected_revision_id,
    p_reason,
    actor_id,
    p_actor_credential_id,
    p_occurred_at
  );

  RETURN true;
END;
$$;

DROP FUNCTION source_wire_memory.issue_protected_read_receipt(
  uuid, smallint, uuid, uuid, varchar, uuid, varchar, varchar, varchar, varchar,
  varchar, varchar, varchar, smallint, timestamptz, timestamptz, varchar, uuid
);
DROP FUNCTION source_wire_memory.consume_protected_read_receipt(
  uuid, smallint, uuid, uuid, varchar, uuid, varchar, varchar, varchar, varchar,
  varchar, varchar, varchar, smallint, timestamptz, timestamptz, varchar
);
DROP TRIGGER protected_read_receipts_append_only
  ON source_wire_memory.protected_read_receipts;
DROP FUNCTION source_wire_memory.reject_protected_read_receipt_history_mutation();

ALTER TABLE source_wire_memory.protected_read_receipts
  ADD COLUMN authentication_epoch_id uuid,
  ADD COLUMN target_order_digest varchar(64) NOT NULL DEFAULT repeat('0', 64)
    CHECK (target_order_digest ~ '^[0-9a-f]{64}$'),
  ADD COLUMN response_byte_count integer NOT NULL DEFAULT 0
    CHECK (response_byte_count BETWEEN 0 AND 98304);

UPDATE source_wire_memory.protected_read_receipts AS receipt
SET authentication_epoch_id = credential.authentication_epoch_id
FROM source_wire_memory.credentials AS credential
WHERE receipt.actor_credential_id = credential.credential_id;

ALTER TABLE source_wire_memory.protected_read_receipts
  ALTER COLUMN authentication_epoch_id SET NOT NULL,
  ALTER COLUMN target_order_digest DROP DEFAULT,
  ALTER COLUMN response_byte_count DROP DEFAULT,
  ADD CONSTRAINT protected_read_receipts_authentication_epoch_fkey
    FOREIGN KEY (authentication_epoch_id)
    REFERENCES source_wire_memory.authentication_epochs(
      authentication_epoch_id
    );

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname
      FROM pg_catalog.pg_constraint
     WHERE conrelid =
           'source_wire_memory.protected_read_receipts'::pg_catalog.regclass
       AND contype = 'c'
       AND (
         pg_catalog.pg_get_constraintdef(oid) LIKE '%consumption_state%'
         OR pg_catalog.pg_get_constraintdef(oid) LIKE '%release_status%'
       )
  LOOP
    EXECUTE pg_catalog.format(
      'ALTER TABLE source_wire_memory.protected_read_receipts DROP CONSTRAINT %I',
      constraint_name
    );
  END LOOP;
END;
$$;

ALTER TABLE source_wire_memory.protected_read_receipts
  ADD CONSTRAINT protected_read_receipts_consumption_state_check CHECK (
    consumption_state IN ('issued', 'consumed', 'invalidated')
  ),
  ADD CONSTRAINT protected_read_receipts_release_status_check CHECK (
    release_status IN (
      'release_authorized',
      'release_attempted',
      'recovery_invalidated'
    )
  ),
  ADD CONSTRAINT protected_read_receipts_state_shape_check CHECK (
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
    OR
    (
      consumption_state = 'invalidated'
      AND release_status = 'recovery_invalidated'
      AND consumed_at IS NOT NULL
    )
  );

CREATE TABLE source_wire_memory.protected_read_receipt_targets (
  receipt_id uuid NOT NULL
    REFERENCES source_wire_memory.protected_read_receipts(receipt_id),
  target_ordinal smallint NOT NULL CHECK (target_ordinal BETWEEN 1 AND 10),
  memory_id uuid NOT NULL,
  revision_id uuid NOT NULL,
  target_order_digest varchar(64) NOT NULL CHECK (
    target_order_digest ~ '^[0-9a-f]{64}$'
  ),
  PRIMARY KEY (receipt_id, target_ordinal),
  UNIQUE (receipt_id, memory_id, revision_id),
  FOREIGN KEY (revision_id)
    REFERENCES source_wire_memory.trusted_memory_revisions(revision_id)
);

CREATE FUNCTION source_wire_memory.reject_protected_read_receipt_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'protected read receipt history is append-only'
      USING ERRCODE = '42501';
  END IF;
  IF
    OLD.receipt_id IS DISTINCT FROM NEW.receipt_id
    OR OLD.format_version IS DISTINCT FROM NEW.format_version
    OR OLD.trace_id IS DISTINCT FROM NEW.trace_id
    OR OLD.request_id IS DISTINCT FROM NEW.request_id
    OR OLD.actor_reference IS DISTINCT FROM NEW.actor_reference
    OR OLD.actor_credential_id IS DISTINCT FROM NEW.actor_credential_id
    OR OLD.authentication_epoch_id IS DISTINCT FROM NEW.authentication_epoch_id
    OR OLD.owner_id IS DISTINCT FROM NEW.owner_id
    OR OLD.namespace_id IS DISTINCT FROM NEW.namespace_id
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
    OR OLD.origin_process_verifier IS DISTINCT FROM NEW.origin_process_verifier
    OR OLD.audit_event_id IS DISTINCT FROM NEW.audit_event_id
    OR OLD.consumption_state <> 'issued'
    OR OLD.release_status <> 'release_authorized'
    OR OLD.consumed_at IS NOT NULL
    OR NEW.consumed_at IS NULL
    OR NOT (
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
    RAISE EXCEPTION 'protected read receipt mutation is not allowed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protected_read_receipts_append_only
BEFORE UPDATE OR DELETE ON source_wire_memory.protected_read_receipts
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_protected_read_receipt_history_mutation();

CREATE TRIGGER protected_read_receipt_targets_immutable
BEFORE UPDATE OR DELETE ON source_wire_memory.protected_read_receipt_targets
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_memory_history_mutation();

CREATE FUNCTION source_wire_memory.issue_protected_read_receipt(
  p_receipt_id uuid,
  p_format_version smallint,
  p_trace_id uuid,
  p_request_id uuid,
  p_actor_reference varchar,
  p_actor_credential_id uuid,
  p_owner_id varchar,
  p_namespace_id varchar,
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
  active_target_count integer;
  current_authentication_epoch_id uuid;
BEGIN
  IF
    p_format_version <> 1
    OR p_operation <> 'search_trusted_memory'
    OR p_policy_decision <> 'allowed'
    OR p_actor_reference <> 'credential:' || p_actor_credential_id::text
    OR p_response_byte_count NOT BETWEEN 1 AND 98304
    OR pg_catalog.cardinality(p_target_memory_ids) <> p_covered_result_count
    OR pg_catalog.cardinality(p_target_revision_ids) <> p_covered_result_count
    OR p_issued_at < pg_catalog.clock_timestamp() - interval '2 seconds'
    OR p_issued_at > pg_catalog.clock_timestamp() + interval '2 seconds'
    OR p_expires_at <= p_issued_at
    OR p_expires_at > p_issued_at + interval '5 seconds'
    OR p_expires_at > pg_catalog.clock_timestamp() + interval '5 seconds'
  THEN
    RAISE EXCEPTION 'protected read receipt validation failed'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock_shared(
    pg_catalog.hashtextextended(
      'source_wire_story4_authentication_epoch',
      1913770104
    )
  );

  SELECT credential.authentication_epoch_id
    INTO current_authentication_epoch_id
    FROM source_wire_memory.credentials AS credential
    JOIN source_wire_memory.installation_state AS installation
      ON installation.singleton = true
     AND installation.current_authentication_epoch_id =
         credential.authentication_epoch_id
   WHERE credential.credential_id = p_actor_credential_id
     AND credential.owner_id = p_owner_id
     AND credential.credential_class = 'harness'
     AND credential.status = 'active'
     AND credential.expires_at > pg_catalog.clock_timestamp()
   FOR UPDATE OF credential;
  IF current_authentication_epoch_id IS NULL THEN
    RAISE EXCEPTION 'protected read authority denied' USING ERRCODE = '42501';
  END IF;

  PERFORM 1
    FROM source_wire_memory.credential_namespace_grants
   WHERE credential_id = p_actor_credential_id
     AND namespace_id = p_namespace_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'protected read authority denied' USING ERRCODE = '42501';
  END IF;

  PERFORM 1
    FROM source_wire_memory.credential_capability_grants
   WHERE credential_id = p_actor_credential_id
     AND capability = 'trusted_memory.search'
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'protected read authority denied' USING ERRCODE = '42501';
  END IF;

  PERFORM memory.memory_id
    FROM source_wire_memory.trusted_memories AS memory
   WHERE memory.memory_id = ANY(p_target_memory_ids)
   ORDER BY memory.memory_id
   FOR UPDATE;

  PERFORM revision.revision_id
    FROM source_wire_memory.trusted_memory_revisions AS revision
   WHERE revision.revision_id = ANY(p_target_revision_ids)
   ORDER BY revision.revision_id
   FOR UPDATE;

  SELECT pg_catalog.count(*)::integer
    INTO active_target_count
    FROM pg_catalog.unnest(p_target_memory_ids)
      WITH ORDINALITY AS memory_target(memory_id, target_ordinal)
    JOIN pg_catalog.unnest(p_target_revision_ids)
      WITH ORDINALITY AS revision_target(revision_id, target_ordinal)
      USING (target_ordinal)
    JOIN source_wire_memory.trusted_memories AS memory
      ON memory.memory_id = memory_target.memory_id
     AND memory.owner_id = p_owner_id
     AND memory.namespace_id = p_namespace_id
     AND memory.state = 'active'
    JOIN source_wire_memory.trusted_memory_revisions AS revision
      ON revision.memory_id = memory_target.memory_id
     AND revision.revision_id = revision_target.revision_id
     AND revision.owner_id = p_owner_id
     AND revision.namespace_id = p_namespace_id
     AND revision.status = 'active';
  IF active_target_count <> p_covered_result_count THEN
    RAISE EXCEPTION 'protected read target validation failed'
      USING ERRCODE = '40001';
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
  )
  SELECT
    p_audit_event_id,
    p_trace_id,
    p_operation,
    'allowed',
    p_actor_credential_id,
    credential.actor_identity_id,
    p_actor_reference,
    p_owner_id,
    p_namespace_id,
    pg_catalog.jsonb_build_object(
      'receiptId', p_receipt_id::text,
      'requestId', p_request_id::text,
      'requestDigest', p_request_digest,
      'resultDigest', p_result_digest,
      'targetOrderDigest', p_target_order_digest,
      'responseByteCount', p_response_byte_count,
      'coveredResultCount', p_covered_result_count,
      'releaseStatus', 'release_authorized'
    )
  FROM source_wire_memory.credentials AS credential
  WHERE credential.credential_id = p_actor_credential_id;

  INSERT INTO source_wire_memory.protected_read_receipts (
    receipt_id,
    format_version,
    trace_id,
    request_id,
    actor_reference,
    actor_credential_id,
    authentication_epoch_id,
    owner_id,
    namespace_id,
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
    origin_process_verifier,
    audit_event_id
  ) VALUES (
    p_receipt_id,
    p_format_version,
    p_trace_id,
    p_request_id,
    p_actor_reference,
    p_actor_credential_id,
    current_authentication_epoch_id,
    p_owner_id,
    p_namespace_id,
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
    p_origin_process_verifier,
    p_audit_event_id
  );

  INSERT INTO source_wire_memory.protected_read_receipt_targets (
    receipt_id,
    target_ordinal,
    memory_id,
    revision_id,
    target_order_digest
  )
  SELECT
    p_receipt_id,
    memory_target.target_ordinal::smallint,
    memory_target.memory_id,
    revision_target.revision_id,
    p_target_order_digest
  FROM pg_catalog.unnest(p_target_memory_ids)
    WITH ORDINALITY AS memory_target(memory_id, target_ordinal)
  JOIN pg_catalog.unnest(p_target_revision_ids)
    WITH ORDINALITY AS revision_target(revision_id, target_ordinal)
    USING (target_ordinal)
  ORDER BY memory_target.target_ordinal;

  RETURN p_audit_event_id;
END;
$$;

CREATE FUNCTION source_wire_memory.consume_protected_read_receipt(
  p_receipt_id uuid,
  p_format_version smallint,
  p_trace_id uuid,
  p_request_id uuid,
  p_actor_reference varchar,
  p_actor_credential_id uuid,
  p_owner_id varchar,
  p_namespace_id varchar,
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
  consumed boolean := false;
  target_memory_ids uuid[];
  target_revision_ids uuid[];
  active_target_count integer;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock_shared(
    pg_catalog.hashtextextended(
      'source_wire_story4_authentication_epoch',
      1913770104
    )
  );

  SELECT
    coalesce(
      pg_catalog.array_agg(target.memory_id ORDER BY target.target_ordinal),
      ARRAY[]::uuid[]
    ),
    coalesce(
      pg_catalog.array_agg(target.revision_id ORDER BY target.target_ordinal),
      ARRAY[]::uuid[]
    )
    INTO target_memory_ids, target_revision_ids
    FROM source_wire_memory.protected_read_receipt_targets AS target
   WHERE target.receipt_id = p_receipt_id
     AND target.target_order_digest = p_target_order_digest;

  IF
    pg_catalog.cardinality(target_memory_ids) <> p_covered_result_count
    OR pg_catalog.cardinality(target_revision_ids) <> p_covered_result_count
  THEN
    RETURN false;
  END IF;

  PERFORM 1
    FROM source_wire_memory.credentials AS credential
    JOIN source_wire_memory.installation_state AS installation
      ON installation.singleton = true
     AND installation.current_authentication_epoch_id =
         credential.authentication_epoch_id
   WHERE credential.credential_id = p_actor_credential_id
     AND credential.owner_id = p_owner_id
     AND credential.credential_class = 'harness'
     AND credential.status = 'active'
     AND credential.expires_at > pg_catalog.clock_timestamp()
   FOR UPDATE OF credential;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM 1
    FROM source_wire_memory.credential_namespace_grants
   WHERE credential_id = p_actor_credential_id
     AND namespace_id = p_namespace_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM 1
    FROM source_wire_memory.credential_capability_grants
   WHERE credential_id = p_actor_credential_id
     AND capability = 'trusted_memory.search'
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM memory.memory_id
    FROM source_wire_memory.trusted_memories AS memory
   WHERE memory.memory_id = ANY(target_memory_ids)
   ORDER BY memory.memory_id
   FOR UPDATE;

  PERFORM revision.revision_id
    FROM source_wire_memory.trusted_memory_revisions AS revision
   WHERE revision.revision_id = ANY(target_revision_ids)
   ORDER BY revision.revision_id
   FOR UPDATE;

  SELECT pg_catalog.count(*)::integer
    INTO active_target_count
    FROM pg_catalog.unnest(target_memory_ids)
      WITH ORDINALITY AS memory_target(memory_id, target_ordinal)
    JOIN pg_catalog.unnest(target_revision_ids)
      WITH ORDINALITY AS revision_target(revision_id, target_ordinal)
      USING (target_ordinal)
    JOIN source_wire_memory.trusted_memories AS memory
      ON memory.memory_id = memory_target.memory_id
     AND memory.owner_id = p_owner_id
     AND memory.namespace_id = p_namespace_id
     AND memory.state = 'active'
    JOIN source_wire_memory.trusted_memory_revisions AS revision
      ON revision.memory_id = memory_target.memory_id
     AND revision.revision_id = revision_target.revision_id
     AND revision.owner_id = p_owner_id
     AND revision.namespace_id = p_namespace_id
     AND revision.status = 'active';
  IF active_target_count <> p_covered_result_count THEN
    RETURN false;
  END IF;

  UPDATE source_wire_memory.protected_read_receipts
     SET consumption_state = 'consumed',
         release_status = 'release_attempted',
         consumed_at = pg_catalog.clock_timestamp()
   WHERE receipt_id = p_receipt_id
     AND format_version = p_format_version
     AND trace_id = p_trace_id
     AND request_id = p_request_id
     AND actor_reference = p_actor_reference
     AND actor_credential_id = p_actor_credential_id
     AND authentication_epoch_id = (
       SELECT current_authentication_epoch_id
       FROM source_wire_memory.installation_state
       WHERE singleton = true
     )
     AND owner_id = p_owner_id
     AND namespace_id = p_namespace_id
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
     AND origin_process_verifier = p_origin_process_verifier
     AND consumption_state = 'issued'
     AND release_status = 'release_authorized'
     AND consumed_at IS NULL
     AND expires_at > pg_catalog.clock_timestamp()
  RETURNING true INTO consumed;

  RETURN coalesce(consumed, false);
END;
$$;

REVOKE ALL ON TABLE source_wire_memory.authentication_epochs FROM PUBLIC;
REVOKE ALL ON TABLE source_wire_memory.installation_state FROM PUBLIC;
REVOKE ALL ON TABLE source_wire_memory.actor_identities FROM PUBLIC;
REVOKE ALL ON TABLE source_wire_memory.trusted_memory_lifecycle_events FROM PUBLIC;
REVOKE ALL ON TABLE source_wire_memory.restore_receipts FROM PUBLIC;
REVOKE ALL ON TABLE source_wire_memory.operator_initialization_records FROM PUBLIC;
REVOKE ALL ON TABLE source_wire_memory.protected_read_receipt_targets FROM PUBLIC;
REVOKE ALL ON TABLE source_wire_memory.protected_read_receipt_targets
  FROM source_wire_runtime;

REVOKE ALL ON FUNCTION source_wire_memory.apply_trusted_memory_correction(
  uuid, varchar, varchar, uuid, uuid, uuid, text, integer, text, uuid, timestamptz
) FROM PUBLIC;
REVOKE ALL ON FUNCTION source_wire_memory.apply_trusted_memory_revocation(
  uuid, varchar, varchar, uuid, uuid, text, uuid, timestamptz
) FROM PUBLIC;
REVOKE ALL ON FUNCTION source_wire_memory.issue_protected_read_receipt(
  uuid, smallint, uuid, uuid, varchar, uuid, varchar, varchar, varchar, varchar,
  varchar, varchar, varchar, varchar, integer, smallint, timestamptz, timestamptz,
  varchar, uuid, uuid[], uuid[]
) FROM PUBLIC;
REVOKE ALL ON FUNCTION source_wire_memory.consume_protected_read_receipt(
  uuid, smallint, uuid, uuid, varchar, uuid, varchar, varchar, varchar, varchar,
  varchar, varchar, varchar, varchar, integer, smallint, timestamptz, timestamptz,
  varchar
) FROM PUBLIC;

GRANT SELECT ON source_wire_memory.installation_state TO source_wire_runtime;
GRANT SELECT, INSERT ON source_wire_memory.actor_identities TO source_wire_runtime;
GRANT UPDATE (decided_by_actor_id)
  ON source_wire_memory.memory_candidates TO source_wire_runtime;
GRANT SELECT (
  event_id,
  occurred_at,
  trace_id,
  operation,
  result,
  actor_identity_id,
  owner_id,
  namespace_id,
  denial_code,
  metadata
) ON source_wire_memory.audit_events TO source_wire_runtime;
GRANT SELECT ON source_wire_memory.trusted_memory_lifecycle_events
  TO source_wire_runtime;
GRANT EXECUTE ON FUNCTION source_wire_memory.apply_trusted_memory_correction(
  uuid, varchar, varchar, uuid, uuid, uuid, text, integer, text, uuid, timestamptz
) TO source_wire_runtime;
GRANT EXECUTE ON FUNCTION source_wire_memory.apply_trusted_memory_revocation(
  uuid, varchar, varchar, uuid, uuid, text, uuid, timestamptz
) TO source_wire_runtime;
GRANT EXECUTE ON FUNCTION source_wire_memory.issue_protected_read_receipt(
  uuid, smallint, uuid, uuid, varchar, uuid, varchar, varchar, varchar, varchar,
  varchar, varchar, varchar, varchar, integer, smallint, timestamptz, timestamptz,
  varchar, uuid, uuid[], uuid[]
) TO source_wire_runtime;
GRANT EXECUTE ON FUNCTION source_wire_memory.consume_protected_read_receipt(
  uuid, smallint, uuid, uuid, varchar, uuid, varchar, varchar, varchar, varchar,
  varchar, varchar, varchar, varchar, integer, smallint, timestamptz, timestamptz,
  varchar
) TO source_wire_runtime;
