import type pg from "pg";

import { SafeError } from "./errors.js";
import {
  type MemoryOnlyPolicySnapshot,
  type MemoryOnlyTransportContext,
  SyntheticMemoryOnlyAccessPlane
} from "./global-memory-access-plane.js";
import type { AuthenticatedCredential } from "./repository.js";
import {
  executeTrustedMemorySearch,
  type ProtectedReadReceiptBinding,
  type ProtectedReadStageHook,
  type TrustedMemorySearchExecution,
  type TrustedMemorySearchInput
} from "./trusted-memory-search.js";

export type MemoryOnlySearchExecutor = (
  pool: pg.Pool,
  actor: AuthenticatedCredential,
  input: TrustedMemorySearchInput,
  traceId: string,
  options: {
    processReleaseSecret: Buffer;
    startedAtMs: number;
    gateBReleaseContext?: Readonly<Record<string, unknown>>;
    signal?: AbortSignal;
    onStage?: ProtectedReadStageHook;
    beforeProtectedRead?: (client: pg.PoolClient) => Promise<void>;
    consumeReceipt?: (
      receipt: ProtectedReadReceiptBinding
    ) => Promise<boolean>;
  }
) => Promise<TrustedMemorySearchExecution>;

export class SyntheticMemoryOnlyRuntime {
  readonly #accessPlane: SyntheticMemoryOnlyAccessPlane;
  readonly #pool: pg.Pool;
  readonly #processReleaseSecret: Buffer;
  readonly #executeSearch: MemoryOnlySearchExecutor;
  readonly #now: () => number;

  constructor(options: {
    accessPlane: SyntheticMemoryOnlyAccessPlane;
    pool: pg.Pool;
    processReleaseSecret: Buffer;
    executeSearch?: MemoryOnlySearchExecutor;
    now?: () => number;
  }) {
    if (options.processReleaseSecret.length !== 32) {
      throw new Error("process_release_secret_invalid");
    }
    this.#accessPlane = options.accessPlane;
    this.#pool = options.pool;
    this.#processReleaseSecret = Buffer.from(options.processReleaseSecret);
    this.#executeSearch = options.executeSearch ?? executeTrustedMemorySearch;
    this.#now = options.now ?? Date.now;
  }

  async search(input: {
    policy: MemoryOnlyPolicySnapshot;
    transport: MemoryOnlyTransportContext;
    request: unknown;
    traceId: string;
    signal?: AbortSignal;
    onStage?: ProtectedReadStageHook;
  }): Promise<TrustedMemorySearchExecution> {
    const authorized = this.#accessPlane.authorizeSearch({
      policy: input.policy,
      transport: input.transport,
      request: input.request
    });

    const startedAtMs = this.#now();
    if (!Number.isSafeInteger(startedAtMs) || startedAtMs < 0) {
      throw new SafeError("operation_unavailable", 503, true);
    }

    return this.#executeSearch(
      this.#pool,
      authorized.actor as AuthenticatedCredential,
      authorized.input as TrustedMemorySearchInput,
      input.traceId,
      {
        processReleaseSecret: this.#processReleaseSecret,
        startedAtMs,
        ...(input.signal ? { signal: input.signal } : {}),
        ...(input.onStage ? { onStage: input.onStage } : {})
      }
    );
  }
}
