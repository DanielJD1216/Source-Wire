import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const scanRoots = ["README.md", "docs", "examples"];
const ignoredSegments = new Set(["node_modules", "dist", ".git"]);
const markdownPattern = /\.md$/i;
const commandPattern = /\b(?:npm run|npm install|npm ci|git diff --check|test -f LICENSE)\b/;
const setupPattern = /\b(?:Node\.js 22|Node 22|npm install|npm ci|Quickstart)\b/i;

const markdownFiles = await collectMarkdownFiles(scanRoots);
const commandFiles = [];
const failures = [];
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));

for (const file of markdownFiles) {
  const content = await readFile(join(root, file), "utf8");
  if (!commandPattern.test(content)) {
    continue;
  }

  commandFiles.push(file);

  if (!setupPattern.test(content)) {
    failures.push(`${file} contains local command snippets but no setup context or Quickstart pointer`);
  }
}

await verifyReadinessCommandLists();

if (failures.length > 0) {
  console.error("failed command docs setup check");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`ok command docs setup ${commandFiles.length} command-bearing markdown files`);
console.log("ok readiness command docs match package scripts");

async function collectMarkdownFiles(paths) {
  const files = [];
  for (const path of paths) {
    files.push(...(await collectPath(path)));
  }
  return files.sort((a, b) => a.localeCompare(b));
}

async function collectPath(path) {
  const absolutePath = join(root, path);
  const pathStat = await stat(absolutePath);

  if (pathStat.isFile()) {
    return markdownPattern.test(path) ? [relative(root, absolutePath).replaceAll("\\", "/")] : [];
  }

  if (!pathStat.isDirectory()) {
    return [];
  }

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignoredSegments.has(entry.name)) {
      continue;
    }

    const child = join(path, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectPath(child)));
      continue;
    }

    if (entry.isFile() && markdownPattern.test(entry.name)) {
      files.push(relative(root, join(root, child)).replaceAll("\\", "/"));
    }
  }

  return files;
}

async function verifyReadinessCommandLists() {
  const publishReadiness = await readFile(join(root, "docs/guides/publish-readiness.md"), "utf8");
  const ciChecks = await readFile(join(root, "docs/reference/ci-checks.md"), "utf8");
  const publishCommands = getScriptCommandList("publish:readiness");
  const ciCheckCommands = getScriptCommandList("ci:check");
  const expandedReadinessCommands = publishCommands.flatMap((command) => {
    if (command === "npm run ci:check") {
      return ciCheckCommands;
    }

    return [command];
  });

  assertCommandList(
    extractBulletedCommands(
      publishReadiness,
      "This command runs:",
      "The `ci:check` sub-gate includes:"
    ),
    publishCommands,
    "docs/guides/publish-readiness.md command list"
  );

  assertCommandList(
    extractBulletedCommands(
      publishReadiness,
      "The `ci:check` sub-gate includes:",
      "## Local Success Marker Map"
    ),
    ciCheckCommands,
    "docs/guides/publish-readiness.md ci:check sub-gate list"
  );

  assertCommandList(
    extractBulletedCommands(
      ciChecks,
      "The readiness gate runs:",
      "`npm run ci:check` remains as a sub-gate inside `npm run publish:readiness`."
    ),
    expandedReadinessCommands,
    "docs/reference/ci-checks.md readiness gate list"
  );
}

function getScriptCommandList(scriptName) {
  const script = packageJson.scripts?.[scriptName];
  if (typeof script !== "string") {
    failures.push(`missing package script: ${scriptName}`);
    return [];
  }

  return script.split(" && ");
}

function extractBulletedCommands(content, startMarker, endMarker) {
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker, startIndex + startMarker.length);

  if (startIndex === -1 || endIndex === -1) {
    failures.push(`unable to find command list section between ${JSON.stringify(startMarker)} and ${JSON.stringify(endMarker)}`);
    return [];
  }

  return content
    .slice(startIndex, endIndex)
    .split(/\r?\n/u)
    .map((line) => line.match(/^- `([^`]+)`$/u)?.[1])
    .filter(Boolean);
}

function assertCommandList(actual, expected, label) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    return;
  }

  failures.push(`${label} must match package.json scripts`);
  const maxLength = Math.max(actual.length, expected.length);
  for (let index = 0; index < maxLength; index += 1) {
    if (actual[index] === expected[index]) {
      continue;
    }

    failures.push(`${label} mismatch at ${index + 1}: expected ${JSON.stringify(expected[index] ?? null)}, received ${JSON.stringify(actual[index] ?? null)}`);
    break;
  }
}
