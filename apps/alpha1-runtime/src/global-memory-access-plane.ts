import { timingSafeEqual } from "node:crypto";

import { assertSourceWireIdentifier } from "./config.js";
import { SafeError } from "./errors.js";
import { canonicalRequestDigest } from "./idempotency.js";
import type { AuthenticatedCredential } from "./repository.js";
import {
  parseTrustedMemorySearch,
  type TrustedMemorySearchInput
} from "./trusted-memory-search.js";

const DPOP_MAX_AGE_MS = 60_000;
const DPOP_REPLAY_CAPACITY = 4_096;
const MAX_ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1_000;
const SEARCH_METHOD = "POST" as const;
const SEARCH_URI = "/v1alpha1/trusted-memories/search" as const;
const DESTINATION_FIELDS = [
  "deliverySurface",
  "workspaceId",
  "channelId",
  "threadId",
  "modelProvider",
  "modelAccount",
  "modelEndpoint",
  "locality",
  "retentionClass"
] as const;

export type MemoryOnlyDestination = Readonly<{
  deliverySurface: string;
  workspaceId: string;
  channelId: string;
  threadId: string;
  modelProvider: string;
  modelAccount: string;
  modelEndpoint: string;
  locality: "local" | "private_network";
  retentionClass: "ephemeral" | "bounded";
}>;

export type MemoryOnlySenderBinding =
  | Readonly<{ kind: "dpop"; thumbprint: string }>
  | Readonly<{ kind: "mtls"; thumbprint: string }>;

export type MemoryOnlyPolicySnapshot = Readonly<{
  ownerId: string;
  principalId: string;
  adapterId: string;
  actorIdentityId: string;
  clientId: string;
  sessionId: string;
  credentialId: string;
  credentialAudience: string;
  credentialIssuedAt: string;
  credentialExpiresAt: string;
  credentialStatus: "active" | "revoked";
  sessionStatus: "active" | "revoked";
  namespaceIds: readonly string[];
  capabilities: readonly "trusted_memory.search"[];
  authorizationEpoch: number;
  deletionEpoch: number;
  destination: MemoryOnlyDestination;
  audienceChain: readonly string[];
  senderBinding: MemoryOnlySenderBinding;
}>;

export type MemoryOnlySenderProof =
  | Readonly<{
      kind: "dpop";
      keyThumbprint: string;
      method: string;
      uri: string;
      nonce: string;
      replayId: string;
      issuedAtMs: number;
    }>
  | Readonly<{
      kind: "mtls";
      certificateThumbprint: string;
    }>;

export type MemoryOnlyTransportContext = Readonly<{
  principalId: string;
  adapterId: string;
  clientId: string;
  sessionId: string;
  credentialAudience: string;
  authorizationEpoch: number;
  deletionEpoch: number;
  destination: MemoryOnlyDestination;
  audienceChain: readonly string[];
  requestMethod: string;
  requestUri: string;
  senderProof: MemoryOnlySenderProof;
}>;

export type AuthorizedMemoryOnlySearch = Readonly<{
  actor: Readonly<AuthenticatedCredential>;
  input: Readonly<TrustedMemorySearchInput>;
  principalId: string;
  clientId: string;
  sessionId: string;
  credentialAudience: string;
  authorizationEpoch: number;
  deletionEpoch: number;
  destinationDigest: string;
  audienceChainDigest: string;
}>;

export class SyntheticMemoryOnlyAccessPlane {
  readonly #now: () => number;
  readonly #expectedDpopNonce: () => string;
  readonly #maxDpopReplayIds: number;
  readonly #consumedDpopReplayIds = new Set<string>();

  constructor(options: {
    now?: () => number;
    expectedDpopNonce: () => string;
    maxDpopReplayIds?: number;
  }) {
    const maxDpopReplayIds = options.maxDpopReplayIds ?? DPOP_REPLAY_CAPACITY;
    if (
      !Number.isSafeInteger(maxDpopReplayIds) ||
      maxDpopReplayIds < 1 ||
      maxDpopReplayIds > DPOP_REPLAY_CAPACITY
    ) {
      throw new Error("dpop_replay_capacity_invalid");
    }
    this.#now = options.now ?? Date.now;
    this.#expectedDpopNonce = options.expectedDpopNonce;
    this.#maxDpopReplayIds = maxDpopReplayIds;
  }

