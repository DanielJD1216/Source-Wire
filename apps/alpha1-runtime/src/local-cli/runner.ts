import {
  SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
  SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION,
  SOURCE_WIRE_PACKAGE_VERSION
} from "@source-wire/contracts";
import { parseArgs } from "node:util";

import {
  createLocalConfigFile,
  createLocalConfigTemplate,
  readAndValidateLocalConfig,
  SOURCE_WIRE_LOCAL_CONFIG_SCHEMA
} from "./config.js";
import {
  localCliFailure,
  SourceWireLocalCliError,
  type SourceWireLocalCliResultV1,
  type SourceWireLocalOperation
} from "./result.js";
import {
  checkKnowledgeProviderReadiness,
  loadConfiguredKnowledgeProvider
} from "./provider.js";
import {
  applyLocalMigrations,
  inspectLocalDatabaseStatus,
  inspectLocalMigrationPlan,
  migrationPlanResult
} from "./database.js";

export type SourceWireLocalCliExecution = Readonly<{
  exitCode: 0 | 1;
  format: "human" | "json";
  result: SourceWireLocalCliResultV1;
}>;

export async function runSourceWireLocalCli(
  args: readonly string[],
  environment: NodeJS.ProcessEnv = process.env
): Promise<SourceWireLocalCliExecution> {
  const command = args[0];
  const operation: SourceWireLocalOperation =
    command === "doctor"
      ? "local.doctor"
      : command === "provider"
        ? "local.provider.check"
        : command === "database" && args[1] === "status"
          ? "local.database.status"
          : command === "database" && args[1] === "migrate"
            ? "local.database.migrate"
            : "local.init";
  try {
    if (command === "init") {
      const parsed = parseLocalArgs(args.slice(1), {
        config: { type: "string" },
        "owner-id": { type: "string" },
        "namespace-id": { type: "string", multiple: true },
        json: { type: "boolean", default: false }
      });
      const configPath = parsed.values.config;
      const ownerId = parsed.values["owner-id"];
      const namespaceIds = parsed.values["namespace-id"];
      if (
        typeof configPath !== "string" ||
        (ownerId !== undefined && typeof ownerId !== "string") ||
        (namespaceIds !== undefined &&
          (!Array.isArray(namespaceIds) ||
            namespaceIds.some((value) => typeof value !== "string")))
      ) {
        invalidArguments();
      }
      const validatedNamespaceIds =
        namespaceIds === undefined ? undefined : namespaceIds as string[];
      let config: ReturnType<typeof createLocalConfigTemplate>;
      try {
        config = createLocalConfigTemplate({
          ...(ownerId ? { ownerId } : {}),
          ...(validatedNamespaceIds
            ? { namespaceIds: validatedNamespaceIds }
            : {})
        });
      } catch {
        invalidArguments();
      }
      await createLocalConfigFile(configPath, config);
      return {
        exitCode: 0,
        format: parsed.values.json ? "json" : "human",
        result: {
          ok: true,
          operation,
          result: {
            schema: SOURCE_WIRE_LOCAL_CONFIG_SCHEMA,
            nextCommand: "source-wire-local doctor --config <path>"
          },
          warnings: []
        }
      };
    }

    if (command === "doctor") {
      const parsed = parseLocalArgs(args.slice(1), {
        config: { type: "string" },
        json: { type: "boolean", default: false }
      });
      const configPath = parsed.values.config;
      if (typeof configPath !== "string") invalidArguments();
      const config = await readAndValidateLocalConfig(configPath);
      return {
        exitCode: 0,
        format: parsed.values.json ? "json" : "human",
        result: {
          ok: true,
          operation,
          result: {
            schema: config.schema,
            contractsPackageVersion: SOURCE_WIRE_PACKAGE_VERSION,
            knowledgeProviderContractVersion:
              SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
            memoryStoreContractVersion:
              SOURCE_WIRE_MEMORY_STORE_CONTRACT_VERSION,
            provider: config.knowledgeProvider ? "configured" : "none",
            mcpTransport: "stdio",
            apiBinding: "loopback",
            externalChecks: "skipped",
            requiredEnvironmentReferenceCount: 3
          },
          warnings: []
        }
      };
    }

    if (command === "provider" && args[1] === "check") {
      const parsed = parseLocalArgs(args.slice(2), {
        config: { type: "string" },
        connect: { type: "boolean", default: false },
        json: { type: "boolean", default: false }
      });
      const configPath = parsed.values.config;
      if (typeof configPath !== "string") invalidArguments();
      const config = await readAndValidateLocalConfig(configPath);
      if (!config.knowledgeProvider) {
        throw new SourceWireLocalCliError("provider_not_configured");
      }
      if (config.namespaces.length !== 1) {
        throw new SourceWireLocalCliError("provider_namespace_invalid");
      }
      if (parsed.values.connect) {
        const loaded = await loadConfiguredKnowledgeProvider({ config });
        await checkKnowledgeProviderReadiness(loaded);
      }
      return {
        exitCode: 0,
        format: parsed.values.json ? "json" : "human",
        result: {
          ok: true,
          operation,
          result: {
            contractVersion:
              SOURCE_WIRE_KNOWLEDGE_PROVIDER_CONTRACT_VERSION,
            executableLoaded: parsed.values.connect,
            profileValidation: parsed.values.connect
              ? "passed"
              : "deferred",
            readiness: parsed.values.connect ? "ready" : "skipped",
            evidenceReleased: false
          },
          warnings: []
        }
      };
    }

    if (command === "database" && args[1] === "status") {
      const parsed = parseLocalArgs(args.slice(2), {
        config: { type: "string" },
        json: { type: "boolean", default: false }
      });
      const configPath = parsed.values.config;
      if (typeof configPath !== "string") invalidArguments();
      const config = await readAndValidateLocalConfig(configPath);
      const databaseUrl = requireLocalDatabaseUrl(
        config.memory.runtimeDatabaseUrlEnv,
        environment
      );
      const status = await inspectLocalDatabaseStatus(databaseUrl);
      return {
        exitCode: status.state === "compatible" ? 0 : 1,
        format: parsed.values.json ? "json" : "human",
        result: {
          ok: true,
          operation,
          result: status,
          warnings: []
        }
      };
    }

    if (command === "database" && args[1] === "migrate") {
      const parsed = parseLocalArgs(args.slice(2), {
        config: { type: "string" },
        apply: { type: "boolean", default: false },
        json: { type: "boolean", default: false }
      });
      const configPath = parsed.values.config;
      if (typeof configPath !== "string") invalidArguments();
      const config = await readAndValidateLocalConfig(configPath);
      const databaseUrl = requireLocalDatabaseUrl(
        config.memory.migratorDatabaseUrlEnv,
        environment
      );
      const fault = parseStory6MigrationFault(environment);
      const plan = await inspectLocalMigrationPlan(databaseUrl);
      const result = parsed.values.apply
        ? await applyLocalMigrations(
            databaseUrl,
            plan,
            fault === "after_first_migration"
              ? {
                  afterMigrationApplied: () => {
                    throw new SourceWireLocalCliError(
                      "database_migration_failed"
                    );
                  }
                }
              : {}
          )
        : migrationPlanResult(plan);
      return {
        exitCode: result.state === "incompatible" ? 1 : 0,
        format: parsed.values.json ? "json" : "human",
        result: {
          ok: true,
          operation,
          result,
          warnings: []
        }
      };
    }

    invalidArguments();
  } catch (error) {
    const format = args.includes("--json") ? "json" : "human";
    return {
      exitCode: 1,
      format,
      result: localCliFailure(operation, error)
    };
  }
}

