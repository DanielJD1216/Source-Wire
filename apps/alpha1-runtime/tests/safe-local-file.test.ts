import assert from "node:assert/strict";
import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  readBoundedRegularFile,
  writeSensitiveBufferAtomically,
  writeSensitiveStreamAtomically
} from "../src/safe-local-file.js";

test("sensitive local files finalize atomically with owner-only permissions", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const destination = join(directory, "portable.ndjson");
    const result = await writeSensitiveStreamAtomically(
      destination,
      chunks("first\n", "second\n"),
      128
    );
    assert.equal(result.byteCount, 13);
    assert.equal(await readFile(destination, "utf8"), "first\nsecond\n");
    assert.equal((await lstat(destination)).mode & 0o777, 0o600);
    assert.equal(
      (await readBoundedRegularFile(destination, 128)).toString("utf8"),
      "first\nsecond\n"
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("stream and finalization failures leave no partial destination or temporary file", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const existing = join(directory, "existing.ndjson");
    await writeFile(existing, "preserved\n", { mode: 0o600 });
    await assert.rejects(
      writeSensitiveStreamAtomically(
        existing,
        failingChunks(),
        128
      ),
      /injected_stream_failure/u
    );
    assert.equal(await readFile(existing, "utf8"), "preserved\n");

    const absent = join(directory, "absent.ndjson");
    await assert.rejects(
      writeSensitiveStreamAtomically(
        absent,
        chunks("complete\n"),
        128,
        undefined,
        () => {
          throw new Error("injected_finalize_failure");
        }
      ),
      /injected_finalize_failure/u
    );
    await assert.rejects(lstat(absent), { code: "ENOENT" });
    assert.deepEqual(
      (await readdir(directory)).filter((name) => name.endsWith(".tmp")),
      []
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("sensitive local file seams reject symlinks, hard links, and world-writable parents", async () => {
  const directory = await privateTemporaryDirectory();
  try {
    const original = join(directory, "original");
    const destinationSymlink = join(directory, "destination-symlink");
    const hardLink = join(directory, "hard-link");
    await writeFile(original, "secret\n", { mode: 0o600 });
    await symlink(original, destinationSymlink);
    await link(original, hardLink);

    await assert.rejects(
      writeSensitiveBufferAtomically(
        destinationSymlink,
        Buffer.from("replacement\n"),
        128
      ),
      /safe_local_file_invalid/u
    );
    await assert.rejects(
      readBoundedRegularFile(hardLink, 128),
      /safe_local_file_invalid/u
    );

    const unsafeDirectory = join(directory, "unsafe");
    await mkdir(unsafeDirectory, { mode: 0o777 });
    await chmod(unsafeDirectory, 0o777);
    await assert.rejects(
      writeSensitiveBufferAtomically(
        join(unsafeDirectory, "portable.ndjson"),
        Buffer.from("blocked\n"),
        128
      ),
      /safe_local_file_invalid/u
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

async function privateTemporaryDirectory(): Promise<string> {
  return realpath(await mkdtemp(join(tmpdir(), "source-wire-safe-file-")));
}

async function* chunks(...values: string[]): AsyncGenerator<Buffer> {
  for (const value of values) yield Buffer.from(value);
}

async function* failingChunks(): AsyncGenerator<Buffer> {
  yield Buffer.from("partial\n");
  throw new Error("injected_stream_failure");
}
