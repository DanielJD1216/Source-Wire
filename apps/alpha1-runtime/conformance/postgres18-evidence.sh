#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
APP_ROOT=$(cd -- "$SCRIPT_DIR/.." && pwd)
REPO=$(cd -- "$APP_ROOT/../.." && pwd)
PG18_BIN=${SOURCE_WIRE_POSTGRES18_BIN_DIR:?set SOURCE_WIRE_POSTGRES18_BIN_DIR to the exact PostgreSQL 18.4 bin directory}
NODE_BIN=${SOURCE_WIRE_NODE_BIN_DIR:-$(dirname -- "$(command -v node)")}

[[ $("$PG18_BIN/postgres" --version) == *" 18.4" ]] || { echo "exact PostgreSQL 18.4 binaries required" >&2; exit 1; }
[[ $("$NODE_BIN/node" --version) == "v22.23.1" ]] || { echo "Node.js 22.23.1 required" >&2; exit 1; }
[[ -f "$APP_ROOT/dist/conformance/story2.js" ]] || { echo "build @source-wire/local-runtime before conformance" >&2; exit 1; }
for story in 1 2 3 4 5; do
  [[ -f "$APP_ROOT/.artifacts/story${story}-conformance-report.json" ]] || {
    echo "PostgreSQL 16 Story ${story} report required before parity" >&2
    exit 1
  }
done

export PATH="$NODE_BIN:$PG18_BIN:/usr/bin:/bin"
export SOURCE_WIRE_EXPECTED_POSTGRES_MAJOR=18
export SOURCE_WIRE_EXPECTED_POSTGRES_VERSION_NUM=180004
export SOURCE_WIRE_CONFORMANCE_REPORT_SUFFIX=pg18.4
export SOURCE_WIRE_CONFORMANCE_POSTGRES_BIN_DIR="$PG18_BIN"

(
  cd "$REPO"
  for story in 1 2 3 4 5; do
    "$NODE_BIN/npm" --prefix "$REPO" run "alpha1:conformance:story${story}"
  done
)

SOURCE_WIRE_APP_ROOT_RESOLVED="$APP_ROOT" python3 - <<'PY'
import json
import os
from pathlib import Path

root = Path(os.environ["SOURCE_WIRE_APP_ROOT_RESOLVED"]) / ".artifacts"
summary = {}
for story in ("story1", "story2", "story3", "story4", "story5"):
    pg16 = json.loads((root / f"{story}-conformance-report.json").read_text())
    pg18 = json.loads((root / f"{story}-conformance-report-pg18.4.json").read_text())
    matrix = lambda report: [(case["id"], case["status"]) for case in report["cases"]]
    checks = {
        "pg16_status_passed": pg16["status"] == "passed",
        "pg18_status_passed": pg18["status"] == "passed",
        "case_count_exact": len(pg16["cases"]) == len(pg18["cases"]) > 0,
        "case_matrix_exact": matrix(pg16) == matrix(pg18),
        "source_commit_exact": pg16["sourceCommit"] == pg18["sourceCommit"],
        "pg16_major": pg16["environment"]["postgresqlMajor"] == 16,
        "pg18_major": pg18["environment"]["postgresqlMajor"] == 18,
        "pg18_exact_version": pg18["environment"]["postgresqlVersionNum"] == 180004,
    }
    if story in {"story2", "story3"}:
        checks.update({
            "source_tree_digest_exact": pg16["sourceTree"]["digestSha256"] == pg18["sourceTree"]["digestSha256"],
            "package_lock_digest_exact": pg16["sourceTree"]["packageLockSha256"] == pg18["sourceTree"]["packageLockSha256"],
            "migration_checksums_exact": pg16["sourceTree"]["migrationChecksums"] == pg18["sourceTree"]["migrationChecksums"],
        })
    if story == "story1":
        checks["dependencies_exact"] = pg16["dependencies"] == pg18["dependencies"]
    if story == "story5":
        checks["package_lock_digest_exact"] = pg16["environment"]["packageLockSha256"] == pg18["environment"]["packageLockSha256"]
    if not all(checks.values()):
        raise SystemExit(f"{story} PostgreSQL 16/18.4 parity failed: {checks}")
    summary[story] = checks
print(json.dumps(summary, indent=2, sort_keys=True))
PY
