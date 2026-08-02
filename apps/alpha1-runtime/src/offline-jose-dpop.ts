import {
  createHash,
  createPublicKey,
  verify,
  type JsonWebKey,
  type KeyObject
} from "node:crypto";

import type { DurableMemoryOnlyTransportContext } from "./durable-memory-only-runtime.js";
import { SafeError } from "./errors.js";
import type { MemoryOnlyDestination } from "./global-memory-access-plane.js";
import { parseStrictJsonObject } from "./strict-json.js";

const ACCESS_TOKEN_MAX_BYTES = 16_384;
const DPOP_PROOF_MAX_BYTES = 8_192;
const MAX_ACCESS_TOKEN_LIFETIME_SECONDS = 15 * 60;
const MAX_DPOP_AGE_SECONDS = 60;
const MAX_ISSUER_KEYS = 8;
const KEY_ID = /^[A-Za-z0-9._-]{1,128}$/u;

export type OfflineIssuerKeySet = Readonly<{
  expectedIssuer: string;
  expectedAudience: string;
  publicKeys: ReadonlyMap<string, KeyObject>;
}>;

export type OfflineMemoryOnlyRequestBinding = Readonly<{
  principalId: string;
  adapterId: string;
  clientId: string;
  sessionId: string;
  authorizationEpoch: string;
  deletionEpoch: string;
  destination: MemoryOnlyDestination;
  audienceChain: readonly string[];
  method: string;
  uri: string;
  nonce: string;
}>;

export function verifyOfflineMemoryOnlyRequest(input: {
  accessToken: string;
  dpopProof: string;
  issuer: OfflineIssuerKeySet;
  request: OfflineMemoryOnlyRequestBinding;
  now?: () => number;
}): DurableMemoryOnlyTransportContext {
  try {
    return verifyRequest(input);
  } catch {
    throw new SafeError("credential_invalid", 401);
  }
}

function verifyRequest(input: {
  accessToken: string;
  dpopProof: string;
  issuer: OfflineIssuerKeySet;
  request: OfflineMemoryOnlyRequestBinding;
  now?: () => number;
}): DurableMemoryOnlyTransportContext {
  if (
    input.issuer.publicKeys.size < 1 ||
    input.issuer.publicKeys.size > MAX_ISSUER_KEYS
  ) {
    throw new Error("issuer_key_set_invalid");
  }
  for (const [keyId, key] of input.issuer.publicKeys) {
    if (
      !KEY_ID.test(keyId) ||
      key.type !== "public" ||
      key.asymmetricKeyType !== "ed25519"
    ) {
      throw new Error("issuer_key_set_invalid");
    }
  }
  const nowMs = (input.now ?? Date.now)();
  if (!Number.isSafeInteger(nowMs) || nowMs < 0) throw new Error("now_invalid");
  const nowSeconds = Math.floor(nowMs / 1_000);

  const access = parseCompact(input.accessToken, ACCESS_TOKEN_MAX_BYTES);
  assertExactKeys(access.header, ["alg", "kid", "typ"]);
  const accessAlgorithm = requireString(access.header, "alg");
  const keyId = requireString(access.header, "kid");
  const accessType = requireString(access.header, "typ");
  if (accessAlgorithm !== "EdDSA" || accessType !== "at+jwt") {
    throw new Error("access_header_invalid");
  }
  const issuerKey = input.issuer.publicKeys.get(keyId);
  if (
    !issuerKey ||
    issuerKey.type !== "public" ||
    issuerKey.asymmetricKeyType !== "ed25519" ||
    !verify(null, access.signingInput, issuerKey, access.signature)
  ) {
    throw new Error("access_signature_invalid");
  }

  assertExactKeys(access.payload, [
    "aud",
    "client_id",
    "cnf",
    "exp",
    "iat",
    "iss",
    "jti",
    "nbf",
    "sid",
    "sub"
  ]);
  const issuer = requireString(access.payload, "iss");
  const audience = requireString(access.payload, "aud");
  const principalId = requireString(access.payload, "sub");
  const clientId = requireString(access.payload, "client_id");
  const sessionId = requireString(access.payload, "sid");
  requireString(access.payload, "jti");
  const issuedAt = requireInteger(access.payload, "iat");
  const notBefore = requireInteger(access.payload, "nbf");
  const expiresAt = requireInteger(access.payload, "exp");
  if (
    issuer !== input.issuer.expectedIssuer ||
    audience !== input.issuer.expectedAudience ||
    principalId !== input.request.principalId ||
    clientId !== input.request.clientId ||
    sessionId !== input.request.sessionId ||
    issuedAt > nowSeconds ||
    notBefore < issuedAt ||
    notBefore > nowSeconds ||
    expiresAt <= nowSeconds ||
    expiresAt <= notBefore ||
    expiresAt - issuedAt > MAX_ACCESS_TOKEN_LIFETIME_SECONDS
  ) {
    throw new Error("access_claims_invalid");
  }
  const confirmation = requireObject(access.payload, "cnf");
  assertExactKeys(confirmation, ["jkt"]);
  const confirmedThumbprint = requireString(confirmation, "jkt");

  const dpop = parseCompact(input.dpopProof, DPOP_PROOF_MAX_BYTES);
  assertExactKeys(dpop.header, ["alg", "jwk", "typ"]);
  if (
    requireString(dpop.header, "alg") !== "EdDSA" ||
    requireString(dpop.header, "typ") !== "dpop+jwt"
  ) {
    throw new Error("dpop_header_invalid");
  }
  const senderJwk = requireObject(dpop.header, "jwk") as JsonWebKey;
  assertExactKeys(senderJwk as Record<string, unknown>, ["crv", "kty", "x"]);
  if (
    senderJwk.kty !== "OKP" ||
    senderJwk.crv !== "Ed25519" ||
    typeof senderJwk.x !== "string" ||
    senderJwk.x.length === 0 ||
    decodeBase64Url(senderJwk.x).length !== 32
  ) {
    throw new Error("dpop_jwk_invalid");
  }
  const senderThumbprint = createHash("sha256")
    .update(
      JSON.stringify({ crv: senderJwk.crv, kty: senderJwk.kty, x: senderJwk.x })
    )
    .digest("base64url");
  if (senderThumbprint !== confirmedThumbprint) {
    throw new Error("sender_binding_invalid");
  }
  const senderKey = createPublicKey({ key: senderJwk, format: "jwk" });
  if (
    senderKey.type !== "public" ||
    senderKey.asymmetricKeyType !== "ed25519" ||
    !verify(null, dpop.signingInput, senderKey, dpop.signature)
  ) {
    throw new Error("dpop_signature_invalid");
  }

  assertExactKeys(dpop.payload, ["htm", "htu", "iat", "jti", "nonce"]);
  const method = requireString(dpop.payload, "htm");
  const uri = requireString(dpop.payload, "htu");
  const replayId = requireString(dpop.payload, "jti");
  const proofIssuedAt = requireInteger(dpop.payload, "iat");
  const nonce = requireString(dpop.payload, "nonce");
  if (
    method !== input.request.method ||
    uri !== input.request.uri ||
    nonce !== input.request.nonce ||
    proofIssuedAt > nowSeconds ||
    nowSeconds - proofIssuedAt > MAX_DPOP_AGE_SECONDS
  ) {
    throw new Error("dpop_claims_invalid");
  }

  const senderProof = Object.freeze({
    kind: "dpop" as const,
    keyThumbprint: senderThumbprint,
    method,
    uri,
    nonce,
    replayId,
    issuedAtMs: proofIssuedAt * 1_000
  });
  const destination = Object.freeze({ ...input.request.destination });
  const audienceChain = Object.freeze([...input.request.audienceChain]);
  return Object.freeze({
    principalId,
    adapterId: input.request.adapterId,
    clientId,
    sessionId,
    credentialAudience: audience,
    authorizationEpoch: input.request.authorizationEpoch,
    deletionEpoch: input.request.deletionEpoch,
    destination,
    audienceChain,
    requestMethod: method,
    requestUri: uri,
    senderProof
  });
}

