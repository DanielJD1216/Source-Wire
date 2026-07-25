import {
  SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
  SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION,
  SOURCE_WIRE_PACKAGE_VERSION
} from "@source-wire/contracts";
import {
  constants,
  lstat,
  open,
  realpath,
  unlink
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

import { assertLoopbackHost, assertSourceWireIdentifier } from "../config.js";
import { readBoundedRegularFile } from "../safe-local-file.js";
import { parseStrictJsonObject } from "../strict-json.js";
import { SourceWireLocalCliError } from "./result.js";

export const SOURCE_WIRE_LOCAL_CONFIG_SCHEMA = "source-wire.local.v1" as const;
export const SOURCE_WIRE_LOCAL_CONFIG_MAX_BYTES = 32 * 1024;
export const SOURCE_WIRE_LOCAL_CONTRACTS_PACKAGE =
  "@source-wire/contracts" as const;
export const SOURCE_WIRE_LOCAL_DEFAULT_CONFIG_NAME =
  "source-wire.local.json" as const;

const ENVIRONMENT_VARIABLE_NAME = /^[A-Z][A-Z0-9_]{1,127}$/u;
const PROVIDER_MODULE =
  /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*(?:\/[A-Za-z0-9._-]+)*$/u;
const JAVASCRIPT_EXPORT = /^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/u;
const MAX_NAMESPACES = 64;
const MAX_PROVIDER_TIMEOUT_MS = 5_000;

export type SourceWireLocalConfigV1 = Readonly<{
  schema: typeof SOURCE_WIRE_LOCAL_CONFIG_SCHEMA;
  compatibility: Readonly<{
    contractsPackage: typeof SOURCE_WIRE_LOCAL_CONTRACTS_PACKAGE;
    contractsPackageVersion: typeof SOURCE_WIRE_PACKAGE_VERSION;
    knowledgeProviderContractVersion:
      typeof SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION;
    memoryStoreContractVersion:
      typeof SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION;
  }>;
  ownerId: string;
  namespaces: readonly string[];
  memory: Readonly<{
    kind: "postgres";
    runtimeDatabaseUrlEnv: string;
    migratorDatabaseUrlEnv: string;
    verifierKeyEnv: string;
  }>;
  knowledgeProvider?: Readonly<{
    module: string;
    exportName: string;
    providerScopeId: string;
    timeoutMs: number;
  }>;
  mcp: Readonly<{
    transport: "stdio";
  }>;
  api: Readonly<{
    host: "127.0.0.1" | "::1";
    port: number | "auto";
  }>;
}>;

export function createLocalConfigTemplate(input?: {
  ownerId?: string;
  namespaceIds?: readonly string[];
}): SourceWireLocalConfigV1 {
  const ownerId = assertLocalIdentifier(
    input?.ownerId ?? "owner_local",
    "ownerId"
  );
  const namespaces = validateNamespaces(
    input?.namespaceIds ?? ["namespace_local"]
  );
  return {
    schema: SOURCE_WIRE_LOCAL_CONFIG_SCHEMA,
    compatibility: {
      contractsPackage: SOURCE_WIRE_LOCAL_CONTRACTS_PACKAGE,
      contractsPackageVersion: SOURCE_WIRE_PACKAGE_VERSION,
      knowledgeProviderContractVersion:
        SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
      memoryStoreContractVersion: SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION
    },
    ownerId,
    namespaces,
    memory: {
      kind: "postgres",
      runtimeDatabaseUrlEnv: "SOURCE_WIRE_DATABASE_URL",
      migratorDatabaseUrlEnv: "SOURCE_WIRE_MIGRATOR_DATABASE_URL",
      verifierKeyEnv: "SOURCE_WIRE_TOKEN_VERIFIER_KEY"
    },
    mcp: {
      transport: "stdio"
    },
    api: {
      host: "127.0.0.1",
      port: "auto"
    }
  };
}

export function serializeLocalConfig(config: SourceWireLocalConfigV1): Buffer {
  return Buffer.from(`${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export async function createLocalConfigFile(
  requestedPath: string,
  config: SourceWireLocalConfigV1
): Promise<void> {
  const destination = await validateNewConfigPath(requestedPath);
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  let created = false;
  try {
    handle = await open(
      destination,
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_WRONLY |
      noFollowFlag(),
      0o600
    );
    created = true;
    await handle.writeFile(serializeLocalConfig(config));
    await handle.sync();
    await handle.chmod(0o600);
    await handle.close();
    handle = undefined;
    const parentHandle = await open(dirname(destination), constants.O_RDONLY);
    try {
      await parentHandle.sync();
    } finally {
      await parentHandle.close();
    }
  } catch (error) {
    await handle?.close().catch(() => undefined);
    if (created) {
      await unlink(destination).catch(() => undefined);
    }
    if (readErrorCode(error) === "EEXIST") {
      throw new SourceWireLocalCliError("config_already_exists");
    }
    if (error instanceof SourceWireLocalCliError) throw error;
    throw new SourceWireLocalCliError("config_path_unsafe");
  }
}

export async function readAndValidateLocalConfig(
  requestedPath: string
): Promise<SourceWireLocalConfigV1> {
  const requested = resolveRequestedPath(requestedPath);
  let before: Awaited<ReturnType<typeof lstat>>;
  try {
    before = await lstat(requested);
  } catch {
    throw new SourceWireLocalCliError("config_unreadable");
  }
  if (
    !before.isFile() ||
    before.isSymbolicLink() ||
    before.nlink !== 1
  ) {
    throw new SourceWireLocalCliError("config_path_unsafe");
  }
  if ((before.mode & 0o022) !== 0) {
    throw new SourceWireLocalCliError("config_permissions_unsafe");
  }
  try {
    const path = await realpath(requested);
    const canonical = await lstat(path);
    if (
      canonical.dev !== before.dev ||
      canonical.ino !== before.ino ||
      canonical.nlink !== before.nlink
    ) {
      throw new SourceWireLocalCliError("config_path_unsafe");
    }
    const bytes = await readBoundedRegularFile(
      path,
      SOURCE_WIRE_LOCAL_CONFIG_MAX_BYTES
    );
    return validateLocalConfig(parseStrictJsonObject(bytes));
  } catch (error) {
    if (error instanceof SourceWireLocalCliError) throw error;
    if (readErrorCode(error) === "EACCES") {
      throw new SourceWireLocalCliError("config_unreadable");
    }
    throw new SourceWireLocalCliError("config_invalid");
  }
}

export function validateLocalConfig(
  value: Record<string, unknown>
): SourceWireLocalConfigV1 {
  assertExactKeys(value, [
    "schema",
    "compatibility",
    "ownerId",
    "namespaces",
    "memory",
    "knowledgeProvider",
    "mcp",
    "api"
  ], ["knowledgeProvider"]);

  if (value.schema !== SOURCE_WIRE_LOCAL_CONFIG_SCHEMA) invalidConfig();
  const compatibility = requireObject(value.compatibility);
  assertExactKeys(compatibility, [
    "contractsPackage",
    "contractsPackageVersion",
    "knowledgeProviderContractVersion",
    "memoryStoreContractVersion"
  ]);
  if (
    compatibility.contractsPackage !==
      SOURCE_WIRE_LOCAL_CONTRACTS_PACKAGE ||
    compatibility.contractsPackageVersion !== SOURCE_WIRE_PACKAGE_VERSION ||
    compatibility.knowledgeProviderContractVersion !==
      SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION ||
    compatibility.memoryStoreContractVersion !==
      SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION
  ) {
    throw new SourceWireLocalCliError("config_incompatible");
  }

  const ownerId = assertLocalIdentifier(value.ownerId, "ownerId");
  const namespaces = validateNamespaces(value.namespaces);

  const memory = requireObject(value.memory);
  assertExactKeys(memory, [
    "kind",
    "runtimeDatabaseUrlEnv",
    "migratorDatabaseUrlEnv",
    "verifierKeyEnv"
  ]);
  if (memory.kind !== "postgres") invalidConfig();
  const runtimeDatabaseUrlEnv = assertEnvironmentReference(
    memory.runtimeDatabaseUrlEnv
  );
  const migratorDatabaseUrlEnv = assertEnvironmentReference(
    memory.migratorDatabaseUrlEnv
  );
  const verifierKeyEnv = assertEnvironmentReference(memory.verifierKeyEnv);
  if (
    new Set([
      runtimeDatabaseUrlEnv,
      migratorDatabaseUrlEnv,
      verifierKeyEnv
    ]).size !== 3
  ) {
    invalidConfig();
  }

  const mcp = requireObject(value.mcp);
  assertExactKeys(mcp, ["transport"]);
  if (mcp.transport !== "stdio") invalidConfig();

  const api = requireObject(value.api);
  assertExactKeys(api, ["host", "port"]);
  let host: "127.0.0.1" | "::1";
  try {
    host = assertLoopbackHost(String(api.host));
  } catch {
    invalidConfig();
  }
  const port =
    api.port === "auto"
      ? "auto"
      : typeof api.port === "number" &&
          Number.isInteger(api.port) &&
          api.port >= 1 &&
          api.port <= 65_535
        ? api.port
        : invalidConfig();

  const base: SourceWireLocalConfigV1 = {
    schema: SOURCE_WIRE_LOCAL_CONFIG_SCHEMA,
    compatibility: {
      contractsPackage: SOURCE_WIRE_LOCAL_CONTRACTS_PACKAGE,
      contractsPackageVersion: SOURCE_WIRE_PACKAGE_VERSION,
      knowledgeProviderContractVersion:
        SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
      memoryStoreContractVersion: SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION
    },
    ownerId,
    namespaces,
    memory: {
      kind: "postgres" as const,
      runtimeDatabaseUrlEnv,
      migratorDatabaseUrlEnv,
      verifierKeyEnv
    },
    mcp: {
      transport: "stdio" as const
    },
    api: {
      host,
      port
    }
  };

  if (value.knowledgeProvider === undefined) return base;
  const provider = requireObject(value.knowledgeProvider);
  assertExactKeys(provider, [
    "module",
    "exportName",
    "providerScopeId",
    "timeoutMs"
  ]);
  if (
    typeof provider.module !== "string" ||
    Buffer.byteLength(provider.module, "utf8") > 214 ||
    !PROVIDER_MODULE.test(provider.module) ||
    provider.module.split("/").some((part) => part === "." || part === "..")
  ) {
    invalidConfig();
  }
  if (
    typeof provider.exportName !== "string" ||
    !JAVASCRIPT_EXPORT.test(provider.exportName)
  ) {
    invalidConfig();
  }
  const providerScopeId = assertLocalIdentifier(
    provider.providerScopeId,
    "providerScopeId"
  );
  if (
    typeof provider.timeoutMs !== "number" ||
    !Number.isInteger(provider.timeoutMs) ||
    provider.timeoutMs < 1 ||
    provider.timeoutMs > MAX_PROVIDER_TIMEOUT_MS
  ) {
    invalidConfig();
  }
  return {
    ...base,
    knowledgeProvider: {
      module: provider.module,
      exportName: provider.exportName,
      providerScopeId,
      timeoutMs: provider.timeoutMs
    }
  };
}

async function validateNewConfigPath(requestedPath: string): Promise<string> {
  const requested = resolveRequestedPath(requestedPath);
  const requestedParent = dirname(requested);
  let parent: string;
  try {
    parent = await realpath(requestedParent);
  } catch {
    throw new SourceWireLocalCliError("config_path_unsafe");
  }
  let parentStat: Awaited<ReturnType<typeof lstat>>;
  try {
    parentStat = await lstat(parent);
  } catch {
    throw new SourceWireLocalCliError("config_path_unsafe");
  }
  if (
    !parentStat.isDirectory() ||
    parentStat.isSymbolicLink() ||
    (parentStat.mode & 0o002) !== 0
  ) {
    throw new SourceWireLocalCliError("config_path_unsafe");
  }
  const path = join(parent, basename(requested));
  try {
    await lstat(requested);
    throw new SourceWireLocalCliError("config_already_exists");
  } catch (error) {
    if (error instanceof SourceWireLocalCliError) throw error;
    if (readErrorCode(error) !== "ENOENT") {
      throw new SourceWireLocalCliError("config_path_unsafe");
    }
  }
  if (path !== requested) {
    try {
      await lstat(path);
      throw new SourceWireLocalCliError("config_already_exists");
    } catch (error) {
      if (error instanceof SourceWireLocalCliError) throw error;
      if (readErrorCode(error) !== "ENOENT") {
        throw new SourceWireLocalCliError("config_path_unsafe");
      }
    }
  }
  return path;
}

function resolveRequestedPath(requestedPath: string): string {
  if (
    typeof requestedPath !== "string" ||
    requestedPath.length < 1 ||
    requestedPath.includes("\0")
  ) {
    throw new SourceWireLocalCliError("config_path_unsafe");
  }
  return resolve(requestedPath);
}

function validateNamespaces(value: unknown): readonly string[] {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > MAX_NAMESPACES
  ) {
    invalidConfig();
  }
  const namespaces = value.map((entry) =>
    assertLocalIdentifier(entry, "namespaceId")
  );
  if (new Set(namespaces).size !== namespaces.length) invalidConfig();
  return namespaces;
}

function assertLocalIdentifier(value: unknown, field: string): string {
  try {
    return assertSourceWireIdentifier(value, field);
  } catch {
    invalidConfig();
  }
}

function assertEnvironmentReference(value: unknown): string {
  if (typeof value !== "string" || !ENVIRONMENT_VARIABLE_NAME.test(value)) {
    invalidConfig();
  }
  return value;
}

function requireObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalidConfig();
  }
  return value as Record<string, unknown>;
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  optional: readonly string[] = []
): void {
  const keys = Object.keys(value);
  if (keys.some((key) => !allowed.includes(key))) invalidConfig();
  for (const key of allowed) {
    if (!optional.includes(key) && !Object.hasOwn(value, key)) invalidConfig();
  }
}

function readErrorCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";
}

function noFollowFlag(): number {
  return "O_NOFOLLOW" in constants ? constants.O_NOFOLLOW : 0;
}

function invalidConfig(): never {
  throw new SourceWireLocalCliError("config_invalid");
}
