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
  "advisory disposition"
);
assertEqual(
  candidate?.advisoryDisposition?.reviewBy,
  "2026-08-24",
  "advisory review date"
);
assertEqual(
  candidate?.publicationSecurityReview?.reviewedAt,
  "2026-07-25",
  "publication security review date"
);
assertEqual(
  candidate?.publicationSecurityReview?.scope,
  "npm-public-alpha-0.1.0-alpha.1",
  "publication security review scope"
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
  "August 24, 2026",
  "Windows is unsupported",
  "MCP transport is stdio only",
  "HTTP and SSE MCP are unsupported",
  "static serving is not used or supported",
  "Publication review completed on July 25, 2026",
  "real data",
  "live providers"
]) {
  if (!security.includes(requiredText)) {
    throw new Error(`security disposition text missing: ${requiredText}`);
  }
}

const audit = await runAudit();
assertJsonEqual(
  audit.metadata?.vulnerabilities,
  {
    info: 0,
    low: 0,
    moderate: 2,
    high: 0,
    critical: 0,
    total: 2
  },
  "production dependency audit counts"
);
assertJsonEqual(
  Object.keys(audit.vulnerabilities ?? {}).sort(),
  ["@hono/node-server", "@modelcontextprotocol/sdk"],
  "production dependency audit packages"
);
const honoFinding = audit.vulnerabilities?.["@hono/node-server"];
const advisory = Array.isArray(honoFinding?.via)
  ? honoFinding.via.find(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        item.url ===
          "https://github.com/advisories/GHSA-frvp-7c67-39w9"
    )
  : undefined;
if (!advisory || advisory.severity !== "moderate") {
  throw new Error("approved nested Hono advisory did not match fresh audit");
}
if (
  audit.vulnerabilities?.["@modelcontextprotocol/sdk"]?.severity !==
    "moderate"
) {
  throw new Error("approved nested MCP finding did not match fresh audit");
}

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
  "ok local runtime npm publication security review completed 2026-07-25"
);
console.log(
  "accepted two moderate nested MCP findings for unsupported Windows static serving scope"
);
console.log("review local runtime advisory disposition by 2026-08-24");
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
    child.once("close", () => {
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
