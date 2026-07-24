import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const scanRoots = ["README.md", "docs", "examples", ".github", "package.json"];
const ignoredSegments = new Set([".git", "dist", "node_modules"]);
const textFilePattern = /\.(?:md|json|yml|yaml)$/i;
const urlPattern = /(?:git\+)?https?:\/\/[^\s<>"')\]]+/g;
const failures = [];

const targets = await collectTargets(scanRoots);
const links = new Map();

for (const target of targets) {
  const lines = target.content.split(/\r?\n/u);
  let inFence = false;

  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
    }

    for (const match of line.matchAll(urlPattern)) {
      const url = normalizeUrl(match[0]);
      if (isLoopbackUrl(url)) {
        continue;
      }

      if (!links.has(url)) {
        links.set(url, []);
      }
      links.get(url).push(`${target.path}:${index + 1}`);
    }
  });
}

for (const [url, references] of [...links.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const result = await checkUrl(url);
  if (!result.ok) {
    failures.push(`${url} failed from ${references.slice(0, 3).join(", ")}: ${result.reason}`);
  }
}

if (failures.length > 0) {
  console.error("failed external link check");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`ok external links ${links.size} urls across ${targets.length} files`);

async function collectTargets(paths) {
  const allTargets = [];

  for (const path of paths) {
    allTargets.push(...(await collectPath(path)));
  }

  return allTargets.sort((a, b) => a.path.localeCompare(b.path));
}

async function collectPath(path) {
  const absolutePath = join(root, path);
  let entries;

  try {
    entries = await readdir(absolutePath, { withFileTypes: true });
  } catch {
    return collectFile(path);
  }

  const targets = [];
  for (const entry of entries) {
    if (ignoredSegments.has(entry.name)) {
      continue;
    }

    const child = join(path, entry.name);
    if (entry.isDirectory()) {
      targets.push(...(await collectPath(child)));
      continue;
    }

    if (entry.isFile()) {
      targets.push(...(await collectFile(child)));
    }
  }

  return targets;
}

async function collectFile(path) {
  const normalizedPath = relative(root, join(root, path)).replaceAll("\\", "/");

  if (!textFilePattern.test(normalizedPath)) {
    return [];
  }

  try {
    const content = await readFile(join(root, normalizedPath), "utf8");
    return [{ path: normalizedPath, content }];
  } catch {
    return [];
  }
}

function normalizeUrl(rawUrl) {
  return rawUrl
    .replace(/^git\+/u, "")
    .replace(/[.,;:]+$/u, "");
}

function isLoopbackUrl(rawUrl) {
  try {
    const { hostname } = new URL(rawUrl);
    return (
      hostname === "localhost" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      /^127(?:\.\d{1,3}){3}$/u.test(hostname)
    );
  } catch {
    return false;
  }
}

async function checkUrl(url) {
  const localRepositoryPath = localRepositoryPathForUrl(url);
  if (localRepositoryPath) {
    try {
      await stat(join(root, localRepositoryPath));
      return { ok: true };
    } catch {
      return { ok: false, reason: `local repository path missing: ${localRepositoryPath}` };
    }
  }

  const headResult = await fetchWithTimeout(url, "HEAD");
  if (isAcceptableStatus(headResult.status)) {
    return { ok: true };
  }

  if (headResult.status !== 0 && headResult.status !== 405 && headResult.status !== 403 && headResult.status !== 404) {
    return { ok: false, reason: headResult.reason };
  }

  const getResult = await fetchWithTimeout(url, "GET");
  if (isAcceptableStatus(getResult.status)) {
    return { ok: true };
  }

  const npmRegistryUrl = npmRegistryUrlForPackagePage(url);
  if (npmRegistryUrl && (headResult.status === 403 || getResult.status === 403)) {
    const registryResult = await fetchWithTimeout(npmRegistryUrl, "GET");
    if (isAcceptableStatus(registryResult.status)) {
      return { ok: true };
    }

    return {
      ok: false,
      reason: `${getResult.reason}; npm registry fallback failed: ${registryResult.reason}`
    };
  }

  return { ok: false, reason: getResult.reason };
}

function localRepositoryPathForUrl(rawUrl) {
  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsedUrl.hostname !== "github.com") {
    return null;
  }

  const prefix = "/DanielJD1216/Source-Wire/blob/main/";
  if (!parsedUrl.pathname.startsWith(prefix)) {
    return null;
  }

  const repositoryPath = decodeURIComponent(parsedUrl.pathname.slice(prefix.length));
  if (!repositoryPath || repositoryPath.split("/").includes("..")) {
    return null;
  }

  return repositoryPath;
}

async function fetchWithTimeout(url, method) {
  const attempts = 3;
  const reasons = [];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Source-Wire external link checker"
        }
      });

      return {
        status: response.status,
        reason: `${method} ${response.status} ${response.statusText}`.trim()
      };
    } catch (error) {
      reasons.push(`${method} attempt ${attempt} ${error.name}: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < attempts) {
      await delay(500 * attempt);
    }
  }

  return {
    status: 0,
    reason: reasons.join("; ")
  };
}

function isAcceptableStatus(status) {
  return status >= 200 && status < 400;
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function npmRegistryUrlForPackagePage(rawUrl) {
  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsedUrl.hostname !== "www.npmjs.com" && parsedUrl.hostname !== "npmjs.com") {
    return null;
  }

  const packagePrefix = "/package/";
  if (!parsedUrl.pathname.startsWith(packagePrefix)) {
    return null;
  }

  const packageName = decodeURIComponent(parsedUrl.pathname.slice(packagePrefix.length)).replace(/\/+$/u, "");
  if (!packageName || packageName.includes("..")) {
    return null;
  }

  return `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
}
