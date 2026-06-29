import { spawn } from "node:child_process";

const requiredPaths = [
  "README.md",
  "package.json",
  "dist/index.js",
  "dist/index.d.ts",
  "dist/cli.js",
  "docs/index.md",
  "docs/quickstart.md",
  "docs/api-reference.md",
  "docs/runtime-boundary.md",
  "docs/schema-exports.md",
  "docs/validation-cli.md",
  "docs/ci-checks.md",
  "docs/publish-readiness.md",
  "docs/release-decision.md",
  "docs/license-version-policy.md",
  "docs/owner-license-approval-packet.md",
  "docs/future-license-change-plan.md",
  "schemas/project-context-pack.schema.json",
  "schemas/second-brain-v1.schema.json",
  "schemas/chat-export-message.schema.json",
  "examples/fixtures/README.md",
  "examples/fixtures/project-context-pack/project-context.json",
  "examples/fixtures/second-brain/use-2nd-brain-example.json",
  "examples/fixtures/chat-export/agent-session.jsonl",
  "examples/fixtures/markdown-vault/Projects/Atlas Demo Workspace.md",
  "examples/fixtures/markdown-vault/Projects/Operating Rules.md",
  "examples/fixtures/markdown-vault/Projects/Research Notes.md",
  "examples/typescript/README.md",
  "examples/typescript/runtime-boundary.ts",
  "examples/typescript/schema-registry.ts",
  "examples/typescript/validation-helper.ts",
  "examples/typescript/contract-types.ts",
  "examples/typescript/tsconfig.json"
];

const forbiddenPathPrefixes = [
  ".git/",
  ".github/",
  "node_modules/",
  "src/",
  "scripts/"
];

const forbiddenExactPaths = [
  ".env",
  ".env.local",
  "package-lock.json",
  "tsconfig.json"
];

const packResult = await run("npm", ["pack", "--dry-run", "--json"]);
if (packResult.exitCode !== 0) {
  console.error(packResult.stderr.trim() || packResult.stdout.trim());
  process.exit(packResult.exitCode);
}

const parsed = JSON.parse(packResult.stdout);
const [pack] = parsed;
const files = pack.files.map((entry) => entry.path).sort();
const failures = [];

for (const requiredPath of requiredPaths) {
  if (!files.includes(requiredPath)) {
    failures.push(`missing required package path: ${requiredPath}`);
  }
}

for (const file of files) {
  if (forbiddenExactPaths.includes(file)) {
    failures.push(`forbidden package path: ${file}`);
  }

  const forbiddenPrefix = forbiddenPathPrefixes.find((prefix) => file.startsWith(prefix));
  if (forbiddenPrefix) {
    failures.push(`forbidden package path prefix ${forbiddenPrefix}: ${file}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`failed ${failure}`);
  }
  process.exit(1);
}

console.log(`ok package dry-run ${pack.name}@${pack.version}`);
console.log(`ok package file count ${files.length}`);
console.log(`ok package filename ${pack.filename}`);

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: process.platform === "win32",
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
