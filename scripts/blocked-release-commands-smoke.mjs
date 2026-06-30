import { assertNoBlockedReleaseCommands } from "./blocked-release-commands.mjs";

const failures = [];

const cleanFailures = [];
assertNoBlockedReleaseCommands(
  {
    "publish:readiness": "npm run ci:check && npm run release:gate",
    "package:dry-run": "npm run build && node scripts/package-dry-run.mjs"
  },
  cleanFailures
);

if (cleanFailures.length > 0) {
  failures.push(`clean scripts should not fail: ${cleanFailures.join("; ")}`);
}

for (const [scriptName, scriptValue, expectedFailure] of [
  ["bad:npm-publish", "npm publish", "script bad:npm-publish includes package publish"],
  ["bad:pnpm-publish", "pnpm publish", "script bad:pnpm-publish includes package publish"],
  ["bad:yarn-publish", "yarn publish", "script bad:yarn-publish includes package publish"],
  ["bad:gh-release", "gh release create v0.1.0", "script bad:gh-release includes gh release"],
  ["bad:git-tag", "git tag v0.1.0", "script bad:git-tag includes git tag"],
  ["bad:git-push-tags", "git push origin --tags", "script bad:git-push-tags includes git push --tags"],
  ["bad:npm-version", "npm version 0.1.0", "script bad:npm-version includes package version change"],
  ["bad:deploy", "vercel deploy", "script bad:deploy includes service deployment"]
]) {
  const caseFailures = [];
  assertNoBlockedReleaseCommands({ [scriptName]: scriptValue }, caseFailures);
  if (!caseFailures.includes(expectedFailure)) {
    failures.push(`${scriptName} did not produce expected failure: ${expectedFailure}`);
  }
}

if (failures.length > 0) {
  console.error("failed blocked release commands smoke");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("ok blocked release commands smoke");
