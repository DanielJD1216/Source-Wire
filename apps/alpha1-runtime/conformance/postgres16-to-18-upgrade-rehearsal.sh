#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
REPO=$(cd -- "$SCRIPT_DIR/../../.." && pwd)
TMP_BASE=$(realpath -m "${TMPDIR:-/tmp}")
ROOT=${SOURCE_WIRE_UPGRADE_REHEARSAL_ROOT:-$TMP_BASE/source-wire-upgrade-rehearsal-${BASHPID}}
ROOT=$(realpath -m "$ROOT")
[[ "$ROOT" == "$TMP_BASE"/source-wire-upgrade-rehearsal-* ]] || {
  echo "rehearsal root must be a dedicated source-wire-upgrade-rehearsal-* directory under $TMP_BASE" >&2
  exit 1
}
ROOT_MARKER="$ROOT/.source-wire-upgrade-rehearsal-root"
OLD_BIN=${SOURCE_WIRE_POSTGRES16_BIN_DIR:?set SOURCE_WIRE_POSTGRES16_BIN_DIR to the PostgreSQL 16 bin directory}
NEW_BIN=${SOURCE_WIRE_POSTGRES18_BIN_DIR:?set SOURCE_WIRE_POSTGRES18_BIN_DIR to the exact PostgreSQL 18.4 bin directory}
NODE_BIN=${SOURCE_WIRE_NODE_BIN_DIR:-$(dirname -- "$(command -v node)")}
OPERATOR="$REPO/apps/alpha1-runtime/dist/src/cli/operator.js"

[[ $("$OLD_BIN/postgres" --version) == *" 16."* ]] || { echo "PostgreSQL 16 binaries required" >&2; exit 1; }
[[ $("$NEW_BIN/postgres" --version) == *" 18.4" ]] || { echo "exact PostgreSQL 18.4 binaries required" >&2; exit 1; }
[[ $("$NODE_BIN/node" --version) == "v22.23.1" ]] || { echo "Node.js 22.23.1 required" >&2; exit 1; }
(cd "$REPO" && PATH="$NODE_BIN:/usr/bin:/bin" "$NODE_BIN/npm" run alpha1:build >/dev/null)
[[ -f "$OPERATOR" ]] || { echo "rehearsal build did not produce the operator" >&2; exit 1; }
SOURCE_COMMIT=$(git -C "$REPO" rev-parse HEAD)
SOURCE_DIRTY=$(git -C "$REPO" status --porcelain=v1 | "$NODE_BIN/node" -e 'let value=""; process.stdin.setEncoding("utf8"); process.stdin.on("data", chunk => value += chunk); process.stdin.on("end", () => process.stdout.write(value.length > 0 ? "true" : "false"));')
SOURCE_TREE_DIGEST_SHA256=$(SOURCE_WIRE_REPO_ROOT="$REPO" python3 - <<'PY'
import hashlib, os, subprocess
from pathlib import Path
repo = Path(os.environ['SOURCE_WIRE_REPO_ROOT'])
commit = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=repo, check=True, stdout=subprocess.PIPE).stdout.strip()
tracked_diff = subprocess.run(['git', 'diff', '--binary', 'HEAD', '--'], cwd=repo, check=True, stdout=subprocess.PIPE).stdout
untracked = subprocess.run(['git', 'ls-files', '--others', '--exclude-standard', '-z'], cwd=repo, check=True, stdout=subprocess.PIPE).stdout.split(b'\0')
digest = hashlib.sha256()
digest.update(commit)
digest.update(b'\0')
digest.update(tracked_diff)
for path_bytes in sorted(path for path in untracked if path):
    digest.update(b'\0')
    digest.update(path_bytes)
    digest.update(b'\0')
    path = repo / os.fsdecode(path_bytes)
    digest.update(str(path.stat().st_mode & 0o111).encode())
    digest.update(b'\0')
    digest.update(path.read_bytes())
print(digest.hexdigest())
PY
)

