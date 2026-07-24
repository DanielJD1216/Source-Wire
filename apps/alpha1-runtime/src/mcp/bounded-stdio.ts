import { Transform, type TransformCallback } from "node:stream";

import { MAX_MCP_STDIO_FRAME_BYTES } from "../config.js";

export class BoundedStdioInput extends Transform {
  private currentFrameBytes = 0;

  constructor(private readonly maximumFrameBytes = MAX_MCP_STDIO_FRAME_BYTES) {
    super();
  }

  override _transform(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
    let segmentStart = 0;

    for (let index = 0; index < bytes.length; index += 1) {
      if (bytes[index] !== 0x0a) continue;
      const segment = bytes.subarray(segmentStart, index + 1);
      if (this.currentFrameBytes + segment.length > this.maximumFrameBytes) {
        callback(new Error("stdio_frame_too_large"));
        return;
      }
      this.push(segment);
      this.currentFrameBytes = 0;
      segmentStart = index + 1;
    }

    const remainder = bytes.subarray(segmentStart);
    if (this.currentFrameBytes + remainder.length > this.maximumFrameBytes) {
      callback(new Error("stdio_frame_too_large"));
      return;
    }
    if (remainder.length > 0) {
      this.push(remainder);
      this.currentFrameBytes += remainder.length;
    }
    callback();
  }
}
