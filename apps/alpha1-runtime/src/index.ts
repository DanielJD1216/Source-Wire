import {
  createLocalConfigFile,
  createLocalConfigTemplate,
  readAndValidateLocalConfig,
  serializeLocalConfig,
  type SourceWireLocalConfigV1
} from "./local-cli/config.js";
import { runLocalMcpStdio } from "./local-cli/mcp-stdio.js";

export {
  SOURCE_WIRE_LOCAL_CONFIG_SCHEMA,
  SOURCE_WIRE_LOCAL_CONTRACTS_PACKAGE,
  SOURCE_WIRE_LOCAL_DEFAULT_CONFIG_NAME,
  createLocalConfigFile,
  createLocalConfigTemplate,
  readAndValidateLocalConfig,
  serializeLocalConfig,
  validateLocalConfig,
  type SourceWireLocalConfigV1,
  type SourceWireLocalKnowledgeProviderConfigV1
} from "./local-cli/config.js";
export {
  SOURCE_WIRE_LOCAL_OPERATIONS,
  SourceWireLocalCliError,
  type SourceWireLocalCliResultV1,
  type SourceWireLocalCliWarningV1,
  type SourceWireLocalErrorCode,
  type SourceWireLocalOperation
} from "./local-cli/result.js";

export type SourceWireLocalEnvironment = Readonly<
  Record<string, string | undefined>
>;

export type SourceWireLocalRuntimeOptions = Readonly<{
  configPath: string;
  environment?: SourceWireLocalEnvironment;
}>;

export type SourceWireLocalRuntimeInspection = Readonly<{
  schema: SourceWireLocalConfigV1["schema"];
  ownerId: string;
  namespaceIds: readonly string[];
  memoryKind: SourceWireLocalConfigV1["memory"]["kind"];
  knowledgeProviderConfigured: boolean;
  providerScopeId?: string;
  mcpTransport: SourceWireLocalConfigV1["mcp"]["transport"];
  apiHost: SourceWireLocalConfigV1["api"]["host"];
}>;

export interface SourceWireLocalRuntime {
  inspect(): Promise<SourceWireLocalRuntimeInspection>;
  startStdioMcp(): Promise<0 | 1>;
}

export function createSourceWireLocalRuntime(
  options: SourceWireLocalRuntimeOptions
): SourceWireLocalRuntime {
  const immutableOptions = Object.freeze({
    configPath: options.configPath,
    environment: Object.freeze({ ...(options.environment ?? process.env) })
  });
  return Object.freeze({
    async inspect(): Promise<SourceWireLocalRuntimeInspection> {
      const config = await readAndValidateLocalConfig(
        immutableOptions.configPath
      );
      return inspectLocalConfig(config);
    },
    async startStdioMcp(): Promise<0 | 1> {
      return runLocalMcpStdio(
        ["--config", immutableOptions.configPath],
        immutableOptions.environment
      );
    }
  });
}

export const initializeSourceWireLocalConfig = createLocalConfigFile;
export const createSourceWireLocalConfig = createLocalConfigTemplate;
export const encodeSourceWireLocalConfig = serializeLocalConfig;

function inspectLocalConfig(
  config: SourceWireLocalConfigV1
): SourceWireLocalRuntimeInspection {
  return Object.freeze({
    schema: config.schema,
    ownerId: config.ownerId,
    namespaceIds: Object.freeze([...config.namespaces]),
    memoryKind: config.memory.kind,
    knowledgeProviderConfigured: config.knowledgeProvider !== undefined,
    ...(config.knowledgeProvider
      ? { providerScopeId: config.knowledgeProvider.providerScopeId }
      : {}),
    mcpTransport: config.mcp.transport,
    apiHost: config.api.host
  });
}
