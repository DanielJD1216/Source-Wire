import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes
} from "node:crypto";

const REPLAY_KEY_SALT = Buffer.from(
  "source-wire.alpha1.credential-idempotency.salt.v1",
  "utf8"
);
const REPLAY_KEY_INFO = Buffer.from(
  "source-wire.alpha1.credential-idempotency.aes-256-gcm.v1",
  "utf8"
);

export const IDEMPOTENCY_REPLAY_WINDOW_MS = 5 * 60 * 1_000;

export type ReplayAuthenticatedContext = {
  actorCredentialId: string;
  operation: string;
  idempotencyKey: string;
  requestDigest: string;
  replayExpiresAt: string;
};

export type EncryptedReplaySecret = {
  ciphertext: Buffer;
  nonce: Buffer;
  tag: Buffer;
};

export function canonicalRequestDigest(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}

export function deriveIdempotencyReplayKey(verifierKey: Buffer): Buffer {
  return Buffer.from(
    hkdfSync("sha256", verifierKey, REPLAY_KEY_SALT, REPLAY_KEY_INFO, 32)
  );
}

export function encryptReplaySecret(
  replayKey: Buffer,
  plaintext: string,
  context: ReplayAuthenticatedContext
): EncryptedReplaySecret {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", replayKey, nonce);
  cipher.setAAD(Buffer.from(canonicalJson(context), "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ]);

  return {
    ciphertext,
    nonce,
    tag: cipher.getAuthTag()
  };
}

export function decryptReplaySecret(
  replayKey: Buffer,
  encrypted: EncryptedReplaySecret,
  context: ReplayAuthenticatedContext
): string {
  const decipher = createDecipheriv("aes-256-gcm", replayKey, encrypted.nonce);
  decipher.setAAD(Buffer.from(canonicalJson(context), "utf8"));
  decipher.setAuthTag(encrypted.tag);
  return Buffer.concat([
    decipher.update(encrypted.ciphertext),
    decipher.final()
  ]).toString("utf8");
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right)
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }

  throw new Error("canonical_request_invalid");
}
