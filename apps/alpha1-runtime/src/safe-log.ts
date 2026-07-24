export type SafeLogEntry = {
  timestamp?: string;
  traceId: string;
  operation: string;
  result: string;
  durationMs: number;
  actorReference: string;
};

export type SafeLogger = (entry: SafeLogEntry) => void;

export const stdoutSafeLogger: SafeLogger = (entry) => {
  process.stdout.write(
    `${JSON.stringify({
      timestamp: entry.timestamp ?? new Date().toISOString(),
      traceId: entry.traceId,
      operation: entry.operation,
      result: entry.result,
      durationMs: entry.durationMs,
      actorReference: entry.actorReference
    })}\n`
  );
};
