import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

const root = process.cwd();
const tempRoot = await mkdtemp(join(tmpdir(), "source-wire-consumer-"));

try {
  await runChecked("npm", ["run", "build"], root);

  const packResult = await runChecked("npm", ["pack", "--json", "--pack-destination", tempRoot], root);
  const [pack] = JSON.parse(packResult.stdout);
  const tarballPath = resolve(tempRoot, pack.filename);
  const consumerRoot = join(tempRoot, "consumer");
  const srcRoot = join(consumerRoot, "src");

  await mkdir(srcRoot, { recursive: true });
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
  await writeFile(
    join(consumerRoot, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          target: "ES2022",
          outDir: "dist"
        },
        include: ["src/**/*.ts"]
      },
      null,
      2
    )
  );
  await writeFile(
    join(srcRoot, "consumer.ts"),
    `import {
  SOURCE_WIRE_PACKAGE_VERSION,
  SOURCE_WIRE_RUNTIME_BOUNDARY,
  SOURCE_WIRE_SCHEMA_EXPORT_LIST,
  isSourceWireValidationSchemaName
} from "@source-wire/contracts";

import type {
  SourceWireRuntimeBoundary,
  SourceWireSecondBrainResponse,
  SourceWireValidationSchemaName
} from "@source-wire/contracts";

const boundary: SourceWireRuntimeBoundary = SOURCE_WIRE_RUNTIME_BOUNDARY;
const schemaName: SourceWireValidationSchemaName = "project-context-pack";

const response: SourceWireSecondBrainResponse = {
  contractVersion: "second-brain.v1",
  intent: "answer_question",
  radius: "project",
  answer: "Synthetic consumer smoke response.",
  citations: [],
  gaps: [],
  nextAction: "Keep the release gate closed until owner approval.",
  maintenanceRan: false,
  noAutoPromotion: true
};

if (boundary.runtimeIncluded !== false) {
  throw new Error("expected contract package without runtime backend");
}

if (!isSourceWireValidationSchemaName(schemaName)) {
  throw new Error("expected project-context-pack to be a validation schema");
}

if (SOURCE_WIRE_SCHEMA_EXPORT_LIST.length < 1) {
  throw new Error("expected schema exports");
}

console.log(JSON.stringify({
  ok: true,
  version: SOURCE_WIRE_PACKAGE_VERSION,
  packageKind: boundary.packageKind,
  responseContract: response.contractVersion
}));
`
  );

  await runChecked("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], consumerRoot);

  const tscPath = join(root, "node_modules", "typescript", "bin", "tsc");
  await runChecked(process.execPath, [tscPath, "-p", "tsconfig.json"], consumerRoot);

  const runtimeResult = await runChecked(process.execPath, ["dist/consumer.js"], consumerRoot);
  const parsedRuntime = JSON.parse(runtimeResult.stdout);
  if (parsedRuntime.ok !== true || parsedRuntime.packageKind !== "contract_skeleton") {
    throw new Error(`unexpected consumer runtime result: ${runtimeResult.stdout}`);
  }
  if (parsedRuntime.version !== pack.version) {
    throw new Error(`package root version export ${parsedRuntime.version} does not match package version ${pack.version}`);
  }

  const installedCliPath = join(
    consumerRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "source-wire.cmd" : "source-wire"
  );
  const installedPackageRoot = join(consumerRoot, "node_modules", "@source-wire", "contracts");
  const installedFixtureMatrix = [
    {
      schemaName: "project-context-pack",
      path: join(installedPackageRoot, "examples", "fixtures", "project-context-pack", "project-context.json")
    },
    {
      schemaName: "second-brain-v1",
      path: join(installedPackageRoot, "examples", "fixtures", "second-brain", "use-2nd-brain-example.json")
    },
    {
      schemaName: "chat-export-message",
      path: join(installedPackageRoot, "examples", "fixtures", "chat-export", "agent-session.jsonl")
    },
    {
      schemaName: "owner-hosted-api-mcp-boundary",
      path: join(
        installedPackageRoot,
        "examples",
        "fixtures",
        "owner-hosted-api-mcp-boundary",
        "boundary-proof-cases.json"
      )
    }
  ];

  for (const fixture of installedFixtureMatrix) {
    await runChecked(installedCliPath, ["validate", fixture.schemaName, fixture.path], consumerRoot);
  }

  console.log(`ok consumer smoke ${pack.name}@${pack.version}`);
  console.log("ok consumer install local tarball");
  console.log("ok consumer typecheck package root imports");
  console.log("ok consumer runtime package root import");
  console.log("ok consumer installed cli package fixture validation");
  console.log("ok consumer installed fixture matrix validation");
} finally {
  await rm(tempRoot, { recursive: true, force: true });
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
