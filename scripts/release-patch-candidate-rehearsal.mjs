import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const currentVersion = "0.1.0";
const patchVersion = "0.1.1";
const root = process.cwd();
const rootTscPath = join(root, "node_modules", "typescript", "bin", "tsc");
const rehearsalRoot = await mkdtemp(join(tmpdir(), "source-wire-patch-candidate-"));
const candidateRoot = join(rehearsalRoot, "candidate");
const packDestination = join(rehearsalRoot, "pack");
const consumerRoot = join(rehearsalRoot, "consumer");

try {
  await cp(root, candidateRoot, {
    recursive: true,
    filter: (source) => {
      const relative = source.slice(root.length).replace(/^[/\\]/u, "");
      if (!relative) return true;
      return ![
        ".git",
        "node_modules",
        "source-wire-contracts-0.1.0.tgz",
        "source-wire-contracts-0.1.1.tgz"
      ].some((blocked) => relative === blocked || relative.startsWith(`${blocked}/`));
    }
  });
  await mkdir(packDestination, { recursive: true });
  await mkdir(join(consumerRoot, "src"), { recursive: true });
  await symlink(join(root, "node_modules"), join(candidateRoot, "node_modules"), "dir");

  await updateJson(join(candidateRoot, "package.json"), (packageJson) => ({
    ...packageJson,
    version: patchVersion
  }));
  await updateJson(join(candidateRoot, "package-lock.json"), (packageLock) => {
    packageLock.version = patchVersion;
    if (packageLock.packages?.[""]) {
      packageLock.packages[""].version = patchVersion;
    }
    return packageLock;
  });
  await replaceText(
    join(candidateRoot, "src", "index.ts"),
    `export const SOURCE_WIRE_PACKAGE_VERSION = "${currentVersion}";`,
    `export const SOURCE_WIRE_PACKAGE_VERSION = "${patchVersion}";`
  );

  await runChecked(process.execPath, [rootTscPath, "-p", "tsconfig.json"], candidateRoot);

  const packResult = await runChecked("npm", ["pack", "--json", "--pack-destination", packDestination], candidateRoot);
  const [pack] = JSON.parse(packResult.stdout);
  const tarballPath = resolve(packDestination, pack.filename);
  if (pack.name !== "@source-wire/contracts" || pack.version !== patchVersion) {
    throw new Error(`unexpected patch candidate package identity ${pack.name}@${pack.version}`);
  }

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
    join(consumerRoot, "src", "consumer.ts"),
    `import {
  SOURCE_WIRE_PACKAGE_VERSION,
  SOURCE_WIRE_RUNTIME_BOUNDARY,
  SOURCE_WIRE_SCHEMA_EXPORT_LIST
} from "@source-wire/contracts";

if (SOURCE_WIRE_PACKAGE_VERSION !== "${patchVersion}") {
  throw new Error(\`expected patch version ${patchVersion}, received \${SOURCE_WIRE_PACKAGE_VERSION}\`);
}

if (SOURCE_WIRE_RUNTIME_BOUNDARY.runtimeIncluded !== false) {
  throw new Error("expected contract package without runtime backend");
}

if (SOURCE_WIRE_SCHEMA_EXPORT_LIST.length < 1) {
  throw new Error("expected schema exports");
}

console.log(JSON.stringify({
  ok: true,
  version: SOURCE_WIRE_PACKAGE_VERSION,
  packageKind: SOURCE_WIRE_RUNTIME_BOUNDARY.packageKind
}));
`
  );

  await runChecked("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], consumerRoot);
  await runChecked(process.execPath, [rootTscPath, "-p", "tsconfig.json"], consumerRoot);

  const runtimeResult = await runChecked(process.execPath, ["dist/consumer.js"], consumerRoot);
  const parsedRuntime = JSON.parse(runtimeResult.stdout);
  if (parsedRuntime.ok !== true || parsedRuntime.version !== patchVersion) {
    throw new Error(`unexpected patch candidate runtime result: ${runtimeResult.stdout}`);
  }

  printSection("Source-Wire Patch Candidate Rehearsal");
  printRows([
    ["Current package version", currentVersion],
    ["Rehearsed patch version", patchVersion],
    ["Candidate package", `${pack.name}@${pack.version}`],
    ["Candidate filename", pack.filename],
    ["Consumer import version", parsedRuntime.version],
    ["Runtime included", "false"],
    ["Mutation scope", "temporary directory only"]
  ]);

  console.log("");
  console.log("ok release patch candidate rehearsal ready");
  console.log("ok patch candidate version 0.1.1");
  console.log("ok patch candidate export matches package version");
  console.log("ok patch candidate consumer smoke");
  console.log("blocked real package version unchanged");
  console.log("blocked npm publish not performed");
  console.log("blocked github release not created");
} finally {
  await rm(rehearsalRoot, { recursive: true, force: true });
}

async function updateJson(path, updater) {
  const current = JSON.parse(await readFile(path, "utf8"));
  await writeFile(path, `${JSON.stringify(updater(current), null, 2)}\n`);
}

async function replaceText(path, before, after) {
  const current = await readFile(path, "utf8");
  if (!current.includes(before)) {
    throw new Error(`expected text not found in ${path}: ${before}`);
  }
  await writeFile(path, current.replace(before, after));
}

function runChecked(command, args, cwd) {
  return new Promise((resolve, reject) => {
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
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with ${exitCode}\n${stderr || stdout}`));
    });
  });
}

function printSection(title) {
  console.log("");
  console.log(title);
  console.log("-".repeat(title.length));
}

function printRows(rows) {
  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  for (const [label, value] of rows) {
    console.log(`${label.padEnd(labelWidth)}: ${value}`);
  }
}
