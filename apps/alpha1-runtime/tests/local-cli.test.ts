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

test("compiled private binary emits deterministic JSON and leaves the public contracts CLI boundary intact", async () => {
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
