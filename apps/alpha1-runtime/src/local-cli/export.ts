import { randomUUID } from "node:crypto";

import {
  MAX_PORTABLE_EXPORT_BYTES,
  assertSourceWireIdentifier,
  parseVerifierKey
} from "../config.js";
import { createRuntimeDatabase } from "../database.js";
import { SafeError } from "../errors.js";
import {
  exportPortableState,
  parsePortableExportRequest
} from "../portable-state.js";
import {
  authenticateCredential,
  recordAudit
} from "../repository.js";
import { writeSensitiveStreamAtomically } from "../safe-local-file.js";
import type { SourceWireLocalConfigV1 } from "./config.js";
import {
  inspectLocalDatabaseStatus,
  parseLocalPostgresCompatibilityMajor
} from "./database.js";
import { SourceWireLocalCliError } from "./result.js";

const OWNER_TOKEN_ENV = "SOURCE_WIRE_OWNER_TOKEN";

export type SourceWireLocalExportResultV1 = Readonly<{
  schema: "source-wire.local-export.v1";
  status: "exported";
  logicalStateSha256: string;
  fileSha256: string;
  governedRecordCount: number;
  byteCount: number;
  namespaceCount: number;
  existingFilePolicy: "reject" | "replace";
  uploaded: false;
}>;

export async function exportLocalPortableState(input: {
  config: SourceWireLocalConfigV1;
  namespaceIds: readonly string[];
  destination: string;
  existingFilePolicy: "reject" | "replace";
  environment: NodeJS.ProcessEnv;
  beforeFinalize?: () => void;
}): Promise<SourceWireLocalExportResultV1> {
  const request = parseExportRequest(input.namespaceIds);
  if (
    request.namespaceIds.some(
      (namespaceId) => !input.config.namespaces.includes(namespaceId)
    )
  ) {
    throw new SourceWireLocalCliError("export_authority_invalid");
  }

  const databaseUrl = requireDatabaseUrl(
    input.config.memory.runtimeDatabaseUrlEnv,
    input.environment
  );
  const verifierKey = requireVerifierKey(
    input.config.memory.verifierKeyEnv,
    input.environment
  );
  const verifierKeyId = requireVerifierKeyId(input.environment);
  const ownerToken = requireEnvironment(OWNER_TOKEN_ENV, input.environment);

  const compatiblePostgresMajor = parseLocalPostgresCompatibilityMajor(
    input.environment
  );
  const status = await inspectLocalDatabaseStatus(databaseUrl, {
    ...(compatiblePostgresMajor === undefined
      ? {}
      : { compatiblePostgresMajor })
  });
  if (status.state !== "compatible") {
    throw new SourceWireLocalCliError("database_incompatible");
  }

  const database = createRuntimeDatabase(databaseUrl);
  try {
    const actor = await authenticateOwner(
      database,
      verifierKey,
      verifierKeyId,
      ownerToken,
      input.config.ownerId
    );
    const bundle = await exportPortableState(
      database.pool,
      actor,
      request
    );
    await recordAudit(database.pool, {
      traceId: randomUUID(),
      operation: "export_portable_state",
      result: "allowed",
      actor,
      metadata: {
        namespaceCount: request.namespaceIds.length,
        governedRecordCount: bundle.governedRecordCount,
        logicalStateSha256: bundle.logicalStateSha256
      }
    });
    const writeResult = await writeSensitiveStreamAtomically(
      input.destination,
      (async function* () {
        yield bundle.bytes;
      })(),
      MAX_PORTABLE_EXPORT_BYTES,
      undefined,
      input.beforeFinalize,
      input.existingFilePolicy
    );
    return {
      schema: "source-wire.local-export.v1",
      status: "exported",
      logicalStateSha256: bundle.logicalStateSha256,
      fileSha256: bundle.fileSha256,
      governedRecordCount: bundle.governedRecordCount,
      byteCount: writeResult.byteCount,
      namespaceCount: request.namespaceIds.length,
      existingFilePolicy: input.existingFilePolicy,
      uploaded: false
    };
  } catch (error) {
    throw mapExportError(error);
  } finally {
    await database.pool.end().catch(() => undefined);
  }
}

function parseExportRequest(namespaceIds: readonly string[]) {
  try {
    return parsePortableExportRequest({
      namespaceIds: [...namespaceIds]
    });
  } catch {
    throw new SourceWireLocalCliError("invalid_arguments");
  }
}

async function authenticateOwner(
  database: ReturnType<typeof createRuntimeDatabase>,
  verifierKey: Buffer,
  verifierKeyId: string,
  ownerToken: string,
  ownerId: string
) {
  try {
    const actor = await authenticateCredential(
      database,
      verifierKey,
      verifierKeyId,
      `Bearer ${ownerToken}`
    );
    if (actor.ownerId !== ownerId) {
      throw new SourceWireLocalCliError("export_authority_invalid");
    }
    return actor;
  } catch (error) {
    if (error instanceof SourceWireLocalCliError) throw error;
    throw new SourceWireLocalCliError("export_authority_invalid");
  }
}

function requireDatabaseUrl(
  environmentName: string,
  environment: NodeJS.ProcessEnv
): string {
  const value = requireEnvironment(environmentName, environment);
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

function requireVerifierKey(
  environmentName: string,
  environment: NodeJS.ProcessEnv
): Buffer {
  const value = requireEnvironment(environmentName, environment);
  try {
    return parseVerifierKey(value);
  } catch {
    throw new SourceWireLocalCliError("environment_invalid");
  }
}

function requireVerifierKeyId(environment: NodeJS.ProcessEnv): string {
  try {
    return assertSourceWireIdentifier(
      environment.SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID ?? "local_alpha1",
      "verifierKeyId"
    );
  } catch {
    throw new SourceWireLocalCliError("environment_invalid");
  }
}

function requireEnvironment(
  environmentName: string,
  environment: NodeJS.ProcessEnv
): string {
  const value = environment[environmentName];
  if (!value) {
    throw new SourceWireLocalCliError("environment_missing");
  }
  return value;
}

function mapExportError(error: unknown): SourceWireLocalCliError {
  if (error instanceof SourceWireLocalCliError) return error;
  const message = error instanceof Error ? error.message : "";
  if (message === "safe_local_file_exists") {
    return new SourceWireLocalCliError("export_destination_exists");
  }
  if (message === "safe_local_file_invalid") {
    return new SourceWireLocalCliError("export_destination_unsafe");
  }
  if (
    error instanceof SafeError &&
    [
      "authentication_required",
      "credential_invalid",
      "credential_expired",
      "credential_revoked",
      "capability_not_allowed",
      "namespace_required",
      "namespace_not_allowed"
    ].includes(error.code)
  ) {
    return new SourceWireLocalCliError("export_authority_invalid");
  }
  return new SourceWireLocalCliError("export_failed");
}
