import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const cliPath = "dist/cli.js";

const checks = [
  {
    label: "valid project-context-pack",
    args: ["validate", "project-context-pack", "examples/fixtures/project-context-pack/project-context.json"],
    expectedExit: 0
  },
  {
    label: "valid second-brain-v1",
    args: ["validate", "second-brain-v1", "examples/fixtures/second-brain/use-2nd-brain-example.json"],
    expectedExit: 0
  },
  {
    label: "valid chat-export-message",
    args: ["validate", "chat-export-message", "examples/fixtures/chat-export/agent-session.jsonl"],
    expectedExit: 0
  },
  {
    label: "valid owner-hosted-api-mcp-boundary",
    args: [
      "validate",
      "owner-hosted-api-mcp-boundary",
      "examples/fixtures/owner-hosted-api-mcp-boundary/boundary-proof-cases.json"
    ],
    expectedExit: 0
  }
];

const tempDir = await mkdtemp(join(tmpdir(), "source-wire-cli-smoke-"));

try {
  const invalidProjectContextPack = join(tempDir, "invalid-project-context-pack.json");
  await writeFile(
    invalidProjectContextPack,
    JSON.stringify({ fixtureType: "source-wire-public-project-context-pack", fixtureSafety: "synthetic" }),
    "utf8"
  );

  checks.push({
    label: "invalid project-context-pack",
    args: ["validate", "project-context-pack", invalidProjectContextPack],
    expectedExit: 1
  });

  const invalidOwnerHostedBoundary = join(tempDir, "invalid-owner-hosted-api-mcp-boundary.json");
  await writeFile(
    invalidOwnerHostedBoundary,
    JSON.stringify({
      fixtureType: "source-wire-owner-hosted-api-mcp-boundary-proof-cases",
      fixtureSafety: "synthetic",
      schemaValidated: true
    }),
    "utf8"
  );

  checks.push({
    label: "invalid owner-hosted-api-mcp-boundary",
    args: ["validate", "owner-hosted-api-mcp-boundary", invalidOwnerHostedBoundary],
    expectedExit: 1
  });

  for (const check of checks) {
    const result = await runCli(check.args);
    if (result.exitCode !== check.expectedExit) {
      console.error(`failed ${check.label}`);
      console.error(`  expected exit ${check.expectedExit}, got ${result.exitCode}`);
      if (result.stdout.trim()) {
        console.error(`  stdout: ${result.stdout.trim()}`);
      }
      if (result.stderr.trim()) {
        console.error(`  stderr: ${result.stderr.trim()}`);
      }
      process.exitCode = 1;
      continue;
    }

    console.log(`ok ${check.label}`);
  }
} finally {
  await rm(tempDir, { force: true, recursive: true });
}

function runCli(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      cwd: process.cwd(),
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

    child.on("close", (exitCode) => {
      resolve({ exitCode: exitCode ?? 1, stdout, stderr });
    });
  });
}
