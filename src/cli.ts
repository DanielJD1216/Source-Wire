#!/usr/bin/env node

import {
  isSourceWireValidationSchemaName,
  SOURCE_WIRE_VALIDATION_SCHEMA_NAMES,
  validateSourceWireFile
} from "./validation.js";

const [command, schemaName, ...files] = process.argv.slice(2);

if (command !== "validate") {
  printUsage();
  process.exitCode = 1;
} else if (!schemaName || !isSourceWireValidationSchemaName(schemaName)) {
  console.error(`failed schema must be one of: ${SOURCE_WIRE_VALIDATION_SCHEMA_NAMES.join(", ")}`);
  printUsage();
  process.exitCode = 1;
} else if (files.length === 0) {
  console.error("failed at least one file path is required");
  printUsage();
  process.exitCode = 1;
} else {
  const results = await Promise.all(files.map((file) => validateSourceWireFile(schemaName, file)));
  const failed = results.filter((result) => !result.ok);

  for (const result of results) {
    if (result.ok) {
      console.log(`ok ${result.file}`);
      continue;
    }

    console.error(`failed ${result.file}`);
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

function printUsage(): void {
  console.error("usage: source-wire validate <schema> <file...>");
  console.error(`schemas: ${SOURCE_WIRE_VALIDATION_SCHEMA_NAMES.join(", ")}`);
}
