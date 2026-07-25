export const SOURCE_WIRE_LOCAL_OPERATIONS = [
  "local.init",
  "local.doctor",
  "local.provider.check",
  "local.mcp.stdio"
] as const;

export type SourceWireLocalOperation =
  (typeof SOURCE_WIRE_LOCAL_OPERATIONS)[number];

export type SourceWireLocalCliWarningV1 = Readonly<{
  code: string;
  message: string;
}>;

export type SourceWireLocalCliResultV1<T = unknown> =
  | Readonly<{
      ok: true;
      operation: SourceWireLocalOperation;
      result: T;
      warnings: readonly SourceWireLocalCliWarningV1[];
    }>
  | Readonly<{
      ok: false;
      operation: SourceWireLocalOperation;
      error: Readonly<{
        code: SourceWireLocalErrorCode;
        message: string;
        retryable: boolean;
        detailsRedacted: true;
      }>;
    }>;

export type SourceWireLocalErrorCode =
  | "invalid_arguments"
  | "config_already_exists"
  | "config_path_unsafe"
  | "config_permissions_unsafe"
  | "config_unreadable"
  | "config_invalid"
  | "config_incompatible"
  | "provider_not_configured"
  | "provider_namespace_invalid"
  | "provider_load_failed"
  | "provider_profile_invalid"
  | "provider_readiness_failed"
  | "environment_missing"
  | "environment_invalid"
  | "database_unavailable"
  | "database_incompatible"
  | "api_unavailable"
  | "api_start_failed"
  | "credential_issue_failed"
  | "credential_revoke_failed"
  | "mcp_start_failed"
  | "composition_failed";

const ERROR_MESSAGES: Readonly<Record<SourceWireLocalErrorCode, string>> = {
  invalid_arguments: "The local command arguments are invalid.",
  config_already_exists: "The local configuration already exists.",
  config_path_unsafe: "The local configuration path is unsafe.",
  config_permissions_unsafe: "The local configuration permissions are unsafe.",
  config_unreadable: "The local configuration could not be read.",
  config_invalid: "The local configuration is invalid.",
  config_incompatible: "The local configuration is incompatible.",
  provider_not_configured:
    "The local configuration does not select a knowledge provider.",
  provider_namespace_invalid:
    "The Alpha provider composition requires exactly one configured namespace.",
  provider_load_failed:
    "The configured knowledge provider could not be loaded safely.",
  provider_profile_invalid:
    "The configured knowledge provider profile is incompatible.",
  provider_readiness_failed:
    "The configured knowledge provider readiness check failed safely.",
  environment_missing: "A required local environment value is missing.",
  environment_invalid: "A required local environment value is invalid.",
  database_unavailable: "The local PostgreSQL memory store is unavailable.",
  database_incompatible:
    "The local PostgreSQL memory store migration state is incompatible.",
  api_unavailable: "The loopback API operation is unavailable.",
  api_start_failed: "The loopback API did not start safely.",
  credential_issue_failed:
    "The process-scoped MCP credential could not be issued.",
  credential_revoke_failed:
    "The process-scoped MCP credential could not be revoked.",
  mcp_start_failed: "The stdio MCP process did not start safely.",
  composition_failed: "The local runtime composition stopped unexpectedly."
};

export class SourceWireLocalCliError extends Error {
  readonly code: SourceWireLocalErrorCode;
  readonly exitCode: 1;

  constructor(code: SourceWireLocalErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "SourceWireLocalCliError";
    this.code = code;
    this.exitCode = 1;
  }
}

export function localCliFailure(
  operation: SourceWireLocalOperation,
  error: unknown
): SourceWireLocalCliResultV1<never> {
  const safeError =
    error instanceof SourceWireLocalCliError
      ? error
      : new SourceWireLocalCliError("config_invalid");
  return {
    ok: false,
    operation,
    error: {
      code: safeError.code,
      message: safeError.message,
      retryable: false,
      detailsRedacted: true
    }
  };
}

export function renderLocalCliResult(
  result: SourceWireLocalCliResultV1,
  format: "human" | "json"
): string {
  if (format === "json") {
    return `${JSON.stringify(result)}\n`;
  }

  if (!result.ok) {
    return [
      `failed ${result.operation} ${result.error.code}`,
      result.error.message
    ].join("\n") + "\n";
  }

  if (result.operation === "local.init") {
    const value = result.result as {
      schema: string;
      nextCommand: string;
    };
    return [
      `ok ${result.operation}`,
      `schema ${value.schema}`,
      `next ${value.nextCommand}`
    ].join("\n") + "\n";
  }

  if (result.operation === "local.mcp.stdio") {
    return `ok ${result.operation}\n`;
  }

  if (result.operation === "local.provider.check") {
    const value = result.result as {
      contractVersion: string;
      executableLoaded: boolean;
      profileValidation: "deferred" | "passed";
      readiness: "skipped" | "ready";
      evidenceReleased: false;
    };
    return [
      `ok ${result.operation}`,
      `knowledge-provider ${value.contractVersion}`,
      `executable-loaded ${value.executableLoaded}`,
      `profile-validation ${value.profileValidation}`,
      `readiness ${value.readiness}`,
      `evidence-released ${value.evidenceReleased}`
    ].join("\n") + "\n";
  }

  const value = result.result as {
    schema: string;
    contractsPackageVersion: string;
    knowledgeProviderContractVersion: string;
    memoryStoreContractVersion: string;
    provider: "configured" | "none";
    mcpTransport: "stdio";
    apiBinding: "loopback";
    externalChecks: "skipped";
  };
  return [
    `ok ${result.operation}`,
    `schema ${value.schema}`,
    `contracts ${value.contractsPackageVersion}`,
    `knowledge-provider ${value.knowledgeProviderContractVersion}`,
    `memory-store ${value.memoryStoreContractVersion}`,
    `provider ${value.provider}`,
    `mcp ${value.mcpTransport}`,
    `api ${value.apiBinding}`,
    `external-checks ${value.externalChecks}`
  ].join("\n") + "\n";
}
