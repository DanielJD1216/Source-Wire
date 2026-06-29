import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const tempRoot = await mkdtemp(join(tmpdir(), "source-wire-package-content-"));

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
  const docsLinkCheckerPath = join(root, "scripts", "check-doc-links.mjs");
  const docsLinksResult = await runChecked(process.execPath, [docsLinkCheckerPath], installedPackageRoot);

  console.log(`ok package content smoke ${pack.name}@${pack.version}`);
  console.log(docsLinksResult.stdout.trim());
  console.log("ok installed package docs links");
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
