import {
  MAX_PROTECTED_CONCURRENCY,
  MAX_PROTECTED_REQUESTS_PER_MINUTE
} from "./config.js";
import { SafeError } from "./errors.js";

export class LocalProtectedRequestGate {
  private active = 0;
  private readonly buckets = new Map<
    string,
    {
      windowStartedAt: number;
      windowCount: number;
    }
  >();
  private readonly maximumConcurrent: number;
  private readonly maximumPerWindow: number;
  private readonly windowMs: number;

  constructor(
    options: {
      maximumConcurrent?: number;
      maximumPerWindow?: number;
      windowMs?: number;
    } = {}
  ) {
    this.maximumConcurrent =
      options.maximumConcurrent ?? MAX_PROTECTED_CONCURRENCY;
    this.maximumPerWindow =
      options.maximumPerWindow ?? MAX_PROTECTED_REQUESTS_PER_MINUTE;
    this.windowMs = options.windowMs ?? 60_000;
  }

  async run<T>(remoteAddress: string | undefined, operation: () => Promise<T>): Promise<T> {
    const address = normalizeLiteralLoopbackAddress(remoteAddress);
    const now = Date.now();
    const bucket = this.buckets.get(address) ?? {
      windowStartedAt: now,
      windowCount: 0
    };
    if (now - bucket.windowStartedAt >= this.windowMs) {
      bucket.windowStartedAt = now;
      bucket.windowCount = 0;
    }

    if (
      this.active >= this.maximumConcurrent ||
      bucket.windowCount >= this.maximumPerWindow
    ) {
      throw new SafeError("rate_limited", 429, true);
    }

    this.buckets.set(address, bucket);
    this.active += 1;
    bucket.windowCount += 1;
    try {
      return await operation();
    } finally {
      this.active -= 1;
    }
  }
}

export function normalizeLiteralLoopbackAddress(value: string | undefined): "127.0.0.1" | "::1" {
  if (value === "127.0.0.1" || value === "::ffff:127.0.0.1") {
    return "127.0.0.1";
  }
  if (value === "::1") {
    return "::1";
  }

  throw new SafeError("operation_unavailable", 503, true);
}
