import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

import {
  STORY5_KNOWLEDGE_PROVIDER_SECURITY_POLICY,
  assertStory5KnowledgeProviderSecurityPolicy
} from "../apps/alpha1-runtime/dist/src/knowledge-provider-security-policy.js";

const rootPackage = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
);
const alphaPackage = JSON.parse(
  await readFile(new URL("../apps/alpha1-runtime/package.json", import.meta.url), "utf8")
);
const lock = JSON.parse(
  await readFile(new URL("../package-lock.json", import.meta.url), "utf8")
);
const mcpServerSource = await readFile(
  new URL("../apps/alpha1-runtime/src/mcp/server.ts", import.meta.url),
  "utf8"
);
const replaceableAdapterSource = await readFile(
  new URL(
    "../apps/alpha1-runtime/src/knowledge-provider/replaceable-synthetic-adapter.ts",
    import.meta.url
  ),
  "utf8"
);
const runtimeCompositionSource = await readFile(
  new URL(
    "../apps/alpha1-runtime/src/runtime-composition.ts",
    import.meta.url
  ),
  "utf8"
);
const disposition = await readFile(
  new URL(
    "../docs/internal/alpha1-story5-mcp-advisory-disposition.md",
    import.meta.url
  ),
  "utf8"
);

assertStory5KnowledgeProviderSecurityPolicy(
  STORY5_KNOWLEDGE_PROVIDER_SECURITY_POLICY
);

if (
  alphaPackage.private !== false ||
  alphaPackage.name !== "@source-wire/local-runtime" ||
  alphaPackage.version !== "0.1.0-alpha.2" ||
  alphaPackage.publishConfig?.access !== "public" ||
  alphaPackage.publishConfig?.tag !== "alpha" ||
  alphaPackage.sourceWireCandidate?.publicationSecurityReview?.reviewedAt !==
    "2026-07-25" ||
  alphaPackage.sourceWireCandidate?.publicationSecurityReview?.scope !==
    "npm-alpha-0.1.0-alpha.2-candidate" ||
  alphaPackage.sourceWireCandidate?.publicationSecurityReview?.status !==
    "prepared-not-published"
) {
  throw new Error("story5_public_alpha_distribution_boundary_invalid");
}
if (rootPackage.publishConfig?.access !== "public") {
  throw new Error("story5_contract_package_boundary_invalid");
}

const sdkVersion =
  lock.packages?.["node_modules/@modelcontextprotocol/sdk"]?.version;
if (sdkVersion !== "1.29.0") {
  throw new Error("story5_mcp_sdk_security_version_invalid");
}
if (
  /serveStatic|serve-static|StreamableHTTPServerTransport|SSEServerTransport|@hono\/node-server/u.test(
    mcpServerSource
  )
) {
  throw new Error("story5_mcp_static_or_http_surface_forbidden");
}

const adapterImports = [
  ...replaceableAdapterSource.matchAll(/from\s+["']([^"']+)["']/gu)
]
  .map((match) => match[1])
  .sort();
if (
  JSON.stringify(adapterImports) !==
  JSON.stringify(["@source-wire/contracts", "node:crypto"])
) {
  throw new Error("story5_replaceable_adapter_import_boundary_invalid");
}
if (
  /knowledge-provider-host|database|repository|mcp|receipt|audit-store|memory-store/iu.test(
    replaceableAdapterSource
  )
) {
  throw new Error("story5_replaceable_adapter_runtime_authority_imported");
}
if (
  /registry|hot.?reload|dynamic.?provider|providerEndpoint|providerCredentials/iu.test(
    runtimeCompositionSource
  )
) {
  throw new Error("story5_runtime_composition_scope_broadened");
}

const audit = readProductionAudit();
const vulnerabilityNames = Object.keys(audit.vulnerabilities ?? {}).sort();
if (
  vulnerabilityNames.length !== 2 ||
  vulnerabilityNames[0] !== "@hono/node-server" ||
  vulnerabilityNames[1] !== "@modelcontextprotocol/sdk"
) {
  throw new Error("story5_dependency_advisory_set_changed");
}
const honoAdvisory = audit.vulnerabilities["@hono/node-server"];
const sdkAdvisory = audit.vulnerabilities["@modelcontextprotocol/sdk"];
if (
  honoAdvisory?.severity !== "moderate" ||
  sdkAdvisory?.severity !== "moderate" ||
  honoAdvisory.via?.length !== 1 ||
  honoAdvisory.via[0]?.url !==
    "https://github.com/advisories/GHSA-frvp-7c67-39w9" ||
  sdkAdvisory.via?.length !== 1 ||
  sdkAdvisory.via[0] !== "@hono/node-server"
) {
  throw new Error("story5_dependency_advisory_set_changed");
}
if (!disposition.includes("Status: Owner accepted")) {
  throw new Error("story5_advisory_disposition_owner_acceptance_required");
}
const reviewDeadline = disposition.match(
  /^Review deadline: (\d{4}-\d{2}-\d{2})$/mu
)?.[1];
if (!reviewDeadline) {
  throw new Error("story5_advisory_review_deadline_missing");
}
const reviewDeadlineEnd = Date.parse(`${reviewDeadline}T23:59:59.999Z`);
if (!Number.isFinite(reviewDeadlineEnd) || Date.now() > reviewDeadlineEnd) {
  throw new Error("story5_advisory_review_deadline_expired");
}

console.log("ok Story 5 immutable provider binding policy");
console.log("ok Story 5 caller authority exclusion");
console.log("ok Story 5 source-evidence tool and capability policy");
console.log("ok replaceable adapter imports only the public provider contract");
console.log("ok startup composition excludes registry and runtime authority");
console.log(`ok MCP SDK ${sdkVersion} avoids known high-severity SDK ranges`);
console.log("ok MCP stdio path excludes static-file and HTTP transports");
console.log("ok known moderate advisory set matches owner-accepted disposition");
console.log(`ok advisory review deadline remains active through ${reviewDeadline}`);
console.log("ok Story 5 production and deployment blocks");

function readProductionAudit() {
  const result = spawnSync(
    process.env.npm_execpath ?? "npm",
    ["audit", "--omit=dev", "--json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      shell: process.platform === "win32"
    }
  );
  if (!result.stdout) {
    throw new Error("story5_dependency_audit_unavailable");
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error("story5_dependency_audit_invalid");
  }
}