function parseLocalArgs(
  args: readonly string[],
  options: NonNullable<Parameters<typeof parseArgs>[0]>["options"]
): ReturnType<typeof parseArgs> {
  try {
    return parseArgs({
      args: [...args],
      options,
      allowPositionals: false,
      strict: true
    });
  } catch {
    invalidArguments();
  }
}

function invalidArguments(): never {
  throw new SourceWireLocalCliError("invalid_arguments");
}

function requireLocalDatabaseUrl(
  environmentName: string,
  environment: NodeJS.ProcessEnv
): string {
  const value = environment[environmentName];
  if (!value) {
    throw new SourceWireLocalCliError("environment_missing");
  }
  try {
    const parsed = new URL(value);
    if (
      (parsed.protocol !== "postgres:" &&
        parsed.protocol !== "postgresql:") ||
      !parsed.username ||
      !parsed.hostname ||
      parsed.pathname.length <= 1
    ) {
      throw new Error("invalid");
    }
  } catch {
    throw new SourceWireLocalCliError("environment_invalid");
  }
  return value;
}

function parseStory6MigrationFault(
  environment: NodeJS.ProcessEnv
): "after_first_migration" | undefined {
  const value = environment.SOURCE_WIRE_STORY6_MIGRATION_FAULT;
  if (value === undefined) return undefined;
  if (
    environment.SOURCE_WIRE_CONFORMANCE_MODE !== "story6" ||
    value !== "after_first_migration"
  ) {
    throw new SourceWireLocalCliError("environment_invalid");
  }
  return value;
}
