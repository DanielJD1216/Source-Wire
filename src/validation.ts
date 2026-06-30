import { readFile } from "node:fs/promises";

import type {
  SourceWireChatExportMessage,
  SourceWireOwnerHostedApiMcpBoundaryFixture,
  SourceWireProjectContextPack,
  SourceWireSecondBrainFixture
} from "./contracts/fixtures.js";

export type SourceWireValidationSchemaName =
  | "project-context-pack"
  | "second-brain-v1"
  | "chat-export-message"
  | "owner-hosted-api-mcp-boundary";

export type SourceWireValidationResult = {
  file: string;
  ok: boolean;
  errors: string[];
};

export const SOURCE_WIRE_VALIDATION_SCHEMA_NAMES = [
  "chat-export-message",
  "owner-hosted-api-mcp-boundary",
  "project-context-pack",
  "second-brain-v1"
] as const satisfies readonly SourceWireValidationSchemaName[];

export async function validateSourceWireFile(
  schemaName: SourceWireValidationSchemaName,
  file: string
): Promise<SourceWireValidationResult> {
  switch (schemaName) {
    case "project-context-pack":
      return validateJsonFile(file, validateProjectContextPack);
    case "second-brain-v1":
      return validateJsonFile(file, validateSecondBrainFixture);
    case "chat-export-message":
      return validateChatExport(file);
    case "owner-hosted-api-mcp-boundary":
      return validateJsonFile(file, validateOwnerHostedApiMcpBoundaryFixture);
  }
}

export function isSourceWireValidationSchemaName(value: string): value is SourceWireValidationSchemaName {
  return SOURCE_WIRE_VALIDATION_SCHEMA_NAMES.includes(value as SourceWireValidationSchemaName);
}

async function validateJsonFile<T>(
  file: string,
  validate: (value: unknown, path: string) => asserts value is T
): Promise<SourceWireValidationResult> {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as unknown;
    validate(parsed, "$");
    return { file, ok: true, errors: [] };
  } catch (error) {
    return { file, ok: false, errors: [formatError(error)] };
  }
}

async function validateChatExport(file: string): Promise<SourceWireValidationResult> {
  const errors: string[] = [];
  try {
    const raw = await readFile(file, "utf8");
    const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      errors.push("JSONL file must include at least one message");
    }

    lines.forEach((line, index) => {
      try {
        const parsed = JSON.parse(line) as unknown;
        validateChatExportMessage(parsed, `$[${index}]`);
      } catch (error) {
        errors.push(formatError(error));
      }
    });
  } catch (error) {
    errors.push(formatError(error));
  }

  return { file, ok: errors.length === 0, errors };
}

function validateProjectContextPack(value: unknown, path: string): asserts value is SourceWireProjectContextPack {
  const object = requireObject(value, path);
  requireLiteral(object.fixtureType, "source-wire-public-project-context-pack", `${path}.fixtureType`);
  requireLiteral(object.fixtureSafety, "synthetic", `${path}.fixtureSafety`);

  const project = requireObject(object.project, `${path}.project`);
  requireString(project.key, `${path}.project.key`);
  requireString(project.name, `${path}.project.name`);
  requireString(project.status, `${path}.project.status`);
  requireString(project.summary, `${path}.project.summary`);

  requireStringArray(object.goals, `${path}.goals`);
  requireStringArray(object.constraints, `${path}.constraints`);
  requireNoteArray(object.decisions, `${path}.decisions`);
  requireNoteArray(object.risks, `${path}.risks`);
}

