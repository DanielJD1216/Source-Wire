import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const tempRoot = await mkdtemp(join(tmpdir(), "source-wire-package-content-"));
const requiredInstalledPaths = [
  "README.md",
  "docs/adopter-walkthrough.md",
  "docs/architecture-map.md",
  "docs/api-reference.md",
  "docs/contracts/mcp-tool-behavior-contract.md",
  "docs/contracts/owner-hosted-api-mcp-boundary-contract.md",
  "docs/contracts/second-brain-v1-contract.md",
  "docs/contracts/source-connection-contract.md",
  "docs/contracts/source-graph-adapter-contract.md",
  "docs/decision-prototypes/license-evidence.md",
  "docs/decision-prototypes/license-options.md",
  "docs/decision-prototypes/license-recommendation.md",
  "docs/decision-prototypes/runtime-adjacent-evidence.md",
  "docs/decision-prototypes/runtime-adjacent-options.md",
  "docs/decision-prototypes/runtime-adjacent-recommendation.md",
  "docs/first-runtime-prd.md",
  "docs/proof/public-extraction-checklist.md",
  "docs/public-runtime-decision.md",
  "docs/runtime-boundary-readiness.md",
  "docs/runtime-implementation-gate.md",
  "examples/fixtures/owner-hosted-api-mcp-boundary/README.md",
  "examples/fixtures/owner-hosted-api-mcp-boundary/boundary-proof-cases.json",
  "examples/runtime-boundary/README.md",
  "examples/runtime-boundary/synthetic-boundary-smoke.mjs",
  "examples/typescript/README.md"
];

try {
  await runChecked("npm", ["run", "build"], root);

  const packResult = await runChecked("npm", ["pack", "--json", "--pack-destination", tempRoot], root);
  const [pack] = JSON.parse(packResult.stdout);
  const tarballPath = resolve(tempRoot, pack.filename);
  const consumerRoot = join(tempRoot, "consumer");

  await mkdir(consumerRoot, { recursive: true });
  await writeFile(
    join(consumerRoot, "package.json"),
    JSON.stringify(
      {
        type: "module",
        private: true,
        dependencies: {
          "@source-wire/contracts": `file:${tarballPath}`
        }
      },
      null,
      2
    )
  );

  await runChecked("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], consumerRoot);

  const installedPackageRoot = join(consumerRoot, "node_modules", "@source-wire", "contracts");
  for (const requiredPath of requiredInstalledPaths) {
    await assertInstalledPath(installedPackageRoot, requiredPath);
  }

  await assertInstalledFileIncludes(installedPackageRoot, "docs/runtime-boundary-readiness.md", [
    "Status: readiness summary only. No runtime implementation is included.",
    "Source-Wire-hosted memory.",
    "Source-Wire does not host memory.",
    "Trusted memory must require owner or application approval."
  ]);

  const docsLinkCheckerPath = join(root, "scripts", "check-doc-links.mjs");
  const docsLinksResult = await runChecked(process.execPath, [docsLinkCheckerPath], installedPackageRoot);

  console.log(`ok package content smoke ${pack.name}@${pack.version}`);
  console.log(`ok installed required paths ${requiredInstalledPaths.length}`);
  console.log("ok installed runtime readiness summary");
  console.log("ok installed runtime readiness summary content");
  console.log(docsLinksResult.stdout.trim());
  console.log("ok installed package docs links");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

async function assertInstalledPath(installedPackageRoot, relativePath) {
  try {
    await stat(join(installedPackageRoot, relativePath));
  } catch {
    throw new Error(`missing installed package path: ${relativePath}`);
  }
}

async function assertInstalledFileIncludes(installedPackageRoot, relativePath, requiredPhrases) {
  const content = await readFile(join(installedPackageRoot, relativePath), "utf8");
  const missingPhrases = requiredPhrases.filter((phrase) => !content.includes(phrase));

  if (missingPhrases.length > 0) {
    throw new Error(
      [
        `installed package path is missing required content: ${relativePath}`,
        ...missingPhrases.map((phrase) => `missing phrase: ${phrase}`)
      ].join("\n")
    );
  }
}

function runChecked(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
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
      if (exitCode === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          [
            `command failed: ${command} ${args.join(" ")}`,
            `cwd: ${cwd}`,
            `exitCode: ${exitCode ?? 1}`,
            stdout.trim() ? `stdout:\n${stdout.trim()}` : "",
            stderr.trim() ? `stderr:\n${stderr.trim()}` : ""
          ]
            .filter(Boolean)
            .join("\n")
        )
      );
    });
  });
}
