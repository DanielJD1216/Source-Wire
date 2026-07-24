import { parseArgs } from "node:util";

import {
  assertSourceWireIdentifier,
  MAX_PORTABLE_EXPORT_BYTES,
  PORTABLE_RESTORE_TIMEOUT_MS,
  parseVerifierKey,
  requireEnvironment
} from "../config.js";
import { createOperatorPool } from "../database.js";
import { asSafeError } from "../errors.js";
import { initializeFreshTarget } from "../initialize.js";
import {
  applyAlpha1Migrations,
  inspectSchemaCompatibilityAsMigrator,
  readAlpha1Migrations
} from "../migration.js";
import {
  initializeFromPortableExport,
  recoverPhysicalBackup,
  verifyRecoveredInstallation,
  type RecoveryResult
} from "../portable-recovery.js";
import {
  readBoundedRegularFile,
  writeSensitiveBufferAtomically
} from "../safe-local-file.js";

async function main(): Promise<void> {
  const command = process.argv[2];
  const databaseUrl = requireEnvironment("SOURCE_WIRE_MIGRATOR_DATABASE_URL");
  const pool = createOperatorPool(databaseUrl, PORTABLE_RESTORE_TIMEOUT_MS);

  try {
    if (command === "migrate") {
      printJson(await applyAlpha1Migrations(pool));
      return;
    }

    if (command === "migration-status") {
      const compatibility = await inspectSchemaCompatibilityAsMigrator(pool);
      const migrations = await readAlpha1Migrations();
      printJson({
        compatibility,
        expectedMigrations: migrations.map(({ version, name, checksumSha256 }) => ({
          version,
          name,
          checksumSha256
        }))
      });
      if (!compatibility.compatible) {
        process.exitCode = 1;
      }
      return;
    }

    if (command === "initialize") {
      const parsed = parseArgs({
        args: process.argv.slice(3),
        options: {
          "owner-id": { type: "string" },
          "namespace-id": { type: "string", multiple: true },
          "expires-at": { type: "string" },
          "from-export": { type: "string" },
          "expected-logical-state-sha256": { type: "string" },
          "operation-key": { type: "string" },
          "secret-output": { type: "string" }
        },
        strict: true
      });
      const verifierKey = parseVerifierKey(process.env.SOURCE_WIRE_TOKEN_VERIFIER_KEY);
      const verifierKeyId = assertSourceWireIdentifier(
        process.env.SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID ?? "local_alpha1",
        "verifierKeyId"
      );
      const expiresAt = parseOptionalTimestamp(parsed.values["expires-at"]);
      const fromExport = parsed.values["from-export"];
      if (fromExport) {
        if (
          parsed.values["owner-id"] ||
          parsed.values["namespace-id"] ||
          !parsed.values["expected-logical-state-sha256"] ||
          !parsed.values["operation-key"] ||
          !parsed.values["secret-output"]
        ) {
          throw new Error("validation_failed:initialize");
        }
        await applyAlpha1Migrations(pool);
        const bytes = await readBoundedRegularFile(
          fromExport,
          MAX_PORTABLE_EXPORT_BYTES
        );
        const input: Parameters<typeof initializeFromPortableExport>[1] = {
          bytes,
          expectedLogicalStateSha256:
            parsed.values["expected-logical-state-sha256"],
          operationKey: parsed.values["operation-key"],
          verifierKey,
          verifierKeyId
        };
        if (expiresAt) input.expiresAt = expiresAt;
        const result = await initializeFromPortableExport(pool, input);
        await writeRecoverySecret(parsed.values["secret-output"], result);
        printJson(safeRecoveryResult(result));
        return;
      }
      if (
        parsed.values["expected-logical-state-sha256"] ||
        parsed.values["operation-key"] ||
        parsed.values["secret-output"]
      ) {
        throw new Error("validation_failed:initialize");
      }
      const ownerId = assertSourceWireIdentifier(parsed.values["owner-id"], "ownerId");
      const namespaceIds = parsed.values["namespace-id"] ?? [];
      const input: Parameters<typeof initializeFreshTarget>[1] = {
        ownerId,
        namespaceIds,
        verifierKey,
        verifierKeyId
      };
      if (expiresAt) input.expiresAt = expiresAt;
      printJson(await initializeFreshTarget(pool, input));
      return;
    }

    if (command === "recover") {
      const parsed = parseArgs({
        args: process.argv.slice(3),
        options: {
          "operation-key": { type: "string" },
          "secret-output": { type: "string" },
          "expires-at": { type: "string" }
        },
        strict: true
      });
      if (
        !parsed.values["operation-key"] ||
        !parsed.values["secret-output"]
      ) {
        throw new Error("validation_failed:recover");
      }
      const verifierKey = parseVerifierKey(
        process.env.SOURCE_WIRE_TOKEN_VERIFIER_KEY
      );
      const verifierKeyId = assertSourceWireIdentifier(
        process.env.SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID ?? "local_alpha1",
        "verifierKeyId"
      );
      await applyAlpha1Migrations(pool);
      const input: Parameters<typeof recoverPhysicalBackup>[1] = {
        operationKey: parsed.values["operation-key"],
        verifierKey,
        verifierKeyId
      };
      const expiresAt = parseOptionalTimestamp(parsed.values["expires-at"]);
      if (expiresAt) input.expiresAt = expiresAt;
      const result = await recoverPhysicalBackup(pool, input);
      await writeRecoverySecret(parsed.values["secret-output"], result);
      printJson(safeRecoveryResult(result));
      return;
    }

    if (command === "verify-recovery") {
      const parsed = parseArgs({
        args: process.argv.slice(3),
        options: {
          "credential-file": { type: "string" },
          "expected-logical-state-sha256": { type: "string" }
        },
        strict: true
      });
      const credentialFile = parsed.values["credential-file"];
      if (!credentialFile) {
        throw new Error("validation_failed:credentialFile");
      }
      const tokenBytes = await readBoundedRegularFile(credentialFile, 1_024);
      const token = readExactSecretToken(tokenBytes);
      const verifierKey = parseVerifierKey(
        process.env.SOURCE_WIRE_TOKEN_VERIFIER_KEY
      );
      const verifierKeyId = assertSourceWireIdentifier(
        process.env.SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID ?? "local_alpha1",
        "verifierKeyId"
      );
      const input: Parameters<typeof verifyRecoveredInstallation>[1] = {
        ownerAdminToken: token,
        verifierKey,
        verifierKeyId
      };
      if (parsed.values["expected-logical-state-sha256"]) {
        input.expectedLogicalStateSha256 =
          parsed.values["expected-logical-state-sha256"];
      }
      printJson(await verifyRecoveredInstallation(pool, input));
      return;
    }

    throw new Error("validation_failed:command");
  } finally {
    await pool.end();
  }
}

