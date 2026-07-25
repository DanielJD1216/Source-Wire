import {
  chmod,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workspace = join(root, "apps", "alpha1-runtime");
const expected = Object.freeze({
  name: "@source-wire/local-runtime",
  version: "0.1.0-alpha.2",
  contractsVersion: "0.2.0",
  binary: "dist/src/cli/local.js"
});
const tempRoot = await mkdtemp(
  join(tmpdir(), "source-wire-local-runtime-candidate-")
);

try {
  const packResult = await runChecked(
    "npm",
    ["pack", "--json", "--pack-destination", tempRoot],
    workspace
  );
  const packed = JSON.parse(packResult.stdout);
  const packageJson = JSON.parse(
    await readFile(join(workspace, "package.json"), "utf8")
  );

  assertEqual(packageJson.name, expected.name, "package name");
  assertEqual(packageJson.version, expected.version, "package version");
  assertEqual(packageJson.private, false, "public Alpha guard");
  assertEqual(
    packageJson.publishConfig?.access,
    "public",
    "public npm access"
  );
  assertEqual(packageJson.publishConfig?.tag, "alpha", "npm dist-tag");
  assertEqual(
    packageJson.dependencies?.["@source-wire/contracts"],
    expected.contractsVersion,
    "contracts dependency"
  );
  assertEqual(
    packageJson.bin?.["source-wire-local"],
    expected.binary,
    "binary path"
  );
  if (!packageJson.exports?.["."]) {
    throw new Error("local runtime public composition export missing");
  }
  if (!Array.isArray(packed) || packed.length !== 1) {
    throw new Error("local runtime pack result must contain one artifact");
  }
  const artifact = packed[0];
  const paths = new Set(artifact.files.map((file) => file.path));
  for (const requiredPath of [
    "README.md",
    "CHANGELOG.md",
    "SECURITY.md",
    "LICENSE",
    "dist/src/index.js",
    "dist/src/index.d.ts",
    expected.binary
  ]) {
    if (!paths.has(requiredPath)) {
      throw new Error(`local runtime package path missing: ${requiredPath}`);
    }
  }
  for (const path of paths) {
    if (
      path.includes("conformance") ||
      path.includes(".artifacts") ||
      path.includes("deployment") ||
      path.startsWith("tests/") ||
      path.includes("/tests/") ||
      (path.endsWith(".ts") && !path.endsWith(".d.ts")) ||
      /\.(?:db|sqlite|sqlite3|jsonl|log|pem|key)$/u.test(path) ||
      /(^|\/)\.env(?:\.|$)/u.test(path)
    ) {
      throw new Error(`forbidden local runtime package path: ${path}`);
    }
  }

  const consumer = join(tempRoot, "consumer");
  await runChecked("npm", ["init", "--yes"], consumer, true);
  const artifactPath = join(tempRoot, artifact.filename);
  await runChecked(
    "npm",
    ["install", "--ignore-scripts", artifactPath],
    consumer
  );
  const consumerConfig = join(consumer, "source-wire.local.json");
  const consumerProbe = join(consumer, "probe.mjs");
  await writeFile(
    consumerProbe,
    [
      'import { createSourceWireLocalConfig, createSourceWireLocalRuntime, initializeSourceWireLocalConfig } from "@source-wire/local-runtime";',
      'import { createSyntheticKnowledgeProvider } from "@source-wire/local-runtime/synthetic-provider";',
      "const configPath = process.argv[2];",
      "const provider = createSyntheticKnowledgeProvider();",
      "const base = createSourceWireLocalConfig({ ownerId: \"owner_consumer\", namespaceIds: [\"namespace_consumer\"] });",
      "const config = {",
      "  ...base,",
      "  knowledgeProvider: {",
      '    module: "@source-wire/local-runtime/synthetic-provider",',
      '    exportName: "createSyntheticKnowledgeProvider",',
      "    providerScopeId: provider.profile.providerScopeId,",
      "    timeoutMs: 1000",
      "  }",
      "};",
      "await initializeSourceWireLocalConfig(configPath, config);",
      "const runtime = createSourceWireLocalRuntime({ configPath, environment: {} });",
      "const inspection = await runtime.inspect();",
      "if (!inspection.knowledgeProviderConfigured || inspection.providerScopeId !== provider.profile.providerScopeId) {",
      '  throw new Error("clean consumer composition inspection failed");',
      "}",
      "let internalBlocked = false;",
      "try {",
      '  await import("@source-wire/local-runtime/dist/src/runtime-composition.js");',
      "} catch (error) {",
      '  internalBlocked = error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED";',
      "}",
      'if (!internalBlocked) throw new Error("private runtime internals were importable");',
      'console.log("ok clean consumer initialized and inspected synthetic provider composition");',
      ""
    ].join("\n"),
    "utf8"
  );
  await runChecked(
    process.execPath,
    [consumerProbe, consumerConfig],
    consumer
  );
  const configStat = await stat(consumerConfig);
  if ((configStat.mode & 0o777) !== 0o600) {
    await chmod(consumerConfig, 0o600);
    throw new Error("clean consumer config permissions were not 0600");
  }
  const installedBinary = join(
    consumer,
    "node_modules",
    ".bin",
    "source-wire-local"
  );
  const binaryConfig = join(consumer, "source-wire.agent.json");
  const binaryResult = await runChecked(
    installedBinary,
    [
      "init",
      "--config",
      binaryConfig,
      "--owner-id",
      "owner_agent",
      "--namespace-id",
      "namespace_agent",
      "--json"
    ],
    consumer
  );
  const binaryEnvelope = JSON.parse(binaryResult.stdout);
  if (
    binaryEnvelope.ok !== true ||
    binaryEnvelope.operation !== "local.init"
  ) {
    throw new Error("installed source-wire-local binary init failed");
  }
  const agentConfig = {
    mcpServers: {
      "source-wire": {
        command: installedBinary,
        args: ["mcp", "stdio", "--config", binaryConfig]
      }
    }
  };
  const serializedAgentConfig = JSON.stringify(agentConfig);
  if (
    !serializedAgentConfig.includes(
      "node_modules/.bin/source-wire-local"
    ) ||
    serializedAgentConfig.includes("npx") ||
    serializedAgentConfig.includes("http://") ||
    serializedAgentConfig.includes("https://")
  ) {
    throw new Error("clean AI-agent configuration is mutable or remote");
  }

  const installedRoot = join(
    consumer,
    "node_modules",
    "@source-wire",
    "local-runtime"
  );
  const installedFiles = (
    await readdir(installedRoot, { recursive: true })
  ).filter((path) => /\.(?:js|d\.ts|json|md)$/u.test(path));
  const installedSurface = (
    await Promise.all(
      installedFiles.map((path) =>
        readFile(join(installedRoot, path), "utf8")
      )
    )
  ).join("\n");
  for (const forbiddenText of [
    root,
    process.env.HOME,
    "api.source-wire",
    "telemetry.source-wire",
    "SOURCE_WIRE_BILLING"
  ].filter((value) => typeof value === "string" && value.length > 0)) {
    if (installedSurface.includes(forbiddenText)) {
      throw new Error(
        `forbidden local runtime package content: ${forbiddenText}`
      );
    }
  }

  console.log(
    `ok local runtime candidate ${expected.name}@${expected.version}`
  );
  console.log(
    "ok local runtime candidate has public npm Alpha metadata publication blocked"
  );
  console.log("ok local runtime candidate reserves alpha dist-tag metadata without publishing");
  console.log(
    `ok local runtime candidate pins @source-wire/contracts@${expected.contractsVersion}`
  );
  console.log("ok local runtime candidate exposes composition API and CLI");
  console.log(
    "ok clean installed consumer initializes and inspects synthetic provider composition"
  );
  console.log(
    "ok clean AI-agent config invokes installed source-wire-local without npx or remote endpoint"
  );
  console.log(
    "ok local runtime package excludes private imports artifacts credential material data deployment and hosted config"
  );
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

function assertEqual(actual, expectedValue, label) {
  if (actual !== expectedValue) {
    throw new Error(
      `${label} mismatch: expected ${JSON.stringify(expectedValue)}, received ${JSON.stringify(actual)}`
    );
  }
}

function runChecked(command, args, cwd, createCwd = false) {
  return new Promise((resolvePromise, rejectPromise) => {
    const start = async () => {
      if (createCwd) {
        const { mkdir } = await import("node:fs/promises");
        await mkdir(cwd, { recursive: true });
      }
      return spawn(command, args, {
        cwd,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"]
      });
    };
    let child;
    let stdout = "";
    let stderr = "";
    void start()
      .then((started) => {
        child = started;
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
      })
      .catch(rejectPromise);
  });
}
