import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const CANDIDATE_VERSION = "0.2.0";
const root = process.cwd();
const tempRoot = await mkdtemp(join(tmpdir(), "source-wire-story5-rc-"));

try {
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const packageLock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  const sourceIndex = await readFile(join(root, "src", "index.ts"), "utf8");
  const releaseNotes = await readFile(
    join(root, "docs", "status", "0.2.0-release-candidate.md"),
    "utf8"
  );
  const advisoryDisposition = await readFile(
    join(root, "docs", "internal", "alpha1-story5-mcp-advisory-disposition.md"),
    "utf8"
  );

  assertEqual(packageJson.version, CANDIDATE_VERSION, "package metadata version");
  assertEqual(packageLock.version, CANDIDATE_VERSION, "package-lock version");
  assertEqual(packageLock.packages?.[""]?.version, CANDIDATE_VERSION, "package-lock root version");
  assertIncludes(
    sourceIndex,
    `SOURCE_WIRE_PACKAGE_VERSION = "${CANDIDATE_VERSION}"`,
    "exported package version"
  );

  for (const requiredPhrase of [
    "release candidate",
    "additive",
    "live connectors remain blocked",
    "production runtime remains blocked",
    "deployment remains blocked",
    "real data remains blocked",
    "automatic trusted-memory promotion remains forbidden",
    "No npm package was published",
    "No GitHub release or Git tag was created",
    "clean external consumer",
    "does not prove a live connector"
  ]) {
    assertIncludes(releaseNotes, requiredPhrase, "release-candidate notes");
  }
  assertIncludes(advisoryDisposition, "Status: Owner accepted", "advisory disposition");
  assertIncludes(advisoryDisposition, "Review deadline: 2026-08-24", "advisory review deadline");

  await runChecked("npm", ["run", "build"], root);
  const packResult = await runChecked(
    "npm",
    ["pack", "--json", "--pack-destination", tempRoot],
    root
  );
  const [pack] = JSON.parse(packResult.stdout);
  assertEqual(pack.version, CANDIDATE_VERSION, "packed candidate version");

  const packagePaths = pack.files.map((entry) => entry.path);
  for (const requiredPath of ["dist/index.d.ts", "dist/index.js", "README.md", "CHANGELOG.md"]) {
    if (!packagePaths.includes(requiredPath)) {
      throw new Error(`packed candidate missing required path: ${requiredPath}`);
    }
  }
  for (const path of packagePaths) {
    if (
      path.startsWith("apps/") ||
      path.startsWith("migrations/") ||
      path.includes("alpha1-runtime") ||
      path.includes("generated-postgres") ||
      path.includes("conformance-state") ||
      /(^|\/)\.env(?:\.|$)/u.test(path) ||
      /credential/iu.test(path)
    ) {
      throw new Error(`packed candidate contains forbidden runtime path: ${path}`);
    }
  }

  const tarballPath = resolve(tempRoot, pack.filename);
  const consumerRoot = join(tempRoot, "consumer");
  const srcRoot = join(consumerRoot, "src");
  await mkdir(srcRoot, { recursive: true });
  await writeFile(
    join(consumerRoot, "package.json"),
    JSON.stringify(
      {
        private: true,
        type: "module",
        dependencies: {
          "@source-wire/contracts": `file:${tarballPath}`
        }
      },
      null,
      2
    )
  );
  await writeFile(
    join(consumerRoot, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          target: "ES2022",
          outDir: "dist"
        },
        include: ["src/**/*.ts"]
      },
      null,
      2
    )
  );
  await writeFile(
    join(srcRoot, "consumer.ts"),
    `import {
  SOURCE_WIRE_KNOWLEDGE_PROVIDER_BOUNDARY,
  SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID,
  SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
  SOURCE_WIRE_PACKAGE_VERSION
} from "@source-wire/contracts";

import type {
  SourceWireKnowledgeEvidenceV1,
  SourceWireKnowledgeProviderCursorV1,
  SourceWireKnowledgeProviderGapV1,
  SourceWireKnowledgeProviderGetInputV1,
  SourceWireKnowledgeProviderProfileV1,
  SourceWireKnowledgeProviderRequestV1,
  SourceWireKnowledgeProviderResultV1,
  SourceWireKnowledgeProviderSearchInputV1,
  SourceWireKnowledgeProviderV1,
  SourceWireSafeErrorV1,
  SourceWireSecondBrainResponse
} from "@source-wire/contracts";

const publicTypeSurface: [
  SourceWireKnowledgeProviderV1?,
  SourceWireKnowledgeProviderRequestV1?,
  SourceWireKnowledgeProviderProfileV1?,
  SourceWireKnowledgeProviderSearchInputV1?,
  SourceWireKnowledgeProviderGetInputV1?,
  SourceWireKnowledgeProviderResultV1?,
  SourceWireKnowledgeEvidenceV1?,
  SourceWireKnowledgeProviderCursorV1?,
  SourceWireKnowledgeProviderGapV1?,
  SourceWireSafeErrorV1?,
  SourceWireSecondBrainResponse?
] = [];
void publicTypeSurface;

const externalAdapter: SourceWireKnowledgeProviderV1 = {
  profile: {
    contractId: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID,
    contractVersion: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
    providerId: "external_release_gate_provider",
    providerScopeId: "scope_release_gate",
    providerFamily: "custom",
    accessMode: "read_only",
    credentialMode: "out_of_band",
    capabilities: [
      "describe",
      "health",
      "search_evidence",
      "get_evidence"
    ].map((capability) => ({
      capability: capability as SourceWireKnowledgeProviderProfileV1["capabilities"][number]["capability"],
      requirement: "required",
      supported: true
    })),
    requiredProvenance: true,
    noAutoPromotion: true,
    arbitraryTableMappingSupported: false,
    maximumResultCount: 20,
    maximumExcerptBytes: 65_536
  },
  async execute(request) {
    return {
      requestId: request.requestId,
      traceId: request.traceId,
      providerId: request.providerId,
      contractVersion: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
      status: "allowed",
      evidence: [],
      gaps: [
        {
          code: "no_evidence",
          message: "Synthetic release-gate adapter returned no evidence.",
          retryable: false
        }
      ],
      providerMutationAttempted: false,
      memoryMutationAttempted: false,
      trustedMemoryCreated: false,
      noAutoPromotion: true,
      readAuditRequired: true,
      releaseState: "internal_unreleased"
    };
  }
};

const adapterResult = await externalAdapter.execute({
  contractId: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_ID,
  contractVersion: SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
  requestId: "request_release_gate",
  traceId: "trace_release_gate",
  providerId: externalAdapter.profile.providerId,
  ownerId: "owner_release_gate",
  namespaceId: "namespace_release_gate",
  providerScopeId: externalAdapter.profile.providerScopeId,
  operation: "search_evidence",
  requiredCapabilities: [
    {
      capability: "search_evidence",
      requirement: "required"
    }
  ],
  deadlineAt: new Date(Date.now() + 1_000).toISOString(),
  search: {
    query: "synthetic release gate",
    maximumResults: 1
  }
});

if (SOURCE_WIRE_PACKAGE_VERSION !== "${CANDIDATE_VERSION}") {
  throw new Error("unexpected candidate version");
}
if (SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION !== "knowledge-provider.v1") {
  throw new Error("unexpected provider contract version");
}
if (SOURCE_WIRE_KNOWLEDGE_PROVIDER_BOUNDARY.liveConnectorIncluded !== false) {
  throw new Error("live connector boundary changed");
}
console.log(JSON.stringify({
  ok: true,
  version: SOURCE_WIRE_PACKAGE_VERSION,
  adapterContractVersion: externalAdapter.profile.contractVersion,
  adapterStatus: adapterResult.status
}));
`
  );

  await runChecked("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], consumerRoot);
  const installedRoot = join(consumerRoot, "node_modules", "@source-wire", "contracts");
  const declarations = await readFile(join(installedRoot, "dist", "index.d.ts"), "utf8");
  const providerDeclarations = await readFile(
    join(installedRoot, "dist", "contracts", "knowledge-provider.d.ts"),
    "utf8"
  );
  const runtimeOutput = await readFile(join(installedRoot, "dist", "index.js"), "utf8");

  assertIncludes(
    declarations,
    'export type * from "./contracts/knowledge-provider.js"',
    "package-root provider type export"
  );
  for (const symbol of [
    "SourceWireKnowledgeProviderV1",
    "SourceWireKnowledgeProviderRequestV1",
    "SourceWireKnowledgeProviderProfileV1",
    "SourceWireKnowledgeProviderSearchInputV1",
    "SourceWireKnowledgeProviderGetInputV1",
    "SourceWireKnowledgeProviderResultV1",
    "SourceWireKnowledgeEvidenceV1",
    "SourceWireKnowledgeProviderCursorV1",
    "SourceWireKnowledgeProviderGapV1",
    "SourceWireSafeErrorV1"
  ]) {
    assertIncludes(providerDeclarations, symbol, "packed provider declarations");
  }
  assertIncludes(
    runtimeOutput,
    "SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION",
    "packed provider runtime exports"
  );

  const tscPath = join(root, "node_modules", "typescript", "bin", "tsc");
  await runChecked(process.execPath, [tscPath, "-p", "tsconfig.json"], consumerRoot);
  const runtimeResult = await runChecked(process.execPath, ["dist/consumer.js"], consumerRoot);
  const parsedRuntime = JSON.parse(runtimeResult.stdout);
  assertEqual(parsedRuntime.version, CANDIDATE_VERSION, "clean consumer runtime version");
  assertEqual(
    parsedRuntime.adapterContractVersion,
    "knowledge-provider.v1",
    "clean consumer adapter contract version"
  );
  assertEqual(parsedRuntime.adapterStatus, "allowed", "clean consumer adapter result");

  console.log("ok Story 5 contracts 0.2.0 release candidate");
  console.log("ok candidate package metadata and exported version aligned");
  console.log("ok KnowledgeProvider v1 complete public type surface");
  console.log("ok clean consumer external adapter implementation");
  console.log("ok packed artifact excludes unpublished Alpha runtime state");
  console.log("ok clean installed consumer typecheck and runtime import");
  console.log("ok additive compatibility and blocked release notes");
  console.log("blocked npm publish, GitHub release, Git tag, deployment, and hosted-service mutation");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

function assertEqual(actual, expected, reason) {
  if (actual !== expected) {
    throw new Error(
      `${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
    );
  }
}

function assertIncludes(content, expected, reason) {
  if (!content.includes(expected)) {
    throw new Error(`${reason}: missing ${JSON.stringify(expected)}`);
  }
}

function runChecked(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("close", (exitCode) => {
      if (exitCode === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }
      reject(
        new Error(
          [
            `command failed: ${command} ${args.join(" ")}`,
            `cwd: ${cwd}`,
            `exitCode: ${exitCode ?? 1}`,
            stdout.trim() ? `stdout:\n${stdout.trim()}` : "",
            stderr.trim() ? `stderr:\n${stderr.trim()}` : ""
          ]
            .filter(Boolean)
            .join("\n")
        )
      );
    });
  });
}
