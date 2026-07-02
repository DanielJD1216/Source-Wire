import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const scanRoots = ["README.md", "docs", "examples"];
const ignoredSegments = new Set([".git", ".github", "dist", "node_modules"]);
const textFilePattern = /\.(?:md|mdx|txt|json|jsonl|yaml|yml)$/i;

const unsafeClaims = [
  {
    kind: "open_source_claim",
    pattern: /\bsource-wire\s+is\s+(?:an?\s+)?open[- ]source\b/i,
    reason: "Source-Wire may be described as open source only after Apache-2.0 is implemented."
  },
  {
    kind: "production_ready_claim",
    pattern: /\bsource-wire\s+is\s+(?:production[- ]ready|ready\s+for\s+production)\b/i,
    reason: "Production use remains blocked because Source-Wire is not a hosted runtime."
  },
  {
    kind: "unsafe_publish_or_host_claim",
    pattern: /\byou\s+can\s+(?:host|publish|build\s+your\s+product\s+on)\s+(?:source-wire|this)\b/i,
    reason: "Hosted runtime and production-product use remain blocked."
  },
  {
    kind: "contribution_open_claim",
    pattern: /\b(?:contributions\s+are\s+open|code\s+contributions\s+are\s+accepted|open\s+for\s+contributions)\b/i,
    reason: "Code contribution acceptance and contribution license terms are not approved."
  },
  {
    kind: "hosted_runtime_claim",
    pattern: /\bsource-wire\s+is\s+(?:a\s+)?hosted\s+(?:runtime|memory\s+(?:backend|service))\b/i,
    reason: "Source-Wire is not a hosted runtime or hosted memory service."
  }
];

const targets = await collectTargets(scanRoots);
const findings = [];

if (packageJson.license !== "Apache-2.0") {
  console.error(`failed package license must be Apache-2.0 after owner approval, received ${packageJson.license}`);
  process.exit(1);
}

for (const target of targets) {
  const lines = target.content.split(/\r?\n/);
  let inFence = false;

  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }

    if (inFence || isExplicitBoundaryLine(line)) {
      return;
    }

    for (const claim of unsafeClaims) {
      if (claim.pattern.test(line)) {
        findings.push({
          kind: claim.kind,
          path: target.path,
          line: index + 1,
          reason: claim.reason,
          snippet: line.trim().slice(0, 180)
        });
      }
    }
  });
}

console.log("Source-Wire public claim boundary scan");
console.log("Mode: release_claim_guard");
console.log("Non-destructive: true");
console.log(`Scanned files: ${targets.length}`);
console.log(`Findings: ${findings.length}`);

if (findings.length > 0) {
  console.log("Next action: narrow public wording or explicitly keep the claim blocked.");
  console.log("");
  console.log("Findings:");
  for (const finding of findings.slice(0, 80)) {
    console.log(`- [high] ${finding.kind} ${finding.path}:${finding.line}`);
    console.log(`  ${finding.reason}`);
    console.log(`  ${finding.snippet}`);
  }
  process.exit(1);
}

console.log("Next action: ready_for_ci");
console.log("ok public claim boundary scan");

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

function isExplicitBoundaryLine(line) {
  return /\b(?:not|no|blocked|do not|does not|without|unsafe|avoid|must not|cannot|currently)\b/i.test(line);
}
