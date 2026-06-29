import { requiredPackagePaths } from "./package-required-paths.mjs";

const failures = [];
const seen = new Set();
const sortedPaths = [...requiredPackagePaths].sort((a, b) => a.localeCompare(b));

for (const path of requiredPackagePaths) {
  if (seen.has(path)) {
    failures.push(`duplicate required package path: ${path}`);
  }
  seen.add(path);
}

for (const [index, path] of requiredPackagePaths.entries()) {
  if (path !== sortedPaths[index]) {
    failures.push(`required package path out of order at index ${index}: expected ${sortedPaths[index]}, received ${path}`);
  }
}

if (failures.length > 0) {
  console.error("failed package required path manifest check");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`ok package required paths ${requiredPackagePaths.length}`);
