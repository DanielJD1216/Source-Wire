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
    assertUniqueObjectKeys(text);
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

function assertUniqueObjectKeys(text: string): void {
  let index = 0;

  const skipWhitespace = (): void => {
    while (index < text.length && /\s/u.test(text[index]!)) index += 1;
  };

  const parseValue = (): void => {
    skipWhitespace();
    const character = text[index];
    if (character === "{") {
      parseObject();
      return;
    }
    if (character === "[") {
      parseArray();
      return;
    }
    if (character === '"') {
      index = findJsonStringEnd(text, index) + 1;
      return;
    }
    const start = index;
    while (
      index < text.length &&
      !/[\s,\]}]/u.test(text[index]!)
    ) {
      index += 1;
    }
    if (index === start) throw new SafeError("validation_failed", 400);
  };

  const parseObject = (): void => {
    index += 1;
    const seen = new Set<string>();
    skipWhitespace();
    if (text[index] === "}") {
      index += 1;
      return;
    }
    while (index < text.length) {
      skipWhitespace();
      if (text[index] !== '"') {
        throw new SafeError("validation_failed", 400);
      }
      const end = findJsonStringEnd(text, index);
      const key = JSON.parse(text.slice(index, end + 1)) as unknown;
      if (typeof key !== "string" || seen.has(key)) {
        throw new SafeError("validation_failed", 400);
      }
      seen.add(key);
      index = end + 1;
      skipWhitespace();
      if (text[index] !== ":") {
        throw new SafeError("validation_failed", 400);
      }
      index += 1;
      parseValue();
      skipWhitespace();
      if (text[index] === "}") {
        index += 1;
        return;
      }
      if (text[index] !== ",") {
        throw new SafeError("validation_failed", 400);
      }
      index += 1;
    }
    throw new SafeError("validation_failed", 400);
  };

  const parseArray = (): void => {
    index += 1;
    skipWhitespace();
    if (text[index] === "]") {
      index += 1;
      return;
    }
    while (index < text.length) {
      parseValue();
      skipWhitespace();
      if (text[index] === "]") {
        index += 1;
        return;
      }
      if (text[index] !== ",") {
        throw new SafeError("validation_failed", 400);
      }
      index += 1;
    }
    throw new SafeError("validation_failed", 400);
  };

  parseValue();
  skipWhitespace();
  if (index !== text.length) throw new SafeError("validation_failed", 400);
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
