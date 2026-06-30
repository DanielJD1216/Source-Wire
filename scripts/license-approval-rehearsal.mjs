import { access, readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.license, "UNLICENSED", "package license must remain UNLICENSED before owner approval");
assertEqual(packageJson.version, "0.0.0", "package version must remain 0.0.0 before release approval");
assertEqual(packageJson.publishConfig?.access, "restricted", "publishConfig.access must stay restricted while publishing is blocked");

try {
  await access("LICENSE");
  failures.push("LICENSE file must not exist before owner approval");
} catch {
  // Expected before license approval.
}

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

console.log("Source-Wire License Approval Rehearsal");
console.log("---------------------------------------");
console.log(`Current license: ${packageJson.license}`);
console.log(`Current version: ${packageJson.version}`);
console.log("Current LICENSE file: not present");
console.log("Current publishing: blocked");
console.log("");
console.log("Future owner-approved Apache-2.0 transition checklist:");
console.log("1. Add unmodified Apache License 2.0 text as LICENSE.");
console.log("2. Change package.json license to Apache-2.0.");
console.log("3. Update release-gate expectations to Apache-2.0.");
console.log("4. Update readiness report and public docs.");
console.log("5. Keep package version 0.0.0.");
console.log("6. Keep npm publishing blocked.");
console.log("7. Keep GitHub release publishing blocked.");
console.log("8. Keep deployment and hosted runtime blocked.");
console.log("");
console.log("ok license rehearsal current boundary");
console.log("ok license rehearsal future checklist");

function assertEqual(actual, expected, reason) {
  if (actual !== expected) {
    failures.push(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}
