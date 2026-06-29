import { spawn } from "node:child_process";

const root = process.cwd();
const forcedCheck = "authorized_read";

const result = await run(process.execPath, ["examples/runtime-boundary/synthetic-boundary-smoke.mjs"], {
  ...process.env,
  SOURCE_WIRE_RUNTIME_BOUNDARY_SMOKE_FORCE_FAILURE: forcedCheck
});

if (result.exitCode === 0) {
  console.error("failed diagnostic regression smoke: forced failure unexpectedly passed");
  process.exit(1);
}

const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
const requiredMarkers = [
  `runtime boundary smoke check failed: ${forcedCheck}`,
  "assertion: forced diagnostic regression failure",
  'expected: "__expected_diagnostic_failure__"',
  'received: "__forced_diagnostic_failure__"',
  "next action: Inspect read credential scope, namespace, citations, and MCP-to-API boundary."
];

const missingMarkers = requiredMarkers.filter((marker) => !output.includes(marker));
if (missingMarkers.length > 0) {
  for (const marker of missingMarkers) {
    console.error(`failed missing diagnostic marker: ${marker}`);
  }
  console.error("diagnostic output:");
  console.error(output.trim());
  process.exit(1);
}

console.log(`ok runtime boundary diagnostics smoke ${forcedCheck}`);
console.log("ok diagnostic failure includes check name");
console.log("ok diagnostic failure includes assertion");
console.log("ok diagnostic failure includes expected value");
console.log("ok diagnostic failure includes received value");
console.log("ok diagnostic failure includes next action");

function run(command, args, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
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
