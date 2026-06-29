import { cp, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const tempRoot = await mkdtemp(join(tmpdir(), "source-wire-examples-installed-"));

try {
  await runChecked("npm", ["run", "build"], root);

  const packResult = await runChecked("npm", ["pack", "--json", "--pack-destination", tempRoot], root);
  const [pack] = JSON.parse(packResult.stdout);
  const tarballPath = resolve(tempRoot, pack.filename);
  const consumerRoot = join(tempRoot, "consumer");
  const consumerExamplesRoot = join(consumerRoot, "examples", "typescript");

  await mkdir(consumerExamplesRoot, { recursive: true });
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
          noEmit: true
        },
        include: ["examples/typescript/**/*.ts"]
      },
      null,
      2
    )
  );

  const exampleFiles = [
    "contract-types.ts",
    "runtime-boundary.ts",
    "schema-registry.ts",
    "validation-helper.ts"
  ];

  for (const file of exampleFiles) {
    await cp(join(root, "examples", "typescript", file), join(consumerExamplesRoot, file));
  }

  await runChecked("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], consumerRoot);

  const tscPath = join(root, "node_modules", "typescript", "bin", "tsc");
  await runChecked(process.execPath, [tscPath, "-p", "tsconfig.json"], consumerRoot);

  console.log(`ok examples installed smoke ${pack.name}@${pack.version}`);
  console.log(`ok installed TypeScript examples ${exampleFiles.length} files`);
  console.log("ok installed examples package-root imports");
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