OLD_DATA="$ROOT/pg16-data"
OLD_SNAPSHOT="$ROOT/pg16-snapshot"
NEW_DATA="$ROOT/pg18-data"
ROLLBACK_DATA="$ROOT/pg16-rollback"
SOCKET="$ROOT/socket"
UPGRADE_WORK="$ROOT/upgrade-work"
OLD_PORT=${SOURCE_WIRE_UPGRADE_OLD_PORT:-55446}
NEW_PORT=${SOURCE_WIRE_UPGRADE_NEW_PORT:-55448}
ROLLBACK_PORT=${SOURCE_WIRE_UPGRADE_ROLLBACK_PORT:-55447}
OS_USER=$(id -un)
VERIFIER_KEY=$($NODE_BIN/node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("base64url"))')
DATABASE=source_wire_upgrade
MIGRATOR_URL="postgresql://source_wire_migrator@127.0.0.1:${OLD_PORT}/${DATABASE}"

stop_cluster() {
  local bin=$1 data=$2
  if [[ -f "$data/postmaster.pid" ]]; then
    "$bin/pg_ctl" -D "$data" stop -m fast >/dev/null 2>&1 || true
  fi
}

normalize_dump() {
  python3 - "$1" "$2" <<'PY'
from pathlib import Path
import sys
source = Path(sys.argv[1]).read_text().splitlines()
normalized = []
for line in source:
    if (
        line.startswith("\\restrict ")
        or line.startswith("\\unrestrict ")
        or line.startswith("-- Dumped from database version ")
    ):
        continue
    if " CONSTRAINT " in line and " CHECK " in line:
        prefix = line.split(" CHECK ", 1)[0]
        suffix = "," if line.rstrip().endswith(",") else ""
        line = f"{prefix} CHECK <deparser-normalized>{suffix}"
    normalized.append(line)
Path(sys.argv[2]).write_text("\n".join(normalized) + "\n")
PY
}

canonicalize_check_constraints() {
  local port=$1 database=$2 output=$3
  "$NEW_BIN/psql" -X -qAt -v ON_ERROR_STOP=1 \
    -h 127.0.0.1 -p "$port" -U postgres -d "$database" >"$output" <<'SQL'
BEGIN;
CREATE SCHEMA source_wire_rehearsal_check_canonical;
DO $body$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT
      namespace.nspname AS schema_name,
      relation.relname AS table_name,
      constraint_row.conname AS constraint_name,
      pg_get_expr(constraint_row.conbin, constraint_row.conrelid) AS expression_sql
    FROM pg_constraint AS constraint_row
    JOIN pg_class AS relation ON relation.oid = constraint_row.conrelid
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE constraint_row.contype = 'c'
      AND namespace.nspname = 'source_wire_memory'
    ORDER BY namespace.nspname, relation.relname, constraint_row.conname
  LOOP
    EXECUTE format(
      'CREATE VIEW source_wire_rehearsal_check_canonical.%I AS SELECT (%s) AS constraint_holds FROM %I.%I',
      'c_' || md5(item.schema_name || '|' || item.table_name || '|' || item.constraint_name),
      item.expression_sql,
      item.schema_name,
      item.table_name
    );
  END LOOP;
END
$body$;
SELECT concat_ws(
  E'\t',
  namespace.nspname,
  relation.relname,
  constraint_row.conname,
  encode(
    convert_to(
      pg_get_viewdef(
        format(
          'source_wire_rehearsal_check_canonical.%I',
          'c_' || md5(namespace.nspname || '|' || relation.relname || '|' || constraint_row.conname)
        )::regclass,
        true
      ),
      'UTF8'
    ),
    'base64'
  )
)
FROM pg_constraint AS constraint_row
JOIN pg_class AS relation ON relation.oid = constraint_row.conrelid
JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
WHERE constraint_row.contype = 'c'
  AND namespace.nspname = 'source_wire_memory'
ORDER BY namespace.nspname, relation.relname, constraint_row.conname;
ROLLBACK;
SQL
}

trap 'stop_cluster "$NEW_BIN" "$NEW_DATA"; stop_cluster "$OLD_BIN" "$OLD_DATA"; stop_cluster "$OLD_BIN" "$ROLLBACK_DATA"' EXIT

if [[ -e "$ROOT" ]]; then
  [[ -f "$ROOT_MARKER" ]] || {
    echo "refusing to delete unmarked rehearsal root: $ROOT" >&2
    exit 1
  }
  rm -rf -- "$ROOT"
fi
mkdir -m 700 -p "$ROOT" "$SOCKET" "$UPGRADE_WORK"
printf '%s\n' "source-wire-upgrade-rehearsal-v1" >"$ROOT_MARKER"

