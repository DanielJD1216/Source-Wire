export type SafeErrorCode =
  | "authentication_required"
  | "credential_invalid"
  | "credential_expired"
  | "credential_revoked"
  | "capability_not_allowed"
  | "namespace_required"
  | "namespace_not_allowed"
  | "validation_failed"
  | "state_conflict"
  | "idempotency_conflict"
  | "schema_incompatible"
  | "schema_too_old"
  | "schema_too_new"
  | "rate_limited"
  | "operation_unavailable";

export class SafeError extends Error {
  readonly code: SafeErrorCode;
  readonly status: number;
  readonly retryable: boolean;

  constructor(code: SafeErrorCode, status: number, retryable = false) {
    super(code);
    this.name = "SafeError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function asSafeError(error: unknown): SafeError {
  if (error instanceof SafeError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.startsWith("validation_failed:")) {
    return new SafeError("validation_failed", 400);
  }
  if (message === "fresh_target_required") {
    return new SafeError("state_conflict", 409);
  }
  if (message === "schema_too_old") {
    return new SafeError("schema_too_old", 503);
  }
  if (message === "schema_too_new") {
    return new SafeError("schema_too_new", 503);
  }
  if (message === "schema_incompatible") {
    return new SafeError("schema_incompatible", 503);
  }

  return new SafeError("operation_unavailable", 503, true);
}
