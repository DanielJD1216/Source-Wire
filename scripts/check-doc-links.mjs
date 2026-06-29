import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, normalize, relative } from "node:path";

const root = process.cwd();
const scanRoots = ["README.md", "docs", "examples"];
const ignoredSegments = new Set(["node_modules", "dist", ".git"]);
const markdownPattern = /\.md$/i;
const markdownLinkPattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

const markdownFiles = await collectMarkdownFiles(scanRoots);
const failures = [];

for (const file of markdownFiles) {
  const content = await readFile(join(root, file), "utf8");
  const lines = content.split(/\r?\n/);
  let inFence = false;

  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }

    if (inFence) {
      return;
    }

    for (const match of line.matchAll(markdownLinkPattern)) {
      const target = match[1];
      if (shouldIgnoreTarget(target)) {
        continue;
      }

      const pathOnly = decodeURIComponent(target.split("#")[0] ?? "");
      if (pathOnly.length === 0) {
        continue;
      }

      const resolved = normalize(join(root, dirname(file), pathOnly));
      if (!isInsideRoot(resolved)) {
        failures.push(`${file}:${index + 1} link escapes repo root: ${target}`);
        continue;
      }

      failures.push(...pendingStat(file, index + 1, target, resolved));
    }
  });
}

const resolvedFailures = [];
for (const failure of failures) {
  if (typeof failure === "string") {
    resolvedFailures.push(failure);
    continue;
  }

  try {
    await stat(failure.resolved);
  } catch {
    resolvedFailures.push(`${failure.file}:${failure.line} missing local link target: ${failure.target}`);
  }
}

if (resolvedFailures.length > 0) {
  console.error("failed docs link check");
  for (const failure of resolvedFailures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`ok docs links ${markdownFiles.length} markdown files`);

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

function shouldIgnoreTarget(target) {
  return (
    target.startsWith("#") ||
    /^[a-z][a-z0-9+.-]*:/i.test(target) ||
    target.startsWith("<") ||
    target.startsWith("{")
  );
}

function isInsideRoot(path) {
  const relativePath = relative(root, path);
  return relativePath === "" || (!relativePath.startsWith("..") && !relativePath.startsWith("/"));
}

function pendingStat(file, line, target, resolved) {
  return [{ file, line, target, resolved }];
}
