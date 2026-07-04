import { mkdtemp, mkdir, cp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const tempRoot = await mkdtemp(join(tmpdir(), "source-wire-reviewer-smoke-"));
const checkoutRoot = join(tempRoot, "Source-Wire");

const requiredMarkers = [
  "Package: @source-wire/contracts",
  "Version: 0.1.0",
  "License: Apache-2.0",
  "Publish boundary: npm package public at @source-wire/contracts@0.1.0, hosted runtime blocked",
  "Runtime boundary: synthetic in-memory boundary plus synthetic API/MCP skeleton and threat-boundary package only, no backend runtime included",
  "ok readiness report"
];

try {
  await mkdir(checkoutRoot, { recursive: true });
  const files = await listGitVisibleFiles();

  for (const file of files) {
    await mkdir(dirname(join(checkoutRoot, file)), { recursive: true });
    await cp(join(root, file), join(checkoutRoot, file));
  }

  await run("npm", ["install"], checkoutRoot);
  const readiness = await run("npm", ["run", "readiness:report"], checkoutRoot);

  for (const marker of requiredMarkers) {
    if (!readiness.stdout.includes(marker)) {
      throw new Error(`missing reviewer readiness marker: ${marker}`);
    }
  }

  console.log("ok reviewer first-pass smoke");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

async function listGitVisibleFiles() {
  const result = await run("git", ["ls-files", "--cached", "--others", "--exclude-standard"], root);
  const files = result.stdout.split(/\r?\n/u).filter(Boolean);
  return files.filter((file) => !file.startsWith("node_modules/") && !file.startsWith("dist/"));
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("close", async (exitCode) => {
      if (exitCode === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const logPath = join(tempRoot, "failure.log");
      await writeFile(
        logPath,
        [
          `command: ${command} ${args.join(" ")}`,
          `cwd: ${cwd}`,
          `exitCode: ${exitCode}`,
          "",
          "stdout:",
          stdout,
          "",
          "stderr:",
          stderr
        ].join("\n")
      );
      reject(new Error(`reviewer smoke command failed: ${command} ${args.join(" ")}. log: ${logPath}`));
    });
  });
}