"$OLD_BIN/initdb" -D "$OLD_DATA" --auth-local=trust --auth-host=trust --encoding=UTF8 --locale=C >"$ROOT/initdb16.log"
cat >>"$OLD_DATA/postgresql.conf" <<EOF
listen_addresses = '127.0.0.1'
port = $OLD_PORT
unix_socket_directories = '$SOCKET'
fsync = on
full_page_writes = on
EOF
"$OLD_BIN/pg_ctl" -D "$OLD_DATA" -l "$ROOT/postgres16.log" start >/dev/null
"$OLD_BIN/pg_isready" -h 127.0.0.1 -p "$OLD_PORT" -d postgres >/dev/null

"$OLD_BIN/psql" -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p "$OLD_PORT" -U "$OS_USER" -d postgres <<'SQL' >"$ROOT/provision.log"
CREATE ROLE postgres LOGIN SUPERUSER CREATEDB CREATEROLE;
CREATE ROLE source_wire_schema_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE source_wire_migrator LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE source_wire_runtime LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT source_wire_schema_owner TO source_wire_migrator;
CREATE DATABASE source_wire_upgrade;
REVOKE CONNECT ON DATABASE source_wire_upgrade FROM PUBLIC;
GRANT CONNECT ON DATABASE source_wire_upgrade TO source_wire_migrator, source_wire_runtime;
GRANT CREATE ON DATABASE source_wire_upgrade TO source_wire_schema_owner;
SQL
"$OLD_BIN/psql" -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p "$OLD_PORT" -U postgres -d "$DATABASE" -c 'REVOKE CREATE ON SCHEMA public FROM PUBLIC' >>"$ROOT/provision.log"

(
  cd "$REPO"
  PATH="$NODE_BIN:/usr/bin:/bin" \
  SOURCE_WIRE_MIGRATOR_DATABASE_URL="$MIGRATOR_URL" \
  SOURCE_WIRE_POSTGRES_COMPATIBILITY_MAJOR=16 \
  SOURCE_WIRE_TOKEN_VERIFIER_KEY="$VERIFIER_KEY" \
  SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID=upgrade_rehearsal \
  "$NODE_BIN/node" "$OPERATOR" migrate >"$ROOT/migrate16.json"
  PATH="$NODE_BIN:/usr/bin:/bin" \
  SOURCE_WIRE_MIGRATOR_DATABASE_URL="$MIGRATOR_URL" \
  SOURCE_WIRE_POSTGRES_COMPATIBILITY_MAJOR=16 \
  SOURCE_WIRE_TOKEN_VERIFIER_KEY="$VERIFIER_KEY" \
  SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID=upgrade_rehearsal \
  "$NODE_BIN/node" "$OPERATOR" initialize \
    --owner-id owner_upgrade \
    --namespace-id ns_upgrade_alpha \
    --namespace-id ns_upgrade_beta >"$ROOT/initialize16.secret.json"
)

"$NEW_BIN/pg_dump" -h 127.0.0.1 -p "$OLD_PORT" -U postgres -d "$DATABASE" --schema-only --no-owner --no-privileges >"$ROOT/before.schema.sql"
"$NEW_BIN/pg_dump" -h 127.0.0.1 -p "$OLD_PORT" -U postgres -d "$DATABASE" --data-only --column-inserts --no-owner --no-privileges >"$ROOT/before.data.sql"
sha256sum "$ROOT/before.schema.sql" "$ROOT/before.data.sql" >"$ROOT/before.sha256"
"$OLD_BIN/psql" -X -At -h 127.0.0.1 -p "$OLD_PORT" -U postgres -d "$DATABASE" -c "SELECT count(*) FROM source_wire_memory.schema_migrations WHERE state='completed'; SELECT count(*) FROM source_wire_memory.owners; SELECT count(*) FROM source_wire_memory.namespaces; SELECT count(*) FROM source_wire_memory.credentials; SELECT count(*) FROM source_wire_memory.audit_events;" >"$ROOT/before.counts"

stop_cluster "$OLD_BIN" "$OLD_DATA"
cp -a "$OLD_DATA" "$OLD_SNAPSHOT"

