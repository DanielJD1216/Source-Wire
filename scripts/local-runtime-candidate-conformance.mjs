import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workspace = join(root, "apps", "alpha1-runtime");
if (process.version !== "v22.23.1") {
  throw new Error(
    `local runtime candidate conformance requires Node.js v22.23.1, received ${process.version}`
  );
}
const tempRoot = await mkdtemp(
  join(tmpdir(), "source-wire-local-runtime-conformance-")
);
const consumer = join(tempRoot, "consumer");

try {
  const pack = JSON.parse(
    (
      await runChecked(
        "npm",
        ["pack", "--json", "--pack-destination", tempRoot],
        workspace
      )
    ).stdout
  );
  if (!Array.isArray(pack) || pack.length !== 1) {
    throw new Error("candidate conformance expected one packed artifact");
  }
  await mkdir(consumer, { recursive: true });
  await runChecked("npm", ["init", "--yes"], consumer);
  await runChecked(
    "npm",
    [
      "install",
      "--ignore-scripts",
      join(tempRoot, pack[0].filename)
    ],
    consumer
  );

  const packageRoot = join(
    consumer,
    "node_modules",
    "@source-wire",
    "local-runtime"
  );
  const packageJson = JSON.parse(
    await readFile(join(packageRoot, "package.json"), "utf8")
  );
  if (
    packageJson.name !== "@source-wire/local-runtime" ||
    packageJson.version !== "0.1.0-alpha.2" ||
    packageJson.private !== false ||
    packageJson.publishConfig?.access !== "public" ||
    packageJson.publishConfig?.tag !== "alpha"
  ) {
    throw new Error("candidate conformance installed wrong package");
  }

  const installedEntry = join(
    packageRoot,
    "dist",
    "src",
    "cli",
    "local.js"
  );
  const installedBinary = join(
    consumer,
    "node_modules",
    ".bin",
    "source-wire-local"
  );
  await access(installedEntry, constants.R_OK);
  await access(installedBinary, constants.X_OK);

  const agentConfigPath = join(consumer, "mcp.json");
  await writeFile(
    agentConfigPath,
    `${JSON.stringify(
      {
        mcpServers: {
          "source-wire": {
            command: installedBinary,
            args: [
              "mcp",
              "stdio",
              "--config",
              join(consumer, "source-wire.local.json")
            ]
          }
        }
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  const agentConfig = await readFile(agentConfigPath, "utf8");
  if (
    !agentConfig.includes("node_modules/.bin/source-wire-local") ||
    agentConfig.includes("npx") ||
    agentConfig.includes("http://") ||
    agentConfig.includes("https://")
  ) {
    throw new Error("candidate AI-agent MCP configuration is mutable");
  }

  const conformanceEnvironment = {
    ...process.env,
    SOURCE_WIRE_PACKED_LOCAL_CLI_ENTRY: installedEntry,
    SOURCE_WIRE_CONFORMANCE_REPORT: join(
      tempRoot,
      "story2-packed-candidate-report.json"
    )
  };
  await runChecked(
    "npm",
    ["run", "alpha1:conformance:story2"],
    root,
    conformanceEnvironment
  );
  await runChecked(
    "npm",
    ["run", "alpha1:conformance:story5"],
    root,
    {
      ...conformanceEnvironment,
      SOURCE_WIRE_CONFORMANCE_REPORT: join(
        tempRoot,
        "story5-packed-candidate-report.json"
      )
    }
  );

  console.log(
    "ok clean installed local runtime started stdio MCP against disposable PostgreSQL"
  );
  console.log(
    "ok packed candidate proved memory and synthetic KnowledgeProvider v1 compositions"
  );
  console.log(
    "ok AI-agent MCP configuration used the installed binary without npx"
  );
  console.log(
    "ok packed candidate conformance cleanup removed disposable PostgreSQL state"
  );
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

function runChecked(
  command,
  args,
  cwd,
  environment = process.env
) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      env: environment,
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
    child.once("close", (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }
      rejectPromise(
        new Error(
          `${command} ${args.join(" ")} failed with ${code}\n${stderr || stdout}`
        )
      );
    });
  });
}
