import {
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual
} from "node:crypto";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const SECRET = /^[A-Za-z0-9_-]{43}$/u;

export const CREDENTIAL_VERIFIER_ALGORITHM = "hmac-sha256-v1";

export type CreatedCredentialSecret = {
  credentialId: string;
  displayPrefix: string;
  token: string;
};

export type ParsedCredentialToken = {
  credentialId: string;
  secret: string;
};

export function createCredentialSecret(credentialId = randomUUID()): CreatedCredentialSecret {
  assertCredentialIdentifier(credentialId);

  const secret = randomBytes(32).toString("base64url");
  const displayPrefix = `sw_a1.${credentialId}`;

  return {
    credentialId,
    displayPrefix,
    token: `${displayPrefix}.${secret}`
  };
}

export function assertCredentialIdentifier(value: string): string {
  if (!UUID_V4.test(value)) {
    throw new Error("credential_identifier_invalid");
  }
  return value;
}

export function parseCredentialToken(token: string): ParsedCredentialToken | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "sw_a1" || !UUID_V4.test(parts[1] ?? "")) {
    return null;
  }

  const secret = parts[2] ?? "";
  if (!SECRET.test(secret)) {
    return null;
  }

  return {
    credentialId: parts[1] as string,
    secret
  };
}

export function computeCredentialVerifier(key: Buffer, exactToken: string): Buffer {
  return createHmac("sha256", key).update(Buffer.from(exactToken, "utf8")).digest();
}

export function verifierMatches(key: Buffer, exactToken: string, storedVerifier: Buffer): boolean {
  const candidate = computeCredentialVerifier(key, exactToken);
  return candidate.length === storedVerifier.length && timingSafeEqual(candidate, storedVerifier);
}

export function computeDummyVerifier(key: Buffer, exactInput: string): Buffer {
  return createHmac("sha256", key)
    .update(Buffer.from(`source-wire-alpha1-dummy:${exactInput}`, "utf8"))
    .digest();
}

export function performDummyVerifierComparison(key: Buffer, exactInput: string): void {
  const candidate = computeCredentialVerifier(key, exactInput);
  const dummy = computeDummyVerifier(key, exactInput);
  timingSafeEqual(candidate, dummy);
}
