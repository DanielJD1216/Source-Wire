import {
  SOURCE_WIRE_VALIDATION_SCHEMA_NAMES,
  isSourceWireValidationSchemaName,
  validateSourceWireFile
} from "@source-wire/contracts";

import type {
  SourceWireValidationResult,
  SourceWireValidationSchemaName
} from "@source-wire/contracts";

export const validationSchemaNames: readonly SourceWireValidationSchemaName[] = SOURCE_WIRE_VALIDATION_SCHEMA_NAMES;

export function parseValidationSchemaName(value: string): SourceWireValidationSchemaName | null {
  return isSourceWireValidationSchemaName(value) ? value : null;
}

export async function validateSyntheticProjectContextPack(): Promise<SourceWireValidationResult> {
  return validateSourceWireFile(
    "project-context-pack",
    "examples/fixtures/project-context-pack/project-context.json"
  );
}
