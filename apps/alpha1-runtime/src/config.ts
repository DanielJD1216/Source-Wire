const SOURCE_WIRE_IDENTIFIER = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

export const STORY1_SCHEMA_VERSION = 1;
export const STORY1_SCHEMA_NAME = "source_wire_memory";
export const STORY1_API_SCHEMA = "source-wire.api.v1alpha1";
export const MAX_AUTHORIZATION_BYTES = 512;
export const MAX_JSON_BODY_BYTES = 16 * 1024;
export const MAX_PROTECTED_CONCURRENCY = 32;
export const MAX_PROTECTED_REQUESTS_PER_MINUTE = 120;
export const STORY1_REQUEST_TIMEOUT_MS = 5_000;
export const STORY1_HEADERS_TIMEOUT_MS = 5_000;
export const STORY1_CONNECTION_CHECK_INTERVAL_MS = 250;
export const RUNTIME_POOL_MAX = 5;
export const RUNTIME_QUERY_TIMEOUT_MS = 2_000;
export const RUNTIME_CONNECTION_TIMEOUT_MS = 2_000;

export const STORY1_CAPABILITIES = [
  "runtime.health",
  "memory_candidate.propose",
  "trusted_memory.search",
  "memory_candidate.review",
  "memory_candidate.decide",
  "trusted_memory.correct",
  "trusted_memory.revoke",
  "namespace.manage",
  "credential.manage",
  "memory.export"
] as const;

export type Story1Capability = (typeof STORY1_CAPABILITIES)[number];

export const STORY1_HARNESS_CAPABILITIES = [
  "runtime.health",
  "memory_candidate.propose",
  "trusted_memory.search"
] as const satisfies readonly Story1Capability[];

export function assertLoopbackHost(value: string): "127.0.0.1" | "::1" {
  if (value === "127.0.0.1" || value === "::1") {
    return value;
  }

  throw new Error("loopback_host_required");
}

export function assertSourceWireIdentifier(value: unknown, field: string): string {
  if (typeof value !== "string" || !SOURCE_WIRE_IDENTIFIER.test(value) || value === "*") {
    throw new Error(`validation_failed:${field}`);
  }

  return value;
}

export function assertIdempotencyKey(value: unknown): string {
  return assertSourceWireIdentifier(value, "idempotencyKey");
}

export function assertCapability(value: unknown): Story1Capability {
  if (typeof value !== "string" || !STORY1_CAPABILITIES.includes(value as Story1Capability)) {
    throw new Error("validation_failed:capability");
  }

  return value as Story1Capability;
}

export function parseVerifierKey(value: string | undefined): Buffer {
  if (!value || !BASE64URL.test(value)) {
    throw new Error("verifier_key_invalid");
  }

  const decoded = Buffer.from(value, "base64url");
  if (
    decoded.length < 32 ||
    decoded.toString("base64url") !== value.replace(/=+$/u, "") ||
    new Set(decoded).size < 8
  ) {
    throw new Error("verifier_key_invalid");
  }

  return decoded;
}

export function requireEnvironment(name: string, environment: NodeJS.ProcessEnv = process.env): string {
  const value = environment[name];
  if (!value) {
    throw new Error(`missing_environment:${name}`);
  }

  return value;
}

export function parsePort(value: string | undefined): number {
  const port = value === undefined ? 4318 : Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error("validation_failed:port");
  }

  return port;
}
