CREATE TABLE source_wire_memory.memory_candidates (
  candidate_id uuid PRIMARY KEY,
  owner_id varchar(64) NOT NULL,
  namespace_id varchar(64) NOT NULL,
  proposed_by_credential_id uuid NOT NULL REFERENCES source_wire_memory.credentials(credential_id),
  state varchar(16) NOT NULL CHECK (state IN ('pending', 'approved', 'rejected')),
  content text NOT NULL,
  content_byte_count integer NOT NULL CHECK (
    content_byte_count BETWEEN 1 AND 8192
    AND content_byte_count = octet_length(content)
  ),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  decided_at timestamptz,
  decided_by_credential_id uuid REFERENCES source_wire_memory.credentials(credential_id),
  UNIQUE (owner_id, namespace_id, candidate_id),
  FOREIGN KEY (owner_id, namespace_id)
    REFERENCES source_wire_memory.namespaces(owner_id, namespace_id),
  CHECK (
    (state = 'pending' AND decided_at IS NULL AND decided_by_credential_id IS NULL)
    OR
    (state IN ('approved', 'rejected') AND decided_at IS NOT NULL AND decided_by_credential_id IS NOT NULL)
  )
);

CREATE TABLE source_wire_memory.trusted_memories (
  memory_id uuid PRIMARY KEY,
  owner_id varchar(64) NOT NULL,
  namespace_id varchar(64) NOT NULL,
  origin_candidate_id uuid NOT NULL UNIQUE,
  state varchar(16) NOT NULL CHECK (state IN ('active', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (owner_id, namespace_id, memory_id),
  FOREIGN KEY (owner_id, namespace_id, origin_candidate_id)
    REFERENCES source_wire_memory.memory_candidates(owner_id, namespace_id, candidate_id)
);

CREATE TABLE source_wire_memory.trusted_memory_revisions (
  revision_id uuid PRIMARY KEY,
  memory_id uuid NOT NULL,
  owner_id varchar(64) NOT NULL,
  namespace_id varchar(64) NOT NULL,
  revision_number integer NOT NULL CHECK (revision_number > 0),
  status varchar(16) NOT NULL CHECK (status IN ('active', 'superseded', 'revoked')),
  content text NOT NULL,
  content_byte_count integer NOT NULL CHECK (
    content_byte_count BETWEEN 1 AND 8192
    AND content_byte_count = octet_length(content)
  ),
  origin_candidate_id uuid NOT NULL UNIQUE,
  created_by_credential_id uuid NOT NULL REFERENCES source_wire_memory.credentials(credential_id),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (memory_id, revision_number),
  UNIQUE (owner_id, namespace_id, memory_id, revision_id),
  FOREIGN KEY (owner_id, namespace_id, memory_id)
    REFERENCES source_wire_memory.trusted_memories(owner_id, namespace_id, memory_id),
  FOREIGN KEY (owner_id, namespace_id, origin_candidate_id)
    REFERENCES source_wire_memory.memory_candidates(owner_id, namespace_id, candidate_id)
);

CREATE UNIQUE INDEX trusted_memory_revisions_one_active
  ON source_wire_memory.trusted_memory_revisions(memory_id)
  WHERE status = 'active';

CREATE TABLE source_wire_memory.candidate_provenance (
  candidate_id uuid PRIMARY KEY,
  owner_id varchar(64) NOT NULL,
  namespace_id varchar(64) NOT NULL,
  provenance_kind varchar(32) NOT NULL CHECK (
    provenance_kind IN ('owner_assertion', 'prior_memory')
  ),
  owner_assertion text,
  prior_memory_id uuid,
  prior_revision_id uuid,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (owner_id, namespace_id, candidate_id)
    REFERENCES source_wire_memory.memory_candidates(owner_id, namespace_id, candidate_id),
  FOREIGN KEY (owner_id, namespace_id, prior_memory_id, prior_revision_id)
    REFERENCES source_wire_memory.trusted_memory_revisions(
      owner_id,
      namespace_id,
      memory_id,
      revision_id
    ),
  CHECK (
    (
      provenance_kind = 'owner_assertion'
      AND owner_assertion IS NOT NULL
      AND octet_length(owner_assertion) BETWEEN 1 AND 1024
      AND prior_memory_id IS NULL
      AND prior_revision_id IS NULL
    )
    OR
    (
      provenance_kind = 'prior_memory'
      AND owner_assertion IS NULL
      AND prior_memory_id IS NOT NULL
      AND prior_revision_id IS NOT NULL
    )
  )
);

CREATE TABLE source_wire_memory.candidate_decisions (
  candidate_id uuid PRIMARY KEY,
  owner_id varchar(64) NOT NULL,
  namespace_id varchar(64) NOT NULL,
  decision varchar(16) NOT NULL CHECK (decision IN ('approve', 'reject')),
  expected_state varchar(16) NOT NULL CHECK (expected_state = 'pending'),
  reason text NOT NULL CHECK (octet_length(reason) BETWEEN 1 AND 512),
  decided_by_credential_id uuid NOT NULL REFERENCES source_wire_memory.credentials(credential_id),
  trusted_memory_id uuid,
  trusted_revision_id uuid,
  decided_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (owner_id, namespace_id, candidate_id)
    REFERENCES source_wire_memory.memory_candidates(owner_id, namespace_id, candidate_id),
  FOREIGN KEY (owner_id, namespace_id, trusted_memory_id, trusted_revision_id)
    REFERENCES source_wire_memory.trusted_memory_revisions(
      owner_id,
      namespace_id,
      memory_id,
      revision_id
    ),
  CHECK (
    (decision = 'approve' AND trusted_memory_id IS NOT NULL AND trusted_revision_id IS NOT NULL)
    OR
    (decision = 'reject' AND trusted_memory_id IS NULL AND trusted_revision_id IS NULL)
  )
);

CREATE TABLE source_wire_memory.trusted_memory_provenance (
  revision_id uuid PRIMARY KEY,
  memory_id uuid NOT NULL,
  owner_id varchar(64) NOT NULL,
  namespace_id varchar(64) NOT NULL,
  origin_candidate_id uuid NOT NULL,
  provenance_kind varchar(32) NOT NULL CHECK (
    provenance_kind IN ('owner_assertion', 'prior_memory')
  ),
  owner_assertion text,
  prior_memory_id uuid,
  prior_revision_id uuid,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (owner_id, namespace_id, memory_id, revision_id)
    REFERENCES source_wire_memory.trusted_memory_revisions(
      owner_id,
      namespace_id,
      memory_id,
      revision_id
    ),
  FOREIGN KEY (owner_id, namespace_id, origin_candidate_id)
    REFERENCES source_wire_memory.memory_candidates(owner_id, namespace_id, candidate_id),
  FOREIGN KEY (owner_id, namespace_id, prior_memory_id, prior_revision_id)
    REFERENCES source_wire_memory.trusted_memory_revisions(
      owner_id,
      namespace_id,
      memory_id,
      revision_id
    ),
  CHECK (
    (
      provenance_kind = 'owner_assertion'
      AND owner_assertion IS NOT NULL
      AND octet_length(owner_assertion) BETWEEN 1 AND 1024
      AND prior_memory_id IS NULL
      AND prior_revision_id IS NULL
    )
    OR
    (
      provenance_kind = 'prior_memory'
      AND owner_assertion IS NULL
      AND prior_memory_id IS NOT NULL
      AND prior_revision_id IS NOT NULL
    )
  )
);

CREATE INDEX memory_candidates_review_order
  ON source_wire_memory.memory_candidates(owner_id, namespace_id, state, created_at, candidate_id);

CREATE FUNCTION source_wire_memory.reject_memory_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'memory history is immutable' USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER candidate_provenance_immutable
BEFORE UPDATE OR DELETE ON source_wire_memory.candidate_provenance
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_memory_history_mutation();

CREATE TRIGGER candidate_decisions_immutable
BEFORE UPDATE OR DELETE ON source_wire_memory.candidate_decisions
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_memory_history_mutation();

CREATE TRIGGER trusted_memory_revisions_immutable
BEFORE UPDATE OR DELETE ON source_wire_memory.trusted_memory_revisions
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_memory_history_mutation();

CREATE TRIGGER trusted_memory_provenance_immutable
BEFORE UPDATE OR DELETE ON source_wire_memory.trusted_memory_provenance
FOR EACH ROW EXECUTE FUNCTION source_wire_memory.reject_memory_history_mutation();

GRANT SELECT, INSERT ON source_wire_memory.memory_candidates TO source_wire_runtime;
GRANT UPDATE (state, updated_at, decided_at, decided_by_credential_id)
  ON source_wire_memory.memory_candidates TO source_wire_runtime;
GRANT SELECT, INSERT ON source_wire_memory.candidate_provenance TO source_wire_runtime;
GRANT SELECT, INSERT ON source_wire_memory.candidate_decisions TO source_wire_runtime;
GRANT SELECT, INSERT ON source_wire_memory.trusted_memories TO source_wire_runtime;
GRANT SELECT, INSERT ON source_wire_memory.trusted_memory_revisions TO source_wire_runtime;
GRANT SELECT, INSERT ON source_wire_memory.trusted_memory_provenance TO source_wire_runtime;
