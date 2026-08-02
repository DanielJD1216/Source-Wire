import assert from "node:assert/strict";
import {
  createHash,
  generateKeyPairSync,
  sign,
  type JsonWebKey,
  type KeyObject
} from "node:crypto";
import test from "node:test";

import { SafeError } from "../src/errors.js";
import { verifyOfflineMemoryOnlyRequest } from "../src/offline-jose-dpop.js";

const NOW_MS = Date.parse("2026-08-02T07:15:00.000Z");
const NOW_SECONDS = NOW_MS / 1_000;

function signCompactJwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  privateKey: KeyObject
): string {
  return signRawCompactJwt(
    JSON.stringify(header),
    JSON.stringify(payload),
    privateKey
  );
}

function signRawCompactJwt(
  headerJson: string,
  payloadJson: string,
  privateKey: KeyObject
): string {
  const encodedHeader = Buffer.from(headerJson, "utf8").toString("base64url");
  const encodedPayload = Buffer.from(payloadJson, "utf8").toString("base64url");
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(null, Buffer.from(signingInput, "ascii"), privateKey);
  return `${signingInput}.${signature.toString("base64url")}`;
}

function ed25519Thumbprint(jwk: JsonWebKey): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        crv: jwk.crv,
        kty: jwk.kty,
        x: jwk.x
      })
    )
    .digest("base64url");
}

test("signed access token and DPoP proof normalize one durable request", () => {
  const issuer = generateKeyPairSync("ed25519");
  const sender = generateKeyPairSync("ed25519");
  const senderJwk = sender.publicKey.export({ format: "jwk" });
  const senderThumbprint = ed25519Thumbprint(senderJwk);
  const accessToken = signCompactJwt(
    { alg: "EdDSA", kid: "issuer-key-1", typ: "at+jwt" },
    {
      iss: "https://issuer.synthetic.invalid",
      aud: "source-wire:trusted-memory",
      sub: "principal_synthetic_owner",
      client_id: "client_synthetic_cli",
      sid: "11111111-1111-4111-8111-111111111111",
      jti: "access-token-1",
      iat: NOW_SECONDS - 30,
      nbf: NOW_SECONDS - 30,
      exp: NOW_SECONDS + 300,
      cnf: { jkt: senderThumbprint }
    },
    issuer.privateKey
  );
  const dpopProof = signCompactJwt(
    { alg: "EdDSA", jwk: senderJwk, typ: "dpop+jwt" },
    {
      htm: "POST",
      htu: "/v1alpha1/trusted-memories/search",
      jti: "dpop-proof-1",
      iat: NOW_SECONDS - 5,
      nonce: "synthetic-dpop-nonce"
    },
    sender.privateKey
  );

  const destination = Object.freeze({
    deliverySurface: "synthetic_cli",
    workspaceId: "workspace_synthetic",
    channelId: "channel_synthetic",
    threadId: "thread_synthetic",
    modelProvider: "synthetic_provider",
    modelAccount: "account_synthetic",
    modelEndpoint: "model_synthetic",
    locality: "local" as const,
    retentionClass: "ephemeral" as const
  });
  const audienceChain = Object.freeze([
    "principal_synthetic_owner",
    "adapter_synthetic_local",
    "client_synthetic_cli",
    "model_synthetic",
    "channel_synthetic"
  ]);

  const verified = verifyOfflineMemoryOnlyRequest({
    accessToken,
    dpopProof,
    issuer: {
      expectedIssuer: "https://issuer.synthetic.invalid",
      expectedAudience: "source-wire:trusted-memory",
      publicKeys: new Map([["issuer-key-1", issuer.publicKey]])
    },
    request: {
      principalId: "principal_synthetic_owner",
      adapterId: "adapter_synthetic_local",
      clientId: "client_synthetic_cli",
      sessionId: "11111111-1111-4111-8111-111111111111",
      authorizationEpoch: "7",
      deletionEpoch: "3",
      destination,
      audienceChain,
      method: "POST",
      uri: "/v1alpha1/trusted-memories/search",
      nonce: "synthetic-dpop-nonce"
    },
    now: () => NOW_MS
  });

  assert.deepEqual(verified, {
    principalId: "principal_synthetic_owner",
    adapterId: "adapter_synthetic_local",
    clientId: "client_synthetic_cli",
    sessionId: "11111111-1111-4111-8111-111111111111",
    credentialAudience: "source-wire:trusted-memory",
    authorizationEpoch: "7",
    deletionEpoch: "3",
    destination,
    audienceChain,
    requestMethod: "POST",
    requestUri: "/v1alpha1/trusted-memories/search",
    senderProof: {
      kind: "dpop",
      keyThumbprint: senderThumbprint,
      method: "POST",
      uri: "/v1alpha1/trusted-memories/search",
      nonce: "synthetic-dpop-nonce",
      replayId: "dpop-proof-1",
      issuedAtMs: (NOW_SECONDS - 5) * 1_000
    }
  });
  assert.equal(Object.isFrozen(verified), true);
  assert.equal(Object.isFrozen(verified.senderProof), true);
});