"$NEW_BIN/initdb" -D "$NEW_DATA" --auth-local=trust --auth-host=trust --encoding=UTF8 --locale=C --no-data-checksums >"$ROOT/initdb18.log"
cat >>"$NEW_DATA/postgresql.conf" <<EOF
listen_addresses = '127.0.0.1'
port = $NEW_PORT
unix_socket_directories = '$SOCKET'
fsync = on
full_page_writes = on
EOF
(
  cd "$UPGRADE_WORK"
  "$NEW_BIN/pg_upgrade" \
    --old-bindir="$OLD_BIN" \
    --new-bindir="$NEW_BIN" \
    --old-datadir="$OLD_DATA" \
    --new-datadir="$NEW_DATA" \
    --username="$OS_USER" \
    --check >"$ROOT/pg_upgrade_check.log"
  "$NEW_BIN/pg_upgrade" \
    --old-bindir="$OLD_BIN" \
    --new-bindir="$NEW_BIN" \
    --old-datadir="$OLD_DATA" \
    --new-datadir="$NEW_DATA" \
    --username="$OS_USER" >"$ROOT/pg_upgrade.log"
)

"$NEW_BIN/pg_ctl" -D "$NEW_DATA" -l "$ROOT/postgres18-upgraded.log" start >/dev/null
"$NEW_BIN/pg_isready" -h 127.0.0.1 -p "$NEW_PORT" -d postgres >/dev/null
"$NEW_BIN/psql" -X -At -h 127.0.0.1 -p "$NEW_PORT" -U postgres -d "$DATABASE" -c "SELECT current_setting('server_version_num'); SELECT count(*) FROM source_wire_memory.schema_migrations WHERE state='completed'; SELECT count(*) FROM source_wire_memory.owners; SELECT count(*) FROM source_wire_memory.namespaces; SELECT count(*) FROM source_wire_memory.credentials; SELECT count(*) FROM source_wire_memory.audit_events;" >"$ROOT/after.counts"
MIGRATOR_URL_18="postgresql://source_wire_migrator@127.0.0.1:${NEW_PORT}/${DATABASE}"
(
  cd "$REPO"
  PATH="$NODE_BIN:/usr/bin:/bin" \
  SOURCE_WIRE_MIGRATOR_DATABASE_URL="$MIGRATOR_URL_18" \
  SOURCE_WIRE_TOKEN_VERIFIER_KEY="$VERIFIER_KEY" \
  SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID=upgrade_rehearsal \
  "$NODE_BIN/node" "$OPERATOR" migrate >"$ROOT/migrate18-replay.json"
)
"$NEW_BIN/vacuumdb" -h 127.0.0.1 -p "$NEW_PORT" -U postgres --all --analyze-in-stages --missing-stats-only >"$ROOT/vacuumdb18-analyze-in-stages.log"
"$NEW_BIN/vacuumdb" -h 127.0.0.1 -p "$NEW_PORT" -U postgres --all --analyze-only >"$ROOT/vacuumdb18-analyze-final.log"
(
  cd "$REPO"
  PATH="$NODE_BIN:/usr/bin:/bin" \
  SOURCE_WIRE_RUNTIME_DATABASE_URL="postgresql://source_wire_runtime@127.0.0.1:${NEW_PORT}/${DATABASE}" \
  SOURCE_WIRE_TOKEN_VERIFIER_KEY="$VERIFIER_KEY" \
  SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID=upgrade_rehearsal \
  SOURCE_WIRE_UPGRADE_INITIALIZATION_ARTIFACT="$ROOT/initialize16.secret.json" \
  "$NODE_BIN/node" "$REPO/apps/alpha1-runtime/dist/conformance/postgres-upgrade-runtime-smoke.js" >"$ROOT/post-upgrade-runtime-smoke.json"
)
"$NEW_BIN/pg_dump" -h 127.0.0.1 -p "$NEW_PORT" -U postgres -d "$DATABASE" --schema-only --no-owner --no-privileges >"$ROOT/after.schema.sql"
"$NEW_BIN/pg_dump" -h 127.0.0.1 -p "$NEW_PORT" -U postgres -d "$DATABASE" --data-only --column-inserts --no-owner --no-privileges >"$ROOT/after.data.sql"
sha256sum "$ROOT/after.schema.sql" "$ROOT/after.data.sql" >"$ROOT/after.sha256"