  authorizeSearch(input: {
    policy: MemoryOnlyPolicySnapshot;
    transport: MemoryOnlyTransportContext;
    request: unknown;
  }): AuthorizedMemoryOnlySearch {
    const nowMs = this.#now();
    validateClock(nowMs);
    const replayId = this.#validateSenderProof(input.policy, input.transport, nowMs);
    const policy = validatePolicy(input.policy);
    validateCredentialWindow(policy, nowMs);
    validateCredentialState(policy);
    validateTransportContext(policy, input.transport);
    if (replayId !== undefined) {
      this.#consumeDpopReplayId(replayId);
    }

    const request = parseTrustedMemorySearch(input.request);
    if (!policy.namespaceIds.includes(request.namespaceId)) {
      throw new SafeError("namespace_not_allowed", 403);
    }
    if (!policy.capabilities.includes("trusted_memory.search")) {
      throw new SafeError("capability_not_allowed", 403);
    }

    const actor = Object.freeze({
      credentialId: policy.credentialId,
      credentialClass: "harness" as const,
      status: "active" as const,
      ownerId: policy.ownerId,
      actorIdentityId: policy.actorIdentityId,
      authenticationEpochId: `authorization_epoch_${policy.authorizationEpoch}`,
      namespaceIds: Object.freeze([...policy.namespaceIds]) as string[],
      capabilities: Object.freeze([
        ...policy.capabilities
      ]) as AuthenticatedCredential["capabilities"],
      issuedAt: new Date(policy.credentialIssuedAt),
      expiresAt: new Date(policy.credentialExpiresAt),
      actorReference: `credential:${policy.credentialId}`
    });

    return Object.freeze({
      actor,
      input: Object.freeze({ ...request }),
      principalId: policy.principalId,
      clientId: policy.clientId,
      sessionId: policy.sessionId,
      credentialAudience: policy.credentialAudience,
      authorizationEpoch: policy.authorizationEpoch,
      deletionEpoch: policy.deletionEpoch,
      destinationDigest: canonicalRequestDigest({
        domain: "source-wire.global-memory-only.destination.v1",
        destination: policy.destination
      }),
      audienceChainDigest: canonicalRequestDigest({
        domain: "source-wire.global-memory-only.audience-chain.v1",
        audienceChain: policy.audienceChain
      })
    });
  }

  #validateSenderProof(
    policy: MemoryOnlyPolicySnapshot,
    transport: MemoryOnlyTransportContext,
    nowMs: number
  ): string | undefined {
    const binding = policy.senderBinding;
    const proof = transport.senderProof;
    if (
      typeof binding !== "object" ||
      binding === null ||
      (binding.kind !== "dpop" && binding.kind !== "mtls") ||
      !isIdentifier(binding.thumbprint)
    ) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    if (typeof proof !== "object" || proof === null || binding.kind !== proof.kind) {
      denyCredential();
    }

    if (proof.kind === "mtls") {
      if (
        binding.kind !== "mtls" ||
        !constantTimeEqual(binding.thumbprint, proof.certificateThumbprint)
      ) {
        denyCredential();
      }
      return undefined;
    }

    const expectedNonce = this.#expectedDpopNonce();
    if (typeof expectedNonce !== "string") {
      throw new SafeError("operation_unavailable", 503, true);
    }
    if (
      binding.kind !== "dpop" ||
      !constantTimeEqual(binding.thumbprint, proof.keyThumbprint) ||
      proof.method !== SEARCH_METHOD ||
      proof.uri !== SEARCH_URI ||
      transport.requestMethod !== proof.method ||
      transport.requestUri !== proof.uri ||
      !constantTimeEqual(expectedNonce, proof.nonce) ||
      !Number.isSafeInteger(proof.issuedAtMs) ||
      proof.issuedAtMs > nowMs ||
      nowMs - proof.issuedAtMs > DPOP_MAX_AGE_MS ||
      !isIdentifier(proof.replayId) ||
      this.#consumedDpopReplayIds.has(proof.replayId)
    ) {
      denyCredential();
    }
    return proof.replayId;
  }

  #consumeDpopReplayId(replayId: string): void {
    if (this.#consumedDpopReplayIds.size >= this.#maxDpopReplayIds) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    this.#consumedDpopReplayIds.add(replayId);
  }
}