function validateSecondBrainFixture(value: unknown, path: string): asserts value is SourceWireSecondBrainFixture {
  const object = requireObject(value, path);
  requireLiteral(object.fixtureType, "source-wire-public-second-brain-example", `${path}.fixtureType`);
  requireLiteral(object.fixtureSafety, "synthetic", `${path}.fixtureSafety`);

  const request = requireObject(object.request, `${path}.request`);
  requireLiteral(request.command, "/2nd-brain", `${path}.request.command`);
  requireString(request.prompt, `${path}.request.prompt`);
  requireOneOf(request.radius, ["project", "source", "global"], `${path}.request.radius`);

  const response = requireObject(object.response, `${path}.response`);
  requireLiteral(response.contractVersion, "second-brain.v1", `${path}.response.contractVersion`);
  requireOneOf(
    response.intent,
    ["answer_question", "draw_diagram", "update_sources", "search_sources", "summarize_context"],
    `${path}.response.intent`
  );
  requireOneOf(response.radius, ["project", "source", "global"], `${path}.response.radius`);
  requireString(response.answer, `${path}.response.answer`);
  requireCitationArray(response.citations, `${path}.response.citations`);
  requireGapArray(response.gaps, `${path}.response.gaps`);
  requireString(response.nextAction, `${path}.response.nextAction`);
  requireBoolean(response.maintenanceRan, `${path}.response.maintenanceRan`);
  requireLiteral(response.noAutoPromotion, true, `${path}.response.noAutoPromotion`);
}

function validateChatExportMessage(value: unknown, path: string): asserts value is SourceWireChatExportMessage {
  const object = requireObject(value, path);
  requireString(object.provider, `${path}.provider`);
  requireString(object.conversationId, `${path}.conversationId`);
  requireString(object.messageId, `${path}.messageId`);
  requireOneOf(object.role, ["user", "assistant", "system", "tool"], `${path}.role`);
  requireDateTimeString(object.createdAt, `${path}.createdAt`);
  requireString(object.content, `${path}.content`);
}

function validateOwnerHostedApiMcpBoundaryFixture(
  value: unknown,
  path: string
): asserts value is SourceWireOwnerHostedApiMcpBoundaryFixture {
  const object = requireObject(value, path);
  requireLiteral(object.fixtureType, "source-wire-owner-hosted-api-mcp-boundary-proof-cases", `${path}.fixtureType`);
  requireLiteral(object.fixtureSafety, "synthetic", `${path}.fixtureSafety`);
  requireLiteral(object.schemaValidated, true, `${path}.schemaValidated`);

  const boundary = requireObject(object.boundary, `${path}.boundary`);
  requireLiteral(boundary.hosting, "owner_hosted", `${path}.boundary.hosting`);
  requireLiteral(boundary.sourceWireHostsUserMemory, false, `${path}.boundary.sourceWireHostsUserMemory`);
  requireLiteral(boundary.runtimeIncludedInPackage, false, `${path}.boundary.runtimeIncludedInPackage`);
  requireLiteral(boundary.noAutoPromotion, true, `${path}.boundary.noAutoPromotion`);

  const owner = requireObject(object.syntheticOwner, `${path}.syntheticOwner`);
  requireString(owner.ownerId, `${path}.syntheticOwner.ownerId`);
  requireString(owner.displayName, `${path}.syntheticOwner.displayName`);

  const namespaces = requireArray(object.syntheticNamespaces, `${path}.syntheticNamespaces`);
  if (namespaces.length < 2) {
    throw new Error(`${path}.syntheticNamespaces must include at least two namespaces`);
  }
  namespaces.forEach((entry, index) => {
    const namespace = requireObject(entry, `${path}.syntheticNamespaces[${index}]`);
    requireString(namespace.namespaceId, `${path}.syntheticNamespaces[${index}].namespaceId`);
    requireString(namespace.label, `${path}.syntheticNamespaces[${index}].label`);
  });

  const proofCases = requireArray(object.proofCases, `${path}.proofCases`);
  if (proofCases.length < 7) {
    throw new Error(`${path}.proofCases must include at least seven cases`);
  }
  proofCases.forEach((entry, index) => validateOwnerHostedApiMcpProofCase(entry, `${path}.proofCases[${index}]`));

  const nonGoals = requireStringArray(object.nonGoals, `${path}.nonGoals`);
  for (const requiredNonGoal of [
    "api_server_runtime",
    "mcp_server_runtime",
    "database_migrations",
    "real_user_data",
    "trusted_memory_auto_promotion"
  ]) {
    if (!nonGoals.includes(requiredNonGoal)) {
      throw new Error(`${path}.nonGoals must include ${requiredNonGoal}`);
    }
  }

  requireProofCaseIds(
    proofCases,
    [
      "authorized_read_trusted_memory",
      "unauthorized_read_denied",
      "wrong_namespace_denied",
      "source_evidence_search_with_citations",
      "source_maintenance_no_auto_promotion",
      "pending_candidate_without_trusted_memory",
      "trusted_memory_approval_owner_controlled"
    ],
    `${path}.proofCases`
  );
}

