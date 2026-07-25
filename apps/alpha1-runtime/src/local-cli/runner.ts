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

export type SourceWireLocalCliExecution = Readonly<{
  exitCode: 0 | 1;
  format: "human" | "json";
  result: SourceWireLocalCliResultV1;
}>;

export async function runSourceWireLocalCli(
  args: readonly string[]
): Promise<SourceWireLocalCliExecution> {
  const command = args[0];
  const operation: SourceWireLocalOperation =
    command === "doctor" ? "local.doctor" : "local.init";
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
