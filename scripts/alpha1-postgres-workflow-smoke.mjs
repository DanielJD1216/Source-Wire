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
  "image: postgres:16",
  "node-version: 22.23.1",
  "npm run alpha1:story5:security-gate",
  "npm run alpha1:conformance",
  "SOURCE_WIRE_ALPHA_POSTGRES_GATE_BEGIN",
  "SOURCE_WIRE_ALPHA_POSTGRES_GATE_SUCCESS",
  "SOURCE_WIRE_ALPHA_POSTGRES_GATE_FAILED",
  "providers=baseline,replaceable",
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
  "npm run alpha1:test"
]) {
  if (job.includes(forbidden)) {
    throw new Error(`alpha_postgres_conformance_job_forbidden_${forbidden}`);
  }
}

console.log("ok Alpha PostgreSQL workflow uses Node.js 22.23.1");
console.log("ok Alpha PostgreSQL workflow uses PostgreSQL 16");
console.log("ok Alpha PostgreSQL workflow runs Stories 1 through 5");
console.log("ok Alpha PostgreSQL workflow runs both provider adapters");
console.log("ok Alpha PostgreSQL workflow exposes stable gate markers");
console.log("blocked Alpha PostgreSQL workflow artifacts and production secrets");
