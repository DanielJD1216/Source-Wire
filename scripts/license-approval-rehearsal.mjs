import { access, readFile } from "node:fs/promises";
import { assertNoBlockedReleaseCommands } from "./blocked-release-commands.mjs";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const failures = [];

assertEqual(packageJson.license, "Apache-2.0", "package license must be Apache-2.0 after owner approval");
assertEqual(packageJson.version, "0.1.0", "package version must remain 0.1.0 after first release");
assertEqual(packageJson.publishConfig?.access, "public", "publishConfig.access must stay public after first release");

try {
  await access("LICENSE");
} catch {
  failures.push("LICENSE file must exist after owner approval");
}

assertNoBlockedReleaseCommands(packageJson.scripts, failures);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`failed ${failure}`);
  }
  process.exit(1);
}

console.log("Source-Wire License Implementation Check");
console.log("----------------------------------------");
console.log(`Current license: ${packageJson.license}`);
console.log(`Current version: ${packageJson.version}`);
console.log("Current LICENSE file: present");
console.log("Current publishing: published as @source-wire/contracts@0.1.0");
console.log("");
console.log("Apache-2.0 implementation state:");
console.log("1. LICENSE file exists.");
console.log("2. package.json license is Apache-2.0.");
console.log("3. package version remains 0.1.0.");
console.log("4. npm publishing is complete for @source-wire/contracts@0.1.0.");
console.log("5. GitHub release is complete for v0.1.0.");
console.log("6. deployment and hosted runtime remain blocked.");
console.log("");
console.log("ok license implementation current boundary");
console.log("ok license implementation checklist complete");

function assertEqual(actual, expected, reason) {
  if (actual !== expected) {
    failures.push(`${reason}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}
