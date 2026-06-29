import { readFile } from "node:fs/promises";

import type {
  SourceWireChatExportMessage,
  SourceWireProjectContextPack,
  SourceWireSecondBrainFixture
} from "./contracts/fixtures.js";

type ValidationResult = {
  file: string;
  ok: boolean;
  errors: string[];
};

const fixtureFiles = {
  projectContextPack: "examples/fixtures/project-context-pack/project-context.json",
  secondBrain: "examples/fixtures/second-brain/use-2nd-brain-example.json",
  chatExport: "examples/fixtures/chat-export/agent-session.jsonl"
};

const results: ValidationResult[] = [
  await validateJsonFile(fixtureFiles.projectContextPack, validateProjectContextPack),
  await validateJsonFile(fixtureFiles.secondBrain, validateSecondBrainFixture),
  await validateChatExport(fixtureFiles.chatExport)
];

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

async function validateJsonFile<T>(
  file: string,
  validate: (value: unknown, path: string) => asserts value is T
): Promise<ValidationResult> {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as unknown;
    validate(parsed, "$");
    return { file, ok: true, errors: [] };
  } catch (error) {
    return { file, ok: false, errors: [formatError(error)] };
  }
}

async function validateChatExport(file: string): Promise<ValidationResult> {
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

function requireStringArray(value: unknown, path: string): void {
  const array = requireArray(value, path);
  if (array.length === 0) {
    throw new Error(`${path} must include at least one item`);
  }
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

function requireLiteral<T extends string | boolean>(value: unknown, expected: T, path: string): void {
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
