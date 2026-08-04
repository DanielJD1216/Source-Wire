import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { parseVerifierKey, requireEnvironment } from "../src/config.js";
import { createRuntimeDatabase } from "../src/database.js";
import { inspectSchemaCompatibility } from "../src/migration.js";
import { authenticateCredential } from "../src/repository.js";

type InitializationArtifact = {
  ownerId: string;
  namespaceIds: string[];
  ownerAdminCredential: {
    secret: string;
  };
};

const databaseUrl = requireEnvironment("SOURCE_WIRE_RUNTIME_DATABASE_URL");
const verifierKey = parseVerifierKey(
  requireEnvironment("SOURCE_WIRE_TOKEN_VERIFIER_KEY")
);
const verifierKeyId = requireEnvironment("SOURCE_WIRE_TOKEN_VERIFIER_KEY_ID");
const initializationPath = requireEnvironment(
  "SOURCE_WIRE_UPGRADE_INITIALIZATION_ARTIFACT"
);
const initialization = JSON.parse(
  await readFile(initializationPath, "utf8")
) as InitializationArtifact;

assert.equal(typeof initialization.ownerId, "string");
assert.ok(initialization.ownerId.length > 0);
assert.ok(Array.isArray(initialization.namespaceIds));
assert.ok(initialization.namespaceIds.length > 0);
assert.equal(typeof initialization.ownerAdminCredential?.secret, "string");

const database = createRuntimeDatabase(databaseUrl);
try {
  const compatibility = await inspectSchemaCompatibility(database.pool);
  assert.equal(compatibility.compatible, true);

  const actor = await authenticateCredential(
    database,
    verifierKey,
    verifierKeyId,
    `Bearer ${initialization.ownerAdminCredential.secret}`
  );
  assert.equal(actor.ownerId, initialization.ownerId);
  assert.deepEqual(
    [...actor.namespaceIds].sort(),
    [...initialization.namespaceIds].sort()
  );
  assert.ok(actor.capabilities.length > 0);

  process.stdout.write(
    `${JSON.stringify({
      schemaCompatible: true,
      credentialAuthenticated: true,
      ownerBindingPreserved: true,
      namespaceBindingCount: actor.namespaceIds.length,
      capabilityBindingCount: actor.capabilities.length
    })}\n`
  );
} finally {
  await database.pool.end();
}
