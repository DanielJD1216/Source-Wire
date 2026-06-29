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

if (failures.length > 0) {
  console.error("failed command docs setup check");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`ok command docs setup ${commandFiles.length} command-bearing markdown files`);

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
