import { randomUUID } from "node:crypto";

import {
  assertSourceWireIdentifier,
  parseVerifierKey,
  requireEnvironment
} from "../src/config.js";
import { createRuntimeDatabase } from "../src/database.js";
import { authenticateCredential } from "../src/repository.js";
import {
  correctTrustedMemory,
  revokeTrustedMemory
} from "../src/trusted-memory-lifecycle.js";

async function main(): Promise<void> {
  if (process.env.SOURCE_WIRE_CONFORMANCE_MODE !== "story4") {
    throw new Error("story4_mutation_probe_refused");
  }
  const database = createRuntimeDatabase(
    requireEnvironment("SOURCE_WIRE_DATABASE_URL")
  );
  try {
    const verifierKey = parseVerifierKey(
      process.env.SOURCE_WIRE_TOKEN_VERIFIER_KEY
    );
    const verifierKeyId = assertSourceWireIdentifier(
      requireEnvironment("SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID"),
      "verifierKeyId"
    );
    const actor = await authenticateCredential(
      database,
      verifierKey,
      verifierKeyId,
      `Bearer ${requireEnvironment("SOURCE_WIRE_OWNER_TOKEN")}`
    );
    const memoryId = requireEnvironment("SOURCE_WIRE_STORY4_MEMORY_ID");
    const expectedRevisionId = requireEnvironment(
      "SOURCE_WIRE_STORY4_EXPECTED_REVISION_ID"
    );
    const namespaceId = assertSourceWireIdentifier(
      requireEnvironment("SOURCE_WIRE_STORY4_NAMESPACE_ID"),
      "namespaceId"
    );
    const mutation = requireEnvironment("SOURCE_WIRE_STORY4_MUTATION");
    if (mutation === "correction") {
      await correctTrustedMemory(
        database.pool,
        actor,
        {
          memoryId,
          namespaceId,
          expectedRevisionId,
          content: "Lifecycle race corrected synthetic content.",
          contentByteCount: Buffer.byteLength(
            "Lifecycle race corrected synthetic content.",
            "utf8"
          ),
          reason: "Synthetic protected-read race correction.",
          idempotencyKey: `race_${randomUUID()}`
        },
        randomUUID()
      );
    } else if (mutation === "revocation") {
      await revokeTrustedMemory(
        database.pool,
        actor,
        {
          memoryId,
          namespaceId,
          expectedRevisionId,
          reason: "Synthetic protected-read race revocation.",
          idempotencyKey: `race_${randomUUID()}`
        },
        randomUUID()
      );
    } else {
      throw new Error("story4_mutation_probe_refused");
    }
    process.stdout.write('{"status":"committed"}\n');
  } finally {
    await database.pool.end();
  }
}

void main().catch(() => {
  process.stdout.write('{"status":"failed"}\n');
  process.exitCode = 1;
});
