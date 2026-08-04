import assert from "node:assert/strict";
import {
  chmod,
  lstat,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  createLocalConfigTemplate,
  SOURCE_WIRE_LOCAL_CONFIG_SCHEMA,
  validateLocalConfig
} from "../src/local-cli/config.js";
import {
  renderLocalCliResult,
  SourceWireLocalCliError
} from "../src/local-cli/result.js";
import {
  createMcpEnvironment,
  createMemoryOnlyMcpEnvironment,
  runLocalMcpStdio
} from "../src/local-cli/mcp-stdio.js";
import { runSourceWireLocalCli } from "../src/local-cli/runner.js";

test("init creates one owner-only non-secret config and never overwrites it", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const destination = join(directory, "source-wire.local.json");
    const first = await runSourceWireLocalCli([
      "init",
      "--config",
      destination,
      "--owner-id",
      "owner_alpha",
      "--namespace-id",
      "ns_project_alpha",
      "--namespace-id",
      "ns_project_beta"
    ]);
    assert.equal(first.exitCode, 0);
    assert(first.result.ok);
    assert.equal(first.result.operation, "local.init");
    assert.equal((await lstat(destination)).mode & 0o777, 0o600);

    const serialized = await readFile(destination, "utf8");
    const config = JSON.parse(serialized) as Record<string, unknown>;
    assert.equal(config.schema, SOURCE_WIRE_LOCAL_CONFIG_SCHEMA);
    assert.deepEqual(config.namespaces, [
      "ns_project_alpha",
      "ns_project_beta"
    ]);
    assertNonSecretSurface(serialized);

    const second = await runSourceWireLocalCli([
      "init",
      "--config",
      destination
    ]);
    assert.equal(second.exitCode, 1);
    assert(!second.result.ok);
    assert.equal(second.result.error.code, "config_already_exists");
    assert.equal(await readFile(destination, "utf8"), serialized);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("offline doctor validates memory-only and single-provider configs without dependencies", async () => {
  const directory = await privateTemporaryDirectory();
  const previousDatabaseUrl = process.env.SOURCE_WIRE_DATABASE_URL;
  const previousMigratorUrl = process.env.SOURCE_WIRE_MIGRATOR_DATABASE_URL;
  const previousVerifierKey = process.env.SOURCE_WIRE_TOKEN_VERIFIER_KEY;
  try {
    delete process.env.SOURCE_WIRE_DATABASE_URL;
    delete process.env.SOURCE_WIRE_MIGRATOR_DATABASE_URL;
    delete process.env.SOURCE_WIRE_TOKEN_VERIFIER_KEY;

    const memoryOnlyPath = join(directory, "memory-only.json");
    await writeConfig(memoryOnlyPath, createLocalConfigTemplate());
    const memoryOnly = await runSourceWireLocalCli([
      "doctor",
      "--config",
      memoryOnlyPath
    ]);
    assert.equal(memoryOnly.exitCode, 0);
    assert(memoryOnly.result.ok);
    assert.deepEqual(memoryOnly.result.result, {
      schema: SOURCE_WIRE_LOCAL_CONFIG_SCHEMA,
      contractsPackageVersion: "0.2.0",
      knowledgeProviderContractVersion: "knowledge-provider.v1",
      memoryStoreContractVersion: "memory-store.v1",
      provider: "none",
      mcpTransport: "stdio",
      apiBinding: "loopback",
      externalChecks: "skipped",
      requiredEnvironmentReferenceCount: 3
    });

    const providerPath = join(directory, "provider.json");
    await writeConfig(providerPath, {
      ...createLocalConfigTemplate(),
      knowledgeProvider: {
        module: "@synthetic-does-not-exist/source-wire-provider",
        exportName: "createProvider",
        providerScopeId: "scope_docs_alpha",
        timeoutMs: 1_000
      }
    });
    const withProvider = await runSourceWireLocalCli([
      "doctor",
      "--config",
      providerPath,
      "--json"
    ]);
    assert.equal(withProvider.exitCode, 0);
    assert(withProvider.result.ok);
    assert.equal(
      (withProvider.result.result as { provider: string }).provider,
      "configured"
    );
    assertNonSecretSurface(
      renderLocalCliResult(withProvider.result, withProvider.format)
    );
  } finally {
    restoreEnvironment(
      "SOURCE_WIRE_DATABASE_URL",
      previousDatabaseUrl
    );
    restoreEnvironment(
      "SOURCE_WIRE_MIGRATOR_DATABASE_URL",
      previousMigratorUrl
    );
    restoreEnvironment(
      "SOURCE_WIRE_TOKEN_VERIFIER_KEY",
      previousVerifierKey
    );
    await rm(directory, { recursive: true, force: true });
  }
});

test("config validation rejects registries, hot reload, remote transports, hooks, and raw secrets", () => {
  const valid = plainConfig();
  const invalidCases: Record<string, unknown>[] = [
    { ...valid, providerRegistry: [] },
    {
      ...valid,
      knowledgeProvider: {
        module: "@example/source-wire-provider",
        exportName: "createProvider",
        providerScopeId: "scope_docs_alpha",
        timeoutMs: 1_000,
        hotReload: true
      }
    },
    {
      ...valid,
      memory: {
        ...(valid.memory as Record<string, unknown>),
        databaseUrl: "postgresql://raw-secret"
      }
    },
    {
      ...valid,
      mcp: { transport: "http" }
    },
    {
      ...valid,
      api: { host: "0.0.0.0", port: 4318 }
    },
    {
      ...valid,
      shellHook: "run arbitrary command"
    },
    {
      ...valid,
      apiKey: "raw-secret"
    }
  ];

  for (const value of invalidCases) {
    assert.throws(
      () => validateLocalConfig(value),
      (error: unknown) =>
        error instanceof SourceWireLocalCliError &&
        error.code === "config_invalid"
    );
  }
});

test("doctor distinguishes exact contract incompatibility from malformed config", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const incompatiblePath = join(directory, "incompatible.json");
    const incompatible = plainConfig();
    incompatible.compatibility = {
      ...(incompatible.compatibility as Record<string, unknown>),
      contractsPackageVersion: "0.1.0"
    };
    await writeConfig(incompatiblePath, incompatible);
    const result = await runSourceWireLocalCli([
      "doctor",
      "--config",
      incompatiblePath
    ]);
    assert.equal(result.exitCode, 1);
    assert(!result.result.ok);
    assert.equal(result.result.error.code, "config_incompatible");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("doctor rejects unsafe file permissions and symlink paths without disclosing paths", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const unsafePath = join(directory, "unsafe.json");
    await writeConfig(unsafePath, createLocalConfigTemplate());
    await chmod(unsafePath, 0o666);
    const unsafe = await runSourceWireLocalCli([
      "doctor",
      "--config",
      unsafePath,
      "--json"
    ]);
    assert.equal(unsafe.exitCode, 1);
    assert(!unsafe.result.ok);
    assert.equal(unsafe.result.error.code, "config_permissions_unsafe");
    assert(!JSON.stringify(unsafe.result).includes(directory));

    const target = join(directory, "target.json");
    const link = join(directory, "link.json");
    await writeConfig(target, createLocalConfigTemplate());
    await symlink(target, link);
    const linked = await runSourceWireLocalCli([
      "doctor",
      "--config",
      link
    ]);
    assert.equal(linked.exitCode, 1);
    assert(!linked.result.ok);
    assert.equal(linked.result.error.code, "config_path_unsafe");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("human and JSON renderers preserve the same operation and error vocabulary", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const missing = join(directory, "missing.json");
    const execution = await runSourceWireLocalCli([
      "doctor",
      "--config",
      missing
    ]);
    assert(!execution.result.ok);
    const human = renderLocalCliResult(execution.result, "human");
    const json = renderLocalCliResult(execution.result, "json");
    assert.match(human, /failed local\.doctor config_unreadable/u);
    const parsed = JSON.parse(json) as {
      operation: string;
      error: { code: string; detailsRedacted: boolean };
    };
    assert.equal(parsed.operation, "local.doctor");
    assert.equal(parsed.error.code, "config_unreadable");
    assert.equal(parsed.error.detailsRedacted, true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("invalid init identifiers fail as arguments before creating a file", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const destination = join(directory, "source-wire.local.json");
    const execution = await runSourceWireLocalCli([
      "init",
      "--config",
      destination,
      "--owner-id",
      "invalid owner"
    ]);
    assert.equal(execution.exitCode, 1);
    assert(!execution.result.ok);
    assert.equal(execution.result.error.code, "invalid_arguments");
    await assert.rejects(lstat(destination), { code: "ENOENT" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("compiled local binary emits deterministic JSON and leaves the public contracts CLI boundary intact", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const destination = join(directory, "source-wire.local.json");
    const localCli = fileURLToPath(
      new URL("../src/cli/local.js", import.meta.url)
    );
    const spawned = spawnSync(
      process.execPath,
      [
        localCli,
        "init",
        "--config",
        destination,
        "--json"
      ],
      {
        encoding: "utf8",
        env: {}
      }
    );
    assert.equal(spawned.status, 0, spawned.stderr);
    assert.equal(spawned.stderr, "");
    const result = JSON.parse(spawned.stdout) as {
      ok: boolean;
      operation: string;
      result: { nextCommand: string };
    };
    assert.equal(result.ok, true);
    assert.equal(result.operation, "local.init");
    assert.equal(
      result.result.nextCommand,
      "source-wire-local doctor --config <path>"
    );

    const repositoryRoot = fileURLToPath(
      new URL("../../../../", import.meta.url)
    );
    const rootPackage = JSON.parse(
      await readFile(join(repositoryRoot, "package.json"), "utf8")
    ) as { bin: Record<string, string> };
    assert.deepEqual(rootPackage.bin, {
      "source-wire": "dist/cli.js"
    });
    const publicCli = await readFile(
      join(repositoryRoot, "src", "cli.ts"),
      "utf8"
    );
    assert(!publicCli.includes("source-wire-local"));
    assert.match(
      publicCli,
      /usage: source-wire validate <schema> <file\.\.\.>/u
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("provider check stays offline by default and connected checking validates readiness without evidence", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const missingPath = join(directory, "missing-provider.json");
    await writeConfig(missingPath, {
      ...createLocalConfigTemplate(),
      knowledgeProvider: {
        module: "@synthetic-does-not-exist/source-wire-provider",
        exportName: "createProvider",
        providerScopeId: "scope_docs_alpha",
        timeoutMs: 1_000
      }
    });
    const offline = await runSourceWireLocalCli([
      "provider",
      "check",
      "--config",
      missingPath,
      "--json"
    ]);
    assert.equal(offline.exitCode, 0);
    assert(offline.result.ok);
    assert.deepEqual(offline.result.result, {
      contractVersion: "knowledge-provider.v1",
      executableLoaded: false,
      profileValidation: "deferred",
      readiness: "skipped",
      evidenceReleased: false
    });

    const connectedPath = join(directory, "connected-provider.json");
    await writeConfig(connectedPath, {
      ...createLocalConfigTemplate(),
      knowledgeProvider: {
        module: "@source-wire/local-runtime/synthetic-provider",
        exportName: "createSyntheticKnowledgeProvider",
        providerScopeId: "scope_docs_alpha",
        timeoutMs: 1_000
      }
    });
    const connected = await runSourceWireLocalCli([
      "provider",
      "check",
      "--config",
      connectedPath,
      "--connect"
    ]);
    assert.equal(connected.exitCode, 0);
    assert(connected.result.ok);
    assert.deepEqual(connected.result.result, {
      contractVersion: "knowledge-provider.v1",
      executableLoaded: true,
      profileValidation: "passed",
      readiness: "ready",
      evidenceReleased: false
    });
    assertNonSecretSurface(
      renderLocalCliResult(connected.result, connected.format)
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("connected provider check fails closed for missing, mismatched, and multi-namespace providers", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const noProviderPath = join(directory, "no-provider.json");
    await writeConfig(noProviderPath, createLocalConfigTemplate());
    const absent = await runSourceWireLocalCli([
      "provider",
      "check",
      "--config",
      noProviderPath
    ]);
    assert.equal(absent.exitCode, 1);
    assert(!absent.result.ok);
    assert.equal(absent.result.error.code, "provider_not_configured");

    const mismatchPath = join(directory, "mismatch.json");
    await writeConfig(mismatchPath, {
      ...createLocalConfigTemplate(),
      knowledgeProvider: {
        module: "@source-wire/local-runtime/synthetic-provider",
        exportName: "createSyntheticKnowledgeProvider",
        providerScopeId: "scope_docs_other",
        timeoutMs: 1_000
      }
    });
    const mismatch = await runSourceWireLocalCli([
      "provider",
      "check",
      "--config",
      mismatchPath,
      "--connect"
    ]);
    assert.equal(mismatch.exitCode, 1);
    assert(!mismatch.result.ok);
    assert.equal(mismatch.result.error.code, "provider_profile_invalid");

    const multiNamespacePath = join(directory, "multi-namespace.json");
    await writeConfig(multiNamespacePath, {
      ...createLocalConfigTemplate({
        namespaceIds: ["ns_alpha", "ns_beta"]
      }),
      knowledgeProvider: {
        module: "@source-wire/local-runtime/synthetic-provider",
        exportName: "createSyntheticKnowledgeProvider",
        providerScopeId: "scope_docs_alpha",
        timeoutMs: 1_000
      }
    });
    const multiNamespace = await runSourceWireLocalCli([
      "provider",
      "check",
      "--config",
      multiNamespacePath,
      "--connect"
    ]);
    assert.equal(multiNamespace.exitCode, 1);
    assert(!multiNamespace.result.ok);
    assert.equal(
      multiNamespace.result.error.code,
      "provider_namespace_invalid"
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("memory-only MCP authority is an exact API-token allowlist", () => {
  const environment = createMemoryOnlyMcpEnvironment(
    "http://127.0.0.1:4318",
    "generated-process-token"
  );
  assert.deepEqual(environment, {
    SOURCE_WIRE_API_URL: "http://127.0.0.1:4318",
    SOURCE_WIRE_MCP_TOKEN: "generated-process-token",
    SOURCE_WIRE_MCP_TOOL_PROFILE: "memory_only"
  });
  for (const forbidden of [
    "SOURCE_WIRE_OWNER_TOKEN",
    "SOURCE_WIRE_DATABASE_URL",
    "SOURCE_WIRE_MIGRATOR_DATABASE_URL",
    "SOURCE_WIRE_STORY5_PROVIDER_MODULE",
    "DATABASE_URL"
  ]) {
    assert.equal(Object.hasOwn(environment, forbidden), false);
  }
});

test("provider MCP authority remains an exact API-token allowlist", () => {
  const environment = createMcpEnvironment(
    "http://127.0.0.1:4318",
    "generated-process-token",
    true
  );
  assert.deepEqual(environment, {
    SOURCE_WIRE_API_URL: "http://127.0.0.1:4318",
    SOURCE_WIRE_MCP_TOKEN: "generated-process-token",
    SOURCE_WIRE_MCP_TOOL_PROFILE: "provider"
  });
  for (const forbidden of [
    "SOURCE_WIRE_OWNER_TOKEN",
    "SOURCE_WIRE_DATABASE_URL",
    "SOURCE_WIRE_LOCAL_PROVIDER_MODULE",
    "SOURCE_WIRE_LOCAL_PROVIDER_EXPORT",
    "SOURCE_WIRE_LOCAL_PROVIDER_SCOPE_ID",
    "DATABASE_URL"
  ]) {
    assert.equal(Object.hasOwn(environment, forbidden), false);
  }
});

test("MCP startup fails before dependencies for ambiguous provider scope and missing authority", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const providerPath = join(directory, "provider.json");
    await writeConfig(providerPath, {
      ...createLocalConfigTemplate({
        namespaceIds: ["ns_alpha", "ns_beta"]
      }),
      knowledgeProvider: {
        module: "@example/source-wire-provider",
        exportName: "createProvider",
        providerScopeId: "scope_docs_alpha",
        timeoutMs: 1_000
      }
    });
    await assert.rejects(
      runLocalMcpStdio(["--config", providerPath], {}),
      (error: unknown) =>
        error instanceof SourceWireLocalCliError &&
        error.code === "provider_namespace_invalid"
    );

    const memoryOnlyPath = join(directory, "memory-only.json");
    await writeConfig(memoryOnlyPath, createLocalConfigTemplate());
    await assert.rejects(
      runLocalMcpStdio(["--config", memoryOnlyPath], {}),
      (error: unknown) =>
        error instanceof SourceWireLocalCliError &&
        error.code === "environment_missing"
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("local crash injection is unavailable outside locked Story 6 conformance", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const configPath = join(directory, "memory-only.json");
    await writeConfig(configPath, createLocalConfigTemplate());
    await assert.rejects(
      runLocalMcpStdio(
        ["--config", configPath],
        {
          SOURCE_WIRE_STORY6_LOCAL_FAULT: "api_after_credential"
        }
      ),
      (error: unknown) =>
        error instanceof SourceWireLocalCliError &&
        error.code === "environment_invalid"
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("database commands keep status and migration authority explicit before connection", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const configPath = join(directory, "memory-only.json");
    await writeConfig(configPath, createLocalConfigTemplate());

    const missingStatus = await runSourceWireLocalCli(
      ["database", "status", "--config", configPath],
      {}
    );
    assert.equal(missingStatus.exitCode, 1);
    assert(!missingStatus.result.ok);
    assert.equal(missingStatus.result.operation, "local.database.status");
    assert.equal(missingStatus.result.error.code, "environment_missing");

    const missingMigrator = await runSourceWireLocalCli(
      ["database", "migrate", "--config", configPath, "--apply"],
      {}
    );
    assert.equal(missingMigrator.exitCode, 1);
    assert(!missingMigrator.result.ok);
    assert.equal(
      missingMigrator.result.operation,
      "local.database.migrate"
    );
    assert.equal(missingMigrator.result.error.code, "environment_missing");

    const refusedFault = await runSourceWireLocalCli(
      ["database", "migrate", "--config", configPath, "--apply"],
      {
        SOURCE_WIRE_MIGRATOR_DATABASE_URL:
          "postgresql://migrator:secret@127.0.0.1:1/disposable",
        SOURCE_WIRE_STORY6_MIGRATION_FAULT: "after_first_migration"
      }
    );
    assert.equal(refusedFault.exitCode, 1);
    assert(!refusedFault.result.ok);
    assert.equal(refusedFault.result.error.code, "environment_invalid");
    assertNonSecretSurface(
      renderLocalCliResult(refusedFault.result, refusedFault.format)
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("database status rejects invalid compatibility selection before connection", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const configPath = join(directory, "memory-only.json");
    await writeConfig(configPath, createLocalConfigTemplate());
    const result = await runSourceWireLocalCli(
      ["database", "status", "--config", configPath],
      {
        SOURCE_WIRE_DATABASE_URL:
          "postgresql://runtime:unavailable-secret@127.0.0.1:1/disposable",
        SOURCE_WIRE_POSTGRES_COMPATIBILITY_MAJOR: "18"
      }
    );
    assert.equal(result.exitCode, 1);
    assert(!result.result.ok);
    assert.equal(result.result.operation, "local.database.status");
    assert.equal(result.result.error.code, "environment_invalid");
    const rendered = renderLocalCliResult(result.result, result.format);
    assertNonSecretSurface(rendered);
    assert.doesNotMatch(rendered, /unavailable-secret|127\.0\.0\.1|disposable/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("database status renderer exposes only bounded read-only PostgreSQL posture", () => {
  const result = {
    ok: true as const,
    operation: "local.database.status" as const,
    result: {
      schema: "source-wire.local-database-status.v1" as const,
      state: "compatible" as const,
      schemaState: "compatible" as const,
      postgresqlVersionNum: 180004,
      postgresqlSupport: "authoritative_18_4" as const,
      recoveryState: "primary" as const,
      inspectionMode: "read_only" as const,
      currentMigrations: [
        { version: 8, name: "0008_gate_b_durable_receipt_handoff.sql" }
      ],
      targetMigrations: [
        { version: 8, name: "0008_gate_b_durable_receipt_handoff.sql" }
      ],
      pendingMigrations: [],
      mutationApplied: false as const
    },
    warnings: []
  };
  const human = renderLocalCliResult(result, "human");
  assert.equal(
    human,
    [
      "ok local.database.status",
      "schema source-wire.local-database-status.v1",
      "state compatible",
      "schema-state compatible",
      "postgresql-version-num 180004",
      "postgresql-support authoritative_18_4",
      "recovery-state primary",
      "inspection-mode read_only",
      "current 8:0008_gate_b_durable_receipt_handoff.sql",
      "target 8:0008_gate_b_durable_receipt_handoff.sql",
      "pending none",
      "mutation-applied false",
      ""
    ].join("\n")
  );
  const json = renderLocalCliResult(result, "json");
  assertNonSecretSurface(human);
  assertNonSecretSurface(json);
  assert.doesNotMatch(
    `${human}${json}`,
    /postgresql:\/\/|password|hostname|databaseName|ready|backup|restore|rpo|rto/iu
  );
});

test("database result renderers expose only safe migration identity and mutation state", () => {
  const result = {
    ok: true as const,
    operation: "local.database.migrate" as const,
    result: {
      state: "pending" as const,
      currentMigrations: [
        { version: 1, name: "0001_story1_bootstrap.sql" }
      ],
      targetMigrations: [
        { version: 1, name: "0001_story1_bootstrap.sql" },
        { version: 2, name: "0002_story2_candidate_lifecycle.sql" }
      ],
      pendingMigrations: [
        { version: 2, name: "0002_story2_candidate_lifecycle.sql" }
      ],
      applyRequired: true,
      applyRequested: false,
      migrationResult: "not_applied" as const,
      mutationApplied: false
    },
    warnings: []
  };
  const human = renderLocalCliResult(result, "human");
  assert.match(human, /ok local\.database\.migrate/u);
  assert.match(human, /current 1:0001_story1_bootstrap\.sql/u);
  assert.match(human, /pending 2:0002_story2_candidate_lifecycle\.sql/u);
  assert.match(human, /apply-required true/u);
  assert.match(human, /mutation-applied false/u);
  assertNonSecretSurface(human);
  assertNonSecretSurface(renderLocalCliResult(result, "json"));
});

test("local export requires explicit scope, destination, and owner environment before database access", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const configPath = join(directory, "memory-only.json");
    const destination = join(directory, "portable.ndjson");
    await writeConfig(configPath, createLocalConfigTemplate());

    const invalid = await runSourceWireLocalCli(
      ["export", "--config", configPath, "--destination", destination],
      {}
    );
    assert.equal(invalid.exitCode, 1);
    assert(!invalid.result.ok);
    assert.equal(invalid.result.operation, "local.export");
    assert.equal(invalid.result.error.code, "invalid_arguments");

    const missing = await runSourceWireLocalCli(
      [
        "export",
        "--config",
        configPath,
        "--namespace-id",
        "namespace_local",
        "--destination",
        destination
      ],
      {}
    );
    assert.equal(missing.exitCode, 1);
    assert(!missing.result.ok);
    assert.equal(missing.result.operation, "local.export");
    assert.equal(missing.result.error.code, "environment_missing");

    const refusedFault = await runSourceWireLocalCli(
      [
        "export",
        "--config",
        configPath,
        "--namespace-id",
        "namespace_local",
        "--destination",
        destination
      ],
      {
        SOURCE_WIRE_STORY6_EXPORT_FAULT: "before_finalize"
      }
    );
    assert.equal(refusedFault.exitCode, 1);
    assert(!refusedFault.result.ok);
    assert.equal(refusedFault.result.error.code, "environment_invalid");
    assertNonSecretSurface(
      renderLocalCliResult(refusedFault.result, refusedFault.format)
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("local export result renderers expose integrity metadata without destination or authority", () => {
  const result = {
    ok: true as const,
    operation: "local.export" as const,
    result: {
      schema: "source-wire.local-export.v1" as const,
      status: "exported" as const,
      logicalStateSha256: "a".repeat(64),
      fileSha256: "b".repeat(64),
      governedRecordCount: 7,
      byteCount: 2048,
      namespaceCount: 2,
      existingFilePolicy: "reject" as const,
      uploaded: false as const
    },
    warnings: []
  };
  const human = renderLocalCliResult(result, "human");
  assert.match(human, /ok local\.export/u);
  assert.match(human, /namespace-count 2/u);
  assert.match(human, /existing-file-policy reject/u);
  assert.match(human, /uploaded false/u);
  assert.equal(human.includes("/private/"), false);
  assertNonSecretSurface(human);
  assertNonSecretSurface(renderLocalCliResult(result, "json"));
});

function plainConfig(): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(createLocalConfigTemplate())
  ) as Record<string, unknown>;
}

async function writeConfig(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, {
    mode: 0o600
  });
  await chmod(path, 0o600);
}

async function privateTemporaryDirectory(): Promise<string> {
  return realpath(await mkdtemp(join(tmpdir(), "source-wire-local-cli-")));
}

function assertNonSecretSurface(value: string): void {
  for (const forbidden of [
    "postgresql://",
    "apiKey",
    "bearer",
    "telemetry",
    "billing",
    "source-wire account",
    "https://api.source-wire"
  ]) {
    assert(
      !value.toLowerCase().includes(forbidden.toLowerCase()),
      `unexpected forbidden surface: ${forbidden}`
    );
  }
}

function restoreEnvironment(
  name: string,
  previousValue: string | undefined
): void {
  if (previousValue === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = previousValue;
  }
}