function validateOwnerHostedApiMcpProofCase(value: unknown, path: string): void {
  const object = requireObject(value, path);
  requireString(object.caseId, `${path}.caseId`);

  const actor = requireObject(object.actor, `${path}.actor`);
  requireOneOf(actor.kind, ["mcp_tool", "owner_hosted_api", "owner_controlled_application"], `${path}.actor.kind`);
  requireString(actor.syntheticTokenRef, `${path}.actor.syntheticTokenRef`);
  requireStringArray(actor.allowedNamespaceIds, `${path}.actor.allowedNamespaceIds`);
  requireStringArrayAllowEmpty(actor.capabilities, `${path}.actor.capabilities`);

  const request = requireObject(object.request, `${path}.request`);
  requireString(request.namespaceId, `${path}.request.namespaceId`);
  for (const optionalStringField of [
    "tool",
    "apiRoute",
    "query",
    "sourceConnectionId",
    "payloadMode",
    "sourceSegmentId",
    "reviewReason"
  ]) {
    if (optionalStringField in request) {
      requireString(request[optionalStringField], `${path}.request.${optionalStringField}`);
    }
  }

  if (!("tool" in request) && !("apiRoute" in request)) {
    throw new Error(`${path}.request must include tool or apiRoute`);
  }

  const expectedResult = requireObject(object.expectedResult, `${path}.expectedResult`);
  requireOneOf(expectedResult.status, ["allowed", "denied", "partial_success"], `${path}.expectedResult.status`);
  requireLiteral(expectedResult.noAutoPromotion, expectedResult.status === "allowed" && object.caseId === "trusted_memory_approval_owner_controlled" ? false : true, `${path}.expectedResult.noAutoPromotion`);

  for (const booleanField of [
    "trustedMemoryReturned",
    "sourceEvidenceReturned",
    "pendingCandidateCreated",
    "pendingCandidateClosed",
    "requiresOwnerReview"
  ]) {
    if (booleanField in expectedResult) {
      requireBoolean(expectedResult[booleanField], `${path}.expectedResult.${booleanField}`);
    }
  }

  for (const numberField of [
    "omittedCount",
    "citationCount",
    "importedCount",
    "changedCount",
    "staleCount",
    "skippedCount",
    "errorCount",
    "pendingCandidateCount",
    "trustedMemoryCreatedCount"
  ]) {
    if (numberField in expectedResult) {
      requireNonNegativeInteger(expectedResult[numberField], `${path}.expectedResult.${numberField}`);
    }
  }

  if ("denialReason" in expectedResult) {
    requireString(expectedResult.denialReason, `${path}.expectedResult.denialReason`);
  }
  if ("approvalPath" in expectedResult) {
    requireLiteral(expectedResult.approvalPath, "owner_or_application_controlled", `${path}.expectedResult.approvalPath`);
  }
  if ("citations" in expectedResult) {
    validateBoundaryCitationArray(expectedResult.citations, `${path}.expectedResult.citations`);
  }

  const audit = requireObject(object.audit, `${path}.audit`);
  requireString(audit.eventType, `${path}.audit.eventType`);
  requireOneOf(audit.result, ["allowed", "denied", "partial_success"], `${path}.audit.result`);
  requireString(audit.syntheticTraceId, `${path}.audit.syntheticTraceId`);

  if (audit.result !== expectedResult.status) {
    throw new Error(`${path}.audit.result must match expectedResult.status`);
  }
}