test("offline JOSE verification denies invalid credentials without parsing hints", () => {
  const issuer = generateKeyPairSync("ed25519");
  const sender = generateKeyPairSync("ed25519");
  const otherSender = generateKeyPairSync("ed25519");
  const senderJwk = sender.publicKey.export({ format: "jwk" });
  const otherSenderJwk = otherSender.publicKey.export({ format: "jwk" });
  const senderThumbprint = ed25519Thumbprint(senderJwk);
  const accessHeader = {
    alg: "EdDSA",
    kid: "issuer-key-1",
    typ: "at+jwt"
  };
  const accessClaims = {
    iss: "https://issuer.synthetic.invalid",
    aud: "source-wire:trusted-memory",
    sub: "principal_synthetic_owner",
    client_id: "client_synthetic_cli",
    sid: "11111111-1111-4111-8111-111111111111",
    jti: "access-token-1",
    iat: NOW_SECONDS - 30,
    nbf: NOW_SECONDS - 30,
    exp: NOW_SECONDS + 300,
    cnf: { jkt: senderThumbprint }
  };
  const dpopHeader = { alg: "EdDSA", jwk: senderJwk, typ: "dpop+jwt" };
  const dpopClaims = {
    htm: "POST",
    htu: "/v1alpha1/trusted-memories/search",
    jti: "dpop-proof-1",
    iat: NOW_SECONDS - 5,
    nonce: "synthetic-dpop-nonce"
  };
  const request = {
    principalId: "principal_synthetic_owner",
    adapterId: "adapter_synthetic_local",
    clientId: "client_synthetic_cli",
    sessionId: "11111111-1111-4111-8111-111111111111",
    authorizationEpoch: "7",
    deletionEpoch: "3",
    destination: {
      deliverySurface: "synthetic_cli",
      workspaceId: "workspace_synthetic",
      channelId: "channel_synthetic",
      threadId: "thread_synthetic",
      modelProvider: "synthetic_provider",
      modelAccount: "account_synthetic",
      modelEndpoint: "model_synthetic",
      locality: "local" as const,
      retentionClass: "ephemeral" as const
    },
    audienceChain: [
      "principal_synthetic_owner",
      "adapter_synthetic_local",
      "client_synthetic_cli",
      "model_synthetic",
      "channel_synthetic"
    ],
    method: "POST",
    uri: "/v1alpha1/trusted-memories/search",
    nonce: "synthetic-dpop-nonce"
  };
  const access = (claims: Record<string, unknown>, header = accessHeader) =>
    signCompactJwt(header, claims, issuer.privateKey);
  const dpop = (
    claims: Record<string, unknown>,
    header: Record<string, unknown> = dpopHeader,
    privateKey: KeyObject = sender.privateKey
  ) => signCompactJwt(header, claims, privateKey);
  const validAccess = access(accessClaims);
  const validDpop = dpop(dpopClaims);
  const corruptSignature = (value: string): string => {
    const parts = value.split(".");
    const signature = parts[2]!;
    parts[2] = `${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
    return parts.join(".");
  };
  const verifyInput = (accessToken: string, dpopProof: string) =>
    verifyOfflineMemoryOnlyRequest({
      accessToken,
      dpopProof,
      issuer: {
        expectedIssuer: "https://issuer.synthetic.invalid",
        expectedAudience: "source-wire:trusted-memory",
        publicKeys: new Map([["issuer-key-1", issuer.publicKey]])
      },
      request,
      now: () => NOW_MS
    });

  const duplicatedAccessBase = JSON.stringify({
    ...accessClaims,
    cnf: undefined
  }).slice(0, -1);
  const duplicateConfirmationToken = signRawCompactJwt(
    JSON.stringify(accessHeader),
    `${duplicatedAccessBase},"cnf":{"jkt":"${senderThumbprint}","jkt":"different"}}`,
    issuer.privateKey
  );
  const duplicateSenderJwkProof = signRawCompactJwt(
    `{"alg":"EdDSA","jwk":{"kty":"OKP","crv":"Ed25519","x":"${senderJwk.x}","x":"${senderJwk.x}"},"typ":"dpop+jwt"}`,
    JSON.stringify(dpopClaims),
    sender.privateKey
  );
  const paddedSenderJwk: JsonWebKey = {
    ...senderJwk,
    x: `${senderJwk.x}==`
  };
  const standardBase64SenderJwk: JsonWebKey = {
    ...senderJwk,
    x: Buffer.from(senderJwk.x!, "base64url").toString("base64")
  };
  const noncanonicalSenderPair = (
    jwk: JsonWebKey
  ): readonly [string, string] => [
    access({ ...accessClaims, cnf: { jkt: ed25519Thumbprint(jwk) } }),
    dpop(dpopClaims, { ...dpopHeader, jwk })
  ];
  const paddedSenderPair = noncanonicalSenderPair(paddedSenderJwk);
  const standardBase64SenderPair = noncanonicalSenderPair(
    standardBase64SenderJwk
  );

  const invalidPairs: readonly [string, string, string][] = [
    [
      "padded sender JWK x",
      paddedSenderPair[0],
      paddedSenderPair[1]
    ],
    [
      "standard-Base64 sender JWK x",
      standardBase64SenderPair[0],
      standardBase64SenderPair[1]
    ],
    ["nested duplicate confirmation", duplicateConfirmationToken, validDpop],
    ["nested duplicate sender JWK", validAccess, duplicateSenderJwkProof],
    ["access signature", corruptSignature(validAccess), validDpop],
    ["DPoP signature", validAccess, corruptSignature(validDpop)],
    [
      "unknown issuer key",
      access(accessClaims, { ...accessHeader, kid: "unknown-key" }),
      validDpop
    ],
    [
      "unsupported access algorithm",
      access(accessClaims, { ...accessHeader, alg: "HS256" }),
      validDpop
    ],
    [
      "symmetric DPoP algorithm",
      validAccess,
      dpop(dpopClaims, { ...dpopHeader, alg: "HS256" })
    ],
    [
      "none DPoP algorithm",
      validAccess,
      dpop(dpopClaims, { ...dpopHeader, alg: "none" })
    ],
    [
      "wrong DPoP type",
      validAccess,
      dpop(dpopClaims, { ...dpopHeader, typ: "JWT" })
    ],
    [
      "expired access token",
      access({ ...accessClaims, exp: NOW_SECONDS }),
      validDpop
    ],
    [
      "future access token",
      access({
        ...accessClaims,
        iat: NOW_SECONDS + 1,
        nbf: NOW_SECONDS + 1
      }),
      validDpop
    ],
    [
      "overlong access token",
      access({
        ...accessClaims,
        iat: NOW_SECONDS - 1,
        nbf: NOW_SECONDS - 1,
        exp: NOW_SECONDS + 901
      }),
      validDpop
    ],
    [
      "issuer mismatch",
      access({ ...accessClaims, iss: "https://other.invalid" }),
      validDpop
    ],
    [
      "audience mismatch",
      access({ ...accessClaims, aud: "other-resource" }),
      validDpop
    ],
    [
      "principal mismatch",
      access({ ...accessClaims, sub: "principal_other" }),
      validDpop
    ],
    [
      "client mismatch",
      access({ ...accessClaims, client_id: "client_other" }),
      validDpop
    ],
    [
      "session mismatch",
      access({ ...accessClaims, sid: "22222222-2222-4222-8222-222222222222" }),
      validDpop
    ],
    [
      "sender confirmation mismatch",
      access({ ...accessClaims, cnf: { jkt: ed25519Thumbprint(otherSenderJwk) } }),
      validDpop
    ],
    [
      "wrong method",
      validAccess,
      dpop({ ...dpopClaims, htm: "GET" })
    ],
    [
      "wrong URI",
      validAccess,
      dpop({ ...dpopClaims, htu: "/different" })
    ],
    [
      "wrong nonce",
      validAccess,
      dpop({ ...dpopClaims, nonce: "different" })
    ],
    [
      "stale DPoP proof",
      validAccess,
      dpop({ ...dpopClaims, iat: NOW_SECONDS - 61 })
    ],
    [
      "future DPoP proof",
      validAccess,
      dpop({ ...dpopClaims, iat: NOW_SECONDS + 1 })
    ],
    [
      "private sender JWK",
      validAccess,
      dpop(
        dpopClaims,
        {
          ...dpopHeader,
          jwk: sender.privateKey.export({ format: "jwk" })
        },
        sender.privateKey
      )
    ],
    ["malformed compact proof", validAccess, "not.a.valid.compact.token"]
  ];

  for (const [name, accessToken, dpopProof] of invalidPairs) {
    assert.throws(
      () => verifyInput(accessToken, dpopProof),
      (error: unknown) =>
        error instanceof SafeError &&
        error.code === "credential_invalid" &&
        error.status === 401,
      name
    );
  }

  const oversizedKeySet = new Map<string, KeyObject>([
    ["issuer-key-1", issuer.publicKey],
    ...Array.from({ length: 8 }, (_, index) => [
      `rotation-key-${index + 1}`,
      issuer.publicKey
    ] as [string, KeyObject])
  ]);
  assert.throws(
    () =>
      verifyOfflineMemoryOnlyRequest({
        accessToken: validAccess,
        dpopProof: validDpop,
        issuer: {
          expectedIssuer: "https://issuer.synthetic.invalid",
          expectedAudience: "source-wire:trusted-memory",
          publicKeys: oversizedKeySet
        },
        request,
        now: () => NOW_MS
      }),
    (error: unknown) =>
      error instanceof SafeError && error.code === "credential_invalid",
    "oversized issuer key rotation set"
  );
});
