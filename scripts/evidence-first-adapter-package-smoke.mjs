import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_NAME = "@doomade/evidence-first-source-wire-adapter";
const PACKAGE_VERSION = "0.1.0-alpha.1";
const CONTRACT_VERSION = "0.2.0";
const PROVIDER_EXPORTS = [
  "createEvidenceFirstSyntheticProvider",
  "createEvidenceFirstInactiveSyntheticProvider",
  "createEvidenceFirstDeletedSyntheticProvider",
  "createEvidenceFirstDeniedSyntheticProvider",
  "createEvidenceFirstIncompleteSyntheticProvider",
  "createEvidenceFirstOversizedSyntheticProvider",
  "createEvidenceFirstLateSyntheticProvider",
  "createEvidenceFirstCrossScopeSyntheticProvider"
];
const FORBIDDEN_RUNTIME_REFERENCES = [
  "@source-wire/alpha1-runtime",
  "apps/alpha1-runtime",
  "@modelcontextprotocol/",
  "\"pg\"",
  "\"node:child_process\"",
  "\"node:fs\"",
  "\"node:http\"",
  "\"node:https\"",
  "\"node:net\"",
  "\"node:worker_threads\"",
  "SOURCE_WIRE_DATABASE_URL",
  "SOURCE_WIRE_OWNER_TOKEN",
  "postgres://",
  "postgresql://"
];

const entryUrl = import.meta.resolve(PACKAGE_NAME);
const entryPath = fileURLToPath(entryUrl);
const packageRoot = join(dirname(entryPath), "..", "..");
const packageJsonPath = join(packageRoot, "package.json");
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const distRoot = join(packageRoot, "dist", "src");
const distFiles = (await readdir(distRoot, { recursive: true }))
  .filter((path) => /\.(?:js|d\.ts|map)$/u.test(path))
  .sort();
const packageSurface = (
  await Promise.all(
    distFiles.map((path) => readFile(join(distRoot, path), "utf8"))
  )
).join("\n");
const adapter = await import(PACKAGE_NAME);

if (
  packageJson.name !== PACKAGE_NAME ||
  packageJson.version !== PACKAGE_VERSION ||
  packageJson.private !== true
) {
  throw new Error("evidence_first_adapter_identity_invalid");
}
if (packageJson.dependencies?.["@source-wire/contracts"] !== CONTRACT_VERSION) {
  throw new Error("evidence_first_contract_dependency_not_exact");
}
for (const name of PROVIDER_EXPORTS) {
  if (typeof adapter[name] !== "function") {
    throw new Error(`evidence_first_provider_export_missing_${name}`);
  }
}
for (const forbidden of FORBIDDEN_RUNTIME_REFERENCES) {
  if (packageSurface.includes(forbidden)) {
    throw new Error(`evidence_first_private_runtime_reference_${forbidden}`);
  }
}

const provider = adapter.createEvidenceFirstSyntheticProvider();
if (
  provider.profile.contractId !== "source-wire.knowledge-provider" ||
  provider.profile.contractVersion !== "knowledge-provider.v1" ||
  provider.profile.accessMode !== "read_only" ||
  provider.profile.credentialMode !== "out_of_band" ||
  provider.profile.requiredProvenance !== true ||
  provider.profile.noAutoPromotion !== true
) {
  throw new Error("evidence_first_provider_profile_invalid");
}

console.log(
  `ok evidence-first adapter package ${PACKAGE_NAME}@${PACKAGE_VERSION}`
);
console.log(
  `ok evidence-first adapter depends exactly on @source-wire/contracts@${CONTRACT_VERSION}`
);
console.log(
  "ok evidence-first adapter exports allowed and fail-closed synthetic providers"
);
console.log(
  "blocked evidence-first adapter private runtime authority and automatic memory promotion"
);
