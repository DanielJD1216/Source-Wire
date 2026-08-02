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

export interface DurableMemoryOnlyAuthorizationAuthority {
  authorizeSearch(input: {
    transport: DurableMemoryOnlyTransportContext;
    request: unknown;
  }): Promise<DurableMemoryOnlyAuthorization>;

  consumeAuthorizedRelease(
    context: DurableMemoryOnlyReleaseContext,
    receipt: ProtectedReadReceiptBinding,
    processReleaseSecret: Buffer
  ): Promise<boolean>;
}

export class DurableMemoryOnlyRuntime {
  readonly #authority: DurableMemoryOnlyAuthorizationAuthority;
  readonly #pool: pg.Pool;
  readonly #processReleaseSecret: Buffer;
  readonly #executeSearch: MemoryOnlySearchExecutor;
  readonly #now: () => number;

  constructor(options: {
    authority: DurableMemoryOnlyAuthorizationAuthority;
    pool: pg.Pool;
    processReleaseSecret: Buffer;
    executeSearch?: MemoryOnlySearchExecutor;
    now?: () => number;
  }) {
    if (options.processReleaseSecret.length !== 32) {
      throw new Error("process_release_secret_invalid");
    }
    this.#authority = options.authority;
    this.#pool = options.pool;
    this.#processReleaseSecret = Buffer.from(options.processReleaseSecret);
    this.#executeSearch = options.executeSearch ?? executeTrustedMemorySearch;
    this.#now = options.now ?? Date.now;
  }

  async search(input: {
    transport: DurableMemoryOnlyTransportContext;
    request: unknown;
    traceId: string;
    signal?: AbortSignal;
    onStage?: ProtectedReadStageHook;
  }): Promise<TrustedMemorySearchExecution> {
    const startedAtMs = this.#now();
    if (!Number.isSafeInteger(startedAtMs) || startedAtMs < 0) {
      throw new SafeError("operation_unavailable", 503, true);
    }
    const authorized = await this.#authority.authorizeSearch({
      transport: input.transport,
      request: input.request
    });
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
    if (consumeCalls !== 1 || !releaseConsumed) {
      execution.clear();
      throw new SafeError("release_binding_invalid", 503, true);
    }
    return execution;
  }
}