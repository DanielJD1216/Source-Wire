import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, normalize, relative } from "node:path";

const root = process.cwd();
const scanRoots = ["README.md", "docs", "examples"];
const ignoredSegments = new Set(["node_modules", "dist", ".git"]);
const markdownPattern = /\.md$/i;
const markdownLinkPattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const headingPattern = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const markdownFiles = await collectMarkdownFiles(scanRoots);
const anchorsByFile = new Map();
const failures = [];
let checkedAnchors = 0;

for (const file of markdownFiles) {
  const content = await readFile(join(root, file), "utf8");
  anchorsByFile.set(file, collectAnchors(content));
}

for (const file of markdownFiles) {
  const content = await readFile(join(root, file), "utf8");
  const lines = content.split(/\r?\n/u);
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
      if (shouldIgnoreTarget(target) || !target.includes("#")) {
        continue;
      }

      const [rawPath = "", rawAnchor = ""] = target.split("#");
      if (rawAnchor.length === 0) {
        continue;
      }

      const targetFile = resolveTargetFile(file, rawPath);
      if (targetFile === null) {
        failures.push(`${file}:${index + 1} anchor link escapes repo root: ${target}`);
        continue;
      }

      if (!anchorsByFile.has(targetFile)) {
        failures.push(`${file}:${index + 1} anchor target file is not scanned markdown: ${target}`);
        continue;
      }

      checkedAnchors += 1;
      const expectedAnchor = decodeURIComponent(rawAnchor).toLowerCase();
      if (!anchorsByFile.get(targetFile).has(expectedAnchor)) {
        failures.push(`${file}:${index + 1} missing anchor ${JSON.stringify(expectedAnchor)} in ${targetFile}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error("failed docs anchor check");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`ok docs anchors ${checkedAnchors} anchor links across ${markdownFiles.length} markdown files`);

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

function collectAnchors(content) {
  const anchors = new Set();
  const usedSlugs = new Map();
  let inFence = false;

  for (const line of content.split(/\r?\n/u)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }

    if (inFence) {
      continue;
    }

    const match = line.match(headingPattern);
    if (!match) {
      continue;
    }

    const baseSlug = slugifyHeading(match[2]);
    const count = usedSlugs.get(baseSlug) ?? 0;
    usedSlugs.set(baseSlug, count + 1);
    anchors.add(count === 0 ? baseSlug : `${baseSlug}-${count}`);
  }

  return anchors;
}

function slugifyHeading(text) {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~[\]]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

function shouldIgnoreTarget(target) {
  return (
    /^[a-z][a-z0-9+.-]*:/i.test(target) ||
    target.startsWith("<") ||
    target.startsWith("{")
  );
}

function resolveTargetFile(sourceFile, rawPath) {
  const pathOnly = decodeURIComponent(rawPath);
  const resolved = pathOnly.length === 0
    ? join(root, sourceFile)
    : normalize(join(root, dirname(sourceFile), pathOnly));

  if (!isInsideRoot(resolved)) {
    return null;
  }

  return relative(root, resolved).replaceAll("\\", "/");
}

function isInsideRoot(path) {
  const relativePath = relative(root, path);
  return relativePath === "" || (!relativePath.startsWith("..") && !relativePath.startsWith("/"));
}
