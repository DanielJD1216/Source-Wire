import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workspace = join(root, "apps", "alpha1-runtime");
const packageJson = JSON.parse(
  await readFile(join(workspace, "package.json"), "utf8")
);
const security = await readFile(join(workspace, "SECURITY.md"), "utf8");
const currentDisposition = await readFile(
  join(root, "docs", "internal", "alpha1-story5-mcp-advisory-disposition.md"),
  "utf8"
);
const candidate = packageJson.sourceWireCandidate;

assertEqual(packageJson.private, false, "public Alpha guard");
assertEqual(
  packageJson.publishConfig?.access,
  "public",
  "public npm access"
);
assertEqual(packageJson.publishConfig?.tag, "alpha", "npm dist-tag");
assertJsonEqual(packageJson.os, ["darwin", "linux"], "candidate platforms");
assertEqual(packageJson.engines?.node, "22.23.1", "Node.js compatibility");
assertEqual(
  packageJson.dependencies?.["@modelcontextprotocol/sdk"],
  "1.29.0",
  "MCP SDK pin"
);
assertEqual(
  packageJson.dependencies?.["@hono/node-server"],
  "2.0.11",
  "direct Hono server pin"
);
assertEqual(candidate?.mcpTransport, "stdio", "MCP transport");
assertEqual(
  candidate?.advisoryDisposition?.status,
  "temporarily-accepted",
  "published advisory snapshot disposition"
);
assertEqual(
  candidate?.advisoryDisposition?.reviewBy,
  "2026-08-24",
  "published advisory snapshot review date"
);
assertEqual(
  candidate?.publicationSecurityReview?.reviewedAt,
  "2026-07-25",
  "publication security review date"
);
assertEqual(
  candidate?.publicationSecurityReview?.scope,
  "npm-public-alpha-0.1.0-alpha.2",
  "publication security review scope"
);
assertEqual(
  candidate?.publicationSecurityReview?.status,
  "approved-for-publication",
  "publication security review status"
);
assertJsonEqual(
  candidate?.advisoryDisposition?.reviewTriggers,
  [
    "dependency",
    "transport",
    "platform",
    "runtime",
    "publication",
    "hosting",
    "deployment",
    "data"
  ],
  "advisory review triggers"
);

for (const requiredText of [
  "GHSA-frvp-7c67-39w9",
  "review deadline was August 24, 2026",
  "The current repository",
  "production dependency audit reports zero vulnerabilities",
  "resolved on August 31, 2026",
  "immutable release snapshot",
  "Windows is unsupported",
  "MCP transport is stdio only",
  "HTTP and SSE MCP are unsupported",
  "static serving is not used or supported",
  "namespace binding",
  "provider deadline enforcement",
  "trusted application code",
  "statement_timeout",
  "real data",
  "live providers"
]) {
  if (!security.includes(requiredText)) {
    throw new Error(`published security snapshot text missing: ${requiredText}`);
  }
}

for (const requiredText of [
  "Status: Resolved",
  "Resolved: 2026-08-31",
  "current production dependency audit reports zero vulnerabilities",
  "Prior status: Owner accepted",
  "Prior review deadline: 2026-08-24"
]) {
  if (!currentDisposition.includes(requiredText)) {
    throw new Error(`current advisory resolution text missing: ${requiredText}`);
  }
}

const audit = await runAudit();
assertJsonEqual(
  audit.metadata?.vulnerabilities,
  {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    total: 0
  },
  "production dependency audit counts"
);
const vulnerabilityMap = audit.vulnerabilities;
if (
  typeof vulnerabilityMap !== "object" ||
  vulnerabilityMap === null ||
  Array.isArray(vulnerabilityMap)
) {
  throw new Error("production dependency audit package map invalid");
}
assertJsonEqual(
  Object.keys(vulnerabilityMap).sort(),
  [],
  "production dependency audit packages"
);

const runtimeSurface = await Promise.all(
  [
    "src/local-cli/mcp-stdio.ts",
    "src/mcp/server.ts",
    "src/cli/local.ts"
  ].map((path) => readFile(join(workspace, path), "utf8"))
);
for (const forbiddenReference of [
  "server/sse",
  "server/streamableHttp",
  "serve-static",
  "serveStatic"
]) {
  if (runtimeSurface.some((source) => source.includes(forbiddenReference))) {
    throw new Error(`unsupported MCP surface present: ${forbiddenReference}`);
  }
}

console.log("ok local runtime security scope macOS Linux and stdio only");
console.log("ok local runtime exact Alpha dependency pins");
console.log(
  "ok local runtime alpha.2 publication security review recorded 2026-07-25"
);
console.log("ok immutable published alpha.2 advisory snapshot retained");
console.log("ok local runtime production dependency audit reports zero vulnerabilities");
console.log("ok prior nested MCP advisory disposition resolved 2026-08-31");
console.log(
  "blocked production hosting deployment Windows HTTP SSE static serving real data and live providers"
);

function runAudit() {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("npm", ["audit", "--omit=dev", "--json"], {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", rejectPromise);
    child.once("close", (code, signal) => {
      if (code !== 0) {
        rejectPromise(
          new Error(
            `npm audit failed with ${signal ? `signal ${signal}` : `exit code ${code}`}\n${stderr || stdout}`
          )
        );
        return;
      }
      try {
        resolvePromise(JSON.parse(stdout));
      } catch {
        rejectPromise(
          new Error(`npm audit did not return JSON\n${stderr || stdout}`)
        );
      }
    });
  });
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label} mismatch: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
    );
  }
}

function assertJsonEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label} mismatch: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
    );
  }
}