function validatePolicy(policy: MemoryOnlyPolicySnapshot): MemoryOnlyPolicySnapshot {
  for (const [field, value] of [
    ["ownerId", policy.ownerId],
    ["principalId", policy.principalId],
    ["adapterId", policy.adapterId],
    ["clientId", policy.clientId],
    ["sessionId", policy.sessionId],
    ["credentialAudience", policy.credentialAudience]
  ] as const) {
    assertSourceWireIdentifier(value, field);
  }
  if (!isUuid(policy.actorIdentityId) || !isUuid(policy.credentialId)) {
    denyCredential();
  }
  if (
    !isEpoch(policy.authorizationEpoch) ||
    !isEpoch(policy.deletionEpoch) ||
    policy.namespaceIds.length < 1 ||
    policy.namespaceIds.some((value) => !isIdentifier(value)) ||
    policy.capabilities.some((value) => value !== "trusted_memory.search") ||
    policy.audienceChain.length < 2 ||
    policy.audienceChain.some((value) => !isIdentifier(value))
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  validateDestination(policy.destination);
  const requiredAudienceChain = [
    policy.principalId,
    policy.adapterId,
    policy.clientId,
    policy.destination.modelEndpoint,
    policy.destination.channelId
  ];
  if (!canonicalEqual(policy.audienceChain, requiredAudienceChain)) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  if (!isIdentifier(policy.senderBinding.thumbprint)) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  return policy;
}

function validateClock(nowMs: number): void {
  if (!Number.isSafeInteger(nowMs) || nowMs < 0) {
    throw new SafeError("operation_unavailable", 503, true);
  }
}

function validateCredentialState(policy: MemoryOnlyPolicySnapshot): void {
  if (
    (policy.credentialStatus !== "active" && policy.credentialStatus !== "revoked") ||
    (policy.sessionStatus !== "active" && policy.sessionStatus !== "revoked")
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  if (policy.credentialStatus !== "active" || policy.sessionStatus !== "active") {
    throw new SafeError("credential_revoked", 401);
  }
}

function validateCredentialWindow(
  policy: MemoryOnlyPolicySnapshot,
  nowMs: number
): void {
  const issuedAt = Date.parse(policy.credentialIssuedAt);
  const expiresAt = Date.parse(policy.credentialExpiresAt);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || issuedAt > nowMs) {
    denyCredential();
  }
  if (expiresAt <= nowMs) {
    throw new SafeError("credential_expired", 401);
  }
  if (
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > MAX_ACCESS_TOKEN_LIFETIME_MS
  ) {
    denyCredential();
  }
}

function validateTransportContext(
  policy: MemoryOnlyPolicySnapshot,
  transport: MemoryOnlyTransportContext
): void {
  if (
    transport.principalId !== policy.principalId ||
    transport.adapterId !== policy.adapterId ||
    transport.clientId !== policy.clientId ||
    transport.sessionId !== policy.sessionId ||
    transport.credentialAudience !== policy.credentialAudience ||
    transport.requestMethod !== SEARCH_METHOD ||
    transport.requestUri !== SEARCH_URI ||
    !canonicalEqual(transport.destination, policy.destination) ||
    !canonicalEqual(transport.audienceChain, policy.audienceChain)
  ) {
    denyCredential();
  }
  if (
    transport.authorizationEpoch !== policy.authorizationEpoch ||
    transport.deletionEpoch !== policy.deletionEpoch
  ) {
    throw new SafeError("credential_revoked", 401);
  }
}

function validateDestination(destination: MemoryOnlyDestination): void {
  if (
    typeof destination !== "object" ||
    destination === null ||
    Array.isArray(destination)
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  const fields = Object.keys(destination);
  if (
    fields.length !== DESTINATION_FIELDS.length ||
    fields.some(
      (field) =>
        !DESTINATION_FIELDS.includes(field as (typeof DESTINATION_FIELDS)[number])
    )
  ) {
    throw new SafeError("operation_unavailable", 503, true);
  }
  for (const field of DESTINATION_FIELDS) {
    const value = destination[field];
    if (
      (field === "locality" && (value === "local" || value === "private_network")) ||
      (field === "retentionClass" && (value === "ephemeral" || value === "bounded"))
    ) {
      continue;
    }
    if (!isIdentifier(value)) {
      throw new SafeError("operation_unavailable", 503, true);
    }
  }
}

function canonicalEqual(left: unknown, right: unknown): boolean {
  return constantTimeEqual(
    canonicalRequestDigest({ value: left }),
    canonicalRequestDigest({ value: right })
  );
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, "utf8");
  const rightBytes = Buffer.from(right, "utf8");
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function isIdentifier(value: unknown): value is string {
  try {
    assertSourceWireIdentifier(value, "value");
    return true;
  } catch {
    return false;
  }
}

function isEpoch(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value)
  );
}

function denyCredential(): never {
  throw new SafeError("credential_invalid", 401);
}
