import { randomBytes } from "node:crypto";
import {
  constants,
  lstat,
  open,
  realpath,
  rename,
  rm
} from "node:fs/promises";
import { basename, dirname, isAbsolute, join } from "node:path";

export async function readBoundedRegularFile(
  path: string,
  maximumBytes: number
): Promise<Buffer> {
  assertAbsolutePath(path);
  const before = await lstat(path);
  if (
    !before.isFile() ||
    before.isSymbolicLink() ||
    before.nlink !== 1 ||
    before.size < 1 ||
    before.size > maximumBytes
  ) {
    invalidFile();
  }
  const handle = await open(
    path,
    constants.O_RDONLY | noFollowFlag()
  );
  try {
    const current = await handle.stat();
    if (
      !current.isFile() ||
      current.nlink !== 1 ||
      current.dev !== before.dev ||
      current.ino !== before.ino ||
      current.size !== before.size
    ) {
      invalidFile();
    }
    const bytes = await handle.readFile();
    if (bytes.length !== current.size || bytes.length > maximumBytes) {
      invalidFile();
    }
    return bytes;
  } finally {
    await handle.close();
  }
}

export async function writeSensitiveBufferAtomically(
  destination: string,
  bytes: Buffer,
  maximumBytes: number
): Promise<void> {
  await writeSensitiveStreamAtomically(
    destination,
    (async function* () {
      yield bytes;
    })(),
    maximumBytes
  );
}

export async function writeSensitiveStreamAtomically(
  destination: string,
  chunks: AsyncIterable<Uint8Array>,
  maximumBytes: number,
  onChunk?: (chunk: Buffer) => void,
  beforeFinalize?: () => void
): Promise<{ byteCount: number }> {
  const parent = await validateDestination(destination);
  const temporaryPath = join(
    parent,
    `.${basename(destination)}.${randomBytes(16).toString("hex")}.tmp`
  );
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  let renamed = false;
  let byteCount = 0;
  try {
    handle = await open(
      temporaryPath,
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_WRONLY |
        noFollowFlag(),
      0o600
    );
    for await (const chunkValue of chunks) {
      const chunk = Buffer.from(chunkValue);
      byteCount += chunk.length;
      if (byteCount > maximumBytes) invalidFile();
      onChunk?.(chunk);
      await handle.write(chunk);
    }
    if (byteCount < 1) invalidFile();
    beforeFinalize?.();
    await handle.sync();
    await handle.chmod(0o600);
    await handle.close();
    handle = undefined;
    await rename(temporaryPath, destination);
    renamed = true;
    const parentHandle = await open(parent, constants.O_RDONLY);
    try {
      await parentHandle.sync();
    } finally {
      await parentHandle.close();
    }
    return { byteCount };
  } finally {
    await handle?.close().catch(() => undefined);
    if (!renamed) {
      await rm(temporaryPath, { force: true }).catch(() => undefined);
    }
  }
}

async function validateDestination(destination: string): Promise<string> {
  assertAbsolutePath(destination);
  const parent = dirname(destination);
  const parentStat = await lstat(parent);
  if (
    !parentStat.isDirectory() ||
    parentStat.isSymbolicLink() ||
    (parentStat.mode & 0o002) !== 0
  ) {
    invalidFile();
  }
  if ((await realpath(parent)) !== parent) invalidFile();
  try {
    const current = await lstat(destination);
    if (
      !current.isFile() ||
      current.isSymbolicLink() ||
      current.nlink !== 1
    ) {
      invalidFile();
    }
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    if (code !== "ENOENT") throw error;
  }
  return parent;
}

function assertAbsolutePath(path: string): void {
  if (!path || !isAbsolute(path) || basename(path) === "." || basename(path) === "..") {
    invalidFile();
  }
}

function noFollowFlag(): number {
  return "O_NOFOLLOW" in constants ? constants.O_NOFOLLOW : 0;
}

function invalidFile(): never {
  throw new Error("safe_local_file_invalid");
}
