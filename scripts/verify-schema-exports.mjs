import { createRequire } from "node:module";

import { SOURCE_WIRE_SCHEMA_EXPORTS, SOURCE_WIRE_SCHEMA_EXPORT_LIST } from "@source-wire/contracts";

const require = createRequire(import.meta.url);

const expected = [
  SOURCE_WIRE_SCHEMA_EXPORTS.projectContextPack,
  SOURCE_WIRE_SCHEMA_EXPORTS.secondBrainV1,
  SOURCE_WIRE_SCHEMA_EXPORTS.chatExportMessage
];

const failures = [];

if (SOURCE_WIRE_SCHEMA_EXPORT_LIST.length !== expected.length) {
  failures.push(`expected ${expected.length} schema exports, got ${SOURCE_WIRE_SCHEMA_EXPORT_LIST.length}`);
}

for (const schemaExport of expected) {
  const listed = SOURCE_WIRE_SCHEMA_EXPORT_LIST.find((entry) => entry.name === schemaExport.name);
  if (!listed) {
    failures.push(`missing schema export list entry: ${schemaExport.name}`);
    continue;
  }

  const loadedSchema = require(schemaExport.packageSubpath);
  if (loadedSchema.$id !== schemaExport.schemaId) {
    failures.push(`${schemaExport.name} $id mismatch: expected ${schemaExport.schemaId}, got ${loadedSchema.$id}`);
  }

  if (loadedSchema.title !== schemaExport.title) {
    failures.push(`${schemaExport.name} title mismatch: expected ${schemaExport.title}, got ${loadedSchema.title}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`failed ${failure}`);
  }
  process.exitCode = 1;
} else {
  for (const schemaExport of expected) {
    console.log(`ok ${schemaExport.packageSubpath}`);
  }
}
