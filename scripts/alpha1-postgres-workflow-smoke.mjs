import { readFile } from "node:fs/promises";

const rootPackage = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
);
const workflow = await readFile(
  new URL("../.github/workflows/package-checks.yml", import.meta.url),
  "utf8"
);

const jobStart = workflow.indexOf("  alpha-postgres-conformance:");
if (jobStart === -1) {
  throw new Error("alpha_postgres_conformance_job_missing");
}
const job = workflow.slice(jobStart);

for (const required of [
  "name: Source-Wire Alpha PostgreSQL conformance",
  "image: postgres:${{ matrix.image }}",
  "label: authoritative-18.4",
  'image: "18.4"',
  'expected_version_num: "180004"',
  "label: compatibility-16",
  'image: "16"',
  'compatibility_major: "16"',
  'export SOURCE_WIRE_POSTGRES_COMPATIBILITY_MAJOR="$POSTGRES_COMPATIBILITY_MAJOR"',
  "unset SOURCE_WIRE_POSTGRES_COMPATIBILITY_MAJOR",
  "node-version: 22.23.1",
  "repository: DanielJD1216/evidence-first-knowledge-base",
  "ref: a01cd307582cecbed54c4ca8e7873d7f9df1ecb8",
  "persist-credentials: false",
  "npm pack --pack-destination",
  "npm install --no-save --package-lock=false --ignore-scripts",
  "rm -rf -- evidence-first-knowledge-base",
  "test ! -e evidence-first-knowledge-base",
  "npm run alpha1:story5:security-gate",
  "npm run alpha1:conformance",
  "npm run alpha1:conformance:evidence-first",
  "npm run local-runtime:candidate-conformance",
  "SOURCE_WIRE_ALPHA_POSTGRES_GATE_BEGIN",
  "SOURCE_WIRE_ALPHA_POSTGRES_GATE_SUCCESS",
  "SOURCE_WIRE_ALPHA_POSTGRES_GATE_FAILED",
  "providers=baseline,replaceable,evidence-first",
  "candidate=local-runtime-alpha.2",
  "${{ github.run_id }}",
  "${{ github.run_attempt }}"
]) {
  if (!job.includes(required)) {
    throw new Error(`alpha_postgres_conformance_job_missing_${required}`);
  }
}

if (
  !rootPackage.scripts?.["alpha1:conformance"]?.includes(
    "alpha1:conformance:story5:replaceable"
  )
) {
  throw new Error("alpha_postgres_replaceable_adapter_conformance_missing");
}

for (const forbidden of [
  "actions/upload-artifact",
  "GH_TOKEN:",
  "secrets.",
  "npm publish",
  "npm run alpha1:test",
  "SOURCE_WIRE_EVIDENCE_ONLY_POSTGRES_VERSION_NUM"
]) {
  if (job.includes(forbidden)) {
    throw new Error(`alpha_postgres_conformance_job_forbidden_${forbidden}`);
  }
}

console.log("ok Alpha PostgreSQL workflow uses Node.js 22.23.1");
console.log("ok Alpha PostgreSQL workflow uses authoritative exact PostgreSQL 18.4");
console.log("ok Alpha PostgreSQL workflow retains explicit PostgreSQL 16 compatibility");
console.log("ok Alpha PostgreSQL workflow runs Stories 1 through 5");
console.log("ok Alpha PostgreSQL workflow runs both provider adapters");
console.log("ok Alpha PostgreSQL workflow pins evidence-first adapter");
console.log("ok Alpha PostgreSQL workflow proves packed local runtime candidate");
console.log("ok Alpha PostgreSQL workflow exposes stable gate markers");
console.log("blocked Alpha PostgreSQL workflow artifacts and production secrets");