function parseCompact(value: string, maxBytes: number): {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signingInput: Buffer;
  signature: Buffer;
} {
  if (
    typeof value !== "string" ||
    Buffer.byteLength(value, "utf8") > maxBytes ||
    !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(value)
  ) {
    throw new Error("compact_invalid");
  }
  const [encodedHeader, encodedPayload, encodedSignature] = value.split(".");
  const headerBytes = decodeBase64Url(encodedHeader!);
  const payloadBytes = decodeBase64Url(encodedPayload!);
  const signature = decodeBase64Url(encodedSignature!);
  return {
    header: parseStrictJsonObject(headerBytes),
    payload: parseStrictJsonObject(payloadBytes),
    signingInput: Buffer.from(`${encodedHeader}.${encodedPayload}`, "ascii"),
    signature
  };
}

function decodeBase64Url(value: string): Buffer {
  const bytes = Buffer.from(value, "base64url");
  if (bytes.length === 0 || bytes.toString("base64url") !== value) {
    throw new Error("base64url_invalid");
  }
  return bytes;
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[]
): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length ||
    actual.some((key, index) => key !== sortedExpected[index])
  ) {
    throw new Error("fields_invalid");
  }
}

function requireString(value: Record<string, unknown>, field: string): string {
  const fieldValue = value[field];
  if (typeof fieldValue !== "string" || fieldValue.length === 0) {
    throw new Error("string_claim_invalid");
  }
  return fieldValue;
}

function requireInteger(value: Record<string, unknown>, field: string): number {
  const fieldValue = value[field];
  if (!Number.isSafeInteger(fieldValue) || (fieldValue as number) < 0) {
    throw new Error("integer_claim_invalid");
  }
  return fieldValue as number;
}

function requireObject(
  value: Record<string, unknown>,
  field: string
): Record<string, unknown> {
  const fieldValue = value[field];
  if (!fieldValue || typeof fieldValue !== "object" || Array.isArray(fieldValue)) {
    throw new Error("object_claim_invalid");
  }
  return fieldValue as Record<string, unknown>;
}