"$NEW_BIN/psql" -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p "$NEW_PORT" -U postgres -d postgres -c 'CREATE DATABASE source_wire_fresh18' >"$ROOT/fresh18-provision.log"
"$NEW_BIN/psql" -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p "$NEW_PORT" -U postgres -d postgres -c 'REVOKE CONNECT ON DATABASE source_wire_fresh18 FROM PUBLIC' >>"$ROOT/fresh18-provision.log"
"$NEW_BIN/psql" -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p "$NEW_PORT" -U postgres -d postgres -c 'GRANT CONNECT ON DATABASE source_wire_fresh18 TO source_wire_migrator, source_wire_runtime' >>"$ROOT/fresh18-provision.log"
"$NEW_BIN/psql" -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p "$NEW_PORT" -U postgres -d postgres -c 'GRANT CREATE ON DATABASE source_wire_fresh18 TO source_wire_schema_owner' >>"$ROOT/fresh18-provision.log"
"$NEW_BIN/psql" -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p "$NEW_PORT" -U postgres -d source_wire_fresh18 -c 'REVOKE CREATE ON SCHEMA public FROM PUBLIC' >>"$ROOT/fresh18-provision.log"
FRESH_MIGRATOR_URL_18="postgresql://source_wire_migrator@127.0.0.1:${NEW_PORT}/source_wire_fresh18"
(
  cd "$REPO"
  PATH="$NODE_BIN:/usr/bin:/bin" \
  SOURCE_WIRE_MIGRATOR_DATABASE_URL="$FRESH_MIGRATOR_URL_18" \
  SOURCE_WIRE_TOKEN_VERIFIER_KEY="$VERIFIER_KEY" \
  SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID=upgrade_rehearsal \
  "$NODE_BIN/node" "$OPERATOR" migrate >"$ROOT/migrate18-fresh.json"
)
SOURCE_WIRE_UPGRADE_REHEARSAL_ROOT_RESOLVED="$ROOT" python3 - <<'PY'
import json, os
from pathlib import Path
r = Path(os.environ['SOURCE_WIRE_UPGRADE_REHEARSAL_ROOT_RESOLVED'])
assert json.loads((r/'migrate18-replay.json').read_text())['status'] == 'already_applied'
assert json.loads((r/'migrate18-fresh.json').read_text())['status'] == 'applied'
PY
"$NEW_BIN/pg_dump" -h 127.0.0.1 -p "$NEW_PORT" -U postgres -d source_wire_fresh18 --schema-only --no-owner --no-privileges >"$ROOT/fresh18.schema.sql"
canonicalize_check_constraints "$NEW_PORT" "$DATABASE" "$ROOT/after.check-constraints.canonical.tsv"
canonicalize_check_constraints "$NEW_PORT" source_wire_fresh18 "$ROOT/fresh18.check-constraints.canonical.tsv"
normalize_dump "$ROOT/after.schema.sql" "$ROOT/after.schema.normalized.sql"
normalize_dump "$ROOT/fresh18.schema.sql" "$ROOT/fresh18.schema.normalized.sql"
normalize_dump "$ROOT/before.data.sql" "$ROOT/before.data.normalized.sql"
normalize_dump "$ROOT/after.data.sql" "$ROOT/after.data.normalized.sql"
cmp -s "$ROOT/after.schema.normalized.sql" "$ROOT/fresh18.schema.normalized.sql"
cmp -s "$ROOT/after.check-constraints.canonical.tsv" "$ROOT/fresh18.check-constraints.canonical.tsv"
cmp -s "$ROOT/before.data.normalized.sql" "$ROOT/after.data.normalized.sql"
stop_cluster "$NEW_BIN" "$NEW_DATA"

