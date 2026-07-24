import { parseArgs } from "node:util";

import {
  assertSourceWireIdentifier,
  parseVerifierKey,
  requireEnvironment
} from "../config.js";
import { createOperatorPool } from "../database.js";
import { asSafeError } from "../errors.js";
import { initializeFreshTarget } from "../initialize.js";
import {
  applyStory1Migration,
  inspectSchemaCompatibilityAsMigrator,
  readStory1Migration
} from "../migration.js";

async function main(): Promise<void> {
  const command = process.argv[2];
  const databaseUrl = requireEnvironment("SOURCE_WIRE_MIGRATOR_DATABASE_URL");
  const pool = createOperatorPool(databaseUrl);

  try {
    if (command === "migrate") {
      printJson(await applyStory1Migration(pool));
      return;
    }

    if (command === "migration-status") {
      const compatibility = await inspectSchemaCompatibilityAsMigrator(pool);
      const migration = await readStory1Migration();
      printJson({
        compatibility,
        expectedChecksumSha256: migration.checksumSha256
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
          "expires-at": { type: "string" }
        },
        strict: true
      });
      const ownerId = assertSourceWireIdentifier(parsed.values["owner-id"], "ownerId");
      const namespaceIds = parsed.values["namespace-id"] ?? [];
      const verifierKey = parseVerifierKey(process.env.SOURCE_WIRE_TOKEN_VERIFIER_KEY);
      const verifierKeyId = assertSourceWireIdentifier(
        process.env.SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID ?? "local_alpha1",
        "verifierKeyId"
      );
      const expiresAtValue = parsed.values["expires-at"];
      const input: Parameters<typeof initializeFreshTarget>[1] = {
        ownerId,
        namespaceIds,
        verifierKey,
        verifierKeyId
      };
      if (expiresAtValue) {
        const expiresAt = new Date(expiresAtValue);
        if (!Number.isFinite(expiresAt.getTime()) || expiresAt.toISOString() !== expiresAtValue) {
          throw new Error("validation_failed:expiresAt");
        }
        input.expiresAt = expiresAt;
      }
      printJson(await initializeFreshTarget(pool, input));
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
