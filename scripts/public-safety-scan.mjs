import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const defaultRoots = ["README.md", "docs", "examples", "src", "schemas", "scripts", "package.json", "tsconfig.json"];
const ignoredSegments = new Set([".git", ".github", "dist", "node_modules"]);
const textFilePattern = /\.(?:md|mdx|txt|json|jsonl|yaml|yml|ts|tsx|js|jsx|mjs|cjs)$/i;
const binaryFilePattern = /\.(?:png|jpe?g|gif|webp|pdf|mov|mp4|zip|sqlite|db)$/i;
const privateMarkers = [
  [["DanielJD", "1216"].join(""), ["2nd", "Brain", "Jinni"].join("-").replace("Brain-", "Brain---")].join("/"),
  ["2nd", "Brain", "Jinni"].join("-").replace("Brain-", "Brain---"),
  ["Jinni", "private"].join(" "),
  ["private", "Jinni"].join(" ")
];

const args = process.argv.slice(2);
const format = getArgValue("--format") ?? "summary";
const roots = args.filter((arg) => !arg.startsWith("--"));
const scanRoots = roots.length > 0 ? roots : defaultRoots;

const targets = await collectTargets(scanRoots);
const report = scanTargets(targets);

if (format === "json") {
  console.log(JSON.stringify(report, null, 2));
} else {
  printSummary(report);
}

if (report.counts.high > 0) {
  process.exitCode = 1;
}

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

  if (binaryFilePattern.test(normalizedPath)) {
    return [{ path: normalizedPath, isBinary: true }];
  }

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

function scanTargets(targets) {
  const findings = [];

  for (const target of targets) {
    if (target.isBinary || typeof target.content !== "string") {
      continue;
    }

    const lines = target.content.split(/\r?\n/);
    lines.forEach((line, index) => {
      findings.push(...scanLine(target.path, index + 1, line));
    });
  }

  const counts = {
    high: findings.filter((finding) => finding.severity === "high").length,
    medium: findings.filter((finding) => finding.severity === "medium").length,
    low: findings.filter((finding) => finding.severity === "low").length
  };

  return {
    mode: "strict_advisory",
    nonDestructive: true,
    scannedCount: targets.filter((target) => !target.isBinary).length,
    findingCount: findings.length,
    counts,
    findings,
    nextAction: findings.length === 0 ? "ready_for_ci" : counts.high > 0 ? "block_until_reviewed" : "review_findings"
  };
}

function scanLine(path, lineNumber, line) {
  const findings = [];
  const trimmed = line.trim();

  if (/sk-[A-Za-z0-9_-]{20,}/.test(line)) {
    findings.push(createFinding("high", "openai_api_key", path, lineNumber, "Possible OpenAI-style API key.", trimmed));
  }

  if (/postgres(?:ql)?:\/\/[^"'\s)]+/i.test(line)) {
    findings.push(createFinding("high", "database_url", path, lineNumber, "Possible database connection URL.", trimmed));
  }

  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(line) && !line.includes("example.com")) {
    findings.push(createFinding("medium", "email_address", path, lineNumber, "Possible real email address.", trimmed));
  }

  if (/(?:\/Users\/|\/home\/|C:\\Users\\)/i.test(line)) {
    findings.push(createFinding("medium", "local_path", path, lineNumber, "Possible local machine path.", trimmed));
  }

  if (/\b(?:client|customer|account)\s*(?:id|number|#)\s*[:=]\s*[A-Za-z0-9_-]{6,}/i.test(line)) {
    findings.push(createFinding("medium", "account_identifier", path, lineNumber, "Possible private account or client identifier.", trimmed));
  }

  if (/\b(?:token|secret|password|api[_-]?key)\s*[:=]\s*["']?[^"'\s]{8,}/i.test(line)) {
    findings.push(createFinding("high", "secret_like_assignment", path, lineNumber, "Possible secret-like assignment.", trimmed));
  }

  if (privateMarkers.some((marker) => line.toLowerCase().includes(marker.toLowerCase()))) {
    findings.push(createFinding("medium", "private_repo_reference", path, lineNumber, "Possible private implementation reference.", trimmed));
  }

  return findings;
}

function createFinding(severity, kind, path, line, reason, snippet) {
  return {
    severity,
    kind,
    path,
    line,
    reason,
    snippet: snippet.slice(0, 180)
  };
}

function getArgValue(name) {
  const exact = args.find((arg) => arg.startsWith(`${name}=`));
  if (!exact) {
    return null;
  }
  return exact.slice(name.length + 1);
}

function printSummary(report) {
  console.log("Source-Wire public safety scan");
  console.log(`Mode: ${report.mode}`);
  console.log(`Non-destructive: ${report.nonDestructive}`);
  console.log(`Scanned files: ${report.scannedCount}`);
  console.log(`Findings: ${report.findingCount} high=${report.counts.high} medium=${report.counts.medium} low=${report.counts.low}`);
  console.log(`Next action: ${report.nextAction}`);

  if (report.findings.length === 0) {
    return;
  }

  console.log("");
  console.log("Findings:");
  for (const finding of report.findings.slice(0, 80)) {
    console.log(`- [${finding.severity}] ${finding.kind} ${finding.path}:${finding.line}`);
    console.log(`  ${finding.reason}`);
    console.log(`  ${finding.snippet}`);
  }

  if (report.findings.length > 80) {
    console.log(`- ... ${report.findings.length - 80} additional findings omitted from summary. Use --format=json for full output.`);
  }
}
