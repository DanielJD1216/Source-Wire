import type pg from "pg";

import { SafeError } from "./errors.js";
import type { MemoryOnlyTransportContext } from "./global-memory-access-plane.js";
import type { MemoryOnlySearchExecutor } from "./global-memory-only-runtime.js";
import type { AuthenticatedCredential } from "./repository.js";
import {
  executeTrustedMemorySearch,
  type ProtectedReadReceiptBinding,
  type ProtectedReadStageHook,
  type TrustedMemorySearchExecution,
  type TrustedMemorySearchInput
} from "./trusted-memory-search.js";

export type DurableMemoryOnlyReleaseContext = Readonly<
  Record<string, unknown>
>;

export type DurableMemoryOnlyTransportContext = Omit<
  MemoryOnlyTransportContext,
  "authorizationEpoch" | "deletionEpoch"
> &
  Readonly<{
    authorizationEpoch: string;
    deletionEpoch: string;
  }>;

export type DurableMemoryOnlyAuthorization = Readonly<{
  actor: AuthenticatedCredential;
  input: TrustedMemorySearchInput;
  releaseContext: DurableMemoryOnlyReleaseContext;
}>;

export type DurableMemoryOnlyHandoffOutcome =
  | "accepted_in_process"
  | "failed";

export type DurableMemoryOnlyHandoffExecution = Omit<
  TrustedMemorySearchExecution,
  "releaseStatus"
> & {
  releaseStatus: "accepted_in_process";
};

export interface DurableMemoryOnlyAuthorizationAuthority {
  authorizeSearch(input: {
    transport: DurableMemoryOnlyTransportContext;
    request: unknown;
  }): Promise<DurableMemoryOnlyAuthorization>;

  lockAuthorizedRetrieval(
    context: DurableMemoryOnlyReleaseContext,
    client: pg.PoolClient
  ): Promise<void>;

  consumeAuthorizedRelease(
    context: DurableMemoryOnlyReleaseContext,
    receipt: ProtectedReadReceiptBinding,
    processReleaseSecret: Buffer
  ): Promise<boolean>;

  finalizeResponseHandoff(
    context: DurableMemoryOnlyReleaseContext,
    receipt: ProtectedReadReceiptBinding,
    processReleaseSecret: Buffer,
    outcome: DurableMemoryOnlyHandoffOutcome
  ): Promise<boolean>;
}

export class DurableMemoryOnlyRuntime {
  readonly #authority: DurableMemoryOnlyAuthorizationAuthority;
  readonly #pool: pg.Pool;
  readonly #processReleaseSecret: Buffer;
  readonly #executeSearch: MemoryOnlySearchExecutor;
  readonly #writeResponse: (
    serializedResponse: ArrayBuffer
  ) => "accepted_in_process";
  readonly #now: () => number;

  constructor(options: {
    authority: DurableMemoryOnlyAuthorizationAuthority;
    pool: pg.Pool;
    processReleaseSecret: Buffer;
    executeSearch?: MemoryOnlySearchExecutor;
    writeResponse: (
      serializedResponse: ArrayBuffer
    ) => "accepted_in_process";
    now?: () => number;
  }) {
    if (options.processReleaseSecret.length !== 32) {
      throw new Error("process_release_secret_invalid");
    }
    this.#authority = options.authority;
    this.#pool = options.pool;
    this.#processReleaseSecret = Buffer.from(options.processReleaseSecret);
    this.#executeSearch = options.executeSearch ?? executeTrustedMemorySearch;
    this.#writeResponse = options.writeResponse;
    this.#now = options.now ?? Date.now;
  }

  async search(input: {
    transport: DurableMemoryOnlyTransportContext;
    request: unknown;
    traceId: string;
    signal?: AbortSignal;
    onStage?: ProtectedReadStageHook;
  }): Promise<DurableMemoryOnlyHandoffExecution> {
    const startedAtMs = this.#now();
    if (!Number.isSafeInteger(startedAtMs) || startedAtMs < 0) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    const authorized = await this.#authority.authorizeSearch({
      transport: input.transport,
      request: input.request
    });
    let fenceCalls = 0;
    let consumeCalls = 0;
    let releaseConsumed = false;

    const execution = await this.#executeSearch(
      this.#pool,
      authorized.actor,
      authorized.input,
      input.traceId,
      {
        processReleaseSecret: this.#processReleaseSecret,
        startedAtMs,
        gateBReleaseContext: authorized.releaseContext,
        beforeProtectedRead: async (client) => {
          fenceCalls += 1;
          if (fenceCalls !== 1) {
            throw new SafeError("release_binding_invalid", 503, true);
          }
          await this.#authority.lockAuthorizedRetrieval(
            authorized.releaseContext,
            client
          );
        },
        consumeReceipt: async (receipt) => {
          consumeCalls += 1;
          if (consumeCalls !== 1) {
            throw new SafeError("release_binding_invalid", 503, true);
          }
          releaseConsumed = await this.#authority.consumeAuthorizedRelease(
            authorized.releaseContext,
            receipt,
            this.#processReleaseSecret
          );
          return releaseConsumed;
        },
        ...(input.signal ? { signal: input.signal } : {}),
        ...(input.onStage ? { onStage: input.onStage } : {})
      }
    );
    if (fenceCalls !== 1 || consumeCalls !== 1 || !releaseConsumed) {
      execution.clear();
      throw new SafeError("release_binding_invalid", 503, true);
    }

    const handoffBuffer = new ArrayBuffer(execution.serializedResponse.byteLength);
    const handoffBytes = new Uint8Array(handoffBuffer);
    handoffBytes.set(execution.serializedResponse);
    let writerError: unknown;
    let outcome: DurableMemoryOnlyHandoffOutcome = "failed";
    try {
      const accepted: unknown = this.#writeResponse(handoffBuffer);
      if (accepted !== "accepted_in_process") {
        throw new SafeError("operation_unavailable", 503, true);
      }
      outcome = "accepted_in_process";
    } catch (error) {
      writerError = error;
    }

    let finalized = false;
    try {
      finalized = await this.#authority.finalizeResponseHandoff(
        authorized.releaseContext,
        execution.receipt,
        this.#processReleaseSecret,
        outcome
      );
    } catch {
      finalized = false;
    } finally {
      handoffBytes.fill(0);
      execution.clear();
    }

    if (!finalized) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    if (writerError !== undefined) {
      throw writerError;
    }
    return {
      ...execution,
      releaseStatus: "accepted_in_process"
    };
  }
}