void main().catch((error) => {
  const safeError = asSafeError(error);
  printJson({
    error: {
      code: safeError.code,
      message: "The requested operator action could not be completed.",
      retryable: safeError.retryable
    }
  });
  process.exitCode = 1;
});

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function parseOptionalTimestamp(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString() !== value
  ) {
    throw new Error("validation_failed:expiresAt");
  }
  return parsed;
}

async function writeRecoverySecret(
  destination: string,
  result: RecoveryResult
): Promise<void> {
  await writeSensitiveBufferAtomically(
    destination,
    Buffer.from(`${result.ownerAdminCredential.secret}\n`, "utf8"),
    1_024
  );
}

function safeRecoveryResult(
  result: RecoveryResult
): Omit<RecoveryResult, "ownerAdminCredential"> & {
  ownerAdminCredential: Omit<RecoveryResult["ownerAdminCredential"], "secret">;
} {
  const { secret: _secret, ...credential } = result.ownerAdminCredential;
  return {
    ...result,
    ownerAdminCredential: credential
  };
}

function readExactSecretToken(bytes: Buffer): string {
  const text = bytes.toString("utf8");
  if (
    !text.endsWith("\n") ||
    text.includes("\r") ||
    text.includes("\u0000") ||
    text.slice(0, -1).includes("\n")
  ) {
    throw new Error("validation_failed:credentialFile");
  }
  return text.slice(0, -1);
}