cp -a "$OLD_SNAPSHOT" "$ROLLBACK_DATA"
"$OLD_BIN/pg_ctl" -D "$ROLLBACK_DATA" -l "$ROOT/postgres16-rollback.log" -o "-p $ROLLBACK_PORT -c unix_socket_directories=$SOCKET" start >/dev/null
"$OLD_BIN/pg_isready" -h 127.0.0.1 -p "$ROLLBACK_PORT" -d postgres >/dev/null
"$NEW_BIN/pg_dump" -h 127.0.0.1 -p "$ROLLBACK_PORT" -U postgres -d "$DATABASE" --schema-only --no-owner --no-privileges >"$ROOT/rollback.schema.sql"
"$NEW_BIN/pg_dump" -h 127.0.0.1 -p "$ROLLBACK_PORT" -U postgres -d "$DATABASE" --data-only --column-inserts --no-owner --no-privileges >"$ROOT/rollback.data.sql"
"$OLD_BIN/psql" -X -At -h 127.0.0.1 -p "$ROLLBACK_PORT" -U postgres -d "$DATABASE" -c "SELECT current_setting('server_version_num'); SELECT count(*) FROM source_wire_memory.schema_migrations WHERE state='completed'; SELECT count(*) FROM source_wire_memory.owners; SELECT count(*) FROM source_wire_memory.namespaces; SELECT count(*) FROM source_wire_memory.credentials; SELECT count(*) FROM source_wire_memory.audit_events;" >"$ROOT/rollback.counts"
normalize_dump "$ROOT/before.schema.sql" "$ROOT/before.schema.normalized.sql"
normalize_dump "$ROOT/rollback.schema.sql" "$ROOT/rollback.schema.normalized.sql"
normalize_dump "$ROOT/rollback.data.sql" "$ROOT/rollback.data.normalized.sql"
cmp -s "$ROOT/before.schema.normalized.sql" "$ROOT/rollback.schema.normalized.sql"
cmp -s "$ROOT/before.data.normalized.sql" "$ROOT/rollback.data.normalized.sql"

SOURCE_WIRE_UPGRADE_REHEARSAL_ROOT_RESOLVED="$ROOT" \
SOURCE_WIRE_REHEARSAL_SOURCE_COMMIT="$SOURCE_COMMIT" \
SOURCE_WIRE_REHEARSAL_SOURCE_DIRTY="$SOURCE_DIRTY" \
SOURCE_WIRE_REHEARSAL_SOURCE_TREE_DIGEST_SHA256="$SOURCE_TREE_DIGEST_SHA256" \
python3 - <<'PY'
import json
import os
from pathlib import Path
r=Path(os.environ['SOURCE_WIRE_UPGRADE_REHEARSAL_ROOT_RESOLVED'])
def lines(name): return (r/name).read_text().splitlines()
before = lines('before.counts')
after = lines('after.counts')
rollback = lines('rollback.counts')
assert after[0] == '180004'
assert rollback[0].startswith('16')
assert before == after[1:]
assert before == rollback[1:]
print(json.dumps({
 'source_build': 'passed',
 'source_commit': os.environ['SOURCE_WIRE_REHEARSAL_SOURCE_COMMIT'],
 'source_dirty': os.environ['SOURCE_WIRE_REHEARSAL_SOURCE_DIRTY'] == 'true',
 'source_tree_digest_sha256': os.environ['SOURCE_WIRE_REHEARSAL_SOURCE_TREE_DIGEST_SHA256'],
 'pg_upgrade_check': 'passed' if 'Clusters are compatible' in (r/'pg_upgrade_check.log').read_text() else 'unknown',
 'pg_upgrade': 'passed' if 'Upgrade Complete' in (r/'pg_upgrade.log').read_text() else 'unknown',
 'before_counts': before,
 'after_counts': after,
 'rollback_counts': rollback,
 'upgraded_schema_matches_fresh_pg18': (r/'after.schema.normalized.sql').read_bytes()==(r/'fresh18.schema.normalized.sql').read_bytes(),
 'canonical_check_constraints_match_fresh_pg18': (r/'after.check-constraints.canonical.tsv').read_bytes()==(r/'fresh18.check-constraints.canonical.tsv').read_bytes(),
 'post_upgrade_runtime_smoke': json.loads((r/'post-upgrade-runtime-smoke.json').read_text()),
 'statistics_maintenance_completed': True,
 'data_upgrade_exact': (r/'before.data.normalized.sql').read_bytes()==(r/'after.data.normalized.sql').read_bytes(),
 'schema_rollback_exact': (r/'before.schema.normalized.sql').read_bytes()==(r/'rollback.schema.normalized.sql').read_bytes(),
 'data_rollback_exact': (r/'before.data.normalized.sql').read_bytes()==(r/'rollback.data.normalized.sql').read_bytes(),
 'migration_replay_status': json.loads((r/'migrate18-replay.json').read_text())['status'],
 'fresh_pg18_migration_status': json.loads((r/'migrate18-fresh.json').read_text())['status']
},indent=2))
PY
