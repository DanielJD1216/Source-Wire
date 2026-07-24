import { TextDecoder } from "node:util";

import { SafeError } from "./errors.js";

export function parseStrictJsonObject(bytes: Buffer): Record<string, unknown> {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new SafeError("validation_failed", 400);
  }

  try {
    assertUniqueTopLevelKeys(text);
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("object_required");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof SafeError) throw error;
    throw new SafeError("validation_failed", 400);
  }
}

function assertUniqueTopLevelKeys(text: string): void {
  const seen = new Set<string>();
  let depth = 0;
  let inString = false;
  let escaped = false;
  let expectingTopLevelKey = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === "{") {
      depth += 1;
      if (depth === 1) expectingTopLevelKey = true;
      continue;
    }
    if (character === "}") {
      if (depth === 1) expectingTopLevelKey = false;
      depth -= 1;
      continue;
    }
    if (character === "[") {
      depth += 1;
      continue;
    }
    if (character === "]") {
      depth -= 1;
      continue;
    }

    if (depth !== 1) {
      if (character === '"') inString = true;
      continue;
    }
    if (/\s/u.test(character)) continue;
    if (!expectingTopLevelKey) {
      if (character === ",") {
        expectingTopLevelKey = true;
      } else if (character === '"') {
        inString = true;
      }
      continue;
    }
    if (character === "}") {
      expectingTopLevelKey = false;
      continue;
    }
    if (character !== '"') {
      continue;
    }

    const end = findJsonStringEnd(text, index);
    const key = JSON.parse(text.slice(index, end + 1)) as unknown;
    if (typeof key !== "string" || seen.has(key)) {
      throw new SafeError("validation_failed", 400);
    }
    seen.add(key);
    expectingTopLevelKey = false;
    index = end;
  }
}

function findJsonStringEnd(text: string, start: number): number {
  let escaped = false;
  for (let index = start + 1; index < text.length; index += 1) {
    const character = text[index]!;
    if (escaped) {
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === '"') {
      return index;
    }
  }
  throw new SafeError("validation_failed", 400);
}
