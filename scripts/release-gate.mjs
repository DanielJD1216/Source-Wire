import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.license, "Apache-2.0", "package license must remain Apache-2.0 after owner license approval");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 until release approval");
assertEqual(packageJson.private, false, "package private flag should stay false for package-shape checks");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while publishing is blocked");

for (const [scriptName, scriptValue] of Object.entries(packageJson.scripts ?? {})) {
  if (scriptName === "publish:readiness") {
    continue;
  }

  if (/\bnpm\s+publish\b/.test(scriptValue)) {
    failures.push(`script ${scriptName} includes npm publish`);
  }

  if (/\bgh\s+release\b/.test(scriptValue)) {
    failures.push(`script ${scriptName} includes gh release`);
  }

  if (/\b(?:vercel|netlify|wrangler|flyctl|railway)\s+(?:deploy|publish|up)\b/.test(scriptValue)) {
    failures.push(`script ${scriptName} includes service deployment`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`failed ${failure}`);
  }
  process.exit(1);
}

console.log("ok release gate");
console.log("ok license Apache-2.0");
console.log("ok version 0.0.0");
console.log("ok publishing blocked");

function assertEqual(actual, expected, reason) {
  if (actual !== expected) {
    failures.push(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}