function requireProofCaseIds(proofCases: unknown[], requiredCaseIds: readonly string[], path: string): void {
  const actualCaseIds = new Set(
    proofCases.map((entry, index) => {
      const object = requireObject(entry, `${path}[${index}]`);
      return object.caseId;
    })
  );

  for (const requiredCaseId of requiredCaseIds) {
    if (!actualCaseIds.has(requiredCaseId)) {
      throw new Error(`${path} must include caseId ${requiredCaseId}`);
    }
  }
}

function validateBoundaryCitationArray(value: unknown, path: string): void {
  const array = requireArray(value, path);
  if (array.length === 0) {
    throw new Error(`${path} must include at least one citation`);
  }
  array.forEach((entry, index) => {
    const object = requireObject(entry, `${path}[${index}]`);
    requireString(object.sourceId, `${path}[${index}].sourceId`);
    requireString(object.segmentId, `${path}[${index}].segmentId`);
    requireString(object.address, `${path}[${index}].address`);
  });
}

function requireNoteArray(value: unknown, path: string): void {
  const array = requireArray(value, path);
  if (array.length === 0) {
    throw new Error(`${path} must include at least one item`);
  }
  array.forEach((entry, index) => {
    const object = requireObject(entry, `${path}[${index}]`);
    requireString(object.id, `${path}[${index}].id`);
    requireString(object.title, `${path}[${index}].title`);
    requireString(object.content, `${path}[${index}].content`);
  });
}

function requireCitationArray(value: unknown, path: string): void {
  const array = requireArray(value, path);
  array.forEach((entry, index) => {
    const object = requireObject(entry, `${path}[${index}]`);
    requireLiteral(object.type, "source_segment", `${path}[${index}].type`);
    requireString(object.sourceTitle, `${path}[${index}].sourceTitle`);
    requireString(object.locator, `${path}[${index}].locator`);
  });
}

function requireGapArray(value: unknown, path: string): void {
  const array = requireArray(value, path);
  array.forEach((entry, index) => {
    const object = requireObject(entry, `${path}[${index}]`);
    requireString(object.reason, `${path}[${index}].reason`);
    if ("nextAction" in object) {
      requireString(object.nextAction, `${path}[${index}].nextAction`);
    }
  });
}

function requireStringArray(value: unknown, path: string): string[] {
  const array = requireArray(value, path);
  if (array.length === 0) {
    throw new Error(`${path} must include at least one item`);
  }
  array.forEach((entry, index) => requireString(entry, `${path}[${index}]`));
  return array as string[];
}

function requireStringArrayAllowEmpty(value: unknown, path: string): void {
  const array = requireArray(value, path);
  array.forEach((entry, index) => requireString(entry, `${path}[${index}]`));
}

function requireObject(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }
  return value;
}

function requireString(value: unknown, path: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
}

function requireBoolean(value: unknown, path: string): void {
  if (typeof value !== "boolean") {
    throw new Error(`${path} must be a boolean`);
  }
}

function requireNonNegativeInteger(value: unknown, path: string): void {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${path} must be a non-negative integer`);
  }
}

function requireLiteral<T extends string | boolean | number>(value: unknown, expected: T, path: string): void {
  if (value !== expected) {
    throw new Error(`${path} must equal ${JSON.stringify(expected)}`);
  }
}

function requireOneOf<T extends string>(value: unknown, allowed: readonly T[], path: string): void {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${path} must be one of: ${allowed.join(", ")}`);
  }
}

function requireDateTimeString(value: unknown, path: string): void {
  requireString(value, path);
  if (Number.isNaN(Date.parse(value as string))) {
    throw new Error(`${path} must be a valid date-time string`);
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